'use client';

import { useEffect, useState } from 'react';
import { isLocalhost } from '@/lib/utils/environment';

interface FloatingControlsProps {
  theme: 'light-parchment' | 'dark-parchment';
  onThemeChange: (theme: 'light-parchment' | 'dark-parchment') => void;
  showDebug: boolean;
  onDebugChange: (value: boolean) => void;
  generationPhase?: string; // world, character, chat0, etc.
  isMenuOpen?: boolean; // Hide on mobile when sidebar is open
}

/**
 * Always-visible floating controls at top-right
 * Contains theme toggle and debug toggle (localhost only)
 */
export default function FloatingControls({
  theme,
  onThemeChange,
  showDebug,
  onDebugChange,
  generationPhase,
  isMenuOpen = false,
}: FloatingControlsProps) {
  const [isLocalEnv, setIsLocalEnv] = useState(false);
  const isDark = theme === 'dark-parchment';

  useEffect(() => {
    setIsLocalEnv(isLocalhost());
  }, []);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg transition-opacity duration-300 ${
      isDark ? 'bg-parchment-tertiary/90 border-white/20' : 'bg-parchment-secondary/90 border-parchment'
    } ${
      isMenuOpen ? 'max-md:hidden' : ''
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => onThemeChange(theme === 'dark-parchment' ? 'light-parchment' : 'dark-parchment')}
        className={`p-2 transition-colors rounded-lg ${
          isDark ? 'text-white hover:bg-parchment/50' : 'text-parchment-primary hover:bg-parchment-tertiary'
        }`}
        title={theme === 'dark-parchment' ? 'Switch to light parchment' : 'Switch to dark parchment'}
      >
        {theme === 'dark-parchment' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Debug Toggle - Only visible on localhost */}
      {isLocalEnv && (
        <>
          <div className={`h-6 w-px ${isDark ? 'bg-white/30' : 'bg-parchment/30'}`}></div>
          <label className="flex items-center gap-2.5 cursor-pointer group" title="Debug mode (localhost only)">
            <span className={`text-xs font-medium transition-colors ${isDark ? 'text-white' : 'text-parchment-primary'}`}>Debug</span>
            <div className="relative inline-block">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => onDebugChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-parchment rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-parchment/50 transition-colors peer-checked:bg-accent-parchment shadow-inner">
                <div className={`absolute top-1 left-1 bg-white rounded-full h-4 w-4 shadow-md transition-transform duration-200 ease-in-out ${showDebug ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </label>

          {/* Phase Indicator - Only visible when debug is on */}
          {showDebug && generationPhase && (
            <>
              <div className={`h-6 w-px ${isDark ? 'bg-white/30' : 'bg-parchment/30'}`}></div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'text-white bg-white/10' : 'text-parchment-primary bg-parchment/30'}`} title="Current generation phase">
                Phase: {generationPhase}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}
