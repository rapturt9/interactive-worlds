import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { CHARACTER_GENERATION_PROMPT } from "@/lib/prompts/character-generation-prompt";
import { generateWorldParametersPrompt } from "@/lib/prompts/world-params-prompt";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const {
      worldBible,
      modelTier = "budget",
      parameters,
      messages,
    } = await req.json();

    if (!worldBible) {
      return new Response("World bible is required", { status: 400 });
    }

    console.log("\n🔍 === CHARACTER GENERATION API CALLED ===");
    console.log("📨 Request details:");
    console.log("   Model tier:", modelTier);
    console.log("   Has world bible:", !!worldBible);
    console.log("   Bible length:", worldBible?.length || 0);
    console.log("   Has parameters:", !!parameters);

    const model = getStorytellingModel(modelTier);

    // Build the user message that includes the world bible and parameters
    const userPrompt = `
${parameters ? generateWorldParametersPrompt(parameters) : ""}

Here is the complete world bible:

<world_bible>
${worldBible}
</world_bible>

Generate the character and local context now, following the instructions in the system prompt.
`;

    // Support both old format (worldBible) and new format (messages)
    const initialMessages = messages || [
      {
        role: "user" as const,
        parts: [
          {
            type: "text" as const,
            text: userPrompt,
          },
        ],
      },
    ];

    console.log("\n📋 Initial messages structure:");
    console.log("   Has messages:", !!messages);
    console.log("   Message count:", messages ? messages.length : 1);

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

    // Prepend system prompt as a system message instead of using system parameter
    // Note: convertToModelMessages already handles reasoning parts correctly
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: CHARACTER_GENERATION_PROMPT,
      },
      ...convertedMessages,
    ];

    console.log("\n🎬 Starting character generation with extended thinking...");
    console.log("📝 Using system prompt: CHARACTER_GENERATION_PROMPT");
    console.log(
      "📝 System prompt preview:",
      CHARACTER_GENERATION_PROMPT.substring(0, 200) + "..."
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
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Character generation API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate character",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
