import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MODEL_CONFIGS, ModelTier } from "@/types";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export function getStorytellingModel(tier: ModelTier) {
  const modelName = MODEL_CONFIGS[tier].storytelling;
  return openrouter(modelName);
}

export function getManagementModel(tier: ModelTier) {
  const modelName = MODEL_CONFIGS[tier].management;
  return openrouter(modelName);
}
