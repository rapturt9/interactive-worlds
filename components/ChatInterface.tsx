'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Message } from '@/types';
import ChatMessage from './ChatMessage';

interface ChatInterfaceProps {
  worldId: string;
  chatId: string;
  initialMessages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  isLoading?: boolean;
  showDebug?: boolean;
}

export default function ChatInterface({
  worldId,
  chatId,
  initialMessages,
  onSendMessage,
  onEditMessage,
  isLoading = false,
  showDebug = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      await onSendMessage(input.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      await onEditMessage(messageId, newContent);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: newContent } : msg
        )
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
      // TODO: Show error to user
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            showDebug={showDebug}
            onEdit={
              message.role === 'user'
                ? (content) => handleEdit(message.id, content)
                : undefined
            }
          />
        ))}
        {(isSending || isLoading) && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg mr-auto max-w-[95%] transition-colors">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">Game Master is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-colors">
        <div className="relative border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your action..."
            className="w-full p-3 pr-14 resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
            rows={3}
            disabled={isSending || isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || isLoading}
            className="absolute bottom-2 right-2 p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
