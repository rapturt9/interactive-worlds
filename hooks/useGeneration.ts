'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { Message, ModelTier, WorldParameters } from '@/types';
import { copyMessagesToNewPhase } from '@/lib/utils/phase-transition-helpers';

/**
 * UNIFIED GENERATION HOOK
 *
 * Single hook handling all generation phases (world, character, chat0+).
 * Consolidates logic from useWorldGeneration, useCharacterGeneration, and useGameplayChat.
 *
 * Usage:
 * ```typescript
 * const worldGen = useGeneration({
 *   phase: 'world',
 *   currentChatId,
 *   modelTier,
 *   userPrompt: generateWorldParametersPrompt(params),
 *   onParseResponse: parseWorldTags,
 *   onSaveMetadata: async (parsed, chatId) => {...},
 *   ...
 * });
 * ```
 */

export interface GenerationConfig {
  // Core config
  phase: 'world' | 'character' | 'chat0' | string;
  currentChatId: string | null;
  modelTier: ModelTier;

  // Phase-specific
  fromPhase?: 'world' | 'character' | string; // For phase transitions
  getUserPrompt: () => string; // Callback to get prompt at generation time
  parameters?: WorldParameters; // For world generation

  // Parsing and metadata
  onParseResponse?: (fullResponse: string) => any;
  onSaveMetadata?: (parsed: any, chatId: string) => Promise<void>;

  // State callbacks
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
  onSetStreaming: (streaming: boolean) => void;

  // Completion callbacks
  onComplete?: () => void;
  onAutoTrigger?: () => void; // For world→character auto-transition

  // Optional refs for conditional logic
  showDebugRef?: React.RefObject<boolean>;

  // Optional phase change callback
  onGenerationPhaseChange?: (phase: string) => void;
}

export interface GenerationReturn {
  isGenerating: boolean;
  chat: ReturnType<typeof useChat>;
  handleGenerate: () => Promise<void>;
}

/**
 * Unified generation hook
 */
