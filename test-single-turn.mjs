#!/usr/bin/env node

/**
 * Test single API call with automatic tool handling
 * The AI SDK should handle tool calls internally
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
  const chatName = content.match(/<chat_name>([\s\S]*?)<\/chat_name>/)?.[1];
  return { bible, chatName };
}

async function testSingleTurn() {
  console.log(
    `\n${c.bright}🎮 SINGLE TURN TEST (AI SDK handles tools internally)${c.reset}`
  );
  console.log("=".repeat(70) + "\n");

  const parameters = {
    genre: "Fantasy",
    setting: "Medieval Kingdom",
    theme: "Coming of Age",
    difficulty: "Medium",
  };

  try {
    log(
      c.blue,
      "📤",
      "Sending single request (AI SDK will handle tools internally)..."
    );

    const response = await fetch(WORLD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelTier: "budget",
        parameters,
        useSimplePrompt: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status}\n${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let toolCallCount = 0;
    let toolResultCount = 0;

    log(c.cyan, "📥", "Parsing stream...");

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
              toolCallCount++;
              log(
                c.magenta,
                `🔧 #${toolCallCount}`,
                `${data.toolName}(${JSON.stringify(data.input).substring(
                  0,
                  50
                )}...)`
              );
              break;
            case "tool-output-available":
              toolResultCount++;
              log(c.green, `✅ #${toolResultCount}`, `Result received`);
              break;
            case "finish":
              log(c.green, "🏁", "Stream finished");
              if (data.finishReason)
                console.log("   Reason:", data.finishReason);
              break;
          }
        } catch (e) {
          // Skip
        }
      }
    }

    const parsed = parseXML(fullText);

    console.log(`\n${c.bright}📊 Results:${c.reset}`);
    console.log(`   Text: ${fullText.length} chars`);
    console.log(`   Tool calls: ${toolCallCount}`);
    console.log(`   Tool results: ${toolResultCount}`);
    console.log(
      `   Bible: ${
        parsed.bible
          ? c.green + "✅ (" + parsed.bible.length + " chars)" + c.reset
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
      console.log(`\n${c.green}${c.bright}✅ SUCCESS!${c.reset}`);
      console.log("=".repeat(70));
      console.log(`\n${c.bright}📖 Bible Preview:${c.reset}`);
      console.log(parsed.bible.substring(0, 500) + "...\n");
      console.log(`${c.bright}🏷️  Chat Name:${c.reset} ${parsed.chatName}\n`);

      return {
        success: true,
        chatName: parsed.chatName,
        bible: parsed.bible,
        toolCalls: toolCallCount,
      };
    } else {
      console.log(`\n${c.yellow}⚠️ INCOMPLETE${c.reset}`);
      console.log("Text preview:", fullText.substring(0, 500));
      return {
        success: false,
        error: "Missing bible or chat name",
        textLength: fullText.length,
        toolCalls: toolCallCount,
      };
    }
  } catch (error) {
    log(c.red, "💥", "Error:");
    console.error(error);
    return { success: false, error: error.message };
  }
}

testSingleTurn()
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
