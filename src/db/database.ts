import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
// @ts-ignore
import * as FileSystem from 'expo-file-system/src/legacy';
import {
  runMigrations,
  needsContentUpdate,
  setContentVersion,
  CURRENT_CONTENT_VERSION,
} from './migrations';
import { backupUserData, restoreUserData } from './userDataMigration';

const DB_NAME = 'lafwa.db';

// Singleton pattern to prevent concurrent database initialization
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function copyDatabaseAsset(dbPath: string) {
  const asset = Asset.fromModule(require('../assets/lafwa.db'));
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error('Database asset has no localUri');
  }

  await FileSystem.copyAsync({
    from: asset.localUri,
    to: dbPath
  });
  console.log('Database copied to', dbPath);
}

/**
 * Update bundled database content while preserving user data.
 * 1. Backup user data (bookmarks, highlights, notes, history)
 * 2. Replace database with fresh copy from bundled asset
 * 3. Run migrations to create user tables
 * 4. Restore user data
 * 5. Update content version
 */
async function updateBundledContent(
  db: SQLite.SQLiteDatabase,
  dbPath: string
): Promise<SQLite.SQLiteDatabase> {
  // 1. Backup user data using natural keys
  console.log('Backing up user data before content update...');
  const backup = await backupUserData(db);

  // 2. Close database and reset singleton
  await db.closeAsync();
  dbInstance = null;

  // 3. Delete old database and copy fresh one
  await FileSystem.deleteAsync(dbPath, { idempotent: true });
  await copyDatabaseAsset(dbPath);

  // 4. Small delay to ensure file system operations complete
  await new Promise(resolve => setTimeout(resolve, 100));

  // 5. Reopen database fresh
  const newDb = await SQLite.openDatabaseAsync(DB_NAME);

  // 6. Run schema migrations (creates user tables like bookmarks, highlights, notes)
  console.log('Running migrations on fresh database...');
  await runMigrations(newDb);

  // 7. Restore user data
  console.log('Restoring user data...');
  const restoreResult = await restoreUserData(newDb, backup);

  if (restoreResult.orphaned > 0) {
    console.warn(
      `Content update: ${restoreResult.orphaned} items could not be restored ` +
      `(content may have changed)`
    );
  }

  // 8. Update content version to mark this update as complete
  await setContentVersion(newDb, CURRENT_CONTENT_VERSION);
  console.log(`Content updated to version ${CURRENT_CONTENT_VERSION}`);

  return newDb;
}

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Wait for ongoing initialization if in progress
  if (dbInitPromise) {
    return dbInitPromise;
  }

  // Start initialization
  dbInitPromise = initializeDatabase();

  try {
    dbInstance = await dbInitPromise;
    return dbInstance;
  } finally {
    dbInitPromise = null;
  }
}

/**
 * Internal database initialization - only called once via singleton pattern
 */
async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const dbFolder = (FileSystem.documentDirectory || '') + 'SQLite';
  const dbPath = dbFolder + '/' + DB_NAME;

  try {
    const folderInfo = await FileSystem.getInfoAsync(dbFolder);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbFolder);
    }

    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      console.log('Copying database asset...');
      await copyDatabaseAsset(dbPath);
    }
  } catch (e) {
    console.error('Error init DB:', e);
  }

  let db = await SQLite.openDatabaseAsync(DB_NAME);

  // Verify bible_verses table exists
  try {
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='bible_verses'"
    );

    if (!result) {
      console.warn('bible_verses table missing - resetting database');
      await db.closeAsync();
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      await copyDatabaseAsset(dbPath);
      db = await SQLite.openDatabaseAsync(DB_NAME);

      // Final verification
      const verify = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='bible_verses'"
      );
      if (!verify) {
        throw new Error('Database asset is corrupt - bible_verses table missing after fresh copy');
      }
    }
  } catch (e) {
    console.error('Error verifying DB:', e);
    throw e;
  }

  // Run migrations first - this creates user tables if needed
  try {
    const migrationResult = await runMigrations(db);
    if (migrationResult.migrationsRun.length > 0) {
      console.log('Migrations completed:', migrationResult.migrationsRun);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Don't throw - app should still work with existing schema
  }

  // Check if bundled database content needs to be updated
  // This runs AFTER migrations so user tables exist for backup
  try {
    if (await needsContentUpdate(db)) {
      console.log('Bundled database has newer content - updating...');
      db = await updateBundledContent(db, dbPath);
    }
  } catch (e) {
    console.error('Content update check/update failed:', e);
    // Continue with existing database - don't break the app
  }

  // Run migrations again in case content update brought in a fresh database
  try {
    const migrationResult = await runMigrations(db);
    if (migrationResult.migrationsRun.length > 0) {
      console.log('Migrations completed:', migrationResult.migrationsRun);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Don't throw - app should still work with existing schema
  }

  return db;
}
