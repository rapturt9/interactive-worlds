import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { getStorytellingModel } from "@/lib/llm/client";
import { WORLD_GENERATION_PROMPT } from "@/lib/prompts/world-generation-prompt";
import { CHARACTER_GENERATION_PROMPT } from "@/lib/prompts/character-generation-prompt";
import { GAMEPLAY_PROMPT_TEMPLATE } from "@/lib/prompts/gameplay-prompt";
import { allTools } from "@/lib/tools/ai-tools";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Get the appropriate system prompt for a given phase
 */
function getSystemPromptForPhase(phase: string): string {
  switch (phase) {
    case 'world':
      return WORLD_GENERATION_PROMPT;
    case 'character':
      return CHARACTER_GENERATION_PROMPT;
    case 'chat0':
    case 'chat1':
    case 'chat2':
    default:
      // All gameplay phases use the base gameplay prompt
      // Bible and character context are in conversation history
      return GAMEPLAY_PROMPT_TEMPLATE;
  }
}

/**
 * UNIFIED GENERATION API
 *
 * Single endpoint handling all generation phases:
 * - world: Initial world/bible generation
 * - character: Character generation after world
 * - chat0, chat1, chat2...: Gameplay turns
 *
 * All phases follow the same pattern:
 * 1. Receive messages array (from hook via setMessages)
 * 2. Convert to model messages
 * 3. Prepend appropriate system prompt
 * 4. Stream response
 */
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    console.log(`\n🔍 === GENERATION API CALLED (${requestBody.phase?.toUpperCase()}) ===`);
    console.log("📨 Full request body:", JSON.stringify(requestBody, null, 2));

    const {
      phase = 'world',
      modelTier = "budget",
      parameters,
      messages,
    } = requestBody;

    console.log("📨 Request details:");
    console.log("   Phase:", phase);
    console.log("   Model tier:", modelTier);
    console.log("   Has parameters:", !!parameters);
    console.log("   Has messages:", !!messages);
    console.log("   Messages count:", messages?.length || 0);

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    const model = getStorytellingModel(modelTier);

    // Messages array includes full context from setMessages() in the hook
    console.log(`✅ Using standard messages array for ${phase} phase`);

    console.log("\n📋 Messages structure:");
    console.log("   Message count:", messages.length);
    messages.forEach((msg: any, idx: number) => {
      console.log(`   [${idx}] ${msg.role}: ${msg.parts?.[0]?.text?.substring(0, 100) || '(no text)'}...`);
    });

    console.log("\n🔄 About to call convertToModelMessages...");

    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(messages);
      console.log("\n✅ Converted messages successfully!");
    } catch (conversionError: any) {
      console.error("\n❌ Error in convertToModelMessages:", conversionError);
      console.error("Stack:", conversionError?.stack);
      throw conversionError;
    }

    // Get system prompt for this phase
    const systemPrompt = getSystemPromptForPhase(phase);

    // Prepend system prompt as a system message
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...convertedMessages,
    ];

    console.log(`\n📝 Using system prompt for phase: ${phase}`);
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
      console.log(`\n   [${idx}] ${msg.role}:`);
      if (typeof msg.content === 'string') {
        console.log(`       Content: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach((part: any, pIdx: number) => {
          if (part.type === 'text') {
            console.log(`       [${pIdx}] text: ${part.text.substring(0, 200)}${part.text.length > 200 ? '...' : ''}`);
          } else if (part.type === 'tool-call') {
            console.log(`       [${pIdx}] tool-call: ${part.toolName}`);
          } else if (part.type === 'tool-result') {
            console.log(`       [${pIdx}] tool-result: ${part.toolName}`);
          } else {
            console.log(`       [${pIdx}] ${part.type}`);
          }
        });
      }
    });

    // Temperature varies by phase
    const temperature = phase === 'world' ? 0.9 : 0.8;

    // Extended thinking enabled with exclude to prevent format conflicts
    const result = streamText({
      model,
      messages: messagesWithSystem,
      tools: allTools,
      temperature,
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
    console.error("Generation API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process generation request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
