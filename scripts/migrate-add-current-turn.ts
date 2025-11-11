#!/usr/bin/env npx tsx

/**
 * Migration Script: Add current_turn column to chats table
 *
 * This script safely adds the current_turn column to existing databases
 * without affecting existing data.
 *
 * Usage:
 *   npx tsx scripts/migrate-add-current-turn.ts
 */

import { addCurrentTurnColumn } from '../lib/db/schema';

async function runMigration() {
  console.log('🚀 Starting migration: Add current_turn column');
  console.log('================================================\n');

  try {
    await addCurrentTurnColumn();
    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log('   The current_turn column has been added to the chats table.');
    console.log('   All existing chats will have current_turn = 0 by default.');
    process.exit(0);
  } catch (error) {
    console.error('\n================================================');
    console.error('❌ Migration failed!');
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
