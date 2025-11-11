'use client';

import { useRotatingMessages } from '@/hooks/useRotatingMessages';

interface EnhancedLoadingStateProps {
  phase: 'world' | 'character' | 'starting';
  theme: 'light-parchment' | 'dark-parchment';
}

// Fun themed messages for each phase
const WORLD_MESSAGES = [
  '🎲 Rolling dice to shape reality...',
  '🏔️ Sculpting mountains and valleys...',
  '🌊 Filling oceans with ancient secrets...',
  '⚔️ Forging legendary artifacts...',
  '📜 Writing the annals of history...',
  '🏰 Building civilizations from dust...',
];

const CHARACTER_MESSAGES = [
  '✅ World generation complete!',
  '✨ Weaving your destiny...',
  '🧙 Consulting the fates...',
  '📖 Writing your legend...',
  '🎭 Breathing life into your hero...',
  '🗡️ Sharpening your skills...',
  '🌟 Awakening your powers...',
];

const STARTING_MESSAGES = [
  '🚪 Opening the gates of adventure...',
  '🌟 Your story begins...',
  '🗺️ Unfurling the map of destiny...',
  '⚡ Igniting the spark of legend...',
];

/**
 * Enhanced loading animation with rotating themed messages
 * Shows fun, immersive text that cycles through phase-specific messages
 */
export default function EnhancedLoadingState({ phase, theme }: EnhancedLoadingStateProps) {
  const isDark = theme === 'dark-parchment';

  // Select messages based on phase
  const messages =
    phase === 'world' ? WORLD_MESSAGES :
    phase === 'character' ? CHARACTER_MESSAGES :
    STARTING_MESSAGES;

  // Rotate through messages every 2.5 seconds
  const currentMessage = useRotatingMessages(messages, 2500);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className={`text-center ${isDark ? 'text-white' : 'text-parchment-primary'}`}>
        {/* Animated loading text with fade transitions */}
        <div className="text-2xl font-serif mb-6 min-h-[2.5rem] flex items-center justify-center">
          <div className="animate-fade-in-slow">
            {currentMessage}
          </div>
        </div>

        {/* Enhanced loading spinner with pulse effect */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer pulse ring */}
            <div className={`absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20 ${
              isDark ? 'bg-white' : 'bg-parchment-primary'
            }`}></div>

            {/* Main spinner */}
            <div className={`relative w-12 h-12 border-4 rounded-full animate-spin ${
              isDark
                ? 'border-white/20 border-t-white'
                : 'border-gray-300/20 border-t-[var(--text-primary)]'
            }`}></div>
          </div>
        </div>

        {/* Bouncing dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? 'bg-white' : 'bg-parchment-primary'
          }`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? 'bg-white' : 'bg-parchment-primary'
          }`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? 'bg-white' : 'bg-parchment-primary'
          }`} style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
