export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  phase?: string; // world, character, chat0, chat1, etc.
}

export interface World {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  modelTier: "budget" | "pro";
  bibleContent?: string; // Current bible (gets updated with summaries)
  originalBibleContent?: string; // Original bible (never changes)
  characterContent?: string; // Character sheet (gets updated)
  generationPhase?: string; // world, character, chat0, chat1, etc.
  conversationState?: "world_generation" | "gameplay";
  parameters?: WorldParameters;
}

export interface WorldParameters {
  // New format
  genre?: string;
  setting?: string;
  theme?: string;
  difficulty?: string;
  // Legacy format
  worldType?: string;
  startingAge?: number;
  startingClass?: string;
  powerSystem?: string;
  customPrompt?: string;
}

export interface Chat {
  id: string;
  worldId: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  turnNumber: number;
}

export type ModelTier = "budget" | "pro";

export interface ModelConfig {
  storytelling: string;
  management: string;
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  budget: {
    storytelling: "anthropic/claude-haiku-4.5",
    management: "google/gemini-2.5-flash",
  },
  pro: {
    storytelling: "anthropic/claude-sonnet-4.5",
    management: "google/gemini-2.5-pro",
  },
};
