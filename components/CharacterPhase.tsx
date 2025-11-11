'use client';

import { UIMessage } from 'ai';
import MessagesArea from './MessagesArea';
import InputArea from './InputArea';
import EnhancedLoadingState from './EnhancedLoadingState';

interface CharacterPhaseProps {
  messages: UIMessage[];
  isGenerating: boolean;
  showProceedButton: boolean;
  onProceedToGameplay: () => void;
  showDebug: boolean;
  generationPhase: string;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  theme: 'light-parchment' | 'dark-parchment';
}

/**
 * Character generation phase component
 * Shows character generation progress with world context
 */
export default function CharacterPhase({
  messages,
  isGenerating,
  showProceedButton,
  onProceedToGameplay,
  showDebug,
  generationPhase,
  onEditMessage,
  theme,
}: CharacterPhaseProps) {
  // Input should ALWAYS be visible when there are messages OR when generation is active
  const showInput = messages.length > 0 || isGenerating;

  // In production mode, show loading animation during generation
  const showLoadingAnimation = !showDebug && isGenerating;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {showLoadingAnimation ? (
        // PRODUCTION MODE: Show enhanced loading animation
        <EnhancedLoadingState
          phase="character"
          theme={theme}
        />
      ) : (
        // DEBUG MODE or COMPLETED: Show messages and buttons
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <MessagesArea
            messages={messages}
            showDebug={showDebug}
            generationPhase={generationPhase}
            isGeneratingCharacter={isGenerating}
            onEditMessage={onEditMessage}
            showProceedButton={showProceedButton}
            onProceedToGameplay={onProceedToGameplay}
          />

          {/* Show input area in debug mode - always disabled during character gen */}
          {showInput && (
            <InputArea
              value=""
              onChange={() => {}}
              onSendMessage={async () => {}}
              disabled={true}
              placeholder="Input disabled during character generation..."
            />
          )}
        </div>
      )}
    </div>
  );
}
