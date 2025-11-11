"use client";

import { useState } from "react";
import { Message, ModelTier } from "@/types";

export type ConversationState = "world_generation" | "gameplay";

export interface TurnSnapshot {
  turnNumber: number;
  bible: string;
  character: string;
  timestamp: Date;
}

export interface UseChatsManagementReturn {
  currentChatId: string | null;
  chatTitle: string;
  conversationState: ConversationState;
  generationPhase: string; // world, character, chat0, chat1, etc.
  modelTier: ModelTier;
  showWorldSetup: boolean;
  isTransitioning: boolean;
  bibleContent: string;
  originalBibleContent: string;
  characterContent: string;
  localContext: string;
  messages: Message[];
  currentConversation: Message[];
  currentTurn: number;
  availableSnapshots: TurnSnapshot[];
  setCurrentChatId: (id: string | null) => void;
  setConversationState: (state: ConversationState) => void;
  setGenerationPhase: (phase: string) => void;
  setChatTitle: (title: string) => void;
  setModelTier: (tier: ModelTier) => void;
  setBibleContent: (content: string) => void;
  setOriginalBibleContent: (content: string) => void;
  setCharacterContent: (content: string) => void;
  setLocalContext: (context: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCurrentConversation: React.Dispatch<React.SetStateAction<Message[]>>;
  setShowWorldSetup: (show: boolean) => void;
  handleNewChat: (resetMessages?: () => void) => void;
  handleSelectChat: (chatId: string) => Promise<void>;
  handleDeleteChat: (chatId: string) => void;
  loadTurnSnapshot: (turnNumber: number) => Promise<void>;
  refreshSnapshots: () => Promise<void>;
}

/**
 * Hook to manage chat lifecycle and state
 * Handles chat creation, loading, deletion, and metadata
 */
export function useChatsManagement(): UseChatsManagementReturn {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messages, setMessagesInternal] = useState<Message[]>([]);

  // Wrap setMessages with logging
  const setMessages: React.Dispatch<React.SetStateAction<Message[]>> = (value) => {
    console.log('🔍 DEBUG: setMessages called in useChatsManagement');
    if (typeof value === 'function') {
      console.log('   Updater function provided');
      setMessagesInternal((prev) => {
        console.log('   prev.length:', prev.length);
        const newValue = (value as (prev: Message[]) => Message[])(prev);
        console.log('   new value length:', newValue.length);
        console.log('   new value preview:', newValue.slice(0, 3).map(m => ({ id: m.id, role: m.role, phase: (m as any).phase })));
        return newValue;
      });
    } else {
      console.log('   Direct value provided, length:', value.length);
      console.log('   value preview:', value.slice(0, 3).map(m => ({ id: m.id, role: m.role, phase: (m as any).phase })));
      setMessagesInternal(value);
    }
  };
  const [currentConversation, setCurrentConversation] = useState<Message[]>([]);
  const [modelTier, setModelTier] = useState<ModelTier>("budget");
  const [bibleContent, setBibleContent] = useState<string>("");
  const [originalBibleContent, setOriginalBibleContent] = useState<string>("");
  const [characterContent, setCharacterContent] = useState<string>("");
  const [conversationState, setConversationStateInternal] =
    useState<ConversationState>("world_generation");

