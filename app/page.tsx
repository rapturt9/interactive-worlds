"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import WorldSetupForm from "@/components/WorldSetupForm";
import SystemPromptSwitch from "@/components/SystemPromptSwitch";
import { WorldParameters, ModelTier, Message } from "@/types";
import { WORLD_GENERATION_PROMPT } from "@/lib/prompts/world-generation-prompt";
import { GAMEPLAY_PROMPT_TEMPLATE } from "@/lib/prompts/gameplay-prompt";
import {
  parseWorldGenerationTags,
  injectContentIntoPrompt,
} from "@/lib/utils/tag-parser";
import { parseUIMessageStream } from "@/lib/utils/ui-message-parser";

export default function Home() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelTier, setModelTier] = useState<ModelTier>("free");
  const [storyBible, setStoryBible] = useState<string>("");
  const [bibleContent, setBibleContent] = useState<string>("");
  const [characterContent, setCharacterContent] = useState<string>("");
  const [conversationState, setConversationState] = useState<
    "world_generation" | "gameplay"
  >("world_generation");
  const [chatTitle, setChatTitle] = useState<string>("");
  const [showDebug, setShowDebug] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isGeneratingBible, setIsGeneratingBible] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setStoryBible("");
    setBibleContent("");
    setCharacterContent("");
    setConversationState("world_generation");
    setChatTitle("");
    setShowWorldSetup(true);
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();

      setCurrentChatId(chatId);
      setChatTitle(data.chatNameOverride || data.title);
      setModelTier(data.modelTier);
      setStoryBible(data.storyBible || "");
      setBibleContent(data.bibleContent || "");
      setCharacterContent(data.characterContent || "");
      setConversationState(data.conversationState || "world_generation");
      setShowWorldSetup(false);

      const messagesWithDates = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        createdAt: new Date(msg.timestamp),
      }));

      setMessages(messagesWithDates);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  const handleWorldSetup = async ({
    modelTier: tier,
    worldParams,
  }: {
    modelTier: ModelTier;
    worldParams: WorldParameters;
  }) => {
    setModelTier(tier);
    setShowWorldSetup(false);
    setIsStreaming(true);
    setIsGeneratingBible(true);

    const title =
      worldParams.worldType || `Adventure ${new Date().toLocaleDateString()}`;
    const chatId = Date.now().toString();

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

      setCurrentChatId(chatId);
      setChatTitle(title);

      // Add System Prompt 1 (World Generation) as first message
      const systemMessage1: Message = {
        id: `${chatId}-system-1`,
        role: "system",
        content: WORLD_GENERATION_PROMPT,
        timestamp: new Date(),
      };

      // Save system message 1 to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: systemMessage1,
        }),
      });

      // Start streaming world generation
      const response = await fetch("/api/generate-world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelTier: tier,
          parameters: worldParams,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate world");
      }

      const reader = response.body?.getReader();
      const worldGenMessageId = `${chatId}-worldgen`;

      // Create a streaming message for world generation
      const streamingMessage: Message = {
        id: worldGenMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // Always set messages (UI will decide whether to show based on debug mode)
      setMessages([systemMessage1, streamingMessage]);

      // Parse UIMessage stream
      let fullResponse = "";
      if (reader) {
        const result = await parseUIMessageStream(reader, (content, parts) => {
          // Update UI in real-time with parsed content
          setMessages([
            systemMessage1,
            {
              ...streamingMessage,
              content,
              // Store parts for new ChatMessage component
              parts: parts.length > 0 ? parts : undefined,
            } as any,
          ]);
        });
        fullResponse = result.content;
      }

      // Parse XML tags from world generation response
      const parsed = parseWorldGenerationTags(fullResponse);
      const { bible, character, chatName } = parsed;

      // Store extracted content
      if (bible) setBibleContent(bible);
      if (character) setCharacterContent(character);
      if (chatName) setChatTitle(chatName);

      // Save world generation message to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: {
            id: worldGenMessageId,
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
          },
        }),
      });

      // Update chat with extracted content and chat name
      await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chatId,
          bibleContent: bible,
          characterContent: character,
          chatNameOverride: chatName,
          conversationState: "gameplay",
        }),
      });

      setConversationState("gameplay");
      setIsGeneratingBible(false);

      // Add System Prompt 2 (Gameplay) with injected bible and character
      const gameplayPrompt = injectContentIntoPrompt(GAMEPLAY_PROMPT_TEMPLATE, {
        bible: bible || "",
        character: character || "",
      });

      const systemMessage2: Message = {
        id: `${chatId}-system-2`,
        role: "system",
        content: gameplayPrompt,
        timestamp: new Date(),
      };

      // Save system message 2 to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: systemMessage2,
        }),
      });

      // Always include system messages (UI will filter based on debug mode)
      setMessages([systemMessage1, streamingMessage, systemMessage2]);

      // Auto-send first gameplay message to get initial scene
      setIsStreaming(true);
      const firstPromptResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "Begin the adventure. Introduce my character and situation.",
            },
          ],
          modelTier: tier,
          bibleContent: bible,
          characterContent: character,
        }),
      });

      if (!firstPromptResponse.ok) {
        throw new Error("Failed to start gameplay");
      }

      const firstReader = firstPromptResponse.body?.getReader();
      let firstFullResponse = "";
      const firstAssistantMessageId = `${chatId}-gameplay-start`;

      const firstAssistantMessage: Message = {
        id: firstAssistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // Always include all messages
      const baseMessages = [systemMessage1, streamingMessage, systemMessage2];
      setMessages([...baseMessages, firstAssistantMessage]);

      // Parse UIMessage stream
      if (firstReader) {
        const result = await parseUIMessageStream(
          firstReader,
          (content, parts) => {
            setMessages([
              ...baseMessages,
              {
                ...firstAssistantMessage,
                content,
                parts: parts.length > 0 ? parts : undefined,
              } as any,
            ]);
          }
        );
        firstFullResponse = result.content;
      }

      // Save first gameplay message to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: {
            id: firstAssistantMessageId,
            role: "assistant",
            content: firstFullResponse,
            timestamp: new Date(),
          },
        }),
      });
    } catch (error) {
      console.error("Error generating world:", error);
      const errorMessage = error instanceof Error
        ? `Failed to generate world: ${error.message}`
        : "Failed to generate world. Please try again.";
      alert(errorMessage);
    } finally {
      setIsStreaming(false);
      setIsGeneratingBible(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentChatId || isSending || isStreaming) return;

    const userMessageId = `${currentChatId}-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    // Save user message to database
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: currentChatId,
        message: userMessage,
      }),
    });

    try {
      // Stream AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          modelTier,
          bibleContent,
          characterContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      let fullResponse = "";
      const assistantMessageId = `${currentChatId}-${Date.now()}`;

      // Create streaming assistant message
      const streamingMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, streamingMessage]);

      // Parse UIMessage stream
      if (reader) {
        const result = await parseUIMessageStream(reader, (content, parts) => {
          // Update streaming message in real-time
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.id === assistantMessageId) {
              lastMessage.content = content;
              (lastMessage as any).parts = parts.length > 0 ? parts : undefined;
            }
            return newMessages;
          });
        });
        fullResponse = result.content;
      }

      // Bible updates are now handled automatically via the gameplay prompt
      // No need to extract spoiler blocks separately

      // Save assistant message to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: {
            id: assistantMessageId,
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
          },
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Update message in database
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, content: newContent }),
    });

    // Delete messages after this one in database
    if (currentChatId) {
      await fetch(
        `/api/messages?chatId=${currentChatId}&messageId=${messageId}`,
        {
          method: "DELETE",
        }
      );
    }

    // Update local state
    const newMessages = messages.slice(0, messageIndex);
    newMessages.push({ ...messages[messageIndex], content: newContent });
    setMessages(newMessages);
    setInput(newContent);
  };

  const handleExportConversation = () => {
    // Format as Python code with triple-quoted strings
    const formatPythonDict = (obj: any, indent = 0): string => {
      const spaces = "  ".repeat(indent);

      if (typeof obj === "string") {
        // Use triple quotes for multiline strings, escape triple quotes in content
        if (obj.includes("\n") || obj.length > 100) {
          // Escape any triple quotes in the content
          const escaped = obj.replace(/"""/g, '\\"""');
          return `"""${escaped}"""`;
        }
        // Escape quotes for short strings
        return `"${obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
      }

      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        const items = obj
          .map((item) => `${spaces}  ${formatPythonDict(item, indent + 1)}`)
          .join(",\n");
        return `[\n${items}\n${spaces}]`;
      }

      if (typeof obj === "object" && obj !== null) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return "{}";
        const items = entries
          .map(
            ([key, value]) =>
              `${spaces}  "${key}": ${formatPythonDict(value, indent + 1)}`
          )
          .join(",\n");
        return `{\n${items}\n${spaces}}`;
      }

      return JSON.stringify(obj);
    };

    // Find the index of System Prompt 2 (gameplay prompt)
    const system2Index = messages.findIndex((m) => m.id.includes("system-2"));

    // Export only gameplay phase messages (from System Prompt 2 onward)
    const gameplayMessages =
      system2Index >= 0
        ? messages.slice(system2Index)
        : messages.filter(
            (m) => !m.id.includes("system-1") && !m.id.includes("worldgen")
          );

    const exportData = {
      messages: gameplayMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      modelTier,
      bibleContent,
      characterContent,
      chatTitle,
    };

    // Format as Python code
    const pythonCode = `# Paste the exported conversation JSON here
conversation = ${formatPythonDict(exportData)}

print(f"✓ Loaded {len(conversation['messages'])} messages")`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(pythonCode)
      .then(() => {
        alert(
          "✓ Conversation copied to clipboard! Paste it into the Jupyter notebook."
        );
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        // Fallback: download as file
        const blob = new Blob([pythonCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversation-${currentChatId}.py`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentChatId={currentChatId || undefined}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Controls */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {chatTitle || "Interactive Worlds"}
            </h1>
            {currentChatId && (
              <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                {modelTier === "free" ? "Free Tier" : "Pro Tier"}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Export Button (only when debug is on) */}
            {showDebug && currentChatId && messages.length > 0 && (
              <button
                onClick={handleExportConversation}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Debug Toggle Slider */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Debug
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !showWorldSetup ? (
              // Welcome Screen
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="mb-6">
                    <img
                      src="/logo.png"
                      alt="Interactive Worlds"
                      className="w-20 h-20 mx-auto"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Welcome to Interactive Worlds
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Create immersive text adventures with persistent worlds
                  </p>
                  <button
                    onClick={handleNewChat}
                    className="px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Start New Adventure
                  </button>
                </div>
              </div>
            ) : (
              // Messages - Centered like Claude.ai
              <div className="max-w-4xl mx-auto w-full px-8 py-6 space-y-6">
                {showWorldSetup && (
                  <WorldSetupForm
                    onSubmit={handleWorldSetup}
                    isGenerating={isStreaming}
                  />
                )}
                {messages.map((message, index) => {
                  // Check if this is the point where system prompt switches
                  const isSystemSwitch =
                    showDebug &&
                    message.role === "system" &&
                    message.id.includes("system-2") &&
                    index > 0 &&
                    messages[index - 1].role === "assistant";

                  return (
                    <div key={message.id}>
                      {isSystemSwitch && <SystemPromptSwitch />}
                      <ChatMessage
                        message={message}
                        showDebug={showDebug}
                        onEdit={
                          message.role === "user"
                            ? (content) =>
                                handleEditMessage(message.id, content)
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
                {isGeneratingBible && !showDebug && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600 dark:border-blue-400"></div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          Generating World
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Creating story bible, characters, and hidden plots...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isSending && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Game Master is thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area - Centered like Claude.ai */}
          {currentChatId && !showWorldSetup && (
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your action..."
                    className="w-full px-4 py-3 pr-14 resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
                    rows={3}
                    disabled={isSending || isStreaming}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isSending || isStreaming}
                    className="absolute bottom-2 right-2 p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
