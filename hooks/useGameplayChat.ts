'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ModelTier } from '@/types';
import { GAMEPLAY_PROMPT_TEMPLATE } from '@/lib/prompts/gameplay-prompt';

export interface UseGameplayChatReturn {
  input: string;
  isSending: boolean;
  gameplayChat: ReturnType<typeof useChat>;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  handleEditMessage: (messageId: string, newContent: string) => Promise<void>;
  handleContinueToGameplay: () => void;
}

interface UseGameplayChatProps {
  currentChatId: string | null;
  modelTier: ModelTier;
  onSetStreaming: (streaming: boolean) => void;
  onShowProceedButton: (show: boolean) => void;
}

/**
 * Hook to manage gameplay chat interactions
 * Uses useChat hook following AI SDK 5.0 best practices
 */
export function useGameplayChat({
  currentChatId,
  modelTier,
  onSetStreaming,
  onShowProceedButton,
}: UseGameplayChatProps): UseGameplayChatReturn {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // useChat hook for gameplay - handles streaming automatically!
  const gameplayChat = useChat({
    id: 'gameplay',
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { modelTier },
    }),
    onFinish: async (message) => {
      console.log('✅ Gameplay message finished!', message);

      if (!currentChatId) return;

      // Save assistant message to database with phase: 'chat0'
      const textParts = message.parts?.filter((p: any) => p.type === 'text') || [];
      const content = textParts.map((p: any) => p.text).join('');

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChatId,
          message: {
            id: message.id,
            role: 'assistant',
            content,
            parts: message.parts,
            timestamp: new Date(),
            phase: 'chat0', // Gameplay messages are in chat0 phase
          },
        }),
      });

      setIsSending(false);
      onSetStreaming(false);
    },
    onError: (error) => {
      console.error('❌ Gameplay chat error:', error);
      setIsSending(false);
      onSetStreaming(false);
      alert(`Failed to send message: ${error.message}`);
    },
  });

  const handleContinueToGameplay = () => {
    if (!currentChatId) return;

    onShowProceedButton(false);
    onSetStreaming(true);
    setIsSending(true);

    // DO NOT save system prompts to database - they are inserted dynamically

    // Save "Begin adventure" user message to database with phase: 'chat0'
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: currentChatId,
        message: {
          id: `${currentChatId}-begin-user`,
          role: 'user',
          content: 'Begin the adventure. Introduce my character and situation.',
          timestamp: new Date(),
          phase: 'chat0', // Starting gameplay in chat0 phase
        },
      }),
    });

    console.log('🎮 Starting gameplay with useChat.sendMessage...');

    // Use useChat's sendMessage - it handles everything!
    gameplayChat.sendMessage({
      parts: [
        {
          type: 'text',
          text: 'Begin the adventure. Introduce my character and situation.',
        },
      ],
    });
  };

  const handleSendMessage = () => {
    if (!input.trim() || !currentChatId || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    onSetStreaming(true);

    // Save user message to database with phase: 'chat0'
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: currentChatId,
        message: {
          id: `${currentChatId}-${Date.now()}`,
          role: 'user',
          content: messageContent,
          timestamp: new Date(),
          phase: 'chat0', // Gameplay messages are in chat0 phase
        },
      }),
    });

    console.log('📨 Sending message via useChat...');

    // Use useChat's sendMessage - it handles everything!
    gameplayChat.sendMessage({
      parts: [
        {
          type: 'text',
          text: messageContent,
        },
      ],
    });
  };

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const messageIndex = gameplayChat.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Update message in database
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: newContent }),
      });

      // Delete messages after this one in database
      if (currentChatId) {
        await fetch(`/api/messages?chatId=${currentChatId}&messageId=${messageId}`, {
          method: 'DELETE',
        });
      }

      // Update local state by setting messages up to and including the edited message
      const newMessages = gameplayChat.messages.slice(0, messageIndex);
      newMessages.push({ ...gameplayChat.messages[messageIndex], parts: [{ type: 'text', text: newContent }] });
      gameplayChat.setMessages(newMessages as any);
      setInput(newContent);
    },
    [gameplayChat, currentChatId]
  );

  return {
    input,
    isSending,
    gameplayChat,
    setInput,
    handleSendMessage,
    handleEditMessage,
    handleContinueToGameplay,
  };
}
