#!/usr/bin/env node

/**
 * Test script for two-phase world generation
 * Phase 1: Generate world bible and chat name
 * Phase 2: Generate character and local context with the bible
 */

const WORLD_API_URL = "http://localhost:3000/api/generate-world";
const CHARACTER_API_URL = "http://localhost:3000/api/generate-character";

// Colors
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

function log(color, prefix, message) {
  console.log(`${color}${prefix}${c.reset} ${message}`);
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

// Parse stream with comprehensive logging
async function parseStream(response, phaseName) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let reasoningText = "";

  const toolCalls = [];
  const toolResults = [];

  log(c.cyan, "📥", `Parsing ${phaseName} stream...`);

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
            toolCalls.push({
              id: data.toolCallId,
              name: data.toolName,
              input: data.input,
            });
            log(
              c.magenta,
              `🔧 Tool #${toolCalls.length}`,
              `${data.toolName}(${JSON.stringify(data.input)})`
            );
            break;
          case "tool-output-available":
            toolResults.push({
              id: data.toolCallId,
              name: data.toolName,
              output: data.output,
            });
            log(
              c.green,
              `✅ Result #${toolResults.length}`,
              `${JSON.stringify(data.output)}`
            );
            break;
          case "error":
            log(c.red, "❌", "Error event");
            if (data.error) console.log("   Details:", data.error);
            break;
          case "finish":
            log(c.green, "🏁", `${phaseName} finished`);
            if (data.finishReason) console.log("   Reason:", data.finishReason);
            break;
        }
      } catch (e) {
        // Skip
      }
    }
  }

  const combinedContent =
    fullText + (reasoningText ? "\n\n" + reasoningText : "");

  console.log(`\n${c.bright}📊 ${phaseName} Summary:${c.reset}`);
  console.log(`   Text: ${fullText.length} chars`);
  console.log(`   Reasoning: ${reasoningText.length} chars`);
  console.log(`   Tool calls: ${toolCalls.length}`);
  console.log(`   Tool results: ${toolResults.length}`);
  console.log(`   Total content: ${combinedContent.length} chars`);

  return { content: combinedContent, toolCalls, toolResults };
}

