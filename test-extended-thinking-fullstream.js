/**
 * Test Extended Thinking using fullStream to see all parts
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "anthropic/claude-sonnet-4.5";

console.log("🧪 Testing Extended Thinking - Full Stream Analysis");
console.log("=".repeat(60));

async function testExtendedThinking() {
  const userMessage = "What is 15 * 23? Think through the calculation step by step.";

  console.log(`\n👤 USER: ${userMessage}\n`);

  const result = streamText({
    model: openrouter(MODEL),
    messages: [{ role: "user", content: userMessage }],
    providerOptions: {
      openrouter: {
        reasoning: { effort: "high" }
      }
    }
  });

  console.log("🔍 Full Stream Parts:\n");

  let hasReasoningPart = false;
  let reasoningText = "";
  let responseText = "";

  for await (const part of result.fullStream) {
    if (part.type === 'reasoning-delta') {
      hasReasoningPart = true;
      reasoningText += part.text || '';
      process.stdout.write(part.text || ''); // Show reasoning in real-time
    } else if (part.type === 'text-delta') {
      responseText += part.textDelta;
    } else if (part.type === 'reasoning-start') {
      console.log("💭 REASONING:\n");
    } else if (part.type === 'reasoning-end') {
      console.log("\n\n📝 RESPONSE:\n");
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 ANALYSIS:");
  console.log(`  Reasoning parts found: ${hasReasoningPart ? 'YES ✓' : 'NO ✗'}`);
  if (hasReasoningPart) {
    console.log(`  Reasoning length: ${reasoningText.length} characters`);
    console.log(`\n💭 Reasoning content:\n${reasoningText.substring(0, 500)}${reasoningText.length > 500 ? '...' : ''}`);
  }
  console.log(`\n📝 Response text length: ${responseText.length} characters`);
}

testExtendedThinking().catch(console.error);
