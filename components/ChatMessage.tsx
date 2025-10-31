'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types';
import { useState, useMemo } from 'react';
import { processContentForDisplay } from '@/lib/utils/tag-parser';

// Support both old Message format and new UIMessage format
type DisplayMessage = Message | {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  timestamp?: Date;
};

interface ChatMessageProps {
  message: DisplayMessage;
  onEdit?: (content: string) => void;
  showDebug?: boolean;
}

// Type guard to check if message is UIMessage format
function isUIMessage(msg: DisplayMessage): msg is { id: string; role: 'user' | 'assistant' | 'system'; parts: any[]; timestamp?: Date } {
  return 'parts' in msg;
}

export default function ChatMessage({ message, onEdit, showDebug = false }: ChatMessageProps) {
  // Get text content for editing (only for old format)
  const textContent = useMemo(() => {
    if (!isUIMessage(message)) {
      return message.content;
    }
    // For UIMessage, concatenate all text parts
    return message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }, [message]);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(textContent);

  const isSystemMessage = message.role === 'system';
  const timestamp = 'timestamp' in message ? message.timestamp : new Date();

  const handleSave = () => {
    if (onEdit && editContent !== textContent) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  // Don't show system messages unless debug mode is on
  if (isSystemMessage && !showDebug) {
    return null;
  }

  return (
    <div className={`group py-6 ${message.role === 'system' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          message.role === 'user'
            ? 'bg-blue-600 dark:bg-blue-500 text-white'
            : message.role === 'assistant'
            ? 'bg-green-600 dark:bg-green-500 text-white'
            : 'bg-amber-600 dark:bg-amber-500 text-white'
        }`}>
          {message.role === 'user' ? 'Y' : message.role === 'assistant' ? 'GM' : 'S'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Game Master' : 'System'}
            </span>
            {message.role === 'user' && onEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[100px] transition-colors"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditContent(textContent);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <MessageContent message={message} showDebug={showDebug} isSystemMessage={isSystemMessage} />
          )}
        </div>
      </div>
    </div>
  );
}

// Component to render message content - handles both old and new formats
function MessageContent({ message, showDebug, isSystemMessage }: { message: DisplayMessage; showDebug: boolean; isSystemMessage: boolean }) {
  // New UIMessage format with parts
  if (isUIMessage(message)) {
    return (
      <div className="space-y-2">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;

          switch (part.type) {
            case 'text':
              return <TextPart key={key} text={part.text || ''} showDebug={showDebug} isSystemMessage={isSystemMessage} />;

            case 'reasoning':
              if (!showDebug) return null;
              return <ReasoningBox key={key}>{part.text || ''}</ReasoningBox>;

            case 'tool-call-calculator_pemdas':
            case 'tool-call-random_number_given_min_max':
            case 'tool-call-random_choice_with_weights':
              if (!showDebug) return null;
              return <ToolCallBox key={key} toolName={part.type.replace('tool-call-', '')} args={part.args} />;

            case 'tool-result':
              if (!showDebug) return null;
              return <ToolResultBox key={key} result={part.result} />;

            default:
              // Unknown part type - show in debug mode
              if (!showDebug) return null;
              return (
                <div key={key} className="my-2 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                  <div className="font-mono text-slate-600 dark:text-slate-400">
                    Unknown part type: {part.type}
                  </div>
                  <pre className="mt-2 text-slate-700 dark:text-slate-300 overflow-x-auto">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                </div>
              );
          }
        })}
      </div>
    );
  }

  // Old Message format with single content string
  const processedContent = isSystemMessage
    ? message.content
    : processContentForDisplay(message.content, showDebug);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !className;

            // Handle spoiler tags - show as box in debug mode, hidden otherwise
            if (language === 'spoiler') {
              if (!showDebug) {
                return null;
              }
              return <SpoilerBox>{String(children).replace(/\n$/, '')}</SpoilerBox>;
            }

            // Handle thinking tags - show as box in debug mode (no dropdown)
            if (language === 'thinking') {
              if (!showDebug) {
                return null;
              }
              return <ThinkingBox>{String(children).replace(/\n$/, '')}</ThinkingBox>;
            }

            // Handle bible tags - show as box
            if (language === 'bible') {
              return <BibleBox>{String(children).replace(/\n$/, '')}</BibleBox>;
            }

            // Handle character tags - show as box
            if (language === 'character') {
              return <CharacterBox>{String(children).replace(/\n$/, '')}</CharacterBox>;
            }

            // Regular code blocks
            if (!isInline) {
              return (
                <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            // Inline code
            return (
              <code className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Component to render text parts
function TextPart({ text, showDebug, isSystemMessage }: { text: string; showDebug: boolean; isSystemMessage: boolean }) {
  const processedContent = isSystemMessage
    ? text
    : processContentForDisplay(text, showDebug);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !className;

            if (language === 'spoiler') {
              if (!showDebug) return null;
              return <SpoilerBox>{String(children).replace(/\n$/, '')}</SpoilerBox>;
            }

            if (language === 'thinking') {
              if (!showDebug) return null;
              return <ThinkingBox>{String(children).replace(/\n$/, '')}</ThinkingBox>;
            }

            if (language === 'bible') {
              return <BibleBox>{String(children).replace(/\n$/, '')}</BibleBox>;
            }

            if (language === 'character') {
              return <CharacterBox>{String(children).replace(/\n$/, '')}</CharacterBox>;
            }

            if (!isInline) {
              return (
                <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            return (
              <code className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Reasoning box - for extended thinking (similar to thinking but different header)
function ReasoningBox({ children }: { children: string }) {
  return (
    <div className="my-4 border-2 border-indigo-500 dark:border-indigo-600 rounded-lg overflow-hidden">
      <div className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2">
        <span className="font-semibold">🧠 Extended Thinking (Reasoning)</span>
      </div>
      <pre className="bg-indigo-50 dark:bg-indigo-950 text-slate-900 dark:text-slate-100 p-4 overflow-x-auto whitespace-pre-wrap text-sm">
        {children}
      </pre>
    </div>
  );
}

// Tool call box - shows tool invocation
function ToolCallBox({ toolName, args }: { toolName: string; args: any }) {
  return (
    <div className="my-2 border border-cyan-500 dark:border-cyan-600 rounded-lg overflow-hidden">
      <div className="bg-cyan-600 dark:bg-cyan-700 text-white px-3 py-1.5 text-sm">
        <span className="font-semibold">🔧 Tool Call: {toolName}</span>
      </div>
      <pre className="bg-cyan-50 dark:bg-cyan-950 text-slate-900 dark:text-slate-100 p-3 overflow-x-auto text-xs">
        {JSON.stringify(args, null, 2)}
      </pre>
    </div>
  );
}

// Tool result box - shows tool result
function ToolResultBox({ result }: { result: any }) {
  return (
    <div className="my-2 border border-teal-500 dark:border-teal-600 rounded-lg overflow-hidden">
      <div className="bg-teal-600 dark:bg-teal-700 text-white px-3 py-1.5 text-sm">
        <span className="font-semibold">✅ Tool Result</span>
      </div>
      <pre className="bg-teal-50 dark:bg-teal-950 text-slate-900 dark:text-slate-100 p-3 overflow-x-auto text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

// Spoiler box - always visible in debug mode (no dropdown)
function SpoilerBox({ children }: { children: string }) {
  return (
    <div className="my-4 border-2 border-amber-500 dark:border-amber-600 rounded-lg overflow-hidden">
      <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2">
        <span className="font-semibold">🔒 Hidden Information (Spoiler)</span>
      </div>
      <pre className="bg-amber-50 dark:bg-amber-950 text-slate-900 dark:text-slate-100 p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Thinking box - always visible in debug mode (no dropdown)
function ThinkingBox({ children }: { children: string }) {
  return (
    <div className="my-4 border-2 border-purple-500 dark:border-purple-600 rounded-lg overflow-hidden">
      <div className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2">
        <span className="font-semibold">💭 AI Thinking Process</span>
      </div>
      <pre className="bg-purple-50 dark:bg-purple-950 text-slate-900 dark:text-slate-100 p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Bible box - always visible, clearly delineated
function BibleBox({ children }: { children: string }) {
  return (
    <div className="my-4 border-2 border-blue-500 dark:border-blue-600 rounded-lg overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2">
        <span className="font-semibold">📖 Story Bible</span>
      </div>
      <pre className="bg-blue-50 dark:bg-blue-950 text-slate-900 dark:text-slate-100 p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Character box - always visible, clearly delineated
function CharacterBox({ children }: { children: string }) {
  return (
    <div className="my-4 border-2 border-green-500 dark:border-green-600 rounded-lg overflow-hidden">
      <div className="bg-green-600 dark:bg-green-700 text-white px-4 py-2">
        <span className="font-semibold">👤 Character</span>
      </div>
      <pre className="bg-green-50 dark:bg-green-950 text-slate-900 dark:text-slate-100 p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}
