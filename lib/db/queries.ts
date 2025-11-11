import { sql } from './schema';
import { Chat, Message, WorldParameters, ModelTier } from '@/types';

/**
 * TIMESTAMP STRATEGY:
 * - All timestamps use TIMESTAMPTZ columns with NOW() for server time
 * - PostgreSQL stores all timestamps in UTC internally
 * - Timestamps are automatically converted to/from UTC when sent to clients
 * - This ensures consistent ordering and proper timezone handling
 */

// Chat queries
export async function getAllChats(userId: string): Promise<Chat[]> {
  const rows = await sql`
    SELECT id, title, model_tier as "modelTier", created_at as "createdAt",
           updated_at as "updatedAt", world_params as "worldParams"
    FROM chats
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;

  return rows.map(row => ({
    id: row.id,
    worldId: row.id,
    name: row.title,
    messages: [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    turnNumber: 0,
  }));
}

export async function getChat(chatId: string, userId: string) {
  const rows = await sql`
    SELECT id, title, model_tier as "modelTier", created_at as "createdAt",
           updated_at as "updatedAt", world_params as "worldParams",
           bible_content as "bibleContent", character_content as "characterContent",
           conversation_state as "conversationState", generation_phase as "generationPhase",
           original_bible_content as "originalBibleContent", current_turn as "currentTurn"
    FROM chats
    WHERE id = ${chatId} AND user_id = ${userId}
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    title: row.title,
    modelTier: row.modelTier as ModelTier,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    worldParams: row.worldParams || null,
    bibleContent: row.bibleContent,
    characterContent: row.characterContent,
    conversationState: row.conversationState || 'world_generation',
    generationPhase: row.generationPhase || 'world',
    originalBibleContent: row.originalBibleContent,
    currentTurn: row.currentTurn || 0,
  };
}

export async function createChat(params: {
  id: string;
  userId: string;
  title: string;
  modelTier: ModelTier;
  worldParams?: WorldParameters;
}) {
  await sql`
    INSERT INTO chats (id, user_id, title, model_tier, world_params, created_at, updated_at)
    VALUES (
      ${params.id},
      ${params.userId},
      ${params.title},
      ${params.modelTier},
      ${params.worldParams ? JSON.stringify(params.worldParams) : null}::jsonb,
      NOW(),
      NOW()
    )
  `;
}

export async function updateChat(chatId: string, userId: string, updates: {
  title?: string;
  bibleContent?: string;
  characterContent?: string;
  conversationState?: string;
  generationPhase?: string;
  originalBibleContent?: string;
  currentTurn?: number;
}) {
  if (Object.keys(updates).length === 0) return;

  // Execute individual update statements (simpler and safer with Neon's template literals)
  if (updates.title !== undefined) {
    await sql`UPDATE chats SET title = ${updates.title}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.bibleContent !== undefined) {
    await sql`UPDATE chats SET bible_content = ${updates.bibleContent}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.characterContent !== undefined) {
    await sql`UPDATE chats SET character_content = ${updates.characterContent}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.conversationState !== undefined) {
    await sql`UPDATE chats SET conversation_state = ${updates.conversationState}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.generationPhase !== undefined) {
    await sql`UPDATE chats SET generation_phase = ${updates.generationPhase}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.originalBibleContent !== undefined) {
    await sql`UPDATE chats SET original_bible_content = ${updates.originalBibleContent}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
  if (updates.currentTurn !== undefined) {
    await sql`UPDATE chats SET current_turn = ${updates.currentTurn}, updated_at = NOW() WHERE id = ${chatId} AND user_id = ${userId}`;
  }
}

export async function deleteChat(chatId: string, userId: string) {
  await sql`
    DELETE FROM chats
    WHERE id = ${chatId} AND user_id = ${userId}
  `;
}

// Message queries
export async function getMessages(chatId: string, userId: string, phase?: string): Promise<Message[]> {
  const rows = phase
    ? await sql`
        SELECT id, role, content, parts, timestamp, phase
        FROM messages
        WHERE chat_id = ${chatId} AND user_id = ${userId} AND phase = ${phase}
        ORDER BY timestamp ASC
      `
    : await sql`
        SELECT id, role, content, parts, timestamp, phase
        FROM messages
        WHERE chat_id = ${chatId} AND user_id = ${userId}
        ORDER BY timestamp ASC
      `;

  return rows.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    parts: row.parts,
    timestamp: new Date(row.timestamp),
    phase: row.phase,
  }));
}

export async function addMessage(chatId: string, userId: string, message: Message) {
  await sql`
    INSERT INTO messages (id, chat_id, user_id, phase, role, content, parts, timestamp)
    VALUES (
      ${message.id},
      ${chatId},
      ${userId},
      ${(message as any).phase || 'world'},
      ${message.role},
      ${message.content},
      ${(message as any).parts ? JSON.stringify((message as any).parts) : null}::jsonb,
      ${message.timestamp}
    )
    ON CONFLICT (id, chat_id, phase) DO NOTHING
  `;

  // Update chat's updated_at using server time (consistent with createChat/updateChat)
  await sql`
    UPDATE chats
    SET updated_at = NOW()
    WHERE id = ${chatId} AND user_id = ${userId}
  `;
}

