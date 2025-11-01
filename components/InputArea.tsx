'use client';

import { ArrowUp } from 'lucide-react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: () => void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * Chat input component with send button
 */
export default function InputArea({
  value,
  onChange,
  onSendMessage,
  disabled,
  placeholder = 'Type your action...',
}: InputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t border-parchment bg-parchment-primary p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative border border-parchment rounded-xl bg-parchment-secondary focus-within:ring-2 focus-within:ring-accent-parchment transition-all">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-14 resize-none bg-transparent text-parchment-primary placeholder-parchment-muted focus:outline-none"
            rows={3}
            disabled={disabled}
          />
          <button
            onClick={onSendMessage}
            disabled={!value.trim() || disabled}
            className="absolute bottom-2 right-2 p-2 bg-accent-parchment text-parchment-primary rounded-lg hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-parchment-muted mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