// Main test
async function testTwoPhaseGeneration() {
  console.log(`\n${c.bright}🎮 TWO-PHASE WORLD GENERATION TEST${c.reset}`);
  console.log("=".repeat(70) + "\n");

  const parameters = {
    genre: "Fantasy",
    setting: "Medieval Kingdom",
    theme: "Coming of Age",
    difficulty: "Medium",
  };

  try {
    // ========== PHASE 1: WORLD GENERATION ==========
    console.log(
      `\n${c.bright}${c.blue}━━━ PHASE 1: WORLD GENERATION ━━━${c.reset}\n`
    );

    log(c.blue, "📤", "Sending world generation request...");

    const worldResponse = await fetch(WORLD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelTier: "budget",
        parameters,
      }),
    });

    if (!worldResponse.ok) {
      const errorText = await worldResponse.text();
      throw new Error(`World API error: ${worldResponse.status}\n${errorText}`);
    }

    const worldResult = await parseStream(worldResponse, "World Generation");

    // Parse world generation output
    const worldParsed = parseXMLTags(worldResult.content);

    console.log(`\n${c.bright}📜 Phase 1 Results:${c.reset}`);
    console.log(
      `   Bible: ${
        worldParsed.bible
          ? c.green + "✅ (" + worldParsed.bible.length + " chars)" + c.reset
          : c.red + "❌" + c.reset
      }`
    );
    console.log(
      `   Chat name: ${
        worldParsed.chatName
          ? c.green + '✅ "' + worldParsed.chatName + '"' + c.reset
          : c.red + "❌" + c.reset
      }`
    );

    if (!worldParsed.bible || !worldParsed.chatName) {
      throw new Error("Phase 1 failed: Missing bible or chat name");
    }

    console.log(`\n${c.bright}📖 Bible Preview:${c.reset}`);
    console.log(worldParsed.bible.substring(0, 400) + "...\n");

    console.log(
      `${c.bright}🏷️  Chat Name:${c.reset} ${worldParsed.chatName}\n`
    );

    // Log all tool calls from phase 1
    console.log(
      `${c.bright}🔧 Phase 1 Tool Calls (${worldResult.toolCalls.length}):${c.reset}`
    );
    worldResult.toolCalls.forEach((call, idx) => {
      console.log(`   ${idx + 1}. ${call.name}: ${JSON.stringify(call.input)}`);
    });

    // ========== PHASE 2: CHARACTER GENERATION ==========
    console.log(
      `\n${c.bright}${c.magenta}━━━ PHASE 2: CHARACTER GENERATION ━━━${c.reset}\n`
    );

    log(c.magenta, "📤", "Sending character generation request...");
    log(
      c.cyan,
      "📚",
      `Passing bible (${worldParsed.bible.length} chars) to character generation`
    );

    const characterResponse = await fetch(CHARACTER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelTier: "budget",
        worldBible: worldParsed.bible,
        parameters,
      }),
    });

    if (!characterResponse.ok) {
      const errorText = await characterResponse.text();
      throw new Error(
        `Character API error: ${characterResponse.status}\n${errorText}`
      );
    }

    const characterResult = await parseStream(
      characterResponse,
      "Character Generation"
    );

    // Parse character generation output
    const characterParsed = parseXMLTags(characterResult.content);

    console.log(`\n${c.bright}📜 Phase 2 Results:${c.reset}`);
    console.log(
      `   Bible (with local): ${
        characterParsed.bible
          ? c.green +
            "✅ (" +
            characterParsed.bible.length +
            " chars)" +
            c.reset
          : c.red + "❌" + c.reset
      }`
    );
    console.log(
      `   Character: ${
        characterParsed.character
          ? c.green +
            "✅ (" +
            characterParsed.character.length +
            " chars)" +
            c.reset
          : c.red + "❌" + c.reset
      }`
    );

    if (!characterParsed.bible || !characterParsed.character) {
      throw new Error("Phase 2 failed: Missing bible or character");
    }

    console.log(`\n${c.bright}👤 Character Preview:${c.reset}`);
    console.log(characterParsed.character.substring(0, 400) + "...\n");

    // Log all tool calls from phase 2
    console.log(
      `${c.bright}🔧 Phase 2 Tool Calls (${characterResult.toolCalls.length}):${c.reset}`
    );
    characterResult.toolCalls.forEach((call, idx) => {
      console.log(`   ${idx + 1}. ${call.name}: ${JSON.stringify(call.input)}`);
    });

    // Check for repeated tool calls
    console.log(`\n${c.bright}🔍 Tool Call Analysis:${c.reset}`);
    const phase1ToolNames = worldResult.toolCalls.map((c) => c.name);
    const phase2ToolNames = characterResult.toolCalls.map((c) => c.name);

    console.log(
      `   Phase 1 tool types: ${[...new Set(phase1ToolNames)].join(", ")}`
    );
    console.log(
      `   Phase 2 tool types: ${[...new Set(phase2ToolNames)].join(", ")}`
    );

    // ========== SUCCESS ==========
    console.log(
      `\n${c.green}${c.bright}✅ TWO-PHASE GENERATION SUCCESSFUL!${c.reset}`
    );
    console.log("=".repeat(70));

    console.log(`\n${c.bright}Final Results:${c.reset}`);
    console.log(`   Chat name: ${worldParsed.chatName}`);
    console.log(`   World bible: ${worldParsed.bible.length} chars`);
    console.log(
      `   Final bible (with local): ${characterParsed.bible.length} chars`
    );
    console.log(`   Character: ${characterParsed.character.length} chars`);
    console.log(`   Phase 1 tool calls: ${worldResult.toolCalls.length}`);
    console.log(`   Phase 2 tool calls: ${characterResult.toolCalls.length}`);
    console.log(
      `   Total tool calls: ${
        worldResult.toolCalls.length + characterResult.toolCalls.length
      }`
    );

    return {
      success: true,
      chatName: worldParsed.chatName,
      bible: characterParsed.bible,
      character: characterParsed.character,
      phase1ToolCalls: worldResult.toolCalls.length,
      phase2ToolCalls: characterResult.toolCalls.length,
    };
  } catch (error) {
    log(c.red, "💥", "Error:");
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Run
testTwoPhaseGeneration()
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
