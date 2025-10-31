/**
 * Tool calling utilities for OpenRouter API
 * Implements the tool calling loop similar to the test notebook
 */

import { GAME_TOOLS } from '@/lib/tools/definitions';
import {
  executeCalculatorPEMDAS,
  executeRandomNumber,
  executeRandomChoice,
} from '@/lib/tools/executor';

interface Message {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  reasoning?: string;
}

interface ToolCallLoopOptions {
  model: string;
  messages: Message[];
  apiKey: string;
  maxIterations?: number;
  onToolCall?: (toolName: string, args: any, result: any) => void;
  onThinking?: (thinking: string) => void;
}

/**
 * Execute tool calling loop with OpenRouter
 * Returns final messages array with all tool calls executed
 */
export async function executeToolCallingLoop({
  model,
  messages: initialMessages,
  apiKey,
  maxIterations = 10,
  onToolCall,
  onThinking,
}: ToolCallLoopOptions): Promise<Message[]> {
  const messages = [...initialMessages];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Send request to OpenRouter
    const payload = {
      model,
      messages,
      tools: GAME_TOOLS,
      reasoning: { effort: 'high' },
      temperature: 0.8,
      max_tokens: 8000,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`OpenRouter error: ${JSON.stringify(result.error)}`);
    }

    const assistantMessage = result.choices[0].message;
    const choiceData = result.choices[0];

    // Extract thinking/reasoning
    let reasoningText = '';

    // Check assistant_message for reasoning_details
    if (assistantMessage.reasoning_details) {
      for (const detail of assistantMessage.reasoning_details) {
        if (detail.type === 'reasoning.text' && detail.text) {
          reasoningText = detail.text;
          break;
        }
      }
    }

    // Also check choice_data level
    if (!reasoningText && choiceData.reasoning_details) {
      for (const detail of choiceData.reasoning_details) {
        if (detail.type === 'reasoning.text' && detail.text) {
          reasoningText = detail.text;
          break;
        }
      }
    }

    // Fallback to direct reasoning field
    if (!reasoningText && assistantMessage.reasoning) {
      reasoningText = assistantMessage.reasoning;
    }

    // Notify about thinking
    if (reasoningText && onThinking) {
      onThinking(reasoningText);
    }

    // Add assistant message
    messages.push(assistantMessage);

    // Check if there are tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolId = toolCall.id;

        // Execute the tool
        let toolResult;

        switch (toolName) {
          case 'calculator_pemdas':
            toolResult = executeCalculatorPEMDAS(toolArgs.expression);
            break;

          case 'random_number_given_min_max':
            toolResult = executeRandomNumber(toolArgs.min, toolArgs.max);
            break;

          case 'random_choice_with_weights':
            toolResult = executeRandomChoice(toolArgs.choices, toolArgs.weights);
            break;

          default:
            toolResult = { error: `Unknown tool: ${toolName}` };
        }

        // Notify about tool call
        if (onToolCall) {
          onToolCall(toolName, toolArgs, toolResult);
        }

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolId,
          content: JSON.stringify(toolResult),
        });
      }

      // Continue loop to get final response
      continue;
    }

    // No more tool calls, we're done
    break;
  }

  return messages;
}
