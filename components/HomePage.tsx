'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

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
export default function HomePage({ onStartAdventure, onSelectChat, onViewAllAdventures }: HomePageProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentChats();
  }, []);

  const loadRecentChats = async () => {
    try {
      const response = await fetch('/api/chats');
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
      console.error('Failed to load recent chats:', error);
      setRecentChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`${recentChats.length === 0 && !isLoading ? 'mb-8' : 'mb-6'}`}>
            <img
              src="/logo.png"
              alt="Interactive Worlds"
              className={`mx-auto transition-all ${recentChats.length === 0 && !isLoading ? 'w-32 h-32' : 'w-24 h-24'}`}
            />
          </div>
          <h1 className="text-5xl font-bold text-parchment-primary mb-4">
            Welcome to Interactive Worlds
          </h1>
          <p className="text-xl text-parchment-secondary mb-10">
            Create immersive text adventures with persistent worlds
          </p>
          <button
            onClick={onStartAdventure}
            className="px-12 py-5 bg-accent-parchment hover:brightness-110 text-white rounded-xl font-bold text-xl transition-all shadow-2xl hover:shadow-accent-parchment/50 hover:scale-105 border-2 border-accent-parchment/20"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(201, 168, 106, 0.4), 0 8px 10px -6px rgba(201, 168, 106, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            Start New Adventure
          </button>
        </div>

        {/* Recent Adventures Section */}
        {!isLoading && recentChats.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-parchment-primary mb-6 text-center">
              Recent Adventures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat?.(chat.id)}
                  className="group p-5 bg-parchment-secondary border border-parchment rounded-lg hover:bg-parchment-tertiary transition-all text-left shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-parchment-primary group-hover:text-accent-parchment transition-colors line-clamp-2">
                      {chat.name}
                    </h3>
                    {chat.modelTier === 'pro' && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-accent-parchment text-parchment-primary rounded">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-parchment-muted">
                    {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>

            {/* View All Adventures Button - Show if there are more than 3 chats */}
            {totalChats > 3 && onViewAllAdventures && (
              <div className="mt-6 text-center">
                <button
                  onClick={onViewAllAdventures}
                  className="px-6 py-2 bg-parchment-secondary hover:bg-parchment-tertiary border border-parchment rounded-lg text-parchment-primary font-medium transition-all shadow-sm hover:shadow-md"
                >
                  View All Adventures ({totalChats})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State - Hidden when vertically centered */}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-parchment"></div>
          </div>
        )}
      </div>
    </div>
  );
}
