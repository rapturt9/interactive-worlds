"use client";

import { useState } from "react";
import { Message, ModelTier } from "@/types";

export type ConversationState = "world_generation" | "gameplay";

export interface UseChatsManagementReturn {
  currentChatId: string | null;
  chatTitle: string;
  conversationState: ConversationState;
  generationPhase: string; // world, character, chat0, chat1, etc.
  modelTier: ModelTier;
  showWorldSetup: boolean;
  bibleContent: string;
  originalBibleContent: string;
  characterContent: string;
  localContext: string;
  messages: Message[];
  currentConversation: Message[];
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
}

/**
 * Hook to manage chat lifecycle and state
 * Handles chat creation, loading, deletion, and metadata
 */
export function useChatsManagement(): UseChatsManagementReturn {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Message[]>([]);
  const [modelTier, setModelTier] = useState<ModelTier>("budget");
  const [bibleContent, setBibleContent] = useState<string>("");
  const [originalBibleContent, setOriginalBibleContent] = useState<string>("");
  const [characterContent, setCharacterContent] = useState<string>("");
  const [conversationState, setConversationState] =
    useState<ConversationState>("world_generation");
  const [generationPhase, setGenerationPhase] = useState<string>("world"); // Track current phase
  const [chatTitle, setChatTitle] = useState<string>("");
  const [localContext, setLocalContext] = useState<string>("");

  const handleNewChat = (resetMessages?: () => void) => {
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
    setShowWorldSetup(true);

    // Call reset function for useChat hooks if provided
    if (resetMessages) {
      resetMessages();
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      console.log("📂 Loading chat:", chatId);
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();

      console.log("📂 Chat data loaded:", {
        messagesCount: data.messages?.length || 0,
        conversationState: data.conversationState,
        generationPhase: data.generationPhase,
        hasBible: !!data.bibleContent,
        hasOriginalBible: !!data.originalBibleContent,
        hasCharacter: !!data.characterContent,
      });

      console.log(
        "📂 First 3 messages from API:",
        data.messages?.slice(0, 3).map((m: any) => ({
          id: m.id,
          role: m.role,
          phase: m.phase,
          contentLength: m.content?.length || 0,
          contentPreview: m.content?.substring(0, 100),
        }))
      );

      setCurrentChatId(chatId);
      setChatTitle(data.title);
      setModelTier(data.modelTier);
      setBibleContent(data.bibleContent || "");
      setOriginalBibleContent(data.originalBibleContent || "");
      setCharacterContent(data.characterContent || "");
      setConversationState(data.conversationState || "world_generation");
      setGenerationPhase(data.generationPhase || "world");
      setShowWorldSetup(false);

      const messagesWithDates = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        createdAt: new Date(msg.timestamp),
      }));

      console.log(
        "📂 Messages with dates processed:",
        messagesWithDates.length
      );
      console.log("📂 Setting messages state...");

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

  return {
    currentChatId,
    chatTitle,
    conversationState,
    generationPhase,
    modelTier,
    showWorldSetup,
    bibleContent,
    originalBibleContent,
    characterContent,
    localContext,
    messages,
    currentConversation,
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
  };
}
