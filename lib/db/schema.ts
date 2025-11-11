import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon SQL client
export const sql = neon(process.env.DATABASE_URL);

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create chats table with user_id
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        model_tier TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        world_params JSONB,
        bible_content TEXT,
        character_content TEXT,
        conversation_state TEXT DEFAULT 'world_generation',
        generation_phase VARCHAR(50) DEFAULT 'world',
        original_bible_content TEXT,
        current_turn INTEGER DEFAULT 0
      )
    `;

    // Create messages table with composite primary key
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        phase VARCHAR(50) NOT NULL DEFAULT 'world',
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        parts JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id, chat_id, phase),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_phase ON messages(phase)`;

    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Migration script to update existing database
export async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');

    // Step 1: Delete all existing data (fresh start as requested)
    console.log('   Deleting all messages...');
    await sql`DELETE FROM messages`;
    console.log('   Deleting all chats...');
    await sql`DELETE FROM chats`;

    // Step 2: Drop old tables
    console.log('   Dropping old tables...');
    await sql`DROP TABLE IF EXISTS messages CASCADE`;
    await sql`DROP TABLE IF EXISTS chats CASCADE`;

    // Step 3: Recreate with new schema
    console.log('   Creating new schema...');
    await initializeDatabase();

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Add parts column to existing messages table (non-destructive migration)
export async function addPartsColumn() {
  try {
    console.log('🔄 Adding parts column to messages table...');

    // Add parts column if it doesn't exist
    await sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS parts JSONB
    `;

    console.log('✅ Parts column added successfully!');
  } catch (error) {
    console.error('❌ Failed to add parts column:', error);
    throw error;
  }
}

// Add current_turn column to existing chats table (non-destructive migration)
export async function addCurrentTurnColumn() {
  try {
    console.log('🔄 Adding current_turn column...');

    // Add column if it doesn't exist
    await sql`
      ALTER TABLE chats
      ADD COLUMN IF NOT EXISTS current_turn INTEGER DEFAULT 0
    `;

    console.log('✅ current_turn column added successfully!');
  } catch (error) {
    console.error('❌ Failed to add current_turn column:', error);
    throw error;
  }
}

// Initialize on module load (for development)
// In production, you might want to run this as a separate migration script
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase()
    .then(() => addPartsColumn())
    .catch(console.error);
}
