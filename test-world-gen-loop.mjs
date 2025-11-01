#!/usr/bin/env node

/**
 * Test script for world generation with frontend loop
 * This simulates the frontend loop behavior by making successive API calls
 */

const API_URL = "http://localhost:3000/api/generate-world";

// Simple XML tag parser
function parseXMLTags(content) {
  const bibleMatch = content.match(/<bible>([\s\S]*?)<\/bible>/);
  const characterMatch = content.match(/<character>([\s\S]*?)<\/character>/);
  const chatNameMatch = content.match(/<chat_name>([\s\S]*?)<\/chat_name>/);

  return {
    bible: bibleMatch ? bibleMatch[1] : null,
    character: characterMatch ? characterMatch[1] : null,
    chatName: chatNameMatch ? chatNameMatch[1] : null,
  };
}

// Parse UIMessage stream
async function parseUIMessageStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const allParts = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim() || !line.startsWith("data: ")) continue;

      try {
        const jsonStr = line.slice(6);
        const data = JSON.parse(jsonStr);

        console.log(`📨 Stream event: ${data.type}`);

        switch (data.type) {
          case "text-delta":
            if (data.delta) fullText += data.delta;
            break;
          case "text":
            if (data.text) fullText += data.text;
            break;
          case "reasoning-delta":
            if (data.delta) {
              let reasoningPart = allParts.find((p) => p.type === "reasoning");
              if (!reasoningPart) {
                reasoningPart = { type: "reasoning", text: "" };
                allParts.push(reasoningPart);
              }
              reasoningPart.text += data.delta;
            }
            break;
          case "tool-input-available":
            console.log(
              `🔧 Tool call: ${data.toolName} with input:`,
              data.input
            );
            allParts.push({
              type: `tool-call-${data.toolName}`,
              toolName: data.toolName,
              args: data.input,
              toolCallId: data.toolCallId,
            });
            break;
          case "tool-output-available":
            console.log(
              `✅ Tool result: ${data.toolName} output:`,
              data.output
            );
            allParts.push({
              type: "tool-result",
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              result: data.output,
            });
            break;
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  // Combine text and reasoning
  const reasoningText = allParts
    .filter((p) => p.type === "reasoning")
    .map((p) => p.text || "")
    .join("\n\n");

  const combinedContent =
    fullText + (reasoningText ? "\n\n" + reasoningText : "");

  return { content: combinedContent, parts: allParts };
}

// Main test function
async function testWorldGenerationLoop() {
  console.log("\n🎮 Testing World Generation Loop\n");
  console.log("=".repeat(60));

  const conversationHistory = [];
  const MAX_ATTEMPTS = 10;
  let attempt = 0;
  let bible = null;
  let character = null;
  let chatName = null;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(`\n🔄 Attempt ${attempt}/${MAX_ATTEMPTS}`);
    console.log("-".repeat(60));

    try {
      const requestBody = {
        modelTier: "budget",
        parameters: {
          genre: "Fantasy",
          setting: "Medieval Kingdom",
          theme: "Coming of Age",
          difficulty: "Medium",
        },
        messages:
          conversationHistory.length > 0 ? conversationHistory : undefined,
      };

      console.log("📤 Sending request to API...");
      if (conversationHistory.length > 0) {
        console.log(
          `   Conversation history: ${conversationHistory.length} messages`
        );
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log("📥 Parsing stream...");
      const result = await parseUIMessageStream(response);

      console.log(`\n📊 Stream complete:`);
      console.log(`   Content length: ${result.content.length}`);
      console.log(`   Parts count: ${result.parts.length}`);
      console.log(
        `   Part types: ${result.parts.map((p) => p.type).join(", ")}`
      );

      // Add to conversation history
      conversationHistory.push({
        role: "assistant",
        parts:
          result.parts.length > 0
            ? result.parts
            : [{ type: "text", text: result.content }],
      });

      // Parse XML tags
      const parsed = parseXMLTags(result.content);
      bible = parsed.bible;
      character = parsed.character;
      chatName = parsed.chatName;

      console.log(`\n📜 XML tags found:`);
      console.log(
        `   Bible: ${bible ? "✅ (" + bible.length + " chars)" : "❌"}`
      );
      console.log(
        `   Character: ${
          character ? "✅ (" + character.length + " chars)" : "❌"
        }`
      );
      console.log(`   Chat name: ${chatName ? '✅ "' + chatName + '"' : "❌"}`);

      // Check if we have all required content
      if (bible && character && chatName) {
        console.log("\n✅ SUCCESS! All XML content found!");
        console.log("=".repeat(60));
        console.log(`\n📖 Bible preview:\n${bible.substring(0, 300)}...\n`);
        console.log(
          `👤 Character preview:\n${character.substring(0, 300)}...\n`
        );
        console.log(`🏷️  Chat name: ${chatName}\n`);
        console.log(`Total attempts: ${attempt}`);
        return { success: true, attempts: attempt, bible, character, chatName };
      }

      // Add continuation prompt
      if (attempt < MAX_ATTEMPTS) {
        console.log("\n⚠️  Missing XML content, adding continuation prompt...");
        conversationHistory.push({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please continue and output the complete <bible>, <character>, and <chat_name> content now.",
            },
          ],
        });
      }
    } catch (error) {
      console.error(`\n❌ Error on attempt ${attempt}:`, error.message);
      return { success: false, attempts: attempt, error: error.message };
    }
  }

  console.log("\n❌ FAILED: Max attempts reached without complete content");
  console.log("=".repeat(60));
  return { success: false, attempts: attempt, reason: "Max attempts reached" };
}

// Run the test
testWorldGenerationLoop()
  .then((result) => {
    console.log("\n📊 Test Result:", result);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
