'use client';

import { Message } from '@/types';
import { UIMessage } from 'ai';
import { memo, useMemo, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import SystemPromptSwitch from './SystemPromptSwitch';

interface MessagesAreaProps {
  messages: UIMessage[] | Message[];
  showDebug: boolean;
  generationPhase?: string; // world, character, chat0, etc.
  isGeneratingWorld?: boolean;
  isGeneratingCharacter?: boolean;
  isSending?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  showProceedButton?: boolean;
  onProceedToGameplay?: () => void;
  showCharacterButton?: boolean;
  onGenerateCharacter?: () => void;
}

/**
 * Messages display area with loading states and action buttons
 */
function MessagesArea({
  messages,
  showDebug,
  generationPhase = 'world',
  isGeneratingWorld = false,
  isGeneratingCharacter = false,
  isSending = false,
  onEditMessage,
  showProceedButton = false,
  onProceedToGameplay,
  showCharacterButton = false,
  onGenerateCharacter,
}: MessagesAreaProps) {
  // Optimize: Use message counts instead of full arrays to prevent recalculation on every streaming chunk
  const messageCount = messages.length;

  // Memoize message filtering - only recalculate when structure changes, not content
  const filteredMessages = useMemo(() => {
    // prepareVisualMessages already handles filtering and phase markers
    return messages;
  }, [messageCount, showDebug, messages]);

  // Scroll management - preserve position or auto-scroll to bottom
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true); // Track if user was at bottom before update

  // Check if user is at bottom (within 100px threshold)
  const isAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Auto-scroll to bottom when new messages arrive (only if user was already at bottom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If user was at bottom, scroll to bottom to show new content
    if (wasAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    // Otherwise preserve current position (user is reading history)
  }, [messageCount, isSending, isGeneratingWorld, isGeneratingCharacter]);

  // Track scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      wasAtBottomRef.current = isAtBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative min-h-0">
        {/* Top gradient fade for immersion */}
        <div
          className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-10"
          style={{
            background: `linear-gradient(to bottom, var(--bg-primary), transparent)`
          }}
        />
        <div className="max-w-4xl mx-auto w-full px-8 py-6 space-y-6">
          {filteredMessages.map((message, index) => {
            // Check if this is the point where system prompt switches (debug mode only)
            const isSystemSwitch =
              showDebug &&
              message.role === 'system' &&
              message.id.includes('system-2') &&
              index > 0 &&
              filteredMessages[index - 1].role === 'assistant';

            // Detect if this is the last assistant message and streaming is active
            const isLastMessage = index === filteredMessages.length - 1;
            const isAssistantMessage = message.role === 'assistant';
            const isStreaming = isLastMessage && isAssistantMessage && (isGeneratingWorld || isGeneratingCharacter || isSending);

            return (
              <div key={`${message.id}-${(message as any).phase || 'unknown'}`}>
                {isSystemSwitch && <SystemPromptSwitch />}
                <ChatMessage
                  message={message}
                  showDebug={showDebug}
                  isStreaming={isStreaming}
                  onEdit={
                    message.role === 'user' && onEditMessage
                      ? (content) => onEditMessage(message.id, content)
                      : undefined
                  }
                />
              </div>
            );
          })}

          {/* World Generation Loading */}
          {isGeneratingWorld && !showDebug && (
            <div className="bg-parchment-secondary border border-parchment p-6 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-accent-parchment"></div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-parchment-primary mb-1">
                    Generating World
                  </div>
                  <div className="text-sm text-parchment-secondary">
                    Creating story bible, characters, and hidden plots...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gameplay Message Loading - Only show before first token arrives */}
          {isSending && (() => {
            const lastMessage = filteredMessages[filteredMessages.length - 1];
            const hasStreamingContent = lastMessage?.role === 'assistant' &&
              (lastMessage as any).parts?.some((p: any) => p.type === 'text' && p.text?.length > 0);

            // Only show placeholder if we don't have streaming content yet
            if (!hasStreamingContent) {
              return (
                <div className="bg-parchment-secondary border border-parchment p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-parchment"></div>
                    <span className="text-sm text-parchment-secondary">
                      Game Master is thinking...
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Character Generation Button - Only show in debug mode */}
      {showDebug && showCharacterButton && onGenerateCharacter && (
        <div className="flex-shrink-0 border-t border-parchment bg-parchment-primary p-6">
          <div className="max-w-md mx-auto text-center">
            <p className="text-parchment-secondary mb-4">
              World generation complete! Now generate the starting character.
            </p>
            <button
              onClick={onGenerateCharacter}
              disabled={isGeneratingCharacter}
              className="px-8 py-3 bg-accent-parchment text-parchment-primary rounded-lg hover:opacity-80 font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGeneratingCharacter ? 'Generating Character...' : 'Generate Character'}
            </button>
          </div>
        </div>
      )}

      {/* Proceed to Gameplay Button - Only show in debug mode */}
      {showDebug && showProceedButton && onProceedToGameplay && (
        <div className="flex-shrink-0 border-t border-parchment bg-parchment-primary p-6">
          <div className="max-w-md mx-auto text-center">
            <p className="text-parchment-secondary mb-4">
              {generationPhase === 'character'
                ? 'Character generation complete! Ready to begin your adventure?'
                : 'World generation complete! Ready to begin your adventure?'}
            </p>
            <button
              onClick={onProceedToGameplay}
              className="px-8 py-3 bg-accent-parchment text-parchment-primary rounded-lg hover:opacity-80 font-medium transition-opacity"
            >
              Begin Adventure
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(MessagesArea);