  // Wrap setConversationState with logging
  const setConversationState = (state: ConversationState) => {
    console.log('🔄 DEBUG: setConversationState called with:', state);
    console.log('   Previous state:', conversationState);
    console.log('   Stack trace:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
    setConversationStateInternal(state);
  };
  const [generationPhase, setGenerationPhase] = useState<string>("world"); // Track current phase
  const [chatTitle, setChatTitle] = useState<string>("");
  const [localContext, setLocalContext] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [availableSnapshots, setAvailableSnapshots] = useState<TurnSnapshot[]>([]);

  const handleNewChat = (resetMessages?: () => void) => {
    // Set transition flag immediately to prevent HomePage flash
    setIsTransitioning(true);

    // Set showWorldSetup first to prevent brief flash of HomePage
    setShowWorldSetup(true);
    setCurrentChatId(null);
    setMessages([]);
    setCurrentConversation([]);
    setBibleContent("");
    setOriginalBibleContent("");
    setCharacterContent("");
    setLocalContext("");
    setConversationState("world_generation");
    setGenerationPhase("world"); // Reset to world phase
    setChatTitle("");
    setCurrentTurn(0);
    setAvailableSnapshots([]);

    // Call reset function for useChat hooks if provided
    if (resetMessages) {
      resetMessages();
    }

    // Clear transition flag after state updates complete
    // Use setTimeout to ensure it happens after React's batch update
    setTimeout(() => {
      setIsTransitioning(false);
    }, 0);
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      console.log("📂 Loading chat:", chatId);
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();

      // ========================================
      // COMPREHENSIVE CHAT INFO ON REFRESH
      // ========================================
      console.log("\n" + "=".repeat(80));
      console.log("📊 CHAT LOADED - FULL STATE DUMP");
      console.log("=".repeat(80));

      console.log("\n🔑 CHAT METADATA:");
      console.log("  ID:", chatId);
      console.log("  Title:", data.title || "(no title)");
      console.log("  Model Tier:", data.modelTier);
      console.log("  Conversation State:", data.conversationState);
      console.log("  Generation Phase:", data.generationPhase);
      console.log("  Current Turn:", data.currentTurn || 0);

      console.log("\n📚 EXTRACTED CONTENT:");
      console.log("  Bible Content:", data.bibleContent ? `${data.bibleContent.length} chars` : "❌ Not extracted");
      console.log("  Original Bible:", data.originalBibleContent ? `${data.originalBibleContent.length} chars` : "❌ Not saved");
      console.log("  Character Content:", data.characterContent ? `${data.characterContent.length} chars` : "❌ Not extracted");
      console.log("  Local Context:", data.localContext ? `${data.localContext.length} chars` : "❌ Not extracted");

      console.log("\n💬 MESSAGES SUMMARY:");
      console.log("  Total Messages:", data.messages?.length || 0);

      // Group messages by phase
      const messagesByPhase = (data.messages || []).reduce((acc: any, msg: any) => {
        const phase = msg.phase || 'unknown';
        if (!acc[phase]) acc[phase] = [];
        acc[phase].push(msg);
        return acc;
      }, {});

      Object.keys(messagesByPhase).sort().forEach(phase => {
        const phaseMessages = messagesByPhase[phase];
        console.log(`\n  📦 PHASE: ${phase.toUpperCase()} (${phaseMessages.length} messages)`);
        phaseMessages.forEach((msg: any, idx: number) => {
          const contentPreview = msg.content?.substring(0, 100).replace(/\n/g, ' ') || '(empty)';
          console.log(`    [${idx + 1}] ${msg.role.toUpperCase()} | ID: ${msg.id} | ${msg.content?.length || 0} chars`);
          console.log(`        Preview: ${contentPreview}${msg.content?.length > 100 ? '...' : ''}`);
        });
      });

      console.log("\n" + "=".repeat(80));
      console.log("✅ END OF CHAT STATE DUMP");
      console.log("=".repeat(80) + "\n");

      setCurrentChatId(chatId);
      setChatTitle(data.title);
      setModelTier(data.modelTier);
      setBibleContent(data.bibleContent || "");
      setOriginalBibleContent(data.originalBibleContent || "");
      setCharacterContent(data.characterContent || "");
      setConversationState(data.conversationState || "world_generation");
      setGenerationPhase(data.generationPhase || "world");
      setCurrentTurn(data.currentTurn || 0);
      setShowWorldSetup(false);

      const messagesWithDates = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        createdAt: new Date(msg.timestamp),
      }));

      console.log("📂 Setting messages state with", messagesWithDates.length, "messages");

      // Visual messages: show all messages (system prompts only in debug mode)
      setMessages(messagesWithDates);

      // Current conversation: only user and assistant messages (no system prompts)
      // System prompt is added fresh on each API call
      setCurrentConversation(
        messagesWithDates.filter((msg: Message) => msg.role !== "system")
      );
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  /**
   * Load a snapshot for a specific turn - restores bible and character state
   */
  const loadTurnSnapshot = async (turnNumber: number) => {
    if (!currentChatId) {
      console.error('No chat selected');
      return;
    }

    try {
      console.log(`⏮️ Loading snapshot for turn ${turnNumber}...`);
      const response = await fetch(
        `/api/snapshots?chatId=${currentChatId}&turn=${turnNumber}`
      );

      if (!response.ok) {
        throw new Error('Failed to load snapshot');
      }

      const data = await response.json();
      const snapshot: TurnSnapshot = data.snapshot;

      // Restore bible and character from snapshot
      setBibleContent(snapshot.bible);
      setCharacterContent(snapshot.character);
      setCurrentTurn(turnNumber);

      console.log(`✅ Loaded snapshot for turn ${turnNumber}`);
      console.log(`📖 Bible restored (${snapshot.bible.length} chars)`);
      console.log(`👤 Character restored (${snapshot.character.length} chars)`);
    } catch (error) {
      console.error('Failed to load snapshot:', error);
      alert(`Failed to load snapshot for turn ${turnNumber}`);
    }
  };

  /**
   * Refresh the list of available snapshots for the current chat
   */
  const refreshSnapshots = async () => {
    if (!currentChatId) {
      return;
    }

    try {
      const response = await fetch(`/api/snapshots?chatId=${currentChatId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }

      const data = await response.json();
      const snapshots: TurnSnapshot[] = data.snapshots.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      }));

      setAvailableSnapshots(snapshots);
      console.log(`📸 Loaded ${snapshots.length} snapshots`);
    } catch (error) {
      console.error('Failed to refresh snapshots:', error);
    }
  };

  /**
   * Export conversation with messages separated by phase for debugging
   */
  const exportConversationByPhase = () => {
    const worldMsgs = messages.filter(m => m.phase === 'world');
    const charMsgs = messages.filter(m => m.phase === 'character');
    const chat0Msgs = messages.filter(m => m.phase === 'chat0');

    const exportData = {
      phases: {
        world: worldMsgs.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500) + (m.content.length > 500 ? '...' : '')
        })),
        character: charMsgs.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500) + (m.content.length > 500 ? '...' : '')
        })),
        chat0: chat0Msgs.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500) + (m.content.length > 500 ? '...' : '')
        })),
      },
      metadata: {
        modelTier,
        bibleContent: bibleContent ? `${bibleContent.substring(0, 200)}...` : null,
        characterContent: characterContent ? `${characterContent.substring(0, 200)}...` : null,
        chatTitle,
      },
      counts: {
        world: worldMsgs.length,
        character: charMsgs.length,
        chat0: chat0Msgs.length,
        total: messages.length,
      },
    };

    console.log('📤 Phase-separated export:', exportData);
    return exportData;
  };

  return {
    currentChatId,
    chatTitle,
    conversationState,
    generationPhase,
    modelTier,
    showWorldSetup,
    isTransitioning,
    bibleContent,
    originalBibleContent,
    characterContent,
    localContext,
    messages,
    currentConversation,
    currentTurn,
    availableSnapshots,
    setCurrentChatId,
    setConversationState,
    setGenerationPhase,
    setChatTitle,
    setModelTier,
    setBibleContent,
    setOriginalBibleContent,
    setCharacterContent,
    setLocalContext,
    setMessages,
    setCurrentConversation,
    setShowWorldSetup,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    loadTurnSnapshot,
    refreshSnapshots,
    exportConversationByPhase,
  };
}
