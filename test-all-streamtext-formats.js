/**
 * Comprehensive test of all message formats with streamText + extended thinking
 *
 * This tests the EXACT same setup as your API routes:
 * - streamText from AI SDK
 * - OpenRouter provider
 * - Extended thinking enabled
 * - Tool definitions
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter("anthropic/claude-haiku-4.5");

// Tool definitions (same as your actual tools)
const tools = {
  random_number_given_min_max: {
    description: 'Generates a random integer between min and max (inclusive)',
    parameters: {
      type: 'object',
      properties: {
        min: { type: 'integer', description: 'Minimum value (inclusive)' },
        max: { type: 'integer', description: 'Maximum value (inclusive)' }
      },
      required: ['min', 'max']
    }
  },
  calculator_pemdas: {
    description: 'Evaluates mathematical expressions following PEMDAS',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Mathematical expression to evaluate' }
      },
      required: ['expression']
    }
  }
};

const providerOptions = {
  openrouter: {
    cacheControl: { type: "ephemeral" },
    reasoning: { effort: "high" }, // Extended thinking enabled!
  },
};

/**
 * Helper to run a test and catch errors
 */
async function runTest(testName, messages, description) {
  console.log("\n" + "=".repeat(80));
  console.log(`📋 ${testName}`);
  console.log("=".repeat(80));
  console.log(description);
  console.log("\n📤 Message structure:");
  messages.forEach((msg, idx) => {
    console.log(`\n[${idx}] ${msg.role}:`);
    if (typeof msg.content === 'string') {
      console.log(`  String content (${msg.content.length} chars)`);
      console.log(`  Preview: ${msg.content.substring(0, 100)}...`);
    } else if (Array.isArray(msg.content)) {
      msg.content.forEach((part, pIdx) => {
        console.log(`  [${pIdx}] type: "${part.type}"`);
        if (part.text) console.log(`      text: ${part.text.substring(0, 60)}...`);
        if (part.toolName) console.log(`      tool: ${part.toolName}`);
      });
    }
    if (msg.reasoning) {
      console.log(`  reasoning attribute: ${msg.reasoning.substring(0, 60)}...`);
    }
    if (msg.tool_calls) {
      console.log(`  tool_calls: ${msg.tool_calls.length} calls`);
    }
  });

  console.log("\n📡 Calling streamText with extended thinking...\n");

  try {
    const result = await streamText({
      model,
      messages,
      tools,
      temperature: 0.8,
      providerOptions,
    });

    console.log("✅✅✅ SUCCESS! streamText accepted this format!");

    // Try to read the stream
    let fullResponse = "";
    let chunkCount = 0;
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      chunkCount++;
    }

    console.log(`\n📥 Stream completed: ${chunkCount} chunks, ${fullResponse.length} chars`);
    if (fullResponse.length > 0) {
      console.log(`Preview: ${fullResponse.substring(0, 150)}...`);
    }

    return { success: true, response: fullResponse };

  } catch (error) {
    console.error("❌❌❌ FAILED!");
    console.error(`Error: ${error.message}`);

    if (error.cause) {
      console.error("\nCause:", JSON.stringify(error.cause, null, 2).substring(0, 500));
    }

    if (error.responseBody) {
      console.error("\nResponse body:", error.responseBody.substring(0, 500));
    }

    return { success: false, error: error.message };
  }
}

/**
 * TEST SUITE
 */
