import { streamText, convertToModelMessages } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  console.log("\n🧠 === SUPERMEMORY CHAT API CALLED ===");

  try {
    const body = await req.json();
    console.log("📨 Request body:", JSON.stringify(body, null, 2));

    const { messages, conversationId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    if (!conversationId) {
      return new Response("Invalid request: conversationId required", {
        status: 400,
      });
    }

    // Create OpenRouter client with Supermemory proxy
    const infiniteChatOpenRouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://api.supermemory.ai/v3/https://openrouter.ai/api/v1",
      headers: {
        "x-supermemory-api-key": process.env.SUPERMEMORY_API_KEY!,
        "x-sm-conversation-id": conversationId,
        "x-sm-user-id": "test-user-123",
      },
    });

    const model = infiniteChatOpenRouter("anthropic/claude-sonnet-4.5");

    console.log("\n🧠 === SUPERMEMORY CHAT API CALLED ===");
    console.log("📨 Request details:");
    console.log("   Conversation ID:", conversationId);
    console.log("   Message count:", messages.length);

    // Convert UI messages to model messages
    console.log("\n🔄 Converting messages...");
    const convertedMessages = convertToModelMessages(messages);
    console.log("✅ Messages converted successfully!");

    console.log("\n📝 Converted messages:");
    convertedMessages.forEach((msg: any, idx: number) => {
      console.log(
        `   [${idx}] ${msg.role}: ${JSON.stringify(msg.content).substring(
          0,
          100
        )}...`
      );
    });

    console.log("\n🚀 Calling streamText with Supermemory proxy...");

    // NOTE: Extended thinking is enabled, but Supermemory proxy may strip reasoning blocks
    // This is a known limitation - memory works great, but reasoning may not appear
    const result = streamText({
      model,
      messages: convertedMessages,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "high" },
          cacheControl: { type: "ephemeral" },
        },
      },
    });

    console.log("✅ Returning stream response");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("\n❌ Supermemory chat API error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.stack : error
    );
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
