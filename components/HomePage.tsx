"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  name: string;
  updatedAt: Date;
  modelTier: string;
}

interface HomePageProps {
  onStartAdventure: () => void;
  onSelectChat?: (chatId: string) => void;
  onViewAllAdventures?: () => void;
}

/**
 * Welcome screen shown before creating a new chat
 * Displays recent adventures if available
 */
export default function HomePage({
  onStartAdventure,
  onSelectChat,
  onViewAllAdventures,
}: HomePageProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentChats();
  }, []);

  const loadRecentChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        setRecentChats([]);
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        setRecentChats([]);
        setTotalChats(0);
        return;
      }

      // Track total number of chats
      setTotalChats(data.length);

      // Get most recent 3 chats
      const mappedChats = data
        .map((chat: any) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt),
        }))
        .slice(0, 3);

      setRecentChats(mappedChats);
    } catch (error) {
      console.error("Failed to load recent chats:", error);
      setRecentChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Centered Header Section - Fixed height, always centered */}
      <div className="h-[60vh] sm:h-[65vh] flex items-center justify-center px-4 py-6 sm:py-8 flex-shrink-0">
        <div className="text-center">
          <div className="mb-3 sm:mb-4 mt-10">
            <img
              src="/logo.png"
              alt="Interactive Worlds"
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 transition-all"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-parchment-primary mb-2 sm:mb-3">
            Welcome to Interactive Worlds
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-parchment-secondary mb-4 sm:mb-6 px-4">
            Create immersive text adventures with persistent worlds
          </p>
          <button
            onClick={onStartAdventure}
            className="px-8 py-3 sm:px-10 sm:py-4 bg-accent-parchment hover:brightness-110 text-white rounded-xl font-bold text-base sm:text-lg transition-all shadow-2xl hover:shadow-accent-parchment/50 hover:scale-105 border-2 border-accent-parchment/20"
            style={{
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              boxShadow:
                "0 10px 25px -5px rgba(201, 168, 106, 0.4), 0 8px 10px -6px rgba(201, 168, 106, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            }}
          >
            Start New Adventure
          </button>
        </div>
      </div>

      {/* Recent Adventures Section - Separate layer in remaining space */}
      {!isLoading && recentChats.length > 0 && (
        <div className="h-[40vh] sm:h-[35vh] px-4 sm:px-8 pb-6 sm:pb-8 flex-shrink-0 overflow-y-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-parchment-primary mb-3 sm:mb-4 text-center">
            Recent Adventures
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {recentChats.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat?.(chat.id)}
                className={`group p-3 sm:p-4 bg-parchment-secondary border border-parchment rounded-lg hover:bg-parchment-tertiary transition-all text-left shadow-md hover:shadow-lg ${
                  index > 0 ? "hidden sm:block" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-parchment-primary group-hover:text-accent-parchment transition-colors line-clamp-2 text-sm">
                    {chat.name}
                  </h3>
                  {chat.modelTier === "pro" && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-accent-parchment text-parchment-primary rounded">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-parchment-muted">
                  {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>

          {/* View All Adventures Button - Show if there are more than 3 chats */}
          {totalChats > 3 && onViewAllAdventures && (
            <div className="mt-3 sm:mt-4 text-center">
              <button
                onClick={onViewAllAdventures}
                className="px-5 py-2 sm:px-6 bg-parchment-secondary hover:bg-parchment-tertiary border border-parchment rounded-lg text-parchment-primary font-medium transition-all shadow-sm hover:shadow-md text-xs sm:text-sm"
              >
                View All Adventures ({totalChats})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading State - Separate layer in remaining space */}
      {isLoading && (
        <div className="h-[40vh] sm:h-[35vh] px-4 sm:px-8 pb-6 sm:pb-8 flex items-center justify-center flex-shrink-0">
          <div className="text-center">
            <p className="text-sm text-parchment-muted mb-3">
              Loading adventures...
            </p>
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent-parchment"></div>
          </div>
        </div>
      )}
    </div>
  );
}
