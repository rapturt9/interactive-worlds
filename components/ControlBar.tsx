"use client";

import { ModelTier, Message } from "@/types";

interface ControlBarProps {
  chatTitle?: string;
  modelTier?: ModelTier;
  currentChatId?: string | null;
  showDebug: boolean;
  onExport: () => void;
  messages: Message[];
  isOpen: boolean;
}

/**
 * Top control bar with title, settings, and authentication
 * Theme and debug controls moved to FloatingControls
 */
export default function ControlBar({
  chatTitle,
  modelTier,
  currentChatId,
  showDebug,
  onExport,
  messages,
  isOpen,
}: ControlBarProps) {
  return (
    <div
      className={`h-14 border-b border-parchment bg-parchment-secondary flex items-center justify-between px-6 transition-all duration-300 absolute top-0 left-0 right-0 ${
        isOpen ? "translate-y-0 z-50" : "-translate-y-full -z-10"
      }`}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-parchment-primary">
          {chatTitle || "Interactive Worlds"}
        </h1>
        {currentChatId && (
          <span className="px-2 py-1 text-xs bg-parchment-tertiary text-parchment-secondary rounded">
            {modelTier === "budget" ? "Budget Tier" : "Pro Tier"}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Export Button (only when debug is on) */}
        {showDebug && currentChatId && messages.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-accent-parchment text-parchment-primary rounded-lg hover:opacity-80 transition-opacity"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        )}
      </div>
    </div>
  );
}
