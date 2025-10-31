import { streamText, stepCountIs, UIMessage, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { GAMEPLAY_PROMPT_TEMPLATE } from "@/lib/prompts/gameplay-prompt";
import { injectContentIntoPrompt } from "@/lib/utils/tag-parser";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      modelTier = "free",
      bibleContent,
      characterContent,
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    const model = getStorytellingModel(modelTier);

    // Inject bible and character content into gameplay prompt template
    const gameplayPrompt = injectContentIntoPrompt(GAMEPLAY_PROMPT_TEMPLATE, {
      bible: bibleContent || "",
      character: characterContent || "",
    });

    const uiMessages = messages as UIMessage[];
    console.log("Chat - Initial messages structure:", JSON.stringify(uiMessages, null, 2));
    console.log("Chat - About to call convertToModelMessages");

    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(uiMessages as Array<Omit<UIMessage, 'id'>>);
      console.log("Chat - Converted messages successfully:", JSON.stringify(convertedMessages, null, 2));
    } catch (conversionError) {
      console.error("Chat - Error in convertToModelMessages:", conversionError);
      throw conversionError;
    }

    const result = streamText({
      model,
      system: gameplayPrompt,
      messages: convertedMessages,
      stopWhen: stepCountIs(10),
      tools: allTools,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          cacheControl: { type: "ephemeral" },
          reasoning: { effort: "high" },
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
