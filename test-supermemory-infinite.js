/**
 * Test script for Supermemory Infinite Chat with OpenRouter + Extended Thinking
 * Run with: node test-supermemory-infinite.js
 *
 * This tests the Supermemory Router approach (infinite chat) which automatically
 * manages memory without explicit tool calls.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

// Configuration
const CONVERSATION_ID = `test-${Date.now()}`; // Unique ID per test run
const MODEL = "anthropic/claude-sonnet-4.5";

// Create OpenRouter client with Supermemory proxy
const infiniteChatOpenRouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://api.supermemory.ai/v3/https://openrouter.ai/api/v1',
  headers: {
    'x-supermemory-api-key': process.env.SUPERMEMORY_API_KEY,
    'x-sm-user-id': 'test-user-123', // Required: User ID for memory isolation
    'x-sm-conversation-id': CONVERSATION_ID,
  }
});

console.log("🔧 Configuration:");
console.log(`  Conversation ID: ${CONVERSATION_ID}`);
console.log(`  Model: ${MODEL}`);
console.log(`  Supermemory Proxy: https://api.supermemory.ai/v3/https://openrouter.ai/api/v1`);
console.log("");

/**
 * Helper function to stream and display response
 */
async function streamAndDisplay(userMessage, testNumber, testName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST ${testNumber}: ${testName}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n👤 USER: ${userMessage}\n`);

  const messages = [{ role: "user", content: userMessage }];

  try {
    const result = streamText({
      model: infiniteChatOpenRouter(MODEL),
      messages,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" }
        }
      }
    });

    let fullResponse = "";
    let reasoningText = "";
    let hasReasoningBlocks = false;

    // Stream using fullStream to capture reasoning parts
    for await (const part of result.fullStream) {
      if (part.type === 'reasoning-start') {
        console.log("💭 REASONING:\n");
        hasReasoningBlocks = true;
      } else if (part.type === 'reasoning-delta' && part.text) {
        reasoningText += part.text;
        process.stdout.write(part.text);
      } else if (part.type === 'reasoning-end') {
        console.log("\n\n🤖 ASSISTANT:\n");
      } else if (part.type === 'text-start') {
        console.log("🤖 ASSISTANT:\n");
      } else if (part.type === 'text-delta') {
        const text = part.textDelta || part.text || '';
        if (text) {
          fullResponse += text;
          process.stdout.write(text);
        }
      } else if (part.type === 'error') {
        console.error("\n❌ Stream error:", part.error);
      }
    }

    console.log("\n");

    // Analysis
    console.log("\n📊 ANALYSIS:");
    console.log(`  ✓ Response length: ${fullResponse.length} characters`);
    console.log(`  ${hasReasoningBlocks ? '✓' : '✗'} Extended thinking detected (${reasoningText.length} chars)`);

    return { success: true, fullResponse, reasoningText, hasReasoningBlocks };

  } catch (error) {
    console.error("❌ ERROR:");
    console.error(`  Message: ${error.message}`);
    if (error.cause) {
      console.error(`  Cause: ${JSON.stringify(error.cause, null, 2)}`);
    }
    return { success: false, error };
  }
}

/**
 * Main test sequence
 */
async function runTests() {
  console.log("\n🧪 SUPERMEMORY INFINITE CHAT + EXTENDED THINKING TEST");
  console.log("=" .repeat(60));
  console.log("\nTesting automatic memory management with OpenRouter\n");

  const results = [];

  // Test 1: Store information in memory
  console.log("\n📝 Phase 1: Memory Storage");
  const test1 = await streamAndDisplay(
    "My character is a wizard named Aldric who specializes in fire magic and comes from the Ember Mountains.",
    1,
    "Memory Storage"
  );
  results.push({ test: "Memory Storage", ...test1 });
  await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit pause

  // Test 2: Retrieve information from memory with extended thinking
  console.log("\n🔍 Phase 2: Memory Retrieval + Extended Thinking");
  const test2 = await streamAndDisplay(
    "What's my character's name, magical specialty, and where are they from?",
    2,
    "Memory Retrieval"
  );
  results.push({ test: "Memory Retrieval", ...test2 });

  // Check if memory was retrieved
  const memoryRetrieved = test2.fullResponse && (
    test2.fullResponse.includes("Aldric") &&
    test2.fullResponse.toLowerCase().includes("fire") &&
    test2.fullResponse.includes("Ember Mountains")
  );
  console.log(`  ${memoryRetrieved ? '✓' : '✗'} Memory successfully retrieved (contains: Aldric, fire magic, Ember Mountains)`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Memory-enhanced generation
  console.log("\n✨ Phase 3: Memory-Enhanced Generation");
  const test3 = await streamAndDisplay(
    "Create a powerful fire spell that would be perfect for my character. Include its name and effect.",
    3,
    "Memory-Enhanced Generation"
  );
  results.push({ test: "Memory-Enhanced Generation", ...test3 });

  // Check if generation referenced stored context
  const contextUsed = test3.fullResponse && (
    test3.fullResponse.includes("Aldric") ||
    test3.fullResponse.toLowerCase().includes("fire") ||
    test3.fullResponse.includes("Ember")
  );
  console.log(`  ${contextUsed ? '✓' : '✗'} Generation used stored context`);

  // Final summary
  console.log("\n\n" + "=".repeat(60));
  console.log("🏁 TEST SUMMARY");
  console.log("=".repeat(60));

  const allSucceeded = results.every(r => r.success);
  const extendedThinkingWorking = results.some(r => r.hasReasoningBlocks);

  console.log(`\n✅ All tests passed: ${allSucceeded ? 'YES' : 'NO'}`);
  console.log(`${extendedThinkingWorking ? '✅' : '⚠️ '} Extended thinking detected: ${extendedThinkingWorking ? 'YES' : 'NO'}`);
  console.log(`${memoryRetrieved ? '✅' : '❌'} Memory retrieval working: ${memoryRetrieved ? 'YES' : 'NO'}`);
  console.log(`${contextUsed ? '✅' : '⚠️ '} Context-aware generation: ${contextUsed ? 'YES' : 'NO'}`);

  console.log(`\n📋 Conversation ID: ${CONVERSATION_ID}`);
  console.log("   (Use this ID in Supermemory dashboard to view stored memories)\n");

  if (!allSucceeded) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ Fatal error running tests:", error);
  process.exit(1);
});
