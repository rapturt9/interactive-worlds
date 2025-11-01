/**
 * Test by calling OpenRouter API directly (bypassing AI SDK)
 * to understand what format it actually expects
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testDirectOpenRouterCall() {
  console.log("🧪 TESTING DIRECT OPENROUTER API CALL\n");
  console.log("=".repeat(80));

  // Test 1: With reasoning content block (from convertToModelMessages)
  const messagesWithReasoning = [
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
      content: [
        {
          type: "reasoning",
          text: "This is simple arithmetic. 2+2 equals 4."
        },
        {
          type: "text",
          text: "The answer is 4!"
        }
      ]
    },
    {
      role: "user",
      content: "Multiply by 3"
    }
  ];

  console.log("\n📋 TEST 1: Messages with type: 'reasoning' (AI SDK format)");
  console.log("=".repeat(80));
  console.log(JSON.stringify(messagesWithReasoning, null, 2));

  try {
    console.log("\n📤 Sending to OpenRouter with extended thinking...\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interactive Worlds Test"
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages: messagesWithReasoning,
        reasoning: { effort: "high" },
        temperature: 0.8,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ TEST 1 FAILED:");
      console.error(JSON.stringify(data, null, 2));
    } else {
      console.log("✅ TEST 1 SUCCESS!");
      console.log("Response:", data.choices[0].message.content.substring(0, 200));
    }
  } catch (error) {
    console.error("❌ TEST 1 ERROR:", error.message);
  }

  console.log("\n" + "=".repeat(80));

  // Test 2: With thinking content block
  const messagesWithThinking = [
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
      content: [
        {
          type: "thinking",
          text: "This is simple arithmetic. 2+2 equals 4."
        },
        {
          type: "text",
          text: "The answer is 4!"
        }
      ]
    },
    {
      role: "user",
      content: "Multiply by 3"
    }
  ];

  console.log("\n📋 TEST 2: Messages with type: 'thinking' (OpenRouter format?)");
  console.log("=".repeat(80));
  console.log(JSON.stringify(messagesWithThinking, null, 2));

  try {
    console.log("\n📤 Sending to OpenRouter with extended thinking...\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interactive Worlds Test"
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages: messagesWithThinking,
        reasoning: { effort: "high" },
        temperature: 0.8,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ TEST 2 FAILED:");
      console.error(JSON.stringify(data, null, 2));
    } else {
      console.log("✅ TEST 2 SUCCESS!");
      console.log("Response:", data.choices[0].message.content.substring(0, 200));
    }
  } catch (error) {
    console.error("❌ TEST 2 ERROR:", error.message);
  }

  console.log("\n" + "=".repeat(80));

  // Test 3: Text part first (the failing case from your logs)
  const messagesTextFirst = [
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
      content: [
        {
          type: "text",
          text: "<thinking>This is simple arithmetic. 2+2 equals 4.</thinking>\n\nThe answer is 4!"
        }
      ]
    },
    {
      role: "user",
      content: "Multiply by 3"
    }
  ];

  console.log("\n📋 TEST 3: Messages with text first (should FAIL)");
  console.log("=".repeat(80));
  console.log(JSON.stringify(messagesTextFirst, null, 2));

  try {
    console.log("\n📤 Sending to OpenRouter with extended thinking...\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interactive Worlds Test"
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages: messagesTextFirst,
        reasoning: { effort: "high" },
        temperature: 0.8,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ TEST 3 FAILED (as expected):");
      console.error(JSON.stringify(data, null, 2));
    } else {
      console.log("✅ TEST 3 SUCCESS! (unexpected)");
      console.log("Response:", data.choices[0].message.content.substring(0, 200));
    }
  } catch (error) {
    console.error("❌ TEST 3 ERROR:", error.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n🏁 TESTS COMPLETE\n");
}

testDirectOpenRouterCall().catch(console.error);
