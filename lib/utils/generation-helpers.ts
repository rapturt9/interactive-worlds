import { Message } from '@/types';

export interface SaveMessagesParams {
  messages: any[]; // From onFinish callback parameter
  chatId: string;
  phase: 'world' | 'character' | 'chat0';
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
}

/**
 * Shared logic for saving generation messages and updating visual state
 * Used by all three generation hooks (world, character, gameplay) for consistency
 *
 * @param messages - Messages from onFinish callback (NOT from useChat state)
 * @param chatId - Current chat ID
 * @param phase - Which phase these messages belong to
 * @param onMessagesUpdate - Callback to update visual message state
 * @returns The saved messages
 */
export async function saveGenerationMessages({
  messages,
  chatId,
  phase,
  onMessagesUpdate,
}: SaveMessagesParams): Promise<Message[]> {
  console.log(`💾 saveGenerationMessages - phase: ${phase}, messages:`, messages.length);

  // 1. Filter and convert to DB format
  const dbMessages: Message[] = messages
    .filter(msg => msg.role !== 'system') // Never save system prompts
    .map((msg) => {
      // Debug log to see actual message structure
      console.log(`   Processing message ${msg.id}:`, {
        role: msg.role,
        hasParts: !!msg.parts,
        partsLength: msg.parts?.length,
        partsPreview: msg.parts?.slice(0, 2),
      });

      const textParts = msg.parts?.filter((p: { type: string }) => p.type === 'text') || [];
      const content = textParts.map((p: { text: string }) => p.text).join('');

      console.log(`   Extracted content length: ${content.length}, preview: ${content.substring(0, 100)}`);

      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content,
        parts: msg.parts,
        timestamp: new Date(),
        phase, // Tag with current phase
      } as Message;
    });

  console.log(`   Filtered to ${dbMessages.length} non-system messages`);

  // 2. Save each message to database
  for (const msg of dbMessages) {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: msg }),
    });
  }
  console.log(`   ✅ Saved ${dbMessages.length} messages to database with phase: ${phase}`);

  // Don't update visual state - streaming from useChat hook already shows messages in real-time
  // Only user messages need manual visual append (done in hooks before sendMessage)

  return dbMessages;
}
