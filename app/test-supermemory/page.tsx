"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import ChatMessage from "@/components/ChatMessage";

export default function SupermemoryTestPage() {
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  const [showDebug, setShowDebug] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, status, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/supermemory-chat",
      body: {
        conversationId,
      },
    }),
    onError: (error) => {
      console.error("❌ Chat error:", error);
    },
    onFinish: (message) => {
      console.log("✅ Message finished:", message);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Debug logging
  useEffect(() => {
    console.log("🔍 Chat state:", {
      input,
      inputLength: input?.length,
      inputTrimmed: input?.trim(),
      status,
      isLoading,
      messageCount: messages.length,
    });
  }, [input, status, isLoading, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Custom submit handler with logging
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    console.log("📤 Submitting message:", { input: trimmedInput, conversationId, status });

    // Send message using AI SDK 5.0 sendMessage
    sendMessage({
      parts: [
        {
          type: 'text',
          text: trimmedInput,
        },
      ],
    });

    // Clear input after sending
    setInput("");
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              🧠 Supermemory + Extended Thinking Test
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Conversation ID: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{conversationId}</code>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Debug Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Show Debug (Reasoning/Tools)
              </span>
            </label>

            {/* Back to Home */}
            <a
              href="/"
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-1">
                Testing Features:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✅ <strong>Infinite Memory:</strong> Supermemory automatically stores and retrieves context across turns</li>
                <li>⚠️ <strong>Extended Thinking:</strong> Enabled but may not appear (Supermemory proxy limitation)</li>
                <li>✅ <strong>User Isolation:</strong> Your memories are isolated by Clerk user ID</li>
                <li>✅ <strong>Conversation Isolation:</strong> Each conversation has its own memory space</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Test Supermemory + Extended Thinking
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Try asking questions that require memory across multiple turns:
              </p>
              <div className="text-left space-y-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Turn 1:</strong> "My favorite color is purple and I love pizza."</p>
                <p><strong>Turn 2:</strong> "What's my favorite color?"</p>
                <p><strong>Turn 3:</strong> "Write a story about my favorite food."</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            showDebug={showDebug}
          />
        ))}

        {error && (
          <div className="my-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-100 font-semibold">❌ Error:</p>
            <p className="text-xs text-red-800 dark:text-red-200 mt-1">{error.message}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              console.log("✏️ Input changed:", e.target.value);
              setInput(e.target.value);
            }}
            placeholder="Test memory and extended thinking..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input || input.trim().length === 0}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => console.log("🔘 Button clicked, disabled:", isLoading || !input || input.trim().length === 0, "status:", status)}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          💡 Tip: Reference previous information to test memory retrieval
        </p>
      </div>
    </div>
  );
}
