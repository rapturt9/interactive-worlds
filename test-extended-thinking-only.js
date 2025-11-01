/**
 * Test script for Extended Thinking ONLY (no Supermemory)
 * This helps us verify that extended thinking works with OpenRouter
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "anthropic/claude-sonnet-4.5";

console.log("🧪 Testing Extended Thinking (WITHOUT Supermemory)");
console.log("=".repeat(60));

async function testExtendedThinking() {
  const userMessage = "What is 15 * 23? Think through the calculation step by step.";

  console.log(`\n👤 USER: ${userMessage}\n`);
  console.log("🤖 ASSISTANT:\n");

  const result = streamText({
    model: openrouter(MODEL),
    messages: [{ role: "user", content: userMessage }],
    providerOptions: {
      openrouter: {
        reasoning: { effort: "high" }
      }
    }
  });

  let fullResponse = "";
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
    fullResponse += textPart;
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("📊 ANALYSIS:");
  console.log(`  Response length: ${fullResponse.length} characters`);

  const hasThinkingTags = fullResponse.includes("<thinking>") || fullResponse.includes("</thinking>");
  console.log(`  Extended thinking tags: ${hasThinkingTags ? 'YES ✓' : 'NO ✗'}`);

  return fullResponse;
}

testExtendedThinking().catch(console.error);
