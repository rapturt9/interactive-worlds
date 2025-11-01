'use client';

interface GenerationLoadingStateProps {
  phase: 'world' | 'character';
  theme: 'light-parchment' | 'dark-parchment';
}

/**
 * Loading animation shown during world/character generation in production mode
 * Shows animated text with pulsing effect
 */
export default function GenerationLoadingState({ phase, theme }: GenerationLoadingStateProps) {
  const isDark = theme === 'dark-parchment';

  const message = phase === 'world'
    ? 'Generating world...'
    : 'Generating character...';

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className={`text-center ${isDark ? 'text-white' : 'text-parchment-primary'}`}>
        {/* Animated loading text */}
        <div className="text-2xl font-serif mb-4 animate-pulse">
          {message}
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
            isDark
              ? 'border-white/20 border-t-white'
              : 'border-parchment/20 border-t-parchment-primary'
          }`}></div>
        </div>
      </div>
    </div>
  );
}
