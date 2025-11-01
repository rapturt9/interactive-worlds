"use client";

import { useState } from "react";
import { WorldParameters, ModelTier } from "@/types";

interface WorldSetupFormProps {
  onSubmit: (params: {
    modelTier: ModelTier;
    worldParams: WorldParameters;
  }) => void;
  isGenerating: boolean;
  onBack?: () => void;
}

export default function WorldSetupForm({
  onSubmit,
  isGenerating,
  onBack,
}: WorldSetupFormProps) {
  const [modelTier, setModelTier] = useState<ModelTier>("budget");
  const [worldParams, setWorldParams] = useState<WorldParameters>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ modelTier, worldParams });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-parchment-secondary rounded-xl border border-parchment p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-parchment-primary hover:text-parchment-primary hover:bg-parchment-tertiary rounded-lg transition-all"
              aria-label="Go back"
              type="button"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
          <h3 className="text-lg font-semibold text-parchment-primary">
            Create Your Adventure
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model Tier */}
          <div>
            <label className="block text-sm font-medium text-parchment-secondary mb-2">
              Model Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModelTier("budget")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  modelTier === "budget"
                    ? "border-accent-parchment bg-parchment-tertiary"
                    : "border-parchment hover:border-accent-parchment"
                }`}
              >
                <div className="font-medium text-parchment-primary">Budget</div>
                <div className="text-xs text-parchment-muted mt-0.5">
                  Gemini Flash + Claude Haiku
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModelTier("pro")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  modelTier === "pro"
                    ? "border-accent-parchment bg-parchment-tertiary"
                    : "border-parchment hover:border-accent-parchment"
                }`}
              >
                <div className="font-medium text-parchment-primary">Pro</div>
                <div className="text-xs text-parchment-muted mt-0.5">
                  Gemini Pro + Claude Sonnet
                </div>
              </button>
            </div>
          </div>

          {/* World Type */}
          <div>
            <label className="block text-sm font-medium text-parchment-secondary mb-2">
              World Type{" "}
              <span className="text-parchment-muted">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Cultivation Fantasy, Space Opera..."
              className="w-full px-3 py-2 border border-parchment rounded-lg bg-parchment-primary text-parchment-primary placeholder-parchment-muted focus:outline-none focus:ring-2 focus:ring-accent-parchment"
              value={worldParams.worldType || ""}
              onChange={(e) =>
                setWorldParams({ ...worldParams, worldType: e.target.value })
              }
            />
          </div>

          {/* Power System */}
          <div>
            <label className="block text-sm font-medium text-parchment-secondary mb-2">
              Power System{" "}
              <span className="text-parchment-muted">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Qi Cultivation, Magic Circles..."
              className="w-full px-3 py-2 border border-parchment rounded-lg bg-parchment-primary text-parchment-primary placeholder-parchment-muted focus:outline-none focus:ring-2 focus:ring-accent-parchment"
              value={worldParams.powerSystem || ""}
              onChange={(e) =>
                setWorldParams({ ...worldParams, powerSystem: e.target.value })
              }
            />
          </div>

          {/* Starting Class */}
          <div>
            <label className="block text-sm font-medium text-parchment-secondary mb-2">
              Starting Social Class{" "}
              <span className="text-parchment-muted">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Peasant, Merchant, Noble..."
              className="w-full px-3 py-2 border border-parchment rounded-lg bg-parchment-primary text-parchment-primary placeholder-parchment-muted focus:outline-none focus:ring-2 focus:ring-accent-parchment"
              value={worldParams.startingClass || ""}
              onChange={(e) =>
                setWorldParams({
                  ...worldParams,
                  startingClass: e.target.value,
                })
              }
            />
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-parchment-secondary mb-2">
              Custom Instructions{" "}
              <span className="text-parchment-muted">(optional)</span>
            </label>
            <textarea
              placeholder="Any additional instructions for world generation..."
              className="w-full px-3 py-2 border border-parchment rounded-lg bg-parchment-primary text-parchment-primary placeholder-parchment-muted focus:outline-none focus:ring-2 focus:ring-accent-parchment resize-none"
              rows={3}
              value={worldParams.customPrompt || ""}
              onChange={(e) =>
                setWorldParams({ ...worldParams, customPrompt: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-accent-parchment hover:opacity-80 text-parchment-primary py-2.5 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isGenerating ? "Generating..." : "Start Adventure"}
          </button>
        </form>
      </div>
    </div>
  );
}
