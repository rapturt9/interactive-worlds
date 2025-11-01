#!/usr/bin/env node

/**
 * Simplified test - only send text in continuation, not tool calls
 * This matches what the AI actually needs to continue
 */

const API_URL = "http://localhost:3000/api/generate-world";

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

// Parse XML tags
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

// Parse stream
async function parseUIMessageStream(response, attemptNum) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let reasoningText = "";
  let toolCallCount = 0;

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
        if (jsonStr === "[DONE]") continue;
        const data = JSON.parse(jsonStr);

        switch (data.type) {
          case "text-delta":
            if (data.delta) fullText += data.delta;
            break;
          case "text":
            if (data.text) fullText += data.text;
            break;
          case "reasoning-delta":
            if (data.delta) reasoningText += data.delta;
            break;
          case "tool-input-available":
            toolCallCount++;
            log(
              colors.blue,
              "🔧",
              `Tool #${toolCallCount}: ${data.toolName}(${JSON.stringify(
                data.input
              )})`
            );
            break;
          case "tool-output-available":
            log(
              colors.green,
              "✅",
              `Result #${toolCallCount}: ${JSON.stringify(data.output)}`
            );
            break;
          case "error":
            log(colors.red, "❌", "Error event");
            break;
          case "finish":
            log(colors.green, "🏁", "Finished");
            break;
        }
      } catch (e) {
        // Skip
      }
    }
  }

  const combinedContent =
    fullText + (reasoningText ? "\n\n" + reasoningText : "");

  console.log(
    `   Text: ${fullText.length} chars, Reasoning: ${reasoningText.length} chars, Tools: ${toolCallCount}`
  );

  return { content: combinedContent, toolCallCount };
}

// Main test
async function testWorldGenerationLoop() {
  console.log(
    "\n" + colors.bright + "🎮 SIMPLIFIED WORLD GENERATION TEST" + colors.reset
  );
  console.log("=".repeat(70) + "\n");

  let attempt = 0;
  const MAX_ATTEMPTS = 5;
  let bible = null;
  let character = null;
  let chatName = null;

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
      // First attempt: send parameters
      // Subsequent attempts: send simple continuation request (no history!)
      const requestBody =
        attempt === 1
          ? {
              modelTier: "budget",
              parameters: {
                genre: "Fantasy",
                setting: "Medieval Kingdom",
                theme: "Coming of Age",
                difficulty: "Medium",
              },
            }
          : {
              modelTier: "budget",
              messages: [
                {
                  role: "user",
                  parts: [
                    {
                      type: "text",
                      text: "Continue generating the world. Output the complete <bible>, <character>, and <chat_name> tags with all content.",
                    },
                  ],
                },
              ],
            };

      log(
        colors.blue,
        "📤",
        attempt === 1
          ? "Sending initial request..."
          : "Sending continuation request..."
      );

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status}\n${errorText}`);
      }

      const result = await parseUIMessageStream(response, attempt);

      // Parse XML
      const parsed = parseXMLTags(result.content);
      if (parsed.bible) bible = parsed.bible;
      if (parsed.character) character = parsed.character;
      if (parsed.chatName) chatName = parsed.chatName;

      console.log("\n" + colors.bright + "📜 Status:" + colors.reset);
      console.log(
        `   Bible: ${
          bible
            ? colors.green + "✅ (" + bible.length + ")" + colors.reset
            : colors.red + "❌" + colors.reset
        }`
      );
      console.log(
        `   Character: ${
          character
            ? colors.green + "✅ (" + character.length + ")" + colors.reset
            : colors.red + "❌" + colors.reset
        }`
      );
      console.log(
        `   Chat name: ${
          chatName
            ? colors.green + '✅ "' + chatName + '"' + colors.reset
            : colors.red + "❌" + colors.reset
        }`
      );

      // Success?
      if (bible && character && chatName) {
        console.log(
          "\n" + colors.green + colors.bright + "✅ SUCCESS!" + colors.reset
        );
        console.log("\n📖 Bible:", bible.substring(0, 300) + "...");
        console.log("\n👤 Character:", character.substring(0, 300) + "...");
        console.log("\n🏷️  Name:", chatName);
        console.log(`\nCompleted in ${attempt} attempt(s)`);
        return { success: true, attempts: attempt };
      }
    } catch (error) {
      log(colors.red, "❌", `Error: ${error.message}`);
      return { success: false, attempts: attempt, error: error.message };
    }
  }

  log(colors.red, "❌", "Max attempts reached");
  return { success: false, attempts: attempt };
}

// Run
testWorldGenerationLoop()
  .then((result) => {
    console.log("\n" + colors.bright + "RESULT:" + colors.reset, result);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    log(colors.red, "💥", "Fatal:");
    console.error(error);
    process.exit(1);
  });
