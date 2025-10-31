'use client';

import { useState } from 'react';
import { WorldParameters, ModelTier } from '@/types';

interface WorldSetupFormProps {
  onSubmit: (params: { modelTier: ModelTier; worldParams: WorldParameters }) => void;
  isGenerating: boolean;
}

export default function WorldSetupForm({ onSubmit, isGenerating }: WorldSetupFormProps) {
  const [modelTier, setModelTier] = useState<ModelTier>('free');
  const [worldParams, setWorldParams] = useState<WorldParameters>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ modelTier, worldParams });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Create Your Adventure
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model Tier */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Model Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModelTier('free')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  modelTier === 'free'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">Free</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gemini Flash + Claude Haiku
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModelTier('pro')}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  modelTier === 'pro'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">Pro</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gemini Pro + Claude Sonnet
                </div>
              </button>
            </div>
          </div>

          {/* World Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              World Type <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Cultivation Fantasy, Space Opera..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={worldParams.worldType || ''}
              onChange={(e) => setWorldParams({ ...worldParams, worldType: e.target.value })}
            />
          </div>

          {/* Power System */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Power System <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Qi Cultivation, Magic Circles..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={worldParams.powerSystem || ''}
              onChange={(e) => setWorldParams({ ...worldParams, powerSystem: e.target.value })}
            />
          </div>

          {/* Starting Class */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Starting Social Class <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Peasant, Merchant, Noble..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={worldParams.startingClass || ''}
              onChange={(e) => setWorldParams({ ...worldParams, startingClass: e.target.value })}
            />
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom Instructions <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              placeholder="Any additional instructions for world generation..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={worldParams.customPrompt || ''}
              onChange={(e) => setWorldParams({ ...worldParams, customPrompt: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Start Adventure'}
          </button>
        </form>
      </div>
    </div>
  );
}
