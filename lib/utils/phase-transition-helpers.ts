import { Message } from '@/types';

/**
 * PHASE TRANSITION UTILITIES
 *
 * These utilities handle copying messages from previous phases to new phases
 * during phase transitions (world → character → chat0).
 *
 * Key concept: When transitioning to a new phase, we copy ALL previous phase messages
 * to the new phase in the database BEFORE starting generation. This ensures:
 * 1. Phase markers and system prompts appear immediately via prepareVisualMessages()
 * 2. Context is visible in the UI before streaming starts
 * 3. Append-only architecture is maintained
 */

interface CopyMessagesToNewPhaseParams {
  chatId: string;
  fromPhases: string | string[]; // 'world' or ['world', 'character']
  toPhase: string; // 'character' or 'chat0'
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
}

/**
 * Copy messages from previous phase(s) to a new phase
 *
 * This function:
 * 1. Loads messages from previous phase(s) from database
 * 2. Filters out system prompts and phase markers (added dynamically)
 * 3. Creates new message records with new phase tag
 * 4. Saves them to database
 * 5. Updates local state immediately
 * 6. Returns messages for API context
 *
 * @returns Array of messages in UIMessage format for API context
 */
export async function copyMessagesToNewPhase({
  chatId,
  fromPhases,
  toPhase,
  onMessagesUpdate,
}: CopyMessagesToNewPhaseParams): Promise<any[]> {
  console.log(`🔄 Copying messages from ${Array.isArray(fromPhases) ? fromPhases.join('+') : fromPhases} → ${toPhase}`);

  // Normalize fromPhases to array
  const phaseArray = Array.isArray(fromPhases) ? fromPhases : [fromPhases];

  // Load messages from all previous phases
  const allPreviousMessages: any[] = [];

  for (const phase of phaseArray) {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}&phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        allPreviousMessages.push(...data.messages);
        console.log(`   Loaded ${data.messages.length} messages from phase ${phase}`);
      } else {
        console.error(`❌ Failed to load messages from phase ${phase}`);
      }
    } catch (error) {
      console.error(`❌ Error loading messages from phase ${phase}:`, error);
    }
  }

  console.log(`   Total messages loaded: ${allPreviousMessages.length}`);

  // Filter out system prompts, phase markers, and display-only messages
  // These are inserted dynamically by prepareVisualMessages()
  const messagesToCopy = allPreviousMessages.filter((msg: any) => {
    // Skip system prompts (role === 'system')
    if (msg.role === 'system') return false;
    // Skip phase markers (role === 'phase-marker')
    if (msg.role === 'phase-marker') return false;
    // Skip extraction confirmation messages
    if (msg.content.includes('extracted successfully')) return false;
    // Skip phase transition messages
    if (msg.content.includes('Starting') && msg.content.includes('Phase')) return false;
    return true;
  });

  console.log(`   Messages to copy after filtering: ${messagesToCopy.length}`);

  // Create new message records with new phase tag
  const copiedMessages: Message[] = messagesToCopy.map((msg: any) => ({
    id: msg.id, // Keep same ID (allows deduplication in production mode)
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    phase: toPhase, // New phase tag
  }));

  // Save copied messages to database
  console.log(`   Saving ${copiedMessages.length} copied messages to database...`);
  try {
    const savePromises = copiedMessages.map((msg) =>
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: msg }),
      })
    );

    await Promise.all(savePromises);
    console.log(`   ✅ Copied messages saved to database`);
  } catch (error) {
    console.error('❌ Error saving copied messages:', error);
    throw error;
  }

  // Don't update local state - old messages are already visible from previous phase
  // Only the DB needs to be updated for the new phase tag

  console.log(`✅ Phase transition complete: ${Array.isArray(fromPhases) ? fromPhases.join('+') : fromPhases} → ${toPhase}`);

  // Return messages for API context (convert to UIMessage format)
  const uiMessages = messagesToCopy.map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text' as const, text: msg.content }],
  }));

  return uiMessages;
}
