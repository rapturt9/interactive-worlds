import { migrateDatabase } from '../lib/db/schema';

async function runMigration() {
  try {
    await migrateDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
