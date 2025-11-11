'use client';

import { ModelTier, WorldParameters } from '@/types';
import { UIMessage } from 'ai';
import WorldSetupForm from './WorldSetupForm';
import MessagesArea from './MessagesArea';
import InputArea from './InputArea';
import EnhancedLoadingState from './EnhancedLoadingState';

interface WorldPhaseProps {
  showSetupForm: boolean;
  messages: UIMessage[];
  isGenerating: boolean;
  onWorldSetup: (params: { modelTier: ModelTier; worldParams: WorldParameters }) => Promise<void>;
  showCharacterButton: boolean;
  onGenerateCharacter: () => void;
  showDebug: boolean;
  generationPhase: string;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onBack?: () => void;
  theme: 'light-parchment' | 'dark-parchment';
  onFormSubmittingChange?: (isSubmitting: boolean) => void;
}

/**
 * World generation phase component
 * Shows setup form and world generation progress
 */
export default function WorldPhase({
  showSetupForm,
  messages,
  isGenerating,
  onWorldSetup,
  showCharacterButton,
  onGenerateCharacter,
  showDebug,
  generationPhase,
  onEditMessage,
  onBack,
  theme,
  onFormSubmittingChange,
}: WorldPhaseProps) {
  // Input should ALWAYS be visible when there are messages OR when generation is active
  const showInput = messages.length > 0 || isGenerating;

  // In production mode, show loading animation during generation
  const showLoadingAnimation = !showDebug && isGenerating;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {showSetupForm ? (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="w-full">
              <WorldSetupForm
                onSubmit={onWorldSetup}
                isGenerating={isGenerating}
                onBack={onBack}
                onSubmittingChange={onFormSubmittingChange}
              />
            </div>
          </div>
        </div>
      ) : showLoadingAnimation ? (
        // PRODUCTION MODE: Show enhanced loading animation instead of messages
        <EnhancedLoadingState
          phase="world"
          theme={theme}
        />
      ) : (
        // DEBUG MODE or COMPLETED: Show messages and buttons
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <MessagesArea
            messages={messages}
            showDebug={showDebug}
            generationPhase={generationPhase}
            isGeneratingWorld={isGenerating}
            onEditMessage={onEditMessage}
            showCharacterButton={showCharacterButton}
            onGenerateCharacter={onGenerateCharacter}
          />

          {/* Show input area in debug mode - always disabled during world gen */}
          {showInput && (
            <InputArea
              value=""
              onChange={() => {}}
              onSendMessage={async () => {}}
              disabled={true}
              placeholder="Input disabled during world generation..."
            />
          )}
        </div>
      )}
    </div>
  );
}
