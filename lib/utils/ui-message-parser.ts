/**
 * Utility to parse UIMessage stream format from AI SDK
 * Handles server-sent events (SSE) with data: prefix
 */

export interface UIMessagePart {
  type: string;
  text?: string;
  [key: string]: any;
}

export interface ParsedUIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: UIMessagePart[];
}

/**
 * Parse a UIMessage stream and convert to a format compatible with our Message type
 * Returns the concatenated text content from all text and reasoning parts
 */
export async function parseUIMessageStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (content: string, parts: UIMessagePart[]) => void
): Promise<{ content: string; parts: UIMessagePart[] }> {
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  const allParts: UIMessagePart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines (SSE format: data: {json}\n)
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;

      try {
        const jsonStr = line.slice(6); // Remove 'data: ' prefix
        const data = JSON.parse(jsonStr);

        // Handle different message chunk types
        switch (data.type) {
          case 'text-delta':
            if (data.delta) {
              fullText += data.delta;
              onUpdate(fullText, allParts);
            }
            break;

          case 'reasoning-delta':
            if (data.delta) {
              // Find or create reasoning part
              let reasoningPart = allParts.find(p => p.type === 'reasoning' && p.id === data.id);
              if (!reasoningPart) {
                reasoningPart = { type: 'reasoning', id: data.id, text: '' };
                allParts.push(reasoningPart);
              }
              reasoningPart.text = (reasoningPart.text || '') + data.delta;
              // DON'T add reasoning to fullText yet - it's separate
              onUpdate(fullText, allParts);
            }
            break;

          case 'tool-call':
            // Add tool call part
            allParts.push({
              type: `tool-call-${data.toolName}`,
              toolName: data.toolName,
              args: data.args,
              toolCallId: data.toolCallId,
            });
            onUpdate(fullText, allParts);
            break;

          case 'tool-result':
            // Add tool result part
            allParts.push({
              type: 'tool-result',
              toolCallId: data.toolCallId,
              toolName: data.toolName,
              result: data.result,
            });
            onUpdate(fullText, allParts);
            break;

          case 'finish':
          case 'error':
            // Stream finished
            break;
        }
      } catch (e) {
        // Skip malformed JSON lines
        console.warn('Failed to parse SSE line:', line, e);
      }
    }
  }

  // After streaming is complete, combine text and reasoning for fullText
  // This is needed for parsing XML tags that might be in either section
  const reasoningText = allParts
    .filter(p => p.type === 'reasoning')
    .map(p => p.text || '')
    .join('\n\n');

  const combinedContent = fullText + (reasoningText ? '\n\n' + reasoningText : '');

  return { content: combinedContent, parts: allParts };
}

/**
 * Convert UIMessage parts to our Message format
 * This maintains backward compatibility with existing code
 */
export function uiMessageToMessage(parts: UIMessagePart[]): { content: string } {
  // Concatenate text from text and reasoning parts
  const textParts = parts
    .filter(p => p.type === 'text' || p.type === 'reasoning')
    .map(p => p.text || '')
    .filter(t => t.length > 0);

  return {
    content: textParts.join('\n\n'),
  };
}
