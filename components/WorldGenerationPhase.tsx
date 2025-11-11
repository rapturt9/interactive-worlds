'use client';

import { Message, ModelTier, WorldParameters } from '@/types';
import { UIMessage } from 'ai';
import WorldSetupForm from './WorldSetupForm';
import MessagesArea from './MessagesArea';
import InputArea from './InputArea';
import EnhancedLoadingState from './EnhancedLoadingState';

interface WorldGenerationPhaseProps {
  showSetupForm: boolean;
  isGenerating: boolean;
  isGeneratingCharacter: boolean;
  onWorldSetup: (params: { modelTier: ModelTier; worldParams: WorldParameters }) => Promise<void>;
  showCharacterButton: boolean;
  onGenerateCharacter: () => void;
  showProceedButton: boolean;
  onProceedToGameplay: () => void;
  showDebug: boolean;
  generationPhase: string;
  worldGenMessages: UIMessage[];
  charGenMessages: UIMessage[];
  systemMessages: Message[];
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onBack?: () => void;
  theme: 'light-parchment' | 'dark-parchment'; // Add theme prop for loading animation
  onFormSubmittingChange?: (isSubmitting: boolean) => void;
}

/**
 * World generation phase component
 * Shows setup form and generation progress
 */
export default function WorldGenerationPhase({
  showSetupForm,
  isGenerating,
  isGeneratingCharacter,
  onWorldSetup,
  showCharacterButton,
  onGenerateCharacter,
  showProceedButton,
  onProceedToGameplay,
  showDebug,
  generationPhase,
  worldGenMessages,
  charGenMessages,
  systemMessages,
  onEditMessage,
  onBack,
  theme,
  onFormSubmittingChange,
}: WorldGenerationPhaseProps) {
  // Input should ALWAYS be visible when there are messages OR when generation is active
  // This applies to both debug and production modes
  const showInput = worldGenMessages.length > 0 || isGenerating || isGeneratingCharacter;

  // In production mode, show loading animation during generation
  const showLoadingAnimation = !showDebug && (isGenerating || isGeneratingCharacter);

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
          phase={isGeneratingCharacter ? 'character' : 'world'}
          theme={theme}
        />
      ) : (
        // DEBUG MODE or COMPLETED: Show messages and buttons
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <MessagesArea
            worldGenMessages={worldGenMessages}
            charGenMessages={charGenMessages}
            systemMessages={systemMessages}
            showDebug={showDebug}
            generationPhase={generationPhase}
            isGeneratingWorld={isGenerating}
            isGeneratingCharacter={isGeneratingCharacter}
            onEditMessage={onEditMessage}
            showCharacterButton={showCharacterButton}
            onGenerateCharacter={onGenerateCharacter}
            showProceedButton={showProceedButton}
            onProceedToGameplay={onProceedToGameplay}
          />

          {/* Show input area in debug mode - always disabled during world gen */}
          {showInput && (
            <InputArea
              value=""
              onChange={() => {}}
              onSendMessage={async () => {}}
              disabled={true}
              placeholder="Input disabled during world/character generation..."
            />
          )}
        </div>
      )}
    </div>
  );
}
