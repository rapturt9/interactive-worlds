import { Message } from '@/types';
import { WORLD_GENERATION_PROMPT } from '@/lib/prompts/world-generation-prompt';
import { CHARACTER_GENERATION_PROMPT } from '@/lib/prompts/character-generation-prompt';
import { GAMEPLAY_PROMPT_TEMPLATE } from '@/lib/prompts/gameplay-prompt';

/**
 * MESSAGE DISPLAY UTILITIES
 *
 * These utilities handle the visual presentation of messages in the UI.
 * Key concepts:
 * - Messages are stored in the database with phase tags (world, character, chat0, chat1, etc.)
 * - In debug mode: show ALL messages from ALL phases with phase switch markers
 * - In non-debug mode: show only chat0+ messages, deduplicated by message ID
 * - System prompts are NEVER stored in the database - they are inserted dynamically
 */

/**
 * Generate gameplay system prompt with bible and character content
 */
function generateSystemPrompt(bibleContent: string, characterContent: string): string {
  return `${GAMEPLAY_PROMPT_TEMPLATE}

**STORY BIBLE:**
${bibleContent}

**CHARACTER:**
${characterContent}`;
}

/**
 * Get the appropriate system prompt for a given phase
 */
export function getSystemPromptForPhase(
  phase: string,
  bibleContent?: string,
  characterContent?: string
): string {
  if (phase === 'world') {
    return WORLD_GENERATION_PROMPT;
  } else if (phase === 'character') {
    return CHARACTER_GENERATION_PROMPT;
  } else if (phase.startsWith('chat')) {
    // Gameplay phases (chat0, chat1, chat2, etc.)
    return generateSystemPrompt(bibleContent || '', characterContent || '');
  }

  // Fallback
  return generateSystemPrompt(bibleContent || '', characterContent || '');
}

/**
 * Get human-readable phase label for display
 */
export function getPhaseLabel(phase: string): string {
  if (phase === 'world') return 'World Generation';
  if (phase === 'character') return 'Character Generation';
  if (phase.startsWith('chat')) {
    const chatNum = phase.replace('chat', '');
    return `Gameplay Session ${parseInt(chatNum) + 1}`;
  }
  return phase;
}

/**
 * Deduplicate messages by message ID
 * When messages are copied across phases, they have the same ID but different phase values.
 * This function keeps only the first occurrence of each message ID.
 */
export function deduplicateByMessageId(messages: Message[]): Message[] {
  const seen = new Set<string>();
  const deduplicated: Message[] = [];

  for (const msg of messages) {
    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      deduplicated.push(msg);
    }
  }

  return deduplicated;
}

/**
 * Prepare visual messages for display in the UI
 *
 * @param dbMessages - All messages from the database (already sorted by timestamp)
 * @param currentPhase - Current generation phase (world, character, chat0, etc.)
 * @param showDebug - Whether to show debug information (all phases)
 * @param bibleContent - Current bible content for system prompt
 * @param characterContent - Current character content for system prompt
 * @returns Array of messages ready for display, with system prompts inserted
 */
export function prepareVisualMessages(
  dbMessages: Message[],
  currentPhase: string,
  showDebug: boolean,
  bibleContent?: string,
  characterContent?: string
): Message[] {
  if (showDebug) {
    // DEBUG MODE: Show all messages from all phases with phase switch markers
    return prepareDebugMessages(dbMessages, bibleContent, characterContent);
  } else {
    // NON-DEBUG MODE: Behavior depends on current phase
    if (currentPhase === 'world' || currentPhase === 'character') {
      // During world/character generation: show only those messages without system prompts
      return dbMessages.filter(msg => msg.role !== 'system');
    } else {
      // During gameplay: show only chat0+ messages, deduplicated, with system prompt
      return prepareProductionMessages(dbMessages, bibleContent, characterContent);
    }
  }
}

/**
 * Prepare messages for debug mode
 * Shows all messages from all phases with system prompts at phase boundaries
 * System prompts are shown when a phase starts (first user message in that phase)
 */
function prepareDebugMessages(
  dbMessages: Message[],
  bibleContent?: string,
  characterContent?: string
): Message[] {
  const result: Message[] = [];
  let currentPhase: string | null = null;

  for (const msg of dbMessages) {
    const msgPhase = (msg as any).phase || 'world';

    // If phase changed, insert a phase switch marker and system prompt
    if (msgPhase !== currentPhase) {
      currentPhase = msgPhase;

      // Insert phase switch marker (use special role to differentiate from system prompts)
      result.push({
        id: `phase-marker-${msgPhase}`,
        role: 'phase-marker' as any, // Special role for phase markers
        content: `--- ${getPhaseLabel(msgPhase)} Phase ---`,
        timestamp: msg.timestamp,
      });

      // Insert system prompt for this phase
      // We insert it at phase boundary so it's visible during generation
      const systemPrompt = getSystemPromptForPhase(msgPhase, bibleContent, characterContent);
      result.push({
        id: `system-${msgPhase}`,
        role: 'system',
        content: systemPrompt,
        timestamp: msg.timestamp,
      });
    }

    // Add the actual message
    result.push(msg);
  }

  console.log('🔍 prepareDebugMessages result:', {
    inputCount: dbMessages.length,
    outputCount: result.length,
    phases: [...new Set(dbMessages.map(m => (m as any).phase || 'world'))],
  });

  return result;
}

/**
 * Prepare messages for production mode
 * Shows only chat0+ messages, deduplicated by message ID, with gameplay system prompt
 * DEFENSIVE: Triple-layer filtering to ensure world/character messages never appear
 */
function prepareProductionMessages(
  dbMessages: Message[],
  bibleContent?: string,
  characterContent?: string
): Message[] {
  // LAYER 1: Filter to only chat0+ phases (skip world and character generation)
  const chatMessages = dbMessages.filter(msg => {
    const phase = (msg as any).phase || 'world';
    return phase.startsWith('chat');
  });

  // LAYER 2: Additional defensive filter - remove any system prompts or phase markers
  const cleanedMessages = chatMessages.filter(msg => {
    // Skip system prompts (they're inserted dynamically)
    if (msg.role === 'system') return false;
    // Skip phase markers
    if ((msg as any).role === 'phase-marker') return false;
    // Skip extraction confirmation messages (contain specific patterns)
    if (msg.content?.includes('extracted successfully')) return false;
    if (msg.content?.includes('Starting') && msg.content?.includes('Phase')) return false;
    return true;
  });

  // LAYER 3: Deduplicate by message ID (messages are copied across phases)
  const deduplicated = deduplicateByMessageId(cleanedMessages);

  // If no messages, return empty (don't show system prompt alone)
  if (deduplicated.length === 0) {
    return [];
  }

  // Insert gameplay system prompt at the beginning
  const systemPrompt = generateSystemPrompt(bibleContent || '', characterContent || '');

  const result: Message[] = [
    {
      id: 'system-gameplay',
      role: 'system',
      content: systemPrompt,
      timestamp: deduplicated[0]?.timestamp || new Date(),
    },
    ...deduplicated,
  ];

  console.log('🔒 Production message filtering:', {
    inputTotal: dbMessages.length,
    afterPhaseFilter: chatMessages.length,
    afterCleanup: cleanedMessages.length,
    afterDedup: deduplicated.length,
    finalCount: result.length,
  });

  return result;
}
