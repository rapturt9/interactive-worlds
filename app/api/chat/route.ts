import { streamText, UIMessage, stepCountIs, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { GAMEPLAY_PROMPT_TEMPLATE } from "@/lib/prompts/gameplay-prompt";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelTier = "budget" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    const model = getStorytellingModel(modelTier);

    // Use base gameplay prompt (bible and character are in conversation history)
    const gameplayPrompt = GAMEPLAY_PROMPT_TEMPLATE;

    console.log("\n🔍 === CHAT/GAMEPLAY API CALLED ===");
    console.log("📨 Request details:");
    console.log("   Model tier:", modelTier);
    console.log("   Message count:", messages.length);
    console.log(
      "   Using continuous conversation with bible/character in history"
    );

    console.log("\n📚 Incoming messages:");
    messages.forEach((msg: any, idx: number) => {
      console.log(
        `   [${idx}] ${msg.role}: ${
          msg.parts ? msg.parts.length + " parts" : "no parts"
        }`
      );
    });

    console.log("\n🔄 About to call convertToModelMessages");

    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(messages);
      console.log("✅ Converted messages successfully!");
    } catch (conversionError) {
      console.error("❌ Error in convertToModelMessages:", conversionError);
      throw conversionError;
    }

    // Prepend system prompt as a system message instead of using system parameter
    // Note: convertToModelMessages already handles reasoning parts correctly
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: gameplayPrompt,
      },
      ...convertedMessages,
    ];

    console.log(
      "\n📝 Using system prompt: GAMEPLAY_PROMPT_TEMPLATE (base template, no injection)"
    );
    console.log(
      "📝 System prompt preview:",
      gameplayPrompt.substring(0, 200) + "..."
    );
    console.log("\n🚀 FINAL CONVERSATION BEING SENT TO MODEL:");
    console.log(
      "   Messages count (including system):",
      messagesWithSystem.length
    );
    messagesWithSystem.forEach((msg: any, idx: number) => {
      const preview = JSON.stringify(msg).substring(0, 150);
      console.log(`   [${idx}] ${msg.role}: ${preview}...`);
    });

    // Extended thinking enabled with exclude to prevent format conflicts on continuation
    const result = streamText({
      model,
      messages: messagesWithSystem,
      tools: allTools,
      temperature: 0.8,
      stopWhen: stepCountIs(50),
      providerOptions: {
        openrouter: {
          cacheControl: { type: "ephemeral" },
          reasoning: { exclude: true, effort: "high" },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