async function runAllTests() {
  console.log("\n🧪 COMPREHENSIVE streamText FORMAT TESTS");
  console.log("Testing with: streamText + OpenRouter + Extended Thinking + Tools\n");

  const results = {};

  // ============================================================================
  // TEST 1: AI SDK reasoning type (what convertToModelMessages produces)
  // ============================================================================
  results.test1 = await runTest(
    "TEST 1: AI SDK 'reasoning' type",
    [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Roll a d20 (1-20) and tell me what happens"
      },
      {
        role: "assistant",
        content: [
          {
            type: "reasoning",
            text: "The user wants me to roll a d20. I'll use the random number tool to generate a number between 1 and 20."
          },
          {
            type: "text",
            text: "Let me roll a d20 for you!"
          },
          {
            type: "tool-call",
            toolCallId: "call_test_1",
            toolName: "random_number_given_min_max",
            args: { min: 1, max: 20 }
          }
        ]
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call_test_1",
            toolName: "random_number_given_min_max",
            result: 15
          }
        ]
      }
    ],
    "This is the EXACT format that convertToModelMessages produces. MUST work!"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // TEST 2: OpenRouter 'thinking' type (transformed)
  // ============================================================================
  results.test2 = await runTest(
    "TEST 2: OpenRouter 'thinking' type",
    [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Roll a d20 (1-20) and tell me what happens"
      },
      {
        role: "assistant",
        content: [
          {
            type: "thinking",  // Changed from 'reasoning'
            text: "The user wants me to roll a d20. I'll use the random number tool."
          },
          {
            type: "text",
            text: "Let me roll a d20 for you!"
          },
          {
            type: "tool-call",
            toolCallId: "call_test_2",
            toolName: "random_number_given_min_max",
            args: { min: 1, max: 20 }
          }
        ]
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call_test_2",
            toolName: "random_number_given_min_max",
            result: 15
          }
        ]
      }
    ],
    "Testing if 'thinking' type works instead of 'reasoning'"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // TEST 3: String content with <thinking> tags
  // ============================================================================
  results.test3 = await runTest(
    "TEST 3: String content with <thinking> tags",
    [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "What is 2+2?"
      },
      {
        role: "assistant",
        content: "<thinking>This is simple arithmetic. 2+2 equals 4.</thinking>\n\nThe answer is 4!"
      },
      {
        role: "user",
        content: "Multiply by 3"
      }
    ],
    "Testing string content with embedded <thinking> tags"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // TEST 4: Jupyter notebook format (top-level reasoning attribute)
  // ============================================================================
  results.test4 = await runTest(
    "TEST 4: Jupyter format - reasoning attribute",
    [
      {
        role: "system",
        content: "You are a game master. Use tools for randomness."
      },
      {
        role: "user",
        content: "I attack the goblin with my sword (damage 10-15). What happens?"
      },
      {
        role: "assistant",
        content: "Exciting! Let me resolve your attack on the goblin.\n\n**Rolling your sword damage:**",
        reasoning: "The user is attacking a goblin. I need to: 1) Roll sword damage (10-15), 2) Narrate what happens, 3) Have goblin counterattack if alive.",
        tool_calls: [
          {
            id: "call_jupyter_1",
            type: "function",
            function: {
              name: "random_number_given_min_max",
              arguments: '{"min": 10, "max": 15}'
            }
          }
        ]
      },
      {
        role: "tool",
        tool_call_id: "call_jupyter_1",
        content: '{"result": 13, "min": 10, "max": 15}'
      }
    ],
    "Testing Jupyter notebook format with top-level 'reasoning' attribute"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // TEST 5: Text-first (should work per our direct API test)
  // ============================================================================
  results.test5 = await runTest(
    "TEST 5: Text part first (no reasoning part)",
    [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Roll a d6"
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Let me roll a d6 for you!"
          },
          {
            type: "tool-call",
            toolCallId: "call_test_5",
            toolName: "random_number_given_min_max",
            args: { min: 1, max: 6 }
          }
        ]
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call_test_5",
            toolName: "random_number_given_min_max",
            result: 4
          }
        ]
      }
    ],
    "Testing text-first without any thinking/reasoning parts"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // TEST 6: YOUR ACTUAL CASE - Multiple tool calls with reasoning
  // ============================================================================
  results.test6 = await runTest(
    "TEST 6: YOUR ACTUAL FAILING CASE - from logs",
    [
      {
        role: "system",
        content: "**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - WORLD GENERATION**\n\nYou are creating an immersive text adventure world. Use tools for ALL randomness."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please generate a world. Use randomness extensively.\n\nOutput in <bible></bible> and <chat_name></chat_name> tags."
          }
        ]
      },
      {
        role: "assistant",
        content: [
          {
            type: "reasoning",
            text: "The user wants me to generate a complete text adventure world. I need to make many random calls for: 1) Universe scale, 2) Number of locations, 3) Power systems, etc. Let me start with foundational parameters."
          },
          {
            type: "text",
            text: "<thinking>\nI'll systematically generate this world using randomness for all major decisions. Let me start with foundational parameters.\n</thinking>"
          },
          {
            type: "tool-call",
            toolCallId: "toolu_01",
            toolName: "random_number_given_min_max",
            args: { min: 1, max: 6 }
          },
          {
            type: "tool-call",
            toolCallId: "toolu_02",
            toolName: "random_number_given_min_max",
            args: { min: 3, max: 8 }
          },
          {
            type: "tool-call",
            toolCallId: "toolu_03",
            toolName: "random_number_given_min_max",
            args: { min: 20, max: 95 }
          }
        ]
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "toolu_01",
            toolName: "random_number_given_min_max",
            result: 3
          },
          {
            type: "tool-result",
            toolCallId: "toolu_02",
            toolName: "random_number_given_min_max",
            result: 5
          },
          {
            type: "tool-result",
            toolCallId: "toolu_03",
            toolName: "random_number_given_min_max",
            result: 70
          }
        ]
      }
    ],
    "THIS IS YOUR EXACT FAILING CASE! Multiple tool calls with reasoning + text parts"
  );

  // ============================================================================
  // RESULTS SUMMARY
  // ============================================================================
  console.log("\n\n" + "=".repeat(80));
  console.log("🏁 TEST RESULTS SUMMARY");
  console.log("=".repeat(80));

  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    const details = result.success
      ? `(${result.response?.length || 0} chars)`
      : `(${result.error})`;
    console.log(`${status} - ${testName} ${details}`);
  });

  console.log("\n" + "=".repeat(80));

  const passCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  console.log(`\nPassed: ${passCount}/${totalCount}`);

  if (passCount === totalCount) {
    console.log("\n🎉 ALL TESTS PASSED! Extended thinking works with streamText!");
  } else {
    console.log("\n⚠️  Some tests failed. See details above.");
  }

  console.log("=".repeat(80) + "\n");
}

// Run all tests
runAllTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