export function useGeneration(config: GenerationConfig): GenerationReturn {
  const {
    phase,
    currentChatId,
    modelTier,
    fromPhase,
    getUserPrompt,
    parameters,
    onParseResponse,
    onSaveMetadata,
    onMessagesUpdate,
    onSetStreaming,
    onComplete,
    onAutoTrigger,
    showDebugRef,
    onGenerationPhaseChange,
  } = config;

  const [isGenerating, setIsGenerating] = useState(false);

  // Ref to prevent duplicate onFinish processing
  const hasCompletedRef = useRef(false);

  // Ref to store currentChatId for onFinish closure
  const chatIdRef = useRef<string | null>(currentChatId);

  // Ref to track message count before sending (for onFinish to slice correctly)
  const messageCountBeforeSendRef = useRef<number>(0);

  // Store ALL config in ref to prevent stale closures
  const configRef = useRef({
    phase,
    modelTier,
    parameters,
    getUserPrompt,
    onParseResponse,
    onSaveMetadata,
    onComplete,
    onAutoTrigger,
    showDebugRef,
    onGenerationPhaseChange,
  });

  // Keep chatIdRef up to date
  useEffect(() => {
    chatIdRef.current = currentChatId;
  }, [currentChatId]);

  // Update configRef when config changes
  useEffect(() => {
    configRef.current = {
      phase,
      modelTier,
      parameters,
      getUserPrompt,
      onParseResponse,
      onSaveMetadata,
      onComplete,
      onAutoTrigger,
      showDebugRef,
      onGenerationPhaseChange,
    };
  }, [phase, modelTier, parameters, getUserPrompt, onParseResponse, onSaveMetadata, onComplete, onAutoTrigger, showDebugRef, onGenerationPhaseChange]);

  // useChat hook - unified for all phases
  const chat = useChat({
    id: `generation-${phase}`, // Unique ID per phase
    transport: new DefaultChatTransport({
      api: '/api/generate',
      body: (message: any, requestBody: any) => {
        // Get current config from ref to inject dynamic body
        const { phase: currentPhase, modelTier, parameters } = configRef.current;

        return {
          ...requestBody,
          phase: currentPhase,
          modelTier,
          parameters,
        };
      },
    }),
    onFinish: async ({ message, messages, isAbort, isDisconnect, isError }: any) => {
      // Get current config from ref to avoid stale closures
      const {
        phase: currentPhase,
        onParseResponse,
        onSaveMetadata,
        onComplete,
        onAutoTrigger,
        showDebugRef,
      } = configRef.current;

      // Guard against duplicate calls
      if (hasCompletedRef.current) {
        console.log(`⚠️ Already processed ${currentPhase} completion, skipping`);
        return;
      }
      hasCompletedRef.current = true;
      console.log(`✅ ${currentPhase} generation finished!`, { messagesCount: messages.length, isAbort, isDisconnect, isError });

      // Get chatId from ref (prevents stale closure)
      const activeChatId = chatIdRef.current;
      if (!activeChatId) {
        console.error(`❌ CRITICAL: chatIdRef.current is null! Cannot complete ${currentPhase} generation.`);
        return;
      }

      console.log(`🎉 ${currentPhase} generation complete, processing results...`);

      // Extract text from UIMessage parts
      const textParts = message.parts?.filter((p: any) => p.type === "text") || [];
      const fullResponse = textParts.map((p: any) => p.text).join("");

      console.log(`📜 Parsing ${currentPhase} generation response:`, {
        fullResponseLength: fullResponse.length,
        preview: fullResponse.substring(0, 500) + "...",
      });

      // Parse response if custom parser provided
      let parsed: any = null;
      if (onParseResponse) {
        parsed = onParseResponse(fullResponse);
        console.log(`📜 Parsed ${currentPhase} tags:`, parsed);
      }

      // Save metadata if custom saver provided
      if (onSaveMetadata && parsed) {
        console.log("💾 Saving metadata to database...");
        await onSaveMetadata(parsed, activeChatId);
        console.log("✅ Metadata saved to database");
      }

      // Save ALL new messages (user + assistant) after the count we tracked before sending
      const newMessages = messages.slice(messageCountBeforeSendRef.current);
      console.log(`💾 Saving ${newMessages.length} NEW messages (user + assistant, filtered from ${messages.length} total)`);

      // Import dynamically to avoid circular dependency
      const { saveGenerationMessages } = await import('@/lib/utils/generation-helpers');
      const savedMessages = await saveGenerationMessages({
        messages: newMessages,
        chatId: activeChatId,
        phase: currentPhase as any,
        onMessagesUpdate,
      });

      // Update in-memory state with saved messages (append-only)
      console.log(`📝 Updating in-memory state with ${savedMessages.length} saved messages`);
      onMessagesUpdate((prev) => [...prev, ...savedMessages]);

      // Reset streaming state
      setIsGenerating(false);
      onSetStreaming(false);

      // Call completion callback
      if (onComplete) {
        onComplete();
      }

      // Auto-trigger logic (for world → character transition)
      if (onAutoTrigger && showDebugRef) {
        const isDebugMode = showDebugRef.current;
        console.log(`🔍 Auto-trigger check: isDebugMode=${isDebugMode}, onAutoTrigger=${!!onAutoTrigger}`);
        if (!isDebugMode) {
          console.log(`🚀 Auto-triggering next phase...`);
          onAutoTrigger();
        } else {
          console.log(`⏸️ Debug mode enabled, skipping auto-trigger`);
        }
      }

      console.log(`✅ ${currentPhase} generation complete!`);
    },
    onError: (error: any) => {
      const { phase: currentPhase } = configRef.current;
      console.error(`❌ ${currentPhase} generation error:`, error);
      setIsGenerating(false);
      onSetStreaming(false);
      toast.error(`Failed to generate ${currentPhase}: ${error.message}`);
    },
  } as any);

  const handleGenerate = async () => {
    if (!chatIdRef.current) {
      toast.error('No chat ID available');
      return;
    }

    // Reset completion flag for new generation
    hasCompletedRef.current = false;

    setIsGenerating(true);
    onSetStreaming(true);

    // Get current config from ref
    const { phase: currentPhase, getUserPrompt, onGenerationPhaseChange } = configRef.current;

    // Update phase indicator
    if (onGenerationPhaseChange) {
      onGenerationPhaseChange(currentPhase);
    }

    try {
      // PHASE TRANSITION: Copy messages from previous phase (if needed)
      if (fromPhase) {
        console.log(`🔄 Starting phase transition: ${fromPhase} → ${currentPhase}`);
        const previousMessages = await copyMessagesToNewPhase({
          chatId: chatIdRef.current!,
          fromPhases: fromPhase,
          toPhase: currentPhase,
          onMessagesUpdate,
        });
        console.log(`✅ Phase transition complete, ${previousMessages.length} messages copied`);

        // Load previous messages into the hook for API context
        console.log(`📝 Loading ${previousMessages.length} messages into hook`);
        chat.setMessages(previousMessages);
      }

      // Get CURRENT prompt at generation time (not initialization time)
      const userPrompt = getUserPrompt();

      // Track message count BEFORE sending
      // sendMessage will add the user message, so we track the count before that happens
      messageCountBeforeSendRef.current = chat.messages.length;
      console.log(`📊 Message count before send: ${messageCountBeforeSendRef.current}`);

      console.log(`🚀 Sending ${currentPhase} generation message...`);

      // Trigger generation - SDK handles message creation and state management
      chat.sendMessage({
        parts: [
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      });
    } catch (error) {
      const { phase: currentPhase } = configRef.current;
      console.error(`Error during ${currentPhase} generation:`, error);
      setIsGenerating(false);
      onSetStreaming(false);
      toast.error(`Failed to start ${currentPhase} generation`);
    }
  };

  return {
    isGenerating,
    chat,
    handleGenerate,
  };
}
