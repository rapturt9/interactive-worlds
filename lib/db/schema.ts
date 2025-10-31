import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'interactive-worlds.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model_tier TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    story_bible TEXT,
    world_params TEXT,
    bible_content TEXT,
    character_content TEXT,
    conversation_state TEXT DEFAULT 'world_generation',
    chat_name_override TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
`);

// Migrate existing chats to add new columns
try {
  db.exec(`
    ALTER TABLE chats ADD COLUMN bible_content TEXT;
  `);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`
    ALTER TABLE chats ADD COLUMN character_content TEXT;
  `);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`
    ALTER TABLE chats ADD COLUMN conversation_state TEXT DEFAULT 'world_generation';
  `);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`
    ALTER TABLE chats ADD COLUMN chat_name_override TEXT;
  `);
} catch (e) {
  // Column already exists
}

export default db;
