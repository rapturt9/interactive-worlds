#!/usr/bin/env node

/**
 * Multi-turn generation test
 * Handles tool calls across multiple turns with proper conversation history
 */

const WORLD_API_URL = "http://localhost:3000/api/generate-world";

const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color, prefix, msg) {
  console.log(`${color}${prefix}${c.reset} ${msg}`);
}

function parseXML(content) {
  const bible = content.match(/<bible>([\s\S]*?)<\/bible>/)?.[1];
  const character = content.match(/<character>([\s\S]*?)<\/character>/)?.[1];
  const chatName = content.match(/<chat_name>([\s\S]*?)<\/chat_name>/)?.[1];
  return { bible, character, chatName };
}

async function parseStream(response, turn) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const parts = [];

  log(c.cyan, "📥", `Parsing turn ${turn} stream...`);

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
          case "tool-input-available":
            const toolCall = {
              type: "tool-call",
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              args: data.input,
            };
            parts.push(toolCall);
            log(
              c.magenta,
              `🔧 #${parts.filter((p) => p.type === "tool-call").length}`,
              `${data.toolName}(${JSON.stringify(data.input)})`
            );
            break;
          case "tool-output-available":
            const toolResult = {
              type: "tool-result",
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              result: data.output,
            };
            parts.push(toolResult);
            log(c.green, `✅ Result`, `${JSON.stringify(data.output)}`);
            break;
          case "finish":
            log(c.green, "🏁", "Stream finished");
            break;
        }
      } catch (e) {
        // Skip
      }
    }
  }

  // Add text part if we have text
  if (fullText) {
    parts.unshift({ type: "text", text: fullText });
  }

  const toolCalls = parts.filter((p) => p.type === "tool-call").length;
  const toolResults = parts.filter((p) => p.type === "tool-result").length;

  console.log(`\n${c.bright}📊 Turn ${turn} Summary:${c.reset}`);
  console.log(`   Text: ${fullText.length} chars`);
  console.log(
    `   Parts: ${parts.length} (${toolCalls} calls, ${toolResults} results)`
  );
  console.log(
    `   Has text output: ${
      fullText.length > 0 ? c.green + "YES" + c.reset : c.red + "NO" + c.reset
    }`
  );

  return { content: fullText, parts };
}

async function testMultiTurnGeneration() {
  console.log(`\n${c.bright}🎮 MULTI-TURN WORLD GENERATION TEST${c.reset}`);
  console.log("=".repeat(70) + "\n");

  const parameters = {
    genre: "Fantasy",
    setting: "Medieval Kingdom",
    theme: "Coming of Age",
    difficulty: "Medium",
  };

  const conversationHistory = [];
  const MAX_TURNS = 10;
  let turn = 0;

  try {
    while (turn < MAX_TURNS) {
      turn++;
      console.log(
        `\n${c.bright}${c.blue}━━━ TURN ${turn}/${MAX_TURNS} ━━━${c.reset}\n`
      );

      const requestBody =
        turn === 1
          ? { modelTier: "budget", parameters }
          : { modelTier: "budget", messages: conversationHistory };

      if (turn > 1) {
        log(
          c.cyan,
          "📚",
          `Sending ${conversationHistory.length} messages in history`
        );
        console.log("   History structure:");
        conversationHistory.forEach((msg, idx) => {
          const partTypes = msg.parts.map((p) => p.type).join(", ");
          console.log(
            `   [${idx}] ${msg.role}: ${msg.parts.length} parts (${partTypes})`
          );
        });
      }

      log(c.blue, "📤", `Sending turn ${turn} request...`);

      const response = await fetch(WORLD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status}\n${errorText}`);
      }

      const result = await parseStream(response, turn);

      // Add assistant response to conversation history
      conversationHistory.push({
        role: "assistant",
        parts:
          result.parts.length > 0
            ? result.parts
            : [{ type: "text", text: result.content }],
      });

      // Check if we have the final output
      const parsed = parseXML(result.content);

      console.log(`\n${c.bright}📜 XML Status:${c.reset}`);
      console.log(
        `   Bible: ${
          parsed.bible
            ? c.green + "✅ (" + parsed.bible.length + ")" + c.reset
            : c.red + "❌" + c.reset
        }`
      );
      console.log(
        `   Chat name: ${
          parsed.chatName
            ? c.green + '✅ "' + parsed.chatName + '"' + c.reset
            : c.red + "❌" + c.reset
        }`
      );

      if (parsed.bible && parsed.chatName) {
        console.log(
          `\n${c.green}${c.bright}✅ WORLD GENERATION COMPLETE!${c.reset}`
        );
        console.log("=".repeat(70));
        console.log(`\n${c.bright}Results:${c.reset}`);
        console.log(`   Turns needed: ${turn}`);
        console.log(`   Chat name: ${parsed.chatName}`);
        console.log(`   Bible: ${parsed.bible.length} chars`);

        console.log(`\n${c.bright}📖 Bible Preview:${c.reset}`);
        console.log(parsed.bible.substring(0, 500) + "...\n");

        // Count total tool calls
        const totalToolCalls = conversationHistory.reduce((sum, msg) => {
          return sum + msg.parts.filter((p) => p.type === "tool-call").length;
        }, 0);

        console.log(`${c.bright}Tool Usage:${c.reset}`);
        console.log(`   Total tool calls across all turns: ${totalToolCalls}`);

        return {
          success: true,
          turns: turn,
          chatName: parsed.chatName,
          bible: parsed.bible,
          totalToolCalls,
        };
      }

      // If no text output but we have tool calls, add continuation prompt
      if (result.content.length === 0 && result.parts.length > 0) {
        log(
          c.yellow,
          "⚠️",
          "Tool calls completed, adding continuation prompt..."
        );

        // Add a user message to prompt continuation
        conversationHistory.push({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Continue with the world generation. Output the complete <bible> and <chat_name> tags now using the tool results above.",
            },
          ],
        });

        continue;
      }

      // If we have some text but no XML tags, add continuation prompt
      if (result.content.length > 0 && !parsed.bible) {
        log(
          c.yellow,
          "⚠️",
          "Got text but no XML tags, adding continuation prompt..."
        );
        console.log("Text preview:", result.content.substring(0, 200));

        conversationHistory.push({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Continue with the world generation. Output the complete <bible> and <chat_name> tags now using the tool results above.",
            },
          ],
        });

        continue;
      }
    }

    throw new Error(`Max turns (${MAX_TURNS}) reached without completion`);
  } catch (error) {
    log(c.red, "💥", "Error:");
    console.error(error);
    return { success: false, error: error.message };
  }
}

testMultiTurnGeneration()
  .then((result) => {
    console.log(`\n${c.bright}📊 FINAL RESULT:${c.reset}`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    log(c.red, "💥", "Fatal:");
    console.error(error);
    process.exit(1);
  });
