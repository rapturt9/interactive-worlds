/**
 * Test what convertToModelMessages actually outputs
 */

import { convertToModelMessages } from "ai";

// Simulate a UIMessage with reasoning/thinking from the AI
const uiMessages = [
  {
    id: "msg-1",
    role: "user",
    parts: [
      {
        type: "text",
        text: "What is 2+2?",
      },
    ],
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [
      {
        type: "reasoning",
        text: "This is simple arithmetic. 2+2 equals 4.",
      },
      {
        type: "text",
        text: "The answer is 4!",
      },
    ],
  },
  {
    id: "msg-3",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Multiply by 3",
      },
    ],
  },
];

console.log("🔍 INPUT UIMessages:");
console.log(JSON.stringify(uiMessages, null, 2));

console.log("\n🔄 Converting with convertToModelMessages...\n");

const converted = convertToModelMessages(uiMessages);

console.log("✅ OUTPUT ModelMessages:");
console.log(JSON.stringify(converted, null, 2));

console.log("\n📊 Analysis:");
converted.forEach((msg, idx) => {
  console.log(`\nMessage ${idx}:`);
  console.log(`  Role: ${msg.role}`);
  console.log(`  Content type: ${typeof msg.content}`);
  if (Array.isArray(msg.content)) {
    console.log(`  Content parts: ${msg.content.length}`);
    msg.content.forEach((part, pIdx) => {
      console.log(`    [${pIdx}] type: ${part.type}`);
    });
  }
});
