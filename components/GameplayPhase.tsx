'use client';

import { UIMessage } from 'ai';
import MessagesArea from './MessagesArea';
import InputArea from './InputArea';

interface GameplayPhaseProps {
  messages: UIMessage[];
  isGenerating: boolean;
  isSending: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  showDebug: boolean;
  generationPhase: string;
  showProceedButton: boolean;
  onProceedToGameplay: () => void;
}

/**
 * Gameplay phase component
 * Shows messages and input area for active gameplay
 */
export default function GameplayPhase({
  messages,
  isGenerating,
  isSending,
  input,
  onInputChange,
  onSendMessage,
  onEditMessage,
  showDebug,
  generationPhase,
  showProceedButton,
  onProceedToGameplay,
}: GameplayPhaseProps) {
  // Always show input if there are messages
  const showInput = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <MessagesArea
        messages={messages}
        showDebug={showDebug}
        generationPhase={generationPhase}
        isSending={isSending}
        onEditMessage={onEditMessage}
        showProceedButton={showProceedButton}
        onProceedToGameplay={onProceedToGameplay}
      />

      {showInput && (
        <InputArea
          value={input}
          onChange={onInputChange}
          onSendMessage={onSendMessage}
          disabled={isSending || isGenerating}
        />
      )}
    </div>
  );
}
