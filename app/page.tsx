"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Sidebar, { SidebarRef } from "@/components/Sidebar";
import HomePage from "@/components/HomePage";
import MenuButton from "@/components/MenuButton";
import FloatingControls from "@/components/FloatingControls";
import WorldGenerationPhase from "@/components/WorldGenerationPhase";
import GameplayPhase from "@/components/GameplayPhase";
import { useChatsManagement } from "@/hooks/useChatsManagement";
import { useTheme } from "@/hooks/useTheme";
import { useWorldGeneration } from "@/hooks/useWorldGeneration";
import { useCharacterGeneration } from "@/hooks/useCharacterGeneration";
import { useGameplayChat } from "@/hooks/useGameplayChat";
import { isLocalhost } from "@/lib/utils/environment";
import { prepareVisualMessages } from "@/lib/utils/message-display";

export default function Home() {
  // Default debug to true on localhost, false in production
  const [showDebug, setShowDebug] = useState(false);
  const [, setIsStreaming] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarRef = useRef<SidebarRef>(null);

  // Set default debug mode based on environment
  useEffect(() => {
    setShowDebug(isLocalhost());
  }, []);

  // Core state management
  const chats = useChatsManagement();
  const { theme, setTheme } = useTheme();

  // Callback to refresh sidebar when a new chat is created
  const handleChatCreated = useCallback(() => {
    sidebarRef.current?.refresh();
  }, []);

  // Phase-specific hooks - charGen must be defined first for the callback reference
  const charGen = useCharacterGeneration({
    currentChatId: chats.currentChatId,
    bibleContent: chats.bibleContent,
    modelTier: chats.modelTier,
    worldGenParams: null, // Will be set after worldGen is initialized
    onLocalContextExtracted: chats.setLocalContext,
    onCharacterExtracted: chats.setCharacterContent,
    onConversationStateChange: chats.setConversationState,
    onSetStreaming: setIsStreaming,
    onMessagesUpdate: chats.setMessages,
    onGenerationPhaseChange: chats.setGenerationPhase,
  });

  // Memoize onMessagesUpdate to prevent infinite loops
  const handleMessagesUpdate = useCallback((messages: any) => {
    // Handle both Message[] and updater function
    if (typeof messages === "function") {
      chats.setMessages(messages);
    } else {
      chats.setMessages(messages);
    }
  }, [chats.setMessages]);

  const worldGen = useWorldGeneration({
    currentChatId: chats.currentChatId,
    showDebug,
    onBibleExtracted: chats.setBibleContent,
    onCharacterExtracted: chats.setCharacterContent,
    onChatTitleExtracted: chats.setChatTitle,
    onMessagesUpdate: handleMessagesUpdate,
    onConversationStateChange: chats.setConversationState,
    onSetCurrentChatId: chats.setCurrentChatId,
    onSetChatTitle: chats.setChatTitle,
    onShowWorldSetup: chats.setShowWorldSetup,
    onSetStreaming: setIsStreaming,
    onChatCreated: handleChatCreated,
    onSidebarRefresh: () => sidebarRef.current?.refresh(),
    onAutoTriggerCharacter: () => {
      console.log("🎯 Auto-triggering character generation from page.tsx");
      chats.setGenerationPhase("character");
      charGen.handleGenerateCharacter();
    },
    onGenerationPhaseChange: chats.setGenerationPhase,
  });

  const gameplay = useGameplayChat({
    currentChatId: chats.currentChatId,
    modelTier: chats.modelTier,
    onSetStreaming: setIsStreaming,
    onShowProceedButton: charGen.setShowProceedButton,
  });

  // Sync loaded messages to appropriate phase hook when a chat is selected
  useEffect(() => {
    console.log('🔍 Message sync useEffect triggered:', {
      messagesLength: chats.messages.length,
      conversationState: chats.conversationState,
      currentChatId: chats.currentChatId,
      bibleContent: chats.bibleContent?.substring(0, 50) + '...',
      showDebug,
    });

    if (chats.messages.length > 0) {
      console.log('🔍 First 3 messages:', chats.messages.slice(0, 3).map(m => ({
        id: m.id,
        role: m.role,
        contentLength: m.content?.length || 0,
        hasContent: !!m.content,
      })));

      // Convert messages to AI SDK format
      const aiSdkMessages = chats.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text' as const, text: msg.content }],
        createdAt: msg.timestamp,
      }));

      console.log('🔍 Converted to AI SDK format, first message:', aiSdkMessages[0]);

      if (chats.conversationState === 'gameplay') {
        console.log('🎮 Setting gameplay messages:', aiSdkMessages.length);
        gameplay.gameplayChat.setMessages(aiSdkMessages as any);
        // Set the proceed button to true if we're in gameplay state
        charGen.setShowProceedButton(true);
      } else if (chats.conversationState === 'world_generation') {
        // For world generation phase, messages may be split
        // This is a simplified approach - you may need to split properly
        console.log('🌍 Setting world gen messages:', aiSdkMessages.length);
        worldGen.worldGenChat.setMessages(aiSdkMessages as any);

        // Check if world generation is complete (has bible content)
        if (chats.bibleContent && chats.generationPhase === 'world') {
          console.log('✅ World gen complete (phase=world), setting buttons (showDebug:', showDebug, ')');
          // World gen complete, show appropriate button based on debug mode
          if (showDebug) {
            charGen.setShowCharacterButton(true);
          } else {
            charGen.setShowProceedButton(true);
          }
        } else if (chats.characterContent && chats.generationPhase === 'character') {
          console.log('✅ Character gen complete (phase=character), setting proceed button');
          // Character gen complete, show proceed button
          charGen.setShowProceedButton(true);
        }
      }
    } else {
      console.log('⚠️ No messages to sync');
    }
  }, [chats.currentChatId, chats.conversationState, chats.generationPhase, chats.bibleContent, chats.characterContent, showDebug, chats.messages]); // Run when chat ID, state, phase, bible, character, or messages change

  const handleNewChat = () => {
    chats.handleNewChat(() => {
      worldGen.worldGenChat.setMessages([]);
      charGen.characterGenChat.setMessages([]);
      gameplay.gameplayChat.setMessages([]);
    });
    charGen.setShowCharacterButton(false);
    charGen.setShowProceedButton(false);
    console.log("New chat started");
  };

  const handleBackToHome = () => {
    chats.setCurrentChatId(null);
    chats.setShowWorldSetup(false);
    console.log("Navigating back to home");
  };

  // STREAMING ARCHITECTURE:
  // During streaming: Display live messages from useChat hooks (worldGenChat.messages or characterGenChat.messages)
  // After completion: Display persisted messages from database (chats.messages)
  // This prevents infinite loops by avoiding state updates during streaming
  const visualMessages = useMemo(() => {
    if (!chats.currentChatId) {
      return [];
    }

    // DURING WORLD GENERATION: Show live streaming messages from worldGenChat
    if (worldGen.isGenerating) {
      console.log('📡 STREAMING MODE: Showing live worldGenChat.messages:', worldGen.worldGenChat.messages.length);
      return worldGen.worldGenChat.messages;
    }

    // DURING CHARACTER GENERATION: Show live streaming messages from characterGenChat
    if (charGen.isGenerating) {
      console.log('📡 STREAMING MODE: Showing live characterGenChat.messages:', charGen.characterGenChat.messages.length);
      return charGen.characterGenChat.messages;
    }

    // NOT STREAMING: Show persisted messages from database
    if (chats.messages.length === 0) {
      return [];
    }

    console.log('💾 PERSISTED MODE: Using chats.messages:', chats.messages.length);

    const prepared = prepareVisualMessages(
      chats.messages,
      chats.generationPhase,
      showDebug,
      chats.bibleContent,
      chats.characterContent
    );

    // Convert to AI SDK UIMessage format with parts
    return prepared.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: [{ type: 'text' as const, text: msg.content }],
      createdAt: msg.timestamp,
    }));
  }, [
    worldGen.isGenerating,
    worldGen.worldGenChat.messages,
    charGen.isGenerating,
    charGen.characterGenChat.messages,
    chats.messages,
    chats.generationPhase,
    showDebug,
    chats.bibleContent,
    chats.characterContent,
    chats.currentChatId,
  ]);

  // Memoize onEditMessage callback
  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      return gameplay.handleEditMessage(messageId, newContent);
    },
    [gameplay.handleEditMessage]
  );

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
    const system2Index = chats.messages.findIndex((m) =>
      m.id.includes("system-2")
    );

    // If System Prompt 2 exists, export gameplay phase (from System Prompt 2 onward)
    // Otherwise, export world generation phase (System Prompt 1 + user params + worldgen)
    const exportMessages =
      system2Index >= 0
        ? chats.messages.slice(system2Index) // Gameplay phase
        : chats.messages; // World generation phase (includes system-1, user-params, worldgen)

    const exportData = {
      messages: exportMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      modelTier: chats.modelTier,
      bibleContent: chats.bibleContent,
      characterContent: chats.characterContent,
      chatTitle: chats.chatTitle,
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
        a.download = `conversation-${chats.currentChatId}.py`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="h-screen flex bg-parchment-primary">
      {/* Floating Controls - Always visible at top-right */}
      <FloatingControls
        theme={theme}
        onThemeChange={setTheme}
        showDebug={showDebug}
        onDebugChange={setShowDebug}
        generationPhase={chats.generationPhase}
      />

      {/* Menu Button - Always visible */}
      {chats.currentChatId && (
        <MenuButton
          isOpen={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          theme={theme}
        />
      )}

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 transition-opacity duration-300"
          style={{ backgroundColor: 'var(--overlay)' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden by default, slides in when menu opens */}
      <Sidebar
        ref={sidebarRef}
        currentChatId={chats.currentChatId ?? undefined}
        onSelectChat={(chatId) => {
          chats.handleSelectChat(chatId);
          setIsMenuOpen(false);
        }}
        onNewChat={() => {
          handleNewChat();
          setIsMenuOpen(false);
        }}
        onDeleteChat={chats.handleDeleteChat}
        isOpen={isMenuOpen}
        showDebug={showDebug}
        onExport={handleExportConversation}
        modelTier={chats.modelTier}
        chatTitle={chats.chatTitle}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {!chats.currentChatId && !chats.showWorldSetup ? (
            <HomePage
              onStartAdventure={handleNewChat}
              onSelectChat={chats.handleSelectChat}
              onViewAllAdventures={() => setIsMenuOpen(true)}
            />
          ) : chats.conversationState === "world_generation" ? (
            <WorldGenerationPhase
              showSetupForm={chats.showWorldSetup}
              isGenerating={worldGen.isGenerating}
              isGeneratingCharacter={charGen.isGenerating}
              onWorldSetup={worldGen.handleWorldSetup}
              showCharacterButton={charGen.showCharacterButton}
              onGenerateCharacter={charGen.handleGenerateCharacter}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              worldGenMessages={visualMessages}
              charGenMessages={[]}
              systemMessages={[]}
              onEditMessage={handleEditMessage}
              onBack={handleBackToHome}
              theme={theme}
            />
          ) : (
            <GameplayPhase
              messages={visualMessages}
              isGenerating={worldGen.isGenerating || charGen.isGenerating}
              isSending={gameplay.isSending}
              input={gameplay.input}
              onInputChange={gameplay.setInput}
              onSendMessage={gameplay.handleSendMessage}
              onEditMessage={handleEditMessage}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              showProceedButton={charGen.showProceedButton}
              onProceedToGameplay={gameplay.handleContinueToGameplay}
            />
          )}
        </div>
      </div>
    </div>
  );
}
