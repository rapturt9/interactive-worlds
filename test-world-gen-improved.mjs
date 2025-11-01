#!/usr/bin/env node

/**
 * Improved test script for world generation with frontend loop
 * Includes detailed debugging and proper UIMessage format handling
 */

const API_URL = "http://localhost:3000/api/generate-world";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

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

// Parse UIMessage stream with detailed logging
async function parseUIMessageStream(response, attemptNum) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const allParts = [];

  // Track event counts
  const eventCounts = {};
  let toolCallCount = 0;
  let toolResultCount = 0;

  log(colors.cyan, "📥", `Parsing stream for attempt ${attemptNum}...`);

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

        // Count event types
        eventCounts[data.type] = (eventCounts[data.type] || 0) + 1;

        switch (data.type) {
          case "text-delta":
            if (data.delta) {
              fullText += data.delta;
            }
            break;

          case "text":
            if (data.text) {
              fullText += data.text;
            }
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
            toolCallCount++;
            log(
              colors.magenta,
              "🔧",
              `Tool call #${toolCallCount}: ${data.toolName}`
            );
            console.log("   Input:", JSON.stringify(data.input, null, 2));

            allParts.push({
              type: "tool-call",
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              args: data.input,
            });
            break;

          case "tool-output-available":
            toolResultCount++;
            log(
              colors.green,
              "✅",
              `Tool result #${toolResultCount}: ${data.toolName}`
            );
            console.log("   Output:", JSON.stringify(data.output, null, 2));

            allParts.push({
              type: "tool-result",
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              result: data.output,
            });
            break;

          case "error":
            log(colors.red, "❌", "Error event received");
            if (data.error) {
              console.log(
                "   Error details:",
                JSON.stringify(data.error, null, 2)
              );
            }
            break;

          case "finish":
            log(colors.green, "🏁", "Stream finished");
            if (data.finishReason) {
              console.log("   Finish reason:", data.finishReason);
            }
            break;
        }
      } catch (e) {
        log(colors.yellow, "⚠️", `Failed to parse SSE line: ${e.message}`);
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

  // Summary
  console.log("\n" + colors.bright + "📊 Stream Summary:" + colors.reset);
  console.log(`   Event counts:`, eventCounts);
  console.log(`   Tool calls: ${toolCallCount}`);
  console.log(`   Tool results: ${toolResultCount}`);
  console.log(`   Content length: ${combinedContent.length} chars`);
  console.log(
    `   Parts: ${allParts.length} (${allParts.map((p) => p.type).join(", ")})`
  );
  console.log(`   Text length: ${fullText.length} chars`);
  console.log(`   Reasoning length: ${reasoningText.length} chars`);

  return { content: combinedContent, parts: allParts };
}

// Convert our parts format to proper UIMessage format for API
function convertPartsToUIMessage(parts) {
  const uiParts = [];

  for (const part of parts) {
    if (part.type === "text") {
      uiParts.push({
        type: "text",
        text: part.text,
      });
    } else if (part.type === "reasoning") {
      // Reasoning is not a standard UIMessage part, include as text
      uiParts.push({
        type: "text",
        text: part.text,
      });
    } else if (part.type === "tool-call") {
      uiParts.push({
        type: "tool-call",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
      });
    } else if (part.type === "tool-result") {
      uiParts.push({
        type: "tool-result",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        result: part.result,
      });
    }
  }

  return uiParts;
}

