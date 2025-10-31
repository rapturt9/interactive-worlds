"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
  modelTier: string;
}

interface SidebarProps {
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function Sidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();
      setChats(
        data.map((chat: any) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt),
        }))
      );
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      try {
        await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
        setChats(chats.filter((c) => c.id !== chatId));
        onDeleteChat(chatId);
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
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
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Adventure
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
            Loading...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
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
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                    </div>
                  </div>
                  {hoveredId === chat.id && (
                    <button
                      onClick={(e) => handleDelete(chat.id, e)}
                      className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {chat.modelTier === "pro" && (
                  <div className="mt-1">
                    <span className="inline-block px-1.5 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded">
                      Pro
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Interactive Worlds v0.1
        </div>
      </div>
    </div>
  );
}
