"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Sidebar, { SidebarRef } from "@/components/Sidebar";
import HomePage from "@/components/HomePage";
import MenuButton from "@/components/MenuButton";
import FloatingControls from "@/components/FloatingControls";
import WorldPhase from "@/components/WorldPhase";
import CharacterPhase from "@/components/CharacterPhase";
import GameplayPhase from "@/components/GameplayPhase";
import { useChatsManagement } from "@/hooks/useChatsManagement";
import { useTheme } from "@/hooks/useTheme";
import { useGeneration } from "@/hooks/useGeneration";
import { isLocalhost } from "@/lib/utils/environment";
import { prepareVisualMessages } from "@/lib/utils/message-display";
import { parseWorldGenerationTags } from "@/lib/utils/tag-parser";
import { generateWorldParametersPrompt } from "@/lib/prompts/world-params-prompt";
import { CHARACTER_USER_PROMPT } from "@/lib/prompts/character-user-prompt";
import { GAMEPLAY_INITIAL_USER_PROMPT } from "@/lib/prompts/gameplay-initial-prompt";
import { toast } from "sonner";

export default function Home() {
  // Default debug to true on localhost, false in production
  const [showDebug, setShowDebug] = useState(false);
  const [, setIsStreaming] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const sidebarRef = useRef<SidebarRef>(null);

  // Button states (previously in hooks)
  const [showCharacterButton, setShowCharacterButton] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);

  // Gameplay input state (previously in useGameplayChat)
  const [gameplayInput, setGameplayInput] = useState('');

  // Track if this is the first gameplay message (for conditional fromPhase)
  const [isFirstGameplayMessage, setIsFirstGameplayMessage] = useState(true);

  // Ref for showDebug (needed for auto-trigger logic)
  const showDebugRef = useRef(showDebug);

  // Set default debug mode based on environment
  useEffect(() => {
    setShowDebug(isLocalhost());
  }, []);

  // Keep showDebugRef up to date
  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);

  // Core state management
  const chats = useChatsManagement();
  const { theme, setTheme } = useTheme();

  // Callback to refresh sidebar when a new chat is created
  const handleChatCreated = useCallback(() => {
    sidebarRef.current?.refresh();
  }, []);

  // CHARACTER GENERATION using unified hook
  const charGen = useGeneration({
    phase: 'character',
    currentChatId: chats.currentChatId,
    modelTier: chats.modelTier,
    fromPhase: 'world',
    getUserPrompt: () => CHARACTER_USER_PROMPT,
    onParseResponse: undefined, // Character doesn't need special parsing
    onSaveMetadata: async (parsed, chatId) => {
      // Extract character content from the full response
      // This would need the actual character extraction logic
      // For now, we'll handle this in onComplete
    },
    onMessagesUpdate: chats.setMessages,
    onSetStreaming: setIsStreaming,
    onComplete: () => {
      console.log('✅ Character generation complete');
      chats.setConversationState('world_generation');
      chats.setGenerationPhase('character');

      // Extract character content from the last message
      const lastMessage = chats.messages[chats.messages.length - 1];
      if (lastMessage && lastMessage.content) {
        chats.setCharacterContent(lastMessage.content);
      }

      // Show proceed button after character generation
      setShowProceedButton(true);
    },
    showDebugRef,
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

  // WORLD GENERATION using unified hook (needs dynamic userPrompt, so we'll use a ref)
  const worldGenParamsRef = useRef<any>(null);

  const worldGen = useGeneration({
    phase: 'world',
    currentChatId: chats.currentChatId,
    modelTier: chats.modelTier,
    getUserPrompt: () => {
      return worldGenParamsRef.current
        ? generateWorldParametersPrompt(worldGenParamsRef.current)
        : '';
    },
    parameters: worldGenParamsRef.current,
    onParseResponse: parseWorldGenerationTags,
    onSaveMetadata: async (parsed, chatId) => {
      console.log('💾 Saving world metadata...', parsed);

      // Extract and save bible content
      if (parsed.bible) {
        chats.setBibleContent(parsed.bible);
      }

      // Extract and save character if present
      if (parsed.character) {
        chats.setCharacterContent(parsed.character);
      }

      // Extract and save title (from <chat_name> tag)
      if (parsed.chatName) {
        chats.setChatTitle(parsed.chatName);

        // Update the chat title in the database
        await fetch('/api/chats', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: chatId, title: parsed.chatName }),
        });
      }
    },
    onMessagesUpdate: handleMessagesUpdate,
    onSetStreaming: setIsStreaming,
    onComplete: () => {
      console.log('✅ World generation complete');
      chats.setConversationState('world_generation');
      chats.setGenerationPhase('world');

      // Show appropriate button based on debug mode
      if (showDebug) {
        setShowCharacterButton(true);
      } else {
        // In production mode, don't show button - auto-trigger will handle it
      }
    },
    onAutoTrigger: () => {
      console.log("🎯 Auto-triggering character generation from page.tsx");
      chats.setGenerationPhase("character");
      charGen.handleGenerate();
    },
    showDebugRef,
    onGenerationPhaseChange: chats.setGenerationPhase,
  });

  // GAMEPLAY using unified hook (dynamic prompt from user input)
  const gameplay = useGeneration({
    phase: 'chat0', // All gameplay stays in chat0 for now
    currentChatId: chats.currentChatId,
    modelTier: chats.modelTier,
    fromPhase: isFirstGameplayMessage ? 'character' : undefined, // Only copy on first message
    getUserPrompt: () => {
      // Use current gameplayInput, or initial prompt if empty
      return gameplayInput.trim() || GAMEPLAY_INITIAL_USER_PROMPT;
    },
    onMessagesUpdate: handleMessagesUpdate,
    onSetStreaming: setIsStreaming,
    onComplete: () => {
      console.log('✅ Gameplay turn complete');
      // Clear input after successful send
      setGameplayInput('');
      // Mark that we've sent the first message
      setIsFirstGameplayMessage(false);
    },
    onGenerationPhaseChange: chats.setGenerationPhase,
  });

  // WRAPPER FUNCTIONS for old hook methods
  // World setup: create chat and start world generation
  const handleWorldSetup = useCallback(async (params: any) => {
    try {
      console.log('🌍 Starting world setup...', params);

      // Store params in ref for the hook to access
      worldGenParamsRef.current = params;

      // Generate unique chat ID
      const chatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create a new chat
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chatId,
          title: 'Untitled Adventure',
          modelTier: chats.modelTier,
          worldParams: params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create chat');
      }

      const newChat = await response.json();
      console.log('✅ Created new chat:', newChat.id);

      // Set current chat ID
      chats.setCurrentChatId(newChat.id);
      chats.setConversationState('world_generation');
      chats.setGenerationPhase('world');

      // Notify sidebar to refresh
      handleChatCreated();

      // Hide setup form
      chats.setShowWorldSetup(false);

      // Wait a tick for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start world generation
      await worldGen.handleGenerate();
    } catch (error) {
      console.error('❌ Error in handleWorldSetup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create chat');
    }
  }, [worldGen, chats, handleChatCreated]);

  // Character generation: just call the hook's handleGenerate
  const handleGenerateCharacter = useCallback(() => {
    console.log('👤 Starting character generation...');
    chats.setGenerationPhase('character');
    charGen.handleGenerate();
  }, [charGen, chats]);

  // Continue to gameplay: transition from character to gameplay
  const handleContinueToGameplay = useCallback(async () => {
    console.log('🎮 Transitioning to gameplay...');

    // Set gameplay state
    chats.setConversationState('gameplay');
    chats.setGenerationPhase('chat0');

    // Hide the proceed button
    setShowProceedButton(false);

    // Mark this as the first gameplay message (will trigger fromPhase)
    setIsFirstGameplayMessage(true);

    // Start first gameplay turn
    await gameplay.handleGenerate();
  }, [gameplay, chats]);

  // Send gameplay message
  const handleSendMessage = useCallback(async () => {
    if (!gameplayInput.trim()) {
      console.log('⚠️ Empty input, not sending');
      return;
    }

    console.log('📤 Sending gameplay message:', gameplayInput);

    // Start generation (getUserPrompt callback will read gameplayInput)
    await gameplay.handleGenerate();
  }, [gameplayInput, gameplay]);

  // Edit message (placeholder - needs full implementation)
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      console.log('✏️ Editing message:', messageId, newContent);
      // TODO: Implement message editing
      // This would need to:
      // 1. Find the message in the database
      // 2. Update its content
      // 3. Regenerate all subsequent messages
      // For now, just return a promise
      return Promise.resolve();
    },
    []
  );

  // Reset form submitting state when generation actually starts
  useEffect(() => {
    if (worldGen.isGenerating) {
      setIsFormSubmitting(false);
    }
  }, [worldGen.isGenerating]);

  // AUTO-TRIGGER GAMEPLAY IN PRODUCTION MODE
  // When character generation completes in production mode, automatically start gameplay
  useEffect(() => {
    if (!showDebug && showProceedButton && !charGen.isGenerating && !worldGen.isGenerating) {
      console.log('🚀 Production mode: Auto-triggering gameplay start...');
      // Add a small delay for smooth transition
      const timer = setTimeout(() => {
        console.log('🎮 Executing auto-trigger to gameplay...');
        handleContinueToGameplay();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showDebug, showProceedButton, charGen.isGenerating, worldGen.isGenerating, handleContinueToGameplay]);

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
        gameplay.chat.setMessages(aiSdkMessages as any);
        // We're already in gameplay - hide the proceed button
        setShowProceedButton(false);
      } else if (chats.conversationState === 'world_generation') {
        // For world generation phase, messages may be split
        // This is a simplified approach - you may need to split properly
        console.log('🌍 Setting world gen messages:', aiSdkMessages.length);
        worldGen.chat.setMessages(aiSdkMessages as any);

        // Check if world generation is complete (has bible content)
        if (chats.bibleContent && chats.generationPhase === 'world') {
          console.log('✅ World gen complete (phase=world), setting buttons (showDebug:', showDebug, ')');
          // World gen complete, show appropriate button based on debug mode
          if (showDebug) {
            console.log('🔘 DEBUG mode: Setting showCharacterButton=true');
            setShowCharacterButton(true);
          } else {
            console.log('🔘 PRODUCTION mode: Setting showProceedButton=true');
            setShowProceedButton(true);
          }
        } else if (chats.characterContent && chats.generationPhase === 'character') {
          console.log('✅ Character gen complete (phase=character), setting proceed button');
          console.log('🔘 Calling setShowProceedButton(true)');
          // Character gen complete, show proceed button
          setShowProceedButton(true);
        } else {
          console.log('⚠️ Button conditions not met:', {
            hasBibleContent: !!chats.bibleContent,
            hasCharacterContent: !!chats.characterContent,
            generationPhase: chats.generationPhase,
          });
        }
      }
    } else {
      console.log('⚠️ No messages to sync');
    }
  }, [chats.currentChatId, chats.conversationState, chats.generationPhase, chats.bibleContent, chats.characterContent, showDebug, chats.messages]); // Run when chat ID, state, phase, bible, character, or messages change

  const handleNewChat = () => {
    chats.handleNewChat(() => {
      worldGen.chat.setMessages([]);
      charGen.chat.setMessages([]);
      gameplay.chat.setMessages([]);
    });
    setShowCharacterButton(false);
    setShowProceedButton(false);
    console.log("New chat started");
  };

  const handleBackToHome = () => {
    chats.setCurrentChatId(null);
    chats.setShowWorldSetup(false);
    console.log("Navigating back to home");
  };

  // APPEND-ONLY VISUAL MESSAGES WITH STREAMING:
  // - Base layer: chats.messages (persisted, append-only)
  // - Streaming layer: Temporarily append live messages during generation
  // - On completion: onFinish saves to chats.messages, streaming layer disappears
  // - No duplicates: streaming messages aren't in chats.messages yet
  const visualMessages = useMemo(() => {
    console.log('🔍 visualMessages memo re-computing');
    console.log('   chats.messages.length:', chats.messages.length);

    if (!chats.currentChatId) {
      return [];
    }

    // All persisted messages come from chats.messages state
    const dbMessages = chats.messages;

    // Prepare with system prompts and phase markers for visual display
    const preparedDbMessages = prepareVisualMessages(
      dbMessages,
      chats.generationPhase,
      showDebug,
      chats.bibleContent,
      chats.characterContent
    );

    // Convert to UIMessage format for display
    let uiMessages = preparedDbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: (msg as any).parts || [{ type: 'text' as const, text: msg.content }],
      createdAt: msg.timestamp,
    }));

    // APPEND STREAMING MESSAGES (not yet saved to chats.messages)
    // During generation, useChat hooks accumulate messages internally
    // We append them here for live display, they'll be saved in onFinish

    if (worldGen.isGenerating && worldGen.chat.messages.length > 0) {
      console.log('   📡 World streaming:', worldGen.chat.messages.length);
      uiMessages = [...uiMessages, ...worldGen.chat.messages as any];
    }

    if (charGen.isGenerating && charGen.chat.messages.length > 0) {
      console.log('   📡 Character streaming:', charGen.chat.messages.length);
      uiMessages = [...uiMessages, ...charGen.chat.messages as any];
    }

    if (gameplay.isGenerating && gameplay.chat.messages.length > 0) {
      console.log('   📡 Gameplay streaming:', gameplay.chat.messages.length);
      uiMessages = [...uiMessages, ...gameplay.chat.messages as any];
    }

    console.log('   Final visual messages:', uiMessages.length);
    return uiMessages;
  }, [
    chats.messages, // Persisted messages
    chats.generationPhase,
    showDebug,
    chats.bibleContent,
    chats.characterContent,
    chats.currentChatId,
    // Streaming dependencies (trigger re-render when streaming messages update):
    worldGen.isGenerating,
    worldGen.chat.messages,
    charGen.isGenerating,
    charGen.chat.messages,
    gameplay.isGenerating,
    gameplay.chat.messages,
  ]);

  // handleEditMessage is already defined above in the wrapper functions section

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
    <div className="h-screen overflow-hidden bg-parchment-primary">
      {/* Floating Controls - Always visible at top-right */}
      <FloatingControls
        theme={theme}
        onThemeChange={setTheme}
        showDebug={showDebug}
        onDebugChange={setShowDebug}
        generationPhase={chats.generationPhase}
        isMenuOpen={isMenuOpen}
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

      {/* Main Content Area - Fills screen, independent of overlays */}
      <main className="fixed inset-0 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {(() => {
            console.log('🎨 Rendering UI - conversationState:', chats.conversationState, 'generationPhase:', chats.generationPhase, 'showProceedButton:', showProceedButton);
            return null;
          })()}
          {chats.showWorldSetup || isFormSubmitting ? (
            <WorldPhase
              showSetupForm={!isFormSubmitting}
              messages={visualMessages}
              isGenerating={worldGen.isGenerating || isFormSubmitting}
              onWorldSetup={handleWorldSetup}
              showCharacterButton={showCharacterButton}
              onGenerateCharacter={handleGenerateCharacter}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              onEditMessage={handleEditMessage}
              onBack={handleBackToHome}
              theme={theme}
              onFormSubmittingChange={setIsFormSubmitting}
            />
          ) : !chats.currentChatId && !chats.isTransitioning ? (
            <HomePage
              onStartAdventure={handleNewChat}
              onSelectChat={chats.handleSelectChat}
              onViewAllAdventures={() => setIsMenuOpen(true)}
            />
          ) : chats.conversationState === "world_generation" && chats.generationPhase === "world" ? (
            <WorldPhase
              showSetupForm={false}
              messages={visualMessages}
              isGenerating={worldGen.isGenerating}
              onWorldSetup={handleWorldSetup}
              showCharacterButton={showCharacterButton}
              onGenerateCharacter={handleGenerateCharacter}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              onEditMessage={handleEditMessage}
              onBack={handleBackToHome}
              theme={theme}
            />
          ) : chats.conversationState === "world_generation" && chats.generationPhase === "character" ? (
            <CharacterPhase
              messages={visualMessages}
              isGenerating={charGen.isGenerating}
              showProceedButton={showProceedButton}
              onProceedToGameplay={handleContinueToGameplay}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              onEditMessage={handleEditMessage}
              theme={theme}
            />
          ) : (
            <GameplayPhase
              messages={visualMessages}
              isGenerating={worldGen.isGenerating || charGen.isGenerating}
              isSending={gameplay.isGenerating}
              input={gameplayInput}
              onInputChange={setGameplayInput}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              showDebug={showDebug}
              generationPhase={chats.generationPhase}
              showProceedButton={showProceedButton}
              onProceedToGameplay={handleContinueToGameplay}
            />
          )}
        </div>
      </main>
    </div>
  );
}
