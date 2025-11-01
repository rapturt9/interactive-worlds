import { streamText, UIMessage, stepCountIs, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { WORLD_GENERATION_PROMPT } from "@/lib/prompts/world-generation-prompt";
import { generateWorldParametersPrompt } from "@/lib/prompts/world-params-prompt";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelTier = "budget", parameters } = await req.json();

    const model = getStorytellingModel(modelTier);

    // Support both old format (parameters) and new format (messages)
    const initialMessages = messages || [
      {
        role: "user" as const,
        parts: [
          {
            type: "text" as const,
            text: generateWorldParametersPrompt(parameters),
          },
        ],
      },
    ];

    console.log("\n🔍 === WORLD GENERATION API CALLED ===");
    console.log("📨 Request details:");
    console.log("   Model tier:", modelTier);
    console.log("   Has parameters:", !!parameters);
    console.log("   Has messages:", !!messages);
    console.log("   Message count:", messages ? messages.length : 0);

    if (messages && messages.length > 0) {
      console.log("\n📚 Conversation history:");
      messages.forEach((msg: any, idx: number) => {
        console.log(
          `   [${idx}] ${msg.role}: ${
            msg.parts ? msg.parts.length + " parts" : "no parts"
          }`
        );
        if (msg.parts) {
          msg.parts.forEach((part: any, pIdx: number) => {
            const partInfo =
              part.type === "tool-call"
                ? `tool-call (${part.toolName})`
                : part.type === "tool-result"
                ? `tool-result (${part.toolName})`
                : part.type;
            console.log(`       [${pIdx}] ${partInfo}`);
          });
        }
      });
    }

    console.log("\n📋 Initial messages structure:");
    console.log(JSON.stringify(initialMessages, null, 2));

    console.log("\n🔄 About to call convertToModelMessages...");

    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(initialMessages);
      console.log("\n✅ Converted messages successfully!");
    } catch (conversionError: any) {
      console.error("\n❌ Error in convertToModelMessages:", conversionError);
      console.error("Stack:", conversionError?.stack);
      throw conversionError;
    }

    // Extended thinking with tool calling - supports multi-turn continuation
    const systemPrompt = WORLD_GENERATION_PROMPT;

    // Prepend system prompt as a system message instead of using system parameter
    // Note: convertToModelMessages already handles reasoning parts correctly
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...convertedMessages,
    ];

    console.log("\n📝 Using system prompt: WORLD_GENERATION_PROMPT");
    console.log(
      "📝 System prompt preview:",
      systemPrompt.substring(0, 200) + "..."
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
    // print the messages
    console.log("\n📝 Converted messages structure:");
    console.log(JSON.stringify(messagesWithSystem, null, 2));

    const result = streamText({
      model,
      messages: messagesWithSystem,
      tools: allTools,
      temperature: 0.9,
      stopWhen: stepCountIs(50),
      providerOptions: {
        openrouter: {
          cacheControl: { type: "ephemeral" },
          reasoning: { exclude: true, effort: "high" },
        },
      },
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("World generation API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate world",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