// Main test function
async function testWorldGenerationLoop() {
  console.log(
    "\n" + colors.bright + "🎮 WORLD GENERATION LOOP TEST" + colors.reset
  );
  console.log("=".repeat(70) + "\n");

  const conversationHistory = [];
  const MAX_ATTEMPTS = 10;
  let attempt = 0;
  let bible = null;
  let character = null;
  let chatName = null;
  let allResponses = [];

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(
      "\n" +
        colors.bright +
        `🔄 ATTEMPT ${attempt}/${MAX_ATTEMPTS}` +
        colors.reset
    );
    console.log("-".repeat(70));

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

      log(colors.blue, "📤", "Sending request to API...");
      if (conversationHistory.length > 0) {
        log(
          colors.blue,
          "📚",
          `Conversation history: ${conversationHistory.length} messages`
        );

        // Debug: Show conversation structure
        console.log(
          "\n" + colors.cyan + "Conversation structure:" + colors.reset
        );
        conversationHistory.forEach((msg, idx) => {
          console.log(
            `   [${idx}] ${msg.role}: ${
              msg.parts ? msg.parts.length + " parts" : "no parts"
            }`
          );
          if (msg.parts) {
            msg.parts.forEach((part, pIdx) => {
              console.log(
                `       [${pIdx}] ${part.type}${
                  part.toolName ? ` (${part.toolName})` : ""
                }`
              );
            });
          }
        });
        console.log("");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API error: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const result = await parseUIMessageStream(response, attempt);
      allResponses.push(result);

      // Add to conversation history using proper UIMessage format
      if (result.parts.length > 0) {
        conversationHistory.push({
          role: "assistant",
          parts: convertPartsToUIMessage(result.parts),
        });
      } else if (result.content.length > 0) {
        conversationHistory.push({
          role: "assistant",
          parts: [
            {
              type: "text",
              text: result.content,
            },
          ],
        });
      }

      // Parse XML tags from the combined content
      const parsed = parseXMLTags(result.content);

      // Update our findings (accumulate across attempts if needed)
      if (parsed.bible) bible = parsed.bible;
      if (parsed.character) character = parsed.character;
      if (parsed.chatName) chatName = parsed.chatName;

      console.log(
        "\n" + colors.bright + "📜 XML Content Status:" + colors.reset
      );
      console.log(
        `   Bible: ${
          bible
            ? colors.green + "✅ (" + bible.length + " chars)" + colors.reset
            : colors.red + "❌ Missing" + colors.reset
        }`
      );
      console.log(
        `   Character: ${
          character
            ? colors.green +
              "✅ (" +
              character.length +
              " chars)" +
              colors.reset
            : colors.red + "❌ Missing" + colors.reset
        }`
      );
      console.log(
        `   Chat name: ${
          chatName
            ? colors.green + '✅ "' + chatName + '"' + colors.reset
            : colors.red + "❌ Missing" + colors.reset
        }`
      );

      // Check if we have all required content
      if (bible && character && chatName) {
        console.log(
          "\n" +
            colors.green +
            colors.bright +
            "✅ SUCCESS! All XML content found!" +
            colors.reset
        );
        console.log("=".repeat(70));

        // Show previews
        console.log("\n" + colors.bright + "📖 Bible Preview:" + colors.reset);
        console.log(bible.substring(0, 400) + "...\n");

        console.log(colors.bright + "👤 Character Preview:" + colors.reset);
        console.log(character.substring(0, 400) + "...\n");

        console.log(
          colors.bright +
            "🏷️  Chat Name:" +
            colors.reset +
            " " +
            chatName +
            "\n"
        );

        console.log(colors.green + `Total attempts: ${attempt}` + colors.reset);
        return { success: true, attempts: attempt, bible, character, chatName };
      }

      // Add continuation prompt
      if (attempt < MAX_ATTEMPTS) {
        log(
          colors.yellow,
          "⚠️",
          "Missing XML content, adding continuation prompt..."
        );
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
      log(colors.red, "❌", `Error on attempt ${attempt}:`);
      console.error(error);
      return { success: false, attempts: attempt, error: error.message };
    }
  }

  log(
    colors.red,
    "❌",
    "FAILED: Max attempts reached without complete content"
  );
  console.log("=".repeat(70));
  return { success: false, attempts: attempt, reason: "Max attempts reached" };
}

// Run the test
testWorldGenerationLoop()
  .then((result) => {
    console.log("\n" + colors.bright + "📊 FINAL RESULT:" + colors.reset);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    log(colors.red, "💥", "FATAL ERROR:");
    console.error(error);
    process.exit(1);
  });
