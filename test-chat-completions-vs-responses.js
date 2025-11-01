/**
 * Test the difference between:
 * 1. /api/v1/chat/completions (what streamText uses)
 * 2. /api/v1/responses (what your Jupyter notebook uses)
 *
 * This will show us which endpoint supports extended thinking with tool calls
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Test messages with tool call continuation
const messages = [
  {
    role: "system",
    content: "You are a helpful assistant. Use tools for randomness."
  },
  {
    role: "user",
    content: "Roll a d20"
  },
  {
    role: "assistant",
    content: "Let me roll a d20 for you!",
    reasoning: "I'll use the random number tool to generate 1-20",
    tool_calls: [
      {
        id: "call_1",
        type: "function",
        function: {
          name: "random_number_given_min_max",
          arguments: '{"min": 1, "max": 20}'
        }
      }
    ]
  },
  {
    role: "tool",
    tool_call_id: "call_1",
    content: '{"result": 15}'
  }
];

const tools = [
  {
    type: "function",
    function: {
      name: "random_number_given_min_max",
      description: "Generate random number",
      parameters: {
        type: "object",
        properties: {
          min: { type: "integer" },
          max: { type: "integer" }
        },
        required: ["min", "max"]
      }
    }
  }
];

console.log("🧪 TESTING TWO OPENROUTER ENDPOINTS\n");
console.log("=".repeat(80));

/**
 * TEST 1: Chat Completions API (what streamText uses)
 */
async function testChatCompletions() {
  console.log("\n📋 TEST 1: /api/v1/chat/completions (streamText endpoint)");
  console.log("=".repeat(80));

  const payload = {
    model: "anthropic/claude-haiku-4.5",
    messages: messages,
    tools: tools,
    reasoning: { effort: "high" },  // Extended thinking
    temperature: 0.8,
    stream: false
  };

  console.log("\n📤 Payload:");
  console.log(JSON.stringify(payload, null, 2).substring(0, 800) + "...");

  try {
    console.log("\n📡 Calling /api/v1/chat/completions...\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interactive Worlds Test"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ FAILED!");
      console.error("Status:", response.status);
      console.error("Error:", JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    console.log("✅ SUCCESS!");
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
    return { success: true, data };

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TEST 2: Responses API (what Jupyter notebook uses)
 */
async function testResponsesAPI() {
  console.log("\n\n📋 TEST 2: /api/v1/responses (Jupyter notebook endpoint)");
  console.log("=".repeat(80));

  // Convert to Responses API format
  const payload = {
    model: "anthropic/claude-haiku-4.5",
    input: messages.map(msg => ({
      type: "message",
      role: msg.role,
      content: typeof msg.content === 'string'
        ? [{ type: msg.role === 'tool' ? 'tool_result' : 'input_text', text: msg.content }]
        : msg.content,
      ...(msg.reasoning && { reasoning: msg.reasoning }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
    })),
    reasoning: { effort: "high" },
    max_output_tokens: 2000,
    stream: false
  };

  console.log("\n📤 Payload:");
  console.log(JSON.stringify(payload, null, 2).substring(0, 800) + "...");

  try {
    console.log("\n📡 Calling /api/v1/responses...\n");

    const response = await fetch("https://openrouter.ai/api/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interactive Worlds Test"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ FAILED!");
      console.error("Status:", response.status);
      console.error("Error:", JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    console.log("✅ SUCCESS!");
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
    return { success: true, data };

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run both tests
 */
async function runComparison() {
  const result1 = await testChatCompletions();
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result2 = await testResponsesAPI();

  console.log("\n\n" + "=".repeat(80));
  console.log("🏁 COMPARISON RESULTS");
  console.log("=".repeat(80));

  console.log("\nChat Completions API (/api/v1/chat/completions):");
  console.log(result1.success ? "  ✅ WORKS" : "  ❌ FAILS");

  console.log("\nResponses API (/api/v1/responses):");
  console.log(result2.success ? "  ✅ WORKS" : "  ❌ FAILS");

  console.log("\n" + "=".repeat(80));

  if (!result1.success && result2.success) {
    console.log("\n🎯 CONCLUSION:");
    console.log("   Extended thinking works with /responses but NOT /chat/completions!");
    console.log("   streamText uses /chat/completions, which may not support extended thinking.");
    console.log("\n💡 SOLUTION:");
    console.log("   Either:");
    console.log("   1. Use /responses endpoint directly (bypass streamText)");
    console.log("   2. Disable extended thinking for streamText");
    console.log("   3. Check if OpenRouter SDK has a flag to use /responses");
  } else if (result1.success && result2.success) {
    console.log("\n🎯 CONCLUSION:");
    console.log("   Both endpoints support extended thinking!");
    console.log("   The issue must be in how streamText formats the messages.");
  } else if (result1.success && !result2.success) {
    console.log("\n🎯 CONCLUSION:");
    console.log("   Chat Completions works but Responses doesn't.");
    console.log("   Unexpected - Jupyter should work with /responses!");
  } else {
    console.log("\n🎯 CONCLUSION:");
    console.log("   Both endpoints failed. The message format might be wrong.");
  }

  console.log("=".repeat(80) + "\n");
}

runComparison().catch(console.error);
