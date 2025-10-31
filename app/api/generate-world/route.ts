import { streamText, stepCountIs, UIMessage, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { WORLD_GENERATION_PROMPT } from "@/lib/prompts/world-generation-prompt";
import { generateWorldParametersPrompt } from "@/lib/prompts/world-params-prompt";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelTier = "free", parameters } = await req.json();

    const model = getStorytellingModel(modelTier);

    // Support both old format (parameters) and new format (messages)
    // Note: Use Omit<UIMessage, 'id'> type for convertToModelMessages compatibility
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

    console.log("Initial messages structure:", JSON.stringify(initialMessages, null, 2));
    console.log("About to call convertToModelMessages");

    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(initialMessages as Array<Omit<UIMessage, 'id'>>);
      console.log("Converted messages successfully:", JSON.stringify(convertedMessages, null, 2));
    } catch (conversionError) {
      console.error("Error in convertToModelMessages:", conversionError);
      throw conversionError;
    }

    // Use system prompt with caching and tool calling
    const result = streamText({
      model,
      system: WORLD_GENERATION_PROMPT,
      messages: convertedMessages,
      stopWhen: stepCountIs(10),
      tools: allTools,
      temperature: 0.9,
      providerOptions: {
        openrouter: {
          cacheControl: { type: "ephemeral" },
          reasoning: { effort: "high" },
        },
      },
    });

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
