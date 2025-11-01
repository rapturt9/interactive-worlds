import { sql } from '../lib/db/schema';

/**
 * Migration script to convert TIMESTAMP columns to TIMESTAMPTZ
 * This fixes the timezone handling issue where timestamps were showing as future dates
 */
async function migrateTimestamps() {
  try {
    console.log('🔄 Starting timestamp migration...');

    // Step 1: Alter chats table columns
    console.log('   Converting chats.created_at to TIMESTAMPTZ...');
    await sql`
      ALTER TABLE chats
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'
    `;

    console.log('   Converting chats.updated_at to TIMESTAMPTZ...');
    await sql`
      ALTER TABLE chats
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'
    `;

    // Step 2: Alter messages table columns
    console.log('   Converting messages.timestamp to TIMESTAMPTZ...');
    await sql`
      ALTER TABLE messages
      ALTER COLUMN timestamp TYPE TIMESTAMPTZ USING timestamp AT TIME ZONE 'UTC'
    `;

    console.log('✅ Timestamp migration completed successfully!');
    console.log('   All timestamp columns now use TIMESTAMPTZ with proper UTC handling');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateTimestamps().catch(console.error);