export async function updateMessage(messageId: string, userId: string, content: string) {
  await sql`
    UPDATE messages
    SET content = ${content}
    WHERE id = ${messageId} AND user_id = ${userId}
  `;
}

export async function deleteMessagesAfter(chatId: string, userId: string, messageId: string) {
  const messages = await sql`
    SELECT timestamp FROM messages
    WHERE id = ${messageId} AND user_id = ${userId}
  `;

  if (messages.length > 0) {
    const messageTimestamp = messages[0].timestamp;
    await sql`
      DELETE FROM messages
      WHERE chat_id = ${chatId} AND user_id = ${userId} AND timestamp > ${messageTimestamp}
    `;
  }
}

// Snapshot queries for turn-based versioning
export interface TurnSnapshot {
  turnNumber: number;
  bible: string;
  character: string;
  timestamp: Date;
}

/**
 * Save a snapshot of the current story bible and character state at a specific turn.
 * Snapshots are stored as system messages in the messages table.
 */
export async function saveTurnSnapshot(
  chatId: string,
  userId: string,
  turnNumber: number,
  bibleContent: string,
  characterContent: string
): Promise<void> {
  const snapshotData: TurnSnapshot = {
    turnNumber,
    bible: bibleContent,
    character: characterContent,
    timestamp: new Date(),
  };

  const snapshotMessage: Message = {
    id: `${chatId}-snapshot-turn-${turnNumber}`,
    role: 'system',
    content: JSON.stringify({
      type: 'snapshot',
      ...snapshotData,
    }),
    timestamp: new Date(),
  };

  // Save snapshot with phase = turn-N
  await sql`
    INSERT INTO messages (id, chat_id, user_id, phase, role, content, timestamp)
    VALUES (
      ${snapshotMessage.id},
      ${chatId},
      ${userId},
      ${`turn-${turnNumber}`},
      ${snapshotMessage.role},
      ${snapshotMessage.content},
      ${snapshotMessage.timestamp}
    )
    ON CONFLICT (id, chat_id, phase)
    DO UPDATE SET
      content = ${snapshotMessage.content},
      timestamp = ${snapshotMessage.timestamp}
  `;
}

/**
 * Load a snapshot for a specific turn.
 * Returns null if no snapshot exists for that turn.
 */
export async function loadTurnSnapshot(
  chatId: string,
  userId: string,
  turnNumber: number
): Promise<TurnSnapshot | null> {
  const rows = await sql`
    SELECT content, timestamp
    FROM messages
    WHERE chat_id = ${chatId}
      AND user_id = ${userId}
      AND phase = ${`turn-${turnNumber}`}
      AND role = 'system'
      AND id = ${`${chatId}-snapshot-turn-${turnNumber}`}
  `;

  if (rows.length === 0) {
    return null;
  }

  try {
    const snapshotData = JSON.parse(rows[0].content);
    if (snapshotData.type === 'snapshot') {
      return {
        turnNumber: snapshotData.turnNumber,
        bible: snapshotData.bible,
        character: snapshotData.character,
        timestamp: new Date(snapshotData.timestamp),
      };
    }
  } catch (error) {
    console.error('Failed to parse snapshot:', error);
  }

  return null;
}

/**
 * Get the current turn number for a chat.
 */
export async function getCurrentTurn(chatId: string, userId: string): Promise<number> {
  const rows = await sql`
    SELECT current_turn as "currentTurn"
    FROM chats
    WHERE id = ${chatId} AND user_id = ${userId}
  `;

  if (rows.length === 0) {
    return 0;
  }

  return rows[0].currentTurn || 0;
}

/**
 * Increment the turn counter for a chat and return the new turn number.
 */
export async function incrementTurn(chatId: string, userId: string): Promise<number> {
  const currentTurn = await getCurrentTurn(chatId, userId);
  const newTurn = currentTurn + 1;

  await updateChat(chatId, userId, { currentTurn: newTurn });

  return newTurn;
}

/**
 * Get all available snapshots for a chat (useful for time-travel UI).
 */
export async function getAllSnapshots(chatId: string, userId: string): Promise<TurnSnapshot[]> {
  const rows = await sql`
    SELECT content, timestamp, phase
    FROM messages
    WHERE chat_id = ${chatId}
      AND user_id = ${userId}
      AND role = 'system'
      AND id LIKE ${`${chatId}-snapshot-turn-%`}
    ORDER BY timestamp ASC
  `;

  const snapshots: TurnSnapshot[] = [];

  for (const row of rows) {
    try {
      const snapshotData = JSON.parse(row.content);
      if (snapshotData.type === 'snapshot') {
        snapshots.push({
          turnNumber: snapshotData.turnNumber,
          bible: snapshotData.bible,
          character: snapshotData.character,
          timestamp: new Date(snapshotData.timestamp),
        });
      }
    } catch (error) {
      console.error('Failed to parse snapshot:', error);
    }
  }

  return snapshots;
}
