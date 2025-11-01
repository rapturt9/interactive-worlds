"use client";

import React, { useState, useMemo, memo, Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types";
import { processContentForDisplay } from "@/lib/utils/tag-parser";

// Support both old Message format and new UIMessage format
type DisplayMessage =
  | Message
  | {
      id: string;
      role: "user" | "assistant" | "system" | "system-switch" | "phase-marker";
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
  isStreaming?: boolean; // Whether this message is currently being streamed
}

// Type guard to check if message is UIMessage format
function isUIMessage(
  msg: DisplayMessage
): msg is {
  id: string;
  role: "user" | "assistant" | "system" | "system-switch" | "phase-marker";
  parts: any[];
  timestamp?: Date;
} {
  return "parts" in msg;
}

function ChatMessage({
  message,
  onEdit,
  showDebug = false,
  isStreaming = false,
}: ChatMessageProps) {
  // Get text content for editing (only for old format)
  const textContent = useMemo(() => {
    if (!isUIMessage(message)) {
      return message.content;
    }
    // For UIMessage, concatenate all text parts
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  }, [message]);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(textContent);

  const isSystemMessage = message.role === "system";
  const isSystemSwitch = message.role === "system-switch";
  const isPhaseMarker = message.role === "phase-marker";
  const timestamp = "timestamp" in message ? message.timestamp : new Date();

  const handleSave = () => {
    if (onEdit && editContent !== textContent) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  // Render phase-marker as a visual divider
  if (isPhaseMarker) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-accent-parchment/30"></div>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent-parchment/10 rounded border border-accent-parchment/30">
            <span className="text-sm font-bold text-accent-parchment">
              {textContent}
            </span>
          </div>
          <div className="flex-1 h-px bg-accent-parchment/30"></div>
        </div>
      </div>
    );
  }

  // Render system-switch as a visual divider
  if (isSystemSwitch) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-4">
          <div
            className="flex-1 h-px"
            style={{
              background: `linear-gradient(to right, transparent, var(--accent), transparent)`,
            }}
          ></div>
          <div className="flex items-center gap-2 px-4 py-2 bg-parchment-secondary rounded-full border border-parchment">
            <span className="text-sm font-semibold text-accent-parchment">
              {textContent || "System Prompt Switch"}
            </span>
          </div>
          <div
            className="flex-1 h-px"
            style={{
              background: `linear-gradient(to right, transparent, var(--accent), transparent)`,
            }}
          ></div>
        </div>
      </div>
    );
  }

  // Show system messages in collapsible section when debug mode is on
  if (isSystemMessage) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="py-4 border-l-4 border-accent-parchment">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-parchment-tertiary transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent-parchment text-parchment-primary flex items-center justify-center text-xs font-bold">
              S
            </div>
            <span className="font-semibold text-sm text-parchment-primary">
              System Prompt
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-accent-parchment transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isExpanded && (
          <div className="px-4 py-3 text-xs text-parchment-primary font-mono bg-parchment-tertiary max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{textContent}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group py-4">
      {/* User message - simple with indicator */}
      {message.role === "user" && (
        <div className="flex items-start gap-2">
          <span className="text-parchment-muted font-bold select-none">
            &gt;
          </span>
          {isEditing ? (
            <div className="flex-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-parchment rounded-lg bg-parchment-secondary text-parchment-primary min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent-parchment"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-accent-parchment text-parchment-primary rounded-lg text-sm hover:opacity-80 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditContent(textContent);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-parchment-tertiary text-parchment-primary rounded-lg text-sm hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-parchment-secondary italic">
                  You
                </span>
                {onEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-accent-parchment hover:opacity-80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    edit
                  </button>
                )}
              </div>
              <div className="text-parchment-primary">
                <MessageContent
                  message={message}
                  showDebug={showDebug}
                  isSystemMessage={isSystemMessage}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assistant message - clean paragraph text */}
      {message.role === "assistant" && (
        <div className="text-parchment-primary leading-relaxed">
          <MessageContent
            message={message}
            showDebug={showDebug}
            isSystemMessage={isSystemMessage}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}

// Component to render message content - handles both old and new formats
function MessageContent({
  message,
  showDebug,
  isSystemMessage,
  isStreaming,
}: {
  message: DisplayMessage;
  showDebug: boolean;
  isSystemMessage: boolean;
  isStreaming: boolean;
}) {
  // New UIMessage format with parts
  if (isUIMessage(message)) {
    // Removed console.log to prevent excessive logging on every render
    return (
      <div className="space-y-2">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;

          switch (part.type) {
            case "text":
              return (
                <TextPart
                  key={key}
                  text={part.text || ""}
                  showDebug={showDebug}
                  isSystemMessage={isSystemMessage}
                  isStreaming={isStreaming}
                />
              );

            case "reasoning":
              if (!showDebug) return null;
              return <ReasoningBox key={key}>{part.text || ""}</ReasoningBox>;

            case "step-start":
              // Skip rendering step-start markers
              return null;

            case "tool-call-calculator_pemdas":
            case "tool-call-random_number_given_min_max":
            case "tool-call-random_choice_with_weights":
              if (!showDebug) return null;
              return (
                <ToolCallBox
                  key={key}
                  toolName={part.type.replace("tool-call-", "")}
                  args={part.args}
                />
              );

            case "tool-result":
              if (!showDebug) return null;
              return <ToolResultBox key={key} result={part.result} />;

            default:
              // AI SDK 5.0 tool part types - tools have dynamic type names with 'tool-' prefix
              // Handle dynamic tool names (type starts with 'tool-' prefix)
              if (
                part.type?.startsWith("tool-calculator_pemdas") ||
                part.type?.startsWith("tool-random_number_given_min_max") ||
                part.type?.startsWith("tool-random_choice_with_weights")
              ) {
                if (!showDebug) return null;

                // Check if this is a tool call or tool result based on state
                const partWithState = part as any;

                // If state is 'output-available', show both the call and the result
                if (
                  partWithState.state === "output-available" &&
                  partWithState.output !== undefined
                ) {
                  return (
                    <Fragment key={key}>
                      <ToolCallBox
                        toolName={part.type.replace("tool-", "")}
                        args={partWithState.input}
                      />
                      <ToolResultBox result={partWithState.output} />
                    </Fragment>
                  );
                }

                // Otherwise just show the tool call
                if (partWithState.input !== undefined) {
                  return (
                    <ToolCallBox
                      key={key}
                      toolName={part.type.replace("tool-", "")}
                      args={partWithState.input}
                    />
                  );
                }
              }

              // Unknown part type - show in debug mode
              if (!showDebug) return null;
              return (
                <div
                  key={key}
                  className="my-2 p-3 bg-[var(--bg-secondary)] rounded text-xs border border-[var(--border-color)]"
                >
                  <div className="font-mono text-[var(--text-secondary)]">
                    Unknown part type: {part.type}
                  </div>
                  <pre className="mt-2 text-[var(--text-primary)] overflow-x-auto">
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

  // Memoize markdown components to prevent recreation
  const markdownComponents = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";
        const isInline = !className;

        if (language === "spoiler") {
          if (!showDebug) return null;
          return <SpoilerBox>{String(children).replace(/\n$/, "")}</SpoilerBox>;
        }

        if (language === "thinking") {
          if (!showDebug) return null;
          return (
            <ThinkingBox>{String(children).replace(/\n$/, "")}</ThinkingBox>
          );
        }

        if (language === "bible") {
          return <BibleBox>{String(children).replace(/\n$/, "")}</BibleBox>;
        }

        if (language === "character") {
          return (
            <CharacterBox>{String(children).replace(/\n$/, "")}</CharacterBox>
          );
        }

        if (!isInline) {
          return (
            <pre className="bg-parchment-tertiary text-parchment-primary p-4 rounded-lg overflow-x-auto border border-parchment">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        }

        return (
          <code
            className="bg-parchment-secondary text-parchment-primary px-1 py-0.5 rounded text-sm"
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [showDebug]
  );

  // OPTIMIZATION: Show raw text during streaming (fast), markdown when complete (beautiful)
  if (isStreaming && !isSystemMessage) {
    return (
      <div className="prose prose-sm max-w-none text-parchment-primary">
        <div className="whitespace-pre-wrap">
          {processedContent}
          <span className="inline-block w-0.5 h-4 ml-1 bg-accent-parchment animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-parchment-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Component to render text parts with streaming optimization
function TextPart({
  text,
  showDebug,
  isSystemMessage,
  isStreaming,
}: {
  text: string;
  showDebug: boolean;
  isSystemMessage: boolean;
  isStreaming: boolean;
}) {
  const processedContent = isSystemMessage
    ? text
    : processContentForDisplay(text, showDebug);

  // Memoize markdown components to prevent recreation on every render
  const markdownComponents = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";
        const isInline = !className;

        if (language === "spoiler") {
          if (!showDebug) return null;
          return <SpoilerBox>{String(children).replace(/\n$/, "")}</SpoilerBox>;
        }

        if (language === "thinking") {
          if (!showDebug) return null;
          return (
            <ThinkingBox>{String(children).replace(/\n$/, "")}</ThinkingBox>
          );
        }

        if (language === "bible") {
          return <BibleBox>{String(children).replace(/\n$/, "")}</BibleBox>;
        }

        if (language === "character") {
          return (
            <CharacterBox>{String(children).replace(/\n$/, "")}</CharacterBox>
          );
        }

        if (!isInline) {
          return (
            <pre className="bg-parchment-tertiary text-parchment-primary p-4 rounded-lg overflow-x-auto border border-parchment">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        }

        return (
          <code
            className="bg-parchment-secondary text-parchment-primary px-1 py-0.5 rounded text-sm"
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [showDebug]
  );

  // OPTIMIZATION: Show raw text during streaming (fast), markdown when complete (beautiful)
  if (isStreaming && !isSystemMessage) {
    return (
      <div className="prose prose-sm max-w-none text-parchment-primary">
        <div className="whitespace-pre-wrap">
          {processedContent}
          <span className="inline-block w-0.5 h-4 ml-1 bg-accent-parchment animate-pulse" />
        </div>
      </div>
    );
  }

  // Render markdown when not streaming or when complete
  return (
    <div className="prose prose-sm max-w-none text-parchment-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Reasoning box - for extended thinking (similar to thinking but different header)
function ReasoningBox({ children }: { children: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-4 py-2">
        <span className="font-semibold">🧠 Extended Thinking (Reasoning)</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-4 overflow-x-auto whitespace-pre-wrap text-sm">
        {children}
      </pre>
    </div>
  );
}

// Tool call box - shows tool invocation
function ToolCallBox({ toolName, args }: { toolName: string; args: any }) {
  return (
    <div className="my-2 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-3 py-1.5 text-sm">
        <span className="font-semibold">🔧 Tool Call: {toolName}</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-3 overflow-x-auto text-xs">
        {JSON.stringify(args, null, 2)}
      </pre>
    </div>
  );
}

// Tool result box - shows tool result
function ToolResultBox({ result }: { result: any }) {
  return (
    <div className="my-2 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-3 py-1.5 text-sm">
        <span className="font-semibold">✅ Tool Result</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-3 overflow-x-auto text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

// Spoiler box - always visible in debug mode (no dropdown)
function SpoilerBox({ children }: { children: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-4 py-2">
        <span className="font-semibold">🔒 Hidden Information (Spoiler)</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Thinking box - always visible in debug mode (no dropdown)
function ThinkingBox({ children }: { children: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-4 py-2">
        <span className="font-semibold">💭 AI Thinking Process</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Bible box - always visible, clearly delineated
function BibleBox({ children }: { children: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-4 py-2">
        <span className="font-semibold">📖 Story Bible</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Character box - always visible, clearly delineated
function CharacterBox({ children }: { children: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-accent-parchment text-parchment-primary px-4 py-2">
        <span className="font-semibold">👤 Character</span>
      </div>
      <pre className="bg-parchment-secondary text-parchment-primary p-4 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ChatMessage);
