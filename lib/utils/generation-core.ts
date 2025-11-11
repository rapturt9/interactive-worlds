import { Message } from '@/types';
import { RefObject } from 'react';
import { saveGenerationMessages } from './generation-helpers';

/**
 * GENERATION CORE UTILITIES
 *
 * Shared logic for all generation hooks (world, character, gameplay).
 * Extracts common patterns to reduce code duplication and ensure consistency.
 */

/**
 * Configuration for creating an onFinish handler
 */
export interface GenerationOnFinishConfig {
  phase: 'world' | 'character' | 'chat0' | string;
  chatIdRef: RefObject<string | null>;
  messageCountBeforeSendRef: RefObject<number>;

  // Optional parsing and metadata extraction
  onParseResponse?: (fullResponse: string) => any;
  onSaveMetadata?: (parsed: any, chatId: string) => Promise<void>;

  // Completion callbacks
  onComplete?: () => void;
  onAutoTrigger?: () => void;

  // State management
  setIsGenerating: (generating: boolean) => void;
  onSetStreaming: (streaming: boolean) => void;
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;

  // Optional refs for conditional logic
  showDebugRef?: RefObject<boolean>;
}

/**
 * Create a standardized onFinish handler for generation hooks
 *
 * This function creates the onFinish callback that:
 * 1. Extracts text from message parts
 * 2. Parses response (optional custom parser)
 * 3. Saves metadata to database (optional custom saver)
 * 4. Saves only NEW assistant messages to database
 * 5. Calls completion callbacks
 *
 * @param config Configuration object
 * @returns onFinish handler function
 */
export function createGenerationOnFinish(config: GenerationOnFinishConfig) {
  return async ({ message, messages, isAbort, isDisconnect, isError }: any) => {
    const {
      phase,
      chatIdRef,
      messageCountBeforeSendRef,
      onParseResponse,
      onSaveMetadata,
      onComplete,
      onAutoTrigger,
      setIsGenerating,
      onSetStreaming,
      onMessagesUpdate,
      showDebugRef,
    } = config;

    console.log(`✅ ${phase} generation finished!`, { messagesCount: messages.length, isAbort, isDisconnect, isError });

    // Get chatId from ref (prevents stale closure)
    const activeChatId = chatIdRef.current;
    if (!activeChatId) {
      console.error(`❌ CRITICAL: chatIdRef.current is null! Cannot complete ${phase} generation.`);
      return;
    }

    console.log(`🎉 ${phase} generation complete, processing results...`);

    // Extract text from UIMessage parts
    const textParts = message.parts?.filter((p: any) => p.type === "text") || [];
    const fullResponse = textParts.map((p: any) => p.text).join("");

    console.log(`📜 Parsing ${phase} generation response:`, {
      fullResponseLength: fullResponse.length,
      preview: fullResponse.substring(0, 500) + "...",
    });

    // Parse response if custom parser provided
    let parsed: any = null;
    if (onParseResponse) {
      parsed = onParseResponse(fullResponse);
      console.log(`📜 Parsed ${phase} tags:`, parsed);
    }

    // Save metadata if custom saver provided
    if (onSaveMetadata && parsed) {
      console.log("💾 Saving metadata to database...");
      await onSaveMetadata(parsed, activeChatId);
      console.log("✅ Metadata saved to database");
    }

    // User message was already saved immediately before sending
    // Only save NEW messages after the count we tracked before sending
    const newMessages = messages.slice(messageCountBeforeSendRef.current);
    const newAssistantMessages = newMessages.filter((msg: any) => msg.role === 'assistant');
    console.log(`💾 Saving ${newAssistantMessages.length} NEW assistant messages (user already saved, filtered from ${messages.length} total)`);

    await saveGenerationMessages({
      messages: newAssistantMessages, // Only NEW assistant messages
      chatId: activeChatId,
      phase: phase as any,
      onMessagesUpdate,
    });

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
      if (!isDebugMode) {
        console.log(`🚀 Auto-triggering next phase...`);
        onAutoTrigger();
      }
    }

    console.log(`✅ ${phase} generation complete!`);
  };
}

/**
 * Configuration for starting generation
 */
export interface GenerationStartConfig {
  currentChatId: string;
  phase: 'world' | 'character' | 'chat0' | string;
  fromPhase?: 'world' | 'character' | string;
  userPrompt: string;
  chat: any; // useChat instance
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
  messageCountBeforeSendRef: RefObject<number>;
  copyMessagesToNewPhase?: (params: any) => Promise<any[]>;
}

/**
 * Handle the start of generation
 *
 * This function:
 * 1. Optionally copies messages from previous phase
 * 2. Loads previous messages into hook via setMessages()
 * 3. Saves user message to visual state and database
 * 4. Tracks message count before sending
 * 5. Calls sendMessage()
 *
 * @param config Configuration object
 */
export async function handleGenerationStart(config: GenerationStartConfig) {
  const {
    currentChatId,
    phase,
    fromPhase,
    userPrompt,
    chat,
    onMessagesUpdate,
    messageCountBeforeSendRef,
    copyMessagesToNewPhase,
  } = config;

  // PHASE TRANSITION: Copy messages from previous phase (if needed)
  if (fromPhase && copyMessagesToNewPhase) {
    console.log(`🔄 Starting phase transition: ${fromPhase} → ${phase}`);
    const previousMessages = await copyMessagesToNewPhase({
      chatId: currentChatId,
      fromPhases: fromPhase,
      toPhase: phase,
      onMessagesUpdate,
    });
    console.log(`✅ Phase transition complete, ${previousMessages.length} messages copied`);

    // Load previous messages into the hook for API context
    console.log(`📝 Loading ${previousMessages.length} messages into hook`);
    chat.setMessages(previousMessages);
  }

  // IMMEDIATELY save user message to visual state and DB
  const userMessage: Message = {
    id: `${currentChatId}-${phase}-user-${Date.now()}`,
    role: 'user',
    content: userPrompt,
    timestamp: new Date(),
    phase: phase as any,
  };

  console.log(`💾 Saving ${phase} user message immediately...`);

  // Append to visual messages immediately
  onMessagesUpdate((prev) => {
    console.log(`   Appending user message to visual (prev: ${prev.length})`);
    return [...prev, userMessage];
  });

  // Save to database
  await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: currentChatId, message: userMessage }),
  });

  // Track message count BEFORE sending
  // sendMessage will add the user message, so we track the count before that happens
  messageCountBeforeSendRef.current = chat.messages.length;
  console.log(`📊 Message count before send: ${messageCountBeforeSendRef.current}`);

  console.log(`🚀 Sending ${phase} generation message...`);

  // Trigger generation
  chat.sendMessage({
    parts: [
      {
        type: 'text',
        text: userPrompt,
      },
    ],
  });
}
