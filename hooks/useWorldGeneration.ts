"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Message, ModelTier, WorldParameters } from "@/types";
import { generateWorldParametersPrompt } from "@/lib/prompts/world-params-prompt";
import { parseWorldGenerationTags } from "@/lib/utils/tag-parser";

export interface UseWorldGenerationReturn {
  isGenerating: boolean;
  isStreaming: boolean;
  showCharacterButton: boolean;
  showProceedButton: boolean;
  worldGenParams: {
    modelTier: ModelTier;
    parameters: WorldParameters;
  } | null;
  worldGenChat: ReturnType<typeof useChat>;
  handleWorldSetup: (params: {
    modelTier: ModelTier;
    worldParams: WorldParameters;
  }) => Promise<void>;
}

interface UseWorldGenerationProps {
  currentChatId: string | null;
  showDebug: boolean;
  onBibleExtracted: (bible: string) => void;
  onCharacterExtracted: (character: string) => void;
  onChatTitleExtracted: (title: string) => void;
  onMessagesUpdate: (
    messages: Message[] | ((prev: Message[]) => Message[])
  ) => void;
  onConversationStateChange: (state: "world_generation" | "gameplay") => void;
  onSetCurrentChatId: (id: string) => void;
  onSetChatTitle: (title: string) => void;
  onShowWorldSetup: (show: boolean) => void;
  onSetStreaming: (streaming: boolean) => void;
  onChatCreated?: () => void;
  onSidebarRefresh?: () => void;
  onAutoTriggerCharacter?: () => void; // Add callback to auto-trigger character generation
  onGenerationPhaseChange?: (phase: string) => void; // Add phase change callback
}

/**
 * Hook to manage world generation phase
 * Handles world generation API calls, parsing, and database persistence
 */
