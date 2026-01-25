import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
// @ts-ignore
import * as FileSystem from 'expo-file-system/src/legacy';
import { runMigrations } from './migrations';

const DB_NAME = 'lafwa.db';

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

export async function openDatabase() {
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

  // Run migrations after verification
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
