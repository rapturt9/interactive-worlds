/**
 * Test script for debugging extended thinking message formats
 * Run with: node test-api-formats.js
 *
 * This script tests different message formats to identify what works
 * with OpenRouter's extended thinking feature.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Test model with extended thinking support
const model = openrouter("anthropic/claude-sonnet-4.5");

// System prompt for all tests
const SYSTEM_PROMPT = "You are a helpful assistant. Think carefully before responding.";

/**
 * Test 1: String content with <thinking> tags (Jupyter notebook format - KNOWN WORKING)
 */
async function test1_StringContentWithThinkingTags() {
  console.log("\n========================================");
  console.log("TEST 1: String content with <thinking> tags");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
    {
      role: "assistant",
      content: "<thinking>This is a simple arithmetic problem. 2+2 equals 4.</thinking>\n\nThe answer is 4!",
    },
    {
      role: "user",
      content: "Now multiply that by 3",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - String content with <thinking> tags works!");

    // Read the stream
    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Test 2: Array content with type: 'thinking'
 */
async function test2_ArrayContentWithThinkingType() {
  console.log("\n========================================");
  console.log("TEST 2: Array content with type: 'thinking'");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
    {
      role: "assistant",
      content: [
        {
          type: "thinking",
          text: "This is a simple arithmetic problem. 2+2 equals 4.",
        },
        {
          type: "text",
          text: "The answer is 4!",
        },
      ],
    },
    {
      role: "user",
      content: "Now multiply that by 3",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - Array content with type: 'thinking' works!");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Test 3: Array content with type: 'reasoning' (what our code currently produces)
 */
async function test3_ArrayContentWithReasoningType() {
  console.log("\n========================================");
  console.log("TEST 3: Array content with type: 'reasoning'");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
    {
      role: "assistant",
      content: [
        {
          type: "reasoning",
          text: "This is a simple arithmetic problem. 2+2 equals 4.",
        },
        {
          type: "text",
          text: "The answer is 4!",
        },
      ],
    },
    {
      role: "user",
      content: "Now multiply that by 3",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - Array content with type: 'reasoning' works!");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Test 4: String content with reasoning attribute
 */
async function test4_StringContentWithReasoningAttribute() {
  console.log("\n========================================");
  console.log("TEST 4: String content with reasoning attribute");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
    {
      role: "assistant",
      content: "The answer is 4!",
      reasoning: "This is a simple arithmetic problem. 2+2 equals 4.",
    },
    {
      role: "user",
      content: "Now multiply that by 3",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - String content with reasoning attribute works!");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Test 5: Array content with text type only (no thinking/reasoning)
 */
async function test5_ArrayContentTextOnly() {
  console.log("\n========================================");
  console.log("TEST 5: Array content with text type only");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
    {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "The answer is 4!",
        },
      ],
    },
    {
      role: "user",
      content: "Now multiply that by 3",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - Array content with text only works!");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Test 6: Simulating convertToModelMessages output with tool calls
 */
async function test6_ConvertToModelMessagesFormat() {
  console.log("\n========================================");
  console.log("TEST 6: convertToModelMessages format with tool calls");
  console.log("========================================");

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "Generate a random number between 1 and 10",
    },
    {
      role: "assistant",
      content: [
        {
          type: "reasoning",
          text: "I'll use the random number tool to generate a number.",
        },
        {
          type: "tool-call",
          toolCallId: "call_123",
          toolName: "random_number",
          args: { min: 1, max: 10 },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call_123",
          toolName: "random_number",
          result: 7,
        },
      ],
    },
    {
      role: "user",
      content: "Double that number",
    },
  ];

  console.log("📤 Sending messages:");
  console.log(JSON.stringify(messages, null, 2));

  try {
    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅ SUCCESS - convertToModelMessages format works!");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }
    console.log("📥 Response preview:", fullResponse.substring(0, 200));

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("\n🧪 STARTING EXTENDED THINKING FORMAT TESTS");
  console.log("==========================================\n");
  console.log("Testing different message formats with OpenRouter extended thinking\n");

  await test1_StringContentWithThinkingTags();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

  await test2_ArrayContentWithThinkingType();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await test3_ArrayContentWithReasoningType();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await test4_StringContentWithReasoningAttribute();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await test5_ArrayContentTextOnly();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await test6_ConvertToModelMessagesFormat();

  console.log("\n\n🏁 ALL TESTS COMPLETED");
  console.log("==========================================");
  console.log("\nSummary:");
  console.log("- Check which formats succeeded (✅) vs failed (❌)");
  console.log("- Use the working format in our API routes");
  console.log("- Update message transformation logic accordingly\n");
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
