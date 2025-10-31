import db from './schema';
import { Chat, Message, WorldParameters, ModelTier } from '@/types';

// Chat queries
export function getAllChats(): Chat[] {
  const rows = db.prepare(`
    SELECT id, title, model_tier as modelTier, created_at as createdAt,
           updated_at as updatedAt, story_bible as storyBible, world_params as worldParams
    FROM chats
    ORDER BY updated_at DESC
  `).all() as any[];

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

export function getChat(chatId: string) {
  const row = db.prepare(`
    SELECT id, title, model_tier as modelTier, created_at as createdAt,
           updated_at as updatedAt, story_bible as storyBible, world_params as worldParams,
           bible_content as bibleContent, character_content as characterContent,
           conversation_state as conversationState, chat_name_override as chatNameOverride
    FROM chats
    WHERE id = ?
  `).get(chatId) as any;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    modelTier: row.modelTier as ModelTier,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    storyBible: row.storyBible,
    worldParams: row.worldParams ? JSON.parse(row.worldParams) : null,
    bibleContent: row.bibleContent,
    characterContent: row.characterContent,
    conversationState: row.conversationState || 'world_generation',
    chatNameOverride: row.chatNameOverride,
  };
}

export function createChat(params: {
  id: string;
  title: string;
  modelTier: ModelTier;
  worldParams?: WorldParameters;
}) {
  db.prepare(`
    INSERT INTO chats (id, title, model_tier, created_at, updated_at, world_params)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.title,
    params.modelTier,
    Date.now(),
    Date.now(),
    params.worldParams ? JSON.stringify(params.worldParams) : null
  );
}

export function updateChat(chatId: string, updates: {
  title?: string;
  storyBible?: string;
  bibleContent?: string;
  characterContent?: string;
  conversationState?: string;
  chatNameOverride?: string;
  updatedAt?: number;
}) {
  const sets: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    sets.push('title = ?');
    values.push(updates.title);
  }
  if (updates.storyBible !== undefined) {
    sets.push('story_bible = ?');
    values.push(updates.storyBible);
  }
  if (updates.bibleContent !== undefined) {
    sets.push('bible_content = ?');
    values.push(updates.bibleContent);
  }
  if (updates.characterContent !== undefined) {
    sets.push('character_content = ?');
    values.push(updates.characterContent);
  }
  if (updates.conversationState !== undefined) {
    sets.push('conversation_state = ?');
    values.push(updates.conversationState);
  }
  if (updates.chatNameOverride !== undefined) {
    sets.push('chat_name_override = ?');
    values.push(updates.chatNameOverride);
  }
  if (updates.updatedAt !== undefined) {
    sets.push('updated_at = ?');
    values.push(updates.updatedAt);
  } else {
    sets.push('updated_at = ?');
    values.push(Date.now());
  }

  if (sets.length === 0) return;

  values.push(chatId);

  db.prepare(`
    UPDATE chats
    SET ${sets.join(', ')}
    WHERE id = ?
  `).run(...values);
}

export function deleteChat(chatId: string) {
  db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);
}

// Message queries
export function getMessages(chatId: string): Message[] {
  const rows = db.prepare(`
    SELECT id, role, content, timestamp
    FROM messages
    WHERE chat_id = ?
    ORDER BY timestamp ASC
  `).all(chatId) as any[];

  return rows.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.timestamp),
  }));
}

export function addMessage(chatId: string, message: Message) {
  db.prepare(`
    INSERT INTO messages (id, chat_id, role, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    message.id,
    chatId,
    message.role,
    message.content,
    message.timestamp.getTime()
  );

  // Update chat's updated_at
  updateChat(chatId, { updatedAt: message.timestamp.getTime() });
}

export function updateMessage(messageId: string, content: string) {
  db.prepare(`
    UPDATE messages
    SET content = ?
    WHERE id = ?
  `).run(content, messageId);
}

export function deleteMessagesAfter(chatId: string, messageId: string) {
  const message = db.prepare(`
    SELECT timestamp FROM messages WHERE id = ?
  `).get(messageId) as any;

  if (message) {
    db.prepare(`
      DELETE FROM messages
      WHERE chat_id = ? AND timestamp > ?
    `).run(chatId, message.timestamp);
  }
}
