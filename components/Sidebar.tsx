"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

interface Chat {
  id: string;
  name: string;
  updatedAt: Date;
  modelTier: string;
}

interface SidebarProps {
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  showDebug?: boolean;
  onExport?: () => void;
  modelTier?: string;
  chatTitle?: string;
}

export interface SidebarRef {
  refresh: () => Promise<void>;
}

const Sidebar = forwardRef<SidebarRef, SidebarProps>(function Sidebar(
  {
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
    isOpen,
    showDebug = false,
    onExport,
    modelTier,
    chatTitle,
  },
  ref
) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: loadChats,
  }));

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats");

      if (!response.ok) {
        console.error("Failed to fetch chats:", response.status);
        setChats([]);
        return;
      }

      const data = await response.json();

      // Check if data is an array
      if (!Array.isArray(data)) {
        console.error("Invalid response format:", data);
        setChats([]);
        return;
      }

      const mappedChats = data.map((chat: any) => ({
        ...chat,
        updatedAt: new Date(chat.updatedAt),
      }));

      console.log("[Sidebar] Loaded", mappedChats.length, "chats");
      setChats(mappedChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
      setChats(chats.filter((c) => c.id !== chatId));
      onDeleteChat(chatId);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <div
      className={`w-64 bg-parchment-secondary border-r border-parchment flex flex-col h-full fixed left-0 top-0 z-40 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-parchment space-y-2 relative">
        {/* Chat title and tier */}
        {currentChatId && (
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-parchment-primary truncate">
              {chatTitle || "Untitled Adventure"}
            </h2>
            {modelTier && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-parchment-tertiary text-parchment-secondary rounded">
                {modelTier === "budget" ? "Budget Tier" : "Pro Tier"}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-parchment hover:opacity-80 text-parchment-primary rounded-lg font-medium transition-opacity"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Adventure
        </button>

        {/* Export button - only in debug mode */}
        {showDebug && onExport && currentChatId && (
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-parchment-tertiary hover:bg-parchment text-parchment-primary rounded-lg text-sm font-medium transition-colors"
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
                strokeWidth={2.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Conversation
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-parchment-muted text-sm">
            Loading...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-parchment-muted text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="py-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onMouseEnter={() => setHoveredId(chat.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative mx-2 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? "bg-parchment-tertiary"
                    : "hover:bg-parchment-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-parchment-primary truncate">
                      {chat.name}
                    </div>
                    <div className="text-xs text-parchment-muted mt-0.5">
                      {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                    </div>
                  </div>
                  {hoveredId === chat.id && (
                    <button
                      onClick={(e) => handleDelete(chat.id, e)}
                      className="flex-shrink-0 p-1 text-parchment-primary hover:text-red-600 transition-colors"
                      title="Delete"
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
                          strokeWidth={2.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {chat.modelTier === "pro" && (
                  <div className="mt-1">
                    <span className="inline-block px-1.5 py-0.5 text-xs bg-accent-parchment text-parchment-primary rounded">
                      Pro
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Auth & Version */}
      <div className="border-t border-parchment">
        <div className="p-4 flex items-center justify-between">
          {/* Authentication */}
          <SignedOut>
            <div className="flex items-center gap-2 w-full">
              <SignInButton mode="modal">
                <button className="flex-1 px-3 py-2 text-sm text-parchment-secondary hover:text-parchment-primary hover:bg-parchment-tertiary rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="flex-1 px-3 py-2 text-sm bg-accent-parchment text-parchment-primary rounded-lg hover:opacity-80 transition-opacity">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-parchment-muted">v0.1</span>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </div>
  );
});

export default Sidebar;
