export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface World {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  modelTier: "free" | "pro";
  storyBible?: string;
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

export type ModelTier = "free" | "pro";

export interface ModelConfig {
  storytelling: string;
  management: string;
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  free: {
    storytelling: "anthropic/claude-haiku-4.5",
    management: "google/gemini-2.5-flash",
  },
  pro: {
    storytelling: "anthropic/claude-sonnet-4.5",
    management: "google/gemini-2.5-pro",
  },
};
