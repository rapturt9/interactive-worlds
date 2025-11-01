/**
 * Test transformation of reasoning → thinking for OpenRouter extended thinking
 *
 * This script tests the exact transformation needed to convert AI SDK's
 * `type: 'reasoning'` parts to OpenRouter's required `type: 'thinking'` format.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter("anthropic/claude-haiku-4.5");

/**
 * Transform reasoning parts to thinking parts for OpenRouter compatibility
 */
function transformReasoningToThinking(messages) {
  return messages.map((msg) => {
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((part) =>
          part.type === 'reasoning' ? { ...part, type: 'thinking' } : part
        )
      };
    }
    return msg;
  });
}

console.log("🧪 TESTING REASONING → THINKING TRANSFORMATION\n");
console.log("=" .repeat(80));

// This is the EXACT message structure from your logs that failed
const failingMessages = [
  {
    "role": "system",
    "content": "**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - WORLD GENERATION**\n\nYou are creating an immersive text adventure world at cosmic scale. Generate the complete world bible and chat name.\n\n**TOOL USAGE:**\nYou MUST use these tools for ALL randomness and calculations:\n- **random_number_given_min_max**: For ALL random values\n- **random_choice_with_weights**: For ALL weighted selections\n- **calculator_pemdas**: For ALL mathematical calculations"
  },
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Please generate a complete world and starting character with these specifications:\n\n**Genre:** Any\n**Setting:** Any\n**Theme:** Any\n**Difficulty:** Medium\n\nPlease use randomness to generate the sections of the complete story bible.\n\nOutput the complete bible in <bible></bible> tags,  and a short descriptive name in <chat_name></chat_name> tags."
      }
    ]
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "reasoning",
        "text": "The user wants me to generate a complete text adventure world with a starting character. Let me start with world generation using randomness."
      },
      {
        "type": "text",
        "text": "<thinking>\nI'll systematically generate this world using randomness for all major decisions.\n</thinking>"
      },
      {
        "type": "tool-call",
        "toolCallId": "toolu_test_01",
        "toolName": "random_number_given_min_max",
        "input": {
          "min": 1,
          "max": 6
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": [
      {
        "type": "tool-result",
        "toolCallId": "toolu_test_01",
        "toolName": "random_number_given_min_max",
        "output": {
          "type": "json",
          "value": {
            "result": 3,
            "min": 1,
            "max": 6
          }
        }
      }
    ]
  }
];

console.log("\n📋 ORIGINAL MESSAGES (AI SDK format with 'reasoning'):");
console.log("=" .repeat(80));
failingMessages.forEach((msg, idx) => {
  console.log(`\n[${idx}] ${msg.role}:`);
  if (Array.isArray(msg.content)) {
    msg.content.forEach((part, pIdx) => {
      console.log(`  [${pIdx}] type: "${part.type}"`);
      if (part.text) {
        console.log(`      text preview: ${part.text.substring(0, 60)}...`);
      }
    });
  } else {
    console.log(`  string content (length: ${msg.content.length})`);
  }
});

console.log("\n\n🔄 APPLYING TRANSFORMATION...\n");

const transformedMessages = transformReasoningToThinking(failingMessages);

console.log("✅ TRANSFORMED MESSAGES (OpenRouter format with 'thinking'):");
console.log("=" .repeat(80));
transformedMessages.forEach((msg, idx) => {
  console.log(`\n[${idx}] ${msg.role}:`);
  if (Array.isArray(msg.content)) {
    msg.content.forEach((part, pIdx) => {
      console.log(`  [${pIdx}] type: "${part.type}"`);
      if (part.text) {
        console.log(`      text preview: ${part.text.substring(0, 60)}...`);
      }
    });
  } else {
    console.log(`  string content (length: ${msg.content.length})`);
  }
});

console.log("\n\n🚀 TESTING WITH OPENROUTER...");
console.log("=" .repeat(80));

async function testTransformation() {
  try {
    console.log("\n📤 Sending transformed messages to OpenRouter with extended thinking...\n");

    const result = await streamText({
      model,
      messages: transformedMessages,
      tools: {
        random_number_given_min_max: {
          description: 'Generate a random number',
          parameters: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            },
            required: ['min', 'max']
          },
          execute: async ({ min, max }) => {
            return { result: Math.floor(Math.random() * (max - min + 1)) + min };
          }
        }
      },
      temperature: 0.9,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
        },
      },
    });

    console.log("✅✅✅ SUCCESS! OpenRouter accepted the transformed messages!");
    console.log("\n📥 Streaming response...\n");

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      process.stdout.write(chunk);
    }

    console.log("\n\n✅ Stream completed successfully!");
    console.log(`\nFull response length: ${fullResponse.length} characters`);

    return true;

  } catch (error) {
    console.error("\n❌❌❌ FAILED!");
    console.error("Error:", error.message);

    if (error.cause) {
      console.error("\nCause:");
      console.error(JSON.stringify(error.cause, null, 2));
    }

    if (error.responseBody) {
      console.error("\nResponse body:");
      console.error(error.responseBody);
    }

    return false;
  }
}

// Run the test
testTransformation().then((success) => {
  console.log("\n" + "=".repeat(80));
  if (success) {
    console.log("🎉 TRANSFORMATION WORKS! Ready to apply to API routes.");
  } else {
    console.log("❌ TRANSFORMATION FAILED! Need to investigate further.");
  }
  console.log("=".repeat(80) + "\n");
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