export function useWorldGeneration({
  currentChatId,
  showDebug,
  onBibleExtracted,
  onCharacterExtracted,
  onChatTitleExtracted,
  onMessagesUpdate,
  onConversationStateChange,
  onSetCurrentChatId,
  onSetChatTitle,
  onShowWorldSetup,
  onSetStreaming,
  onChatCreated,
  onSidebarRefresh,
  onAutoTriggerCharacter,
  onGenerationPhaseChange,
}: UseWorldGenerationProps): UseWorldGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCharacterButton, setShowCharacterButton] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const [worldGenParams, setWorldGenParams] = useState<{
    modelTier: ModelTier;
    parameters: WorldParameters;
  } | null>(null);

  // Ref to prevent duplicate onFinish processing
  const hasCompletedRef = useRef(false);

  // Ref to store chatId for onFinish closure (since currentChatId prop doesn't update in closure)
  const chatIdRef = useRef<string | null>(currentChatId);

  // Ref to store showDebug for onFinish closure (avoid stale closure values)
  const showDebugRef = useRef(showDebug);

  // Keep showDebugRef up to date
  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);

  // useChat hook for world generation - server handles multi-turn tool calling
  const worldGenChat = useChat({
    id: "world-generation", // Unique ID to prevent conflicts with other useChat instances
    transport: new DefaultChatTransport({
      api: "/api/generate-world",
      body: worldGenParams
        ? {
            modelTier: worldGenParams.modelTier,
            parameters: worldGenParams.parameters,
          }
        : undefined,
    }),
    // REMOVED sendAutomaticallyWhen - server handles tool calling with stopWhen
    onFinish: async ({ message, messages, isAbort, isDisconnect, isError }) => {
      // Guard against duplicate calls
      if (hasCompletedRef.current) {
        console.log("⚠️ Already processed completion, skipping");
        return;
      }
      hasCompletedRef.current = true;
      console.log("✅ World generation finished!", { message, messagesCount: messages.length, isAbort, isDisconnect, isError });

      // DEBUG: Check currentChatId (use ref since prop doesn't update in closure)
      const activeChatId = chatIdRef.current;
      console.log("🔍 DEBUG onFinish - currentChatId prop:", currentChatId);
      console.log("🔍 DEBUG onFinish - chatIdRef.current:", activeChatId);
      if (!activeChatId) {
        console.error("❌ CRITICAL: chatIdRef.current is null! onFinish handler cannot continue.");
        console.error("This means the chatId was not properly stored in the ref during handleWorldSetup");
        return;
      }

      console.log("🎉 World generation complete, processing results...");

      // DEBUG: Log the message structure
      console.log("🔍 DEBUG: message.parts exists?", !!message.parts);
      console.log("🔍 DEBUG: message.parts length:", message.parts?.length || 0);
      console.log("🔍 DEBUG: message structure:", {
        id: message.id,
        role: message.role,
        partsCount: message.parts?.length || 0,
      });

      // Extract text from UIMessage parts (correct TypeScript structure)
      const textParts = message.parts?.filter((p) => p.type === "text") || [];

      console.log("🔍 DEBUG: textParts found:", textParts.length);
      console.log("🔍 DEBUG: First text part preview:", textParts[0]?.text?.substring(0, 200));

      const fullResponse = textParts.map((p) => p.text).join("");

      console.log("📜 Parsing world generation response:", {
        fullResponseLength: fullResponse.length,
        preview: fullResponse.substring(0, 500) + "...",
      });

      // Parse XML tags
      const parsed = parseWorldGenerationTags(fullResponse);
      const bible = parsed.bible || "";
      const character = parsed.character || "";
      const chatName = parsed.chatName || "";

      console.log("📜 Parsed XML tags:", {
        hasBible: !!bible,
        bibleLength: bible?.length || 0,
        hasCharacter: !!character,
        characterLength: character?.length || 0,
        hasChatName: !!chatName,
        chatName: chatName || "none",
      });

      // DEBUG: Log parsed content
      if (!bible) console.warn("⚠️ No bible content parsed!");
      if (!character) console.warn("⚠️ No character content parsed!");
      if (!chatName) console.warn("⚠️ No chat name parsed!");

      // Store extracted content via callbacks
      console.log("🔍 DEBUG: Calling extraction callbacks...");
      if (bible) {
        console.log("📖 Extracting bible content...");
        onBibleExtracted(bible);

        // Add bible extraction message for display
        const bibleMessage: Message = {
          id: `${activeChatId}-bible-extraction`,
          role: 'assistant',
          content: `<bible>\n${bible}\n</bible>`,
          timestamp: new Date(),
          phase: 'world',
        };

        // Append to messages
        onMessagesUpdate((prev: Message[]) => [...prev, bibleMessage]);
      }
      if (character) {
        console.log("👤 Extracting character content...");
        onCharacterExtracted(character);

        // Add character extraction message for display
        const characterMessage: Message = {
          id: `${activeChatId}-character-extraction`,
          role: 'assistant',
          content: `<character>\n${character}\n</character>`,
          timestamp: new Date(),
          phase: 'world',
        };

        // Append to messages
        onMessagesUpdate((prev: Message[]) => [...prev, characterMessage]);
      }
      if (chatName) {
        console.log("📝 Extracting chat title...");
        onChatTitleExtracted(chatName);
        console.log("✅ Chat title updated to:", chatName);
      }

      // Save the world generation messages to database
      // IMPORTANT:
      // 1. Use the 'messages' parameter from onFinish, not worldGenChat.messages
      // 2. SKIP system messages - they should never be saved to database
      // 3. Add phase: 'world' to all messages
      console.log("🔍 DEBUG: worldGenChat.messages length:", worldGenChat.messages.length);
      console.log("🔍 DEBUG: messages parameter length:", messages.length);
      console.log("🔍 DEBUG: Using messages parameter (has assistant response)");

      // Convert UIMessage format to Message format for database
      // Filter out system messages - they are never saved to DB
      const dbMessages: Message[] = messages
        .filter(msg => msg.role !== "system")
        .map((msg) => {
          // messages should have correct UIMessage structure with parts directly
          const textParts = msg.parts?.filter((p) => p.type === "text") || [];
          const content = textParts.map((p: any) => p.text).join("");

          console.log("🔍 DEBUG: Converting message to DB format:", {
            id: msg.id,
            role: msg.role,
            partsCount: msg.parts?.length || 0,
            textPartsCount: textParts.length,
            contentLength: content.length,
          });

          return {
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content,
            parts: msg.parts,
            timestamp: new Date(),
            phase: 'world', // All world generation messages have phase: 'world'
          } as any;
        });

      // Save all world gen messages
      console.log("💾 Saving", dbMessages.length, "non-system messages to database...");
      for (const msg of dbMessages) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: activeChatId,
            message: msg,
          }),
        });
      }
      console.log("✅ All messages saved to database");

      // Update visual messages state with saved messages
      // This ensures messages persist after streaming completes
      onMessagesUpdate(dbMessages);

      // Update chat with extracted content and chat name
      console.log("💾 Updating chat metadata in database...");
      await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeChatId,
          title: chatName || undefined, // Update title directly
          bibleContent: bible,
          originalBibleContent: bible, // Set original bible (never changes after this)
          characterContent: character,
          conversationState: "gameplay",
          generationPhase: "world", // Mark that we're still in world phase
        }),
      });
      console.log("✅ Chat metadata updated in database");

      // Refresh sidebar to show updated title
      if (chatName && onSidebarRefresh) {
        console.log("🔄 Refreshing sidebar to show updated title...");
        onSidebarRefresh();
      }

      console.log("🔍 DEBUG: Setting button states...");
      console.log("🔍 DEBUG: showDebug prop =", showDebug);
      console.log("🔍 DEBUG: showDebugRef.current =", showDebugRef.current);

      setIsGenerating(false);
      setIsStreaming(false);
      onSetStreaming(false);

      // AUTO-TRIGGER LOGIC - Only 2 conditions:
      // CONDITION 1: Debug mode ON + button pressed (handled in handleGenerateCharacter)
      // CONDITION 2: Debug mode OFF + world generation completed (handled here)
      const isDebugMode = showDebugRef.current;

      if (isDebugMode) {
        console.log("🟢 CONDITION 1: Debug mode ON - Showing character generation button (user must press it)");
        setShowCharacterButton(true);
      } else {
        console.log("🟢 CONDITION 2: Production mode + World generation completed - Auto-triggering character generation");
        // Auto-trigger character generation after a brief delay
        if (onAutoTriggerCharacter) {
          setTimeout(() => {
            console.log("🚀 Executing auto-trigger...");
            onAutoTriggerCharacter();
          }, 500); // Small delay to allow state updates to settle
        }
      }

      console.log("✅ onFinish handler completed successfully!");
    },
    onError: (error) => {
      console.error("❌ World generation error:", error);
      setIsGenerating(false);
      setIsStreaming(false);
      onSetStreaming(false);
      alert(`Failed to generate world: ${error.message}`);
    },
  });

  const handleWorldSetup = async ({
    modelTier: tier,
    worldParams,
  }: {
    modelTier: ModelTier;
    worldParams: WorldParameters;
  }) => {
    // Reset completion flag for new generation
    hasCompletedRef.current = false;

    onShowWorldSetup(false);
    setIsStreaming(true);
    onSetStreaming(true);
    setIsGenerating(true);

    const title =
      worldParams.worldType || `Adventure ${new Date().toLocaleDateString()}`;
    const chatId = Date.now().toString();

    console.log("🔍 DEBUG handleWorldSetup: Creating new chat with ID:", chatId);
    console.log("🔍 DEBUG: Current currentChatId before creation:", currentChatId);

    try {
      // Create chat in database
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chatId,
          title,
          modelTier: tier,
          worldParams,
        }),
      });

      console.log("✅ Chat created in database, setting currentChatId:", chatId);

      // Notify parent that chat was created (for sidebar refresh)
      onChatCreated?.();

      // Store in ref so onFinish callback can access it (prop won't update in closure)
      chatIdRef.current = chatId;
      console.log("✅ Stored chatId in ref:", chatIdRef.current);

      onSetCurrentChatId(chatId);
      onSetChatTitle(title);
      console.log("🔍 DEBUG: After onSetCurrentChatId, currentChatId prop is still:", currentChatId, "(won't update until re-render)");

      // Create user message with world generation parameters
      const userParamsMessage: Message = {
        id: `${chatId}-user-params`,
        role: "user",
        content: generateWorldParametersPrompt(worldParams),
        timestamp: new Date(),
        phase: 'world', // Tag with phase
      };

      // Save ONLY user parameters message to database (system prompts never saved)
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: userParamsMessage,
        }),
      });

      console.log("📨 Created user message with world parameters:", {
        id: userParamsMessage.id,
        contentPreview: userParamsMessage.content.substring(0, 150) + "...",
      });

      // Set initial visual messages (ONLY user params - system prompt will be inserted dynamically by prepareVisualMessages)
      onMessagesUpdate([userParamsMessage]);

      // Set params for useChat and trigger world generation
      setWorldGenParams({
        modelTier: tier,
        parameters: worldParams,
      });

      // Trigger the useChat world generation
      worldGenChat.sendMessage({
        parts: [
          {
            type: "text",
            text: generateWorldParametersPrompt(worldParams),
          },
        ],
      });

      // The rest will be handled by handleWorldGenerationComplete when useChat finishes
    } catch (error) {
      console.error("Error generating world:", error);
      const errorMessage =
        error instanceof Error
          ? `Failed to generate world: ${error.message}`
          : "Failed to generate world. Please try again.";
      alert(errorMessage);
      setIsGenerating(false);
      setIsStreaming(false);
      onSetStreaming(false);
    }
  };

  return {
    isGenerating,
    isStreaming,
    showCharacterButton,
    showProceedButton,
    worldGenParams,
    worldGenChat,
    handleWorldSetup,
  };
}
