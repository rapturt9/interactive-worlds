'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Message, ModelTier, WorldParameters } from '@/types';
import { CHARACTER_GENERATION_PROMPT } from '@/lib/prompts/character-generation-prompt';

export interface UseCharacterGenerationReturn {
  isGenerating: boolean;
  showCharacterButton: boolean;
  showProceedButton: boolean;
  characterGenChat: ReturnType<typeof useChat>;
  handleGenerateCharacter: () => void;
  setShowCharacterButton: (show: boolean) => void;
  setShowProceedButton: (show: boolean) => void;
}

interface UseCharacterGenerationProps {
  currentChatId: string | null;
  bibleContent: string;
  modelTier: ModelTier;
  worldGenParams: {
    modelTier: ModelTier;
    parameters: WorldParameters;
  } | null;
  onLocalContextExtracted: (context: string) => void;
  onCharacterExtracted: (character: string) => void;
  onConversationStateChange: (state: 'world_generation' | 'gameplay') => void;
  onSetStreaming: (streaming: boolean) => void;
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
  onGenerationPhaseChange?: (phase: string) => void; // Add callback to update phase
}

/**
 * Hook to manage character generation phase
 * Handles character generation API calls, parsing, and database persistence
 */
export function useCharacterGeneration({
  currentChatId,
  bibleContent,
  modelTier,
  worldGenParams,
  onLocalContextExtracted,
  onCharacterExtracted,
  onConversationStateChange,
  onSetStreaming,
  onMessagesUpdate,
  onGenerationPhaseChange,
}: UseCharacterGenerationProps): UseCharacterGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCharacterButton, setShowCharacterButton] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);

  // Ref to prevent duplicate onFinish processing
  const hasCompletedRef = useRef(false);

  // Ref to store currentChatId for onFinish closure
  const chatIdRef = useRef<string | null>(currentChatId);

  // Keep chatIdRef up to date
  useEffect(() => {
    chatIdRef.current = currentChatId;
  }, [currentChatId]);

  // useChat hook for character generation - server handles multi-turn tool calling
  const characterGenChat = useChat({
    id: 'character-generation', // Unique ID to prevent conflicts
    transport: new DefaultChatTransport({
      api: '/api/generate-character',
      body: bibleContent
        ? {
            worldBible: bibleContent,
            modelTier,
            parameters: worldGenParams?.parameters,
          }
        : undefined,
    }),
    // REMOVED sendAutomaticallyWhen - server handles tool calling with stopWhen
    onFinish: async ({ message, messages, isAbort, isDisconnect, isError }) => {
      // Guard against duplicate calls
      if (hasCompletedRef.current) {
        console.log('⚠️ Already processed character completion, skipping');
        return;
      }
      hasCompletedRef.current = true;
      console.log('✅ Character generation finished!', { message, messagesCount: messages.length, isAbort, isDisconnect, isError });

      if (!currentChatId) return;

      console.log('🎉 Character generation complete, processing results...');

      // Extract text from UIMessage parts (correct TypeScript structure)
      const textParts = message.parts?.filter((p) => p.type === 'text') || [];
      const fullResponse = textParts.map((p) => p.text).join('');

      console.log('📜 Parsing character generation response:', {
        fullResponseLength: fullResponse.length,
        preview: fullResponse.substring(0, 500) + '...',
      });

      // Parse local_context and character tags
      const localContextMatch = fullResponse.match(/<local_context>([\s\S]*?)<\/local_context>/);
      const characterMatch = fullResponse.match(/<character>([\s\S]*?)<\/character>/);

      const local_context = localContextMatch?.[1] || '';
      const character = characterMatch?.[1] || '';

      console.log('📜 Parsed tags:', {
        hasLocalContext: !!local_context,
        localContextLength: local_context?.length || 0,
        hasCharacter: !!character,
        characterLength: character?.length || 0,
      });

      // Store extracted content via callbacks
      if (local_context) onLocalContextExtracted(local_context);
      if (character) {
        onCharacterExtracted(character);

        // Add character extraction message for display
        const characterMessage: Message = {
          id: `${chatIdRef.current}-character-extraction-final`,
          role: 'assistant',
          content: `<character>\n${character}\n</character>`,
          timestamp: new Date(),
          phase: 'character',
        };

        // Append to messages
        onMessagesUpdate((prev: Message[]) => [...prev, characterMessage]);
      }

      // Save the character generation messages to database
      // SKIP system messages - they should never be saved to database
      const dbMessages: Message[] = characterGenChat.messages
        .filter(msg => msg.role !== 'system')
        .map((msg) => {
          const textParts = msg.parts?.filter((p) => p.type === 'text') || [];
          const content = textParts.map((p: any) => p.text).join('');

          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content,
            parts: msg.parts,
            timestamp: new Date(),
            phase: 'character', // Character generation messages have phase: 'character'
          } as any;
        });

      // Save all character gen messages (excluding system prompts)
      for (const msg of dbMessages) {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentChatId,
            message: msg,
          }),
        });
      }

      // Update visual messages state with saved messages
      // This ensures messages persist after streaming completes
      onMessagesUpdate((prev) => [...prev, ...dbMessages]);

      // Update chat with character and local context
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentChatId,
          characterContent: character,
          conversationState: 'gameplay',
          generationPhase: 'character', // Mark that character phase is complete
        }),
      });

      // Update phase indicator to show character phase complete
      if (onGenerationPhaseChange) {
        onGenerationPhaseChange('character');
      }

      onConversationStateChange('gameplay');
      setIsGenerating(false);
      onSetStreaming(false);
      setShowCharacterButton(false);
      setShowProceedButton(true);
    },
    onError: (error) => {
      console.error('❌ Character generation error:', error);
      setIsGenerating(false);
      onSetStreaming(false);
      alert(`Failed to generate character: ${error.message}`);
    },
  });

  const handleGenerateCharacter = () => {
    if (!bibleContent) {
      alert('No world bible available for character generation');
      return;
    }

    // Reset completion flag for new generation
    hasCompletedRef.current = false;

    setIsGenerating(true);
    onSetStreaming(true);
    setShowCharacterButton(false);

    // Add system prompt switch marker and CHARACTER_GENERATION_PROMPT to visual messages
    onMessagesUpdate((prevMessages) => [
      ...prevMessages,
      {
        id: `${currentChatId}-switch-character`,
        role: 'system-switch',
        content: 'Switching to Character Generation Phase',
        switchTo: 'character_generation',
        timestamp: new Date(),
      },
      {
        id: `${currentChatId}-system-character`,
        role: 'system',
        content: CHARACTER_GENERATION_PROMPT,
        timestamp: new Date(),
      },
    ]);

    // Trigger character generation
    characterGenChat.sendMessage({
      parts: [
        {
          type: 'text',
          text: `Generate the starting character with full local_context. Output in <local_context></local_context> and <character></character> tags.

Here is the complete world bible:

<world_bible>
${bibleContent}
</world_bible>`,
        },
      ],
    });
  };

  return {
    isGenerating,
    showCharacterButton,
    showProceedButton,
    characterGenChat,
    handleGenerateCharacter,
    setShowCharacterButton,
    setShowProceedButton,
  };
}
