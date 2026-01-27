/**
 * Database Migration System
 * Handles schema updates for existing installations
 */

import { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_SCHEMA_VERSION = 5;
export const CURRENT_CONTENT_VERSION = 2;  // Bumped to trigger daily_verses seed update

interface MigrationResult {
  previousVersion: number;
  currentVersion: number;
  migrationsRun: number[];
}

interface VersionInfo {
  schemaVersion: number;
  contentVersion: number;
}

/**
 * Get current schema version from database
 */
async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    // Create version table if it doesn't exist
    // Note: content_version column may be added by migration v5 or getVersionInfo
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        content_version INTEGER DEFAULT 0
      );
    `);

    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version LIMIT 1'
    );

    return result?.version ?? 1; // Default to v1 if no version recorded
  } catch (error) {
    console.warn('Error getting schema version:', error);
    return 1;
  }
}

/**
 * Get both schema and content versions from database
 */
async function getVersionInfo(db: SQLiteDatabase): Promise<VersionInfo> {
  try {
    // Ensure table exists with content_version column
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        content_version INTEGER DEFAULT 0
      );
    `);

    // Check if content_version column exists (for existing installs)
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(schema_version)"
    );
    const hasContentVersion = tableInfo.some((col) => col.name === 'content_version');

    if (!hasContentVersion) {
      await db.execAsync('ALTER TABLE schema_version ADD COLUMN content_version INTEGER DEFAULT 0');
    }

    const result = await db.getFirstAsync<{ version: number; content_version: number }>(
      'SELECT version, COALESCE(content_version, 0) as content_version FROM schema_version LIMIT 1'
    );

    return {
      schemaVersion: result?.version ?? 1,
      contentVersion: result?.content_version ?? 0,
    };
  } catch (error) {
    console.warn('Error getting version info:', error);
    return { schemaVersion: 1, contentVersion: 0 };
  }
}

/**
 * Check if bundled database content needs to be updated.
 * Returns false on fresh install (we just copied the latest bundled DB).
 */
export async function needsContentUpdate(db: SQLiteDatabase): Promise<boolean> {
  const { schemaVersion, contentVersion } = await getVersionInfo(db);

  // If content_version is 0, this is either:
  // 1. Fresh install - just set content_version and return false
  // 2. Upgrade from old version without content versioning - need to update
  //
  // We can detect fresh install by checking if user data exists.
  // On fresh install, there's no user data to preserve, so just set version.
  if (contentVersion === 0) {
    const hasUserData = await checkForUserData(db);
    if (!hasUserData) {
      // Fresh install - just set content version, no update needed
      console.log('Fresh install detected - setting content version');
      await setContentVersion(db, CURRENT_CONTENT_VERSION);
      return false;
    }
    // Has user data but no content version - needs update
    return true;
  }

  return contentVersion < CURRENT_CONTENT_VERSION;
}

/**
 * Check if there's any user data in the database (bookmarks, highlights, notes, history)
 */
async function checkForUserData(db: SQLiteDatabase): Promise<boolean> {
  try {
    // Check bookmarks table
    const bookmarks = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks'
    );
    if (bookmarks && bookmarks.count > 0) return true;

    // Check highlights table
    const highlights = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM highlights'
    );
    if (highlights && highlights.count > 0) return true;

    // Check notes table
    const notes = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes'
    );
    if (notes && notes.count > 0) return true;

    // Check reading_history table
    const history = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reading_history'
    );
    if (history && history.count > 0) return true;

    return false;
  } catch (e) {
    // Tables might not exist yet - definitely fresh install
    return false;
  }
}

/**
 * Set the content version after a successful content update
 */
export async function setContentVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync(`UPDATE schema_version SET content_version = ${version}`);
}

/**
 * Set schema version in database
 * Preserves content_version when updating schema version
 */
async function setSchemaVersion(db: SQLiteDatabase, version: number): Promise<void> {
  // Get current content version to preserve it
  const current = await db.getFirstAsync<{ content_version: number }>(
    'SELECT COALESCE(content_version, 0) as content_version FROM schema_version LIMIT 1'
  );
  const contentVersion = current?.content_version ?? 0;

  await db.execAsync(`
    DELETE FROM schema_version;
    INSERT INTO schema_version (version, content_version) VALUES (${version}, ${contentVersion});
  `);
}

/**
 * Migration definitions
 * Each migration runs once and bumps the version
 */
const migrations: Record<number, (db: SQLiteDatabase) => Promise<void>> = {
  // Migration to v2: Add highlights and reading_history tables
  2: async (db: SQLiteDatabase) => {
    console.log('Running migration v2: Adding highlights and reading_history tables');

    await db.execAsync(`
      -- Highlights table for verse highlighting
      CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verse_id INTEGER NOT NULL,
        color TEXT NOT NULL CHECK(color IN ('yellow', 'green', 'blue', 'pink')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(verse_id),
        FOREIGN KEY (verse_id) REFERENCES bible_verses(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_highlights_verse_id ON highlights(verse_id);

      -- Reading history table
      CREATE TABLE IF NOT EXISTS reading_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('bible', 'hymn')),
        reference TEXT NOT NULL,
        book TEXT,
        chapter INTEGER,
        hymn_number INTEGER,
        last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_count INTEGER DEFAULT 1,
        UNIQUE(type, reference)
      );

      CREATE INDEX IF NOT EXISTS idx_reading_history_type ON reading_history(type);
      CREATE INDEX IF NOT EXISTS idx_reading_history_last_read ON reading_history(last_read_at DESC);
    `);
  },

  // Migration to v3: Add notes table for personal verse notes
  3: async (db: SQLiteDatabase) => {
    console.log('Running migration v3: Adding notes table');

    await db.execAsync(`
      -- Notes table for personal verse notes
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verse_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(verse_id),
        FOREIGN KEY (verse_id) REFERENCES bible_verses(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notes_verse_id ON notes(verse_id);
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
    `);
  },

  // Migration to v4: Make notes language-agnostic by storing book/chapter/verse
  // instead of version-specific verse_id
  4: async (db: SQLiteDatabase) => {
    console.log('Running migration v4: Making notes language-agnostic');

    // 1. Create new notes table with book/chapter/verse columns
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book, chapter, verse)
      );

      CREATE INDEX IF NOT EXISTS idx_notes_v2_location ON notes_v2(book, chapter, verse);
      CREATE INDEX IF NOT EXISTS idx_notes_v2_updated ON notes_v2(updated_at DESC);
    `);

    // 2. Migrate existing data from old notes table
    // Join with bible_verses to get book/chapter/verse
    try {
      await db.execAsync(`
        INSERT OR IGNORE INTO notes_v2 (book, chapter, verse, text, created_at, updated_at)
        SELECT DISTINCT v.book, v.chapter, v.verse, n.text, n.created_at, n.updated_at
        FROM notes n
        JOIN bible_verses v ON n.verse_id = v.id;
      `);
      console.log('Migrated existing notes to v2 schema');
    } catch (error) {
      console.warn('No existing notes to migrate or migration failed:', error);
    }

    // 3. Drop old notes table and rename new one
    await db.execAsync(`
      DROP TABLE IF EXISTS notes;
      ALTER TABLE notes_v2 RENAME TO notes;
    `);

    console.log('Notes table migration complete - now language-agnostic');
  },

  // Migration to v5: Add content version tracking
  5: async (db: SQLiteDatabase) => {
    console.log('Running migration v5: Adding content version tracking');

    // Check if content_version column already exists
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(schema_version)"
    );
    const hasContentVersion = tableInfo.some((col) => col.name === 'content_version');

    if (!hasContentVersion) {
      await db.execAsync('ALTER TABLE schema_version ADD COLUMN content_version INTEGER DEFAULT 0');
    }

    console.log('Content version tracking added');
  },
};

/**
 * Run all pending migrations
 * Call this after opening the database
 */
export async function runMigrations(db: SQLiteDatabase): Promise<MigrationResult> {
  const previousVersion = await getSchemaVersion(db);
  const migrationsRun: number[] = [];

  console.log(`Database schema version: ${previousVersion}, target: ${CURRENT_SCHEMA_VERSION}`);

  if (previousVersion >= CURRENT_SCHEMA_VERSION) {
    return { previousVersion, currentVersion: previousVersion, migrationsRun };
  }

  // Run each migration in order
  for (let version = previousVersion + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
    const migration = migrations[version];
    if (migration) {
      try {
        await migration(db);
        await setSchemaVersion(db, version);
        migrationsRun.push(version);
        console.log(`Migration v${version} completed successfully`);
      } catch (error) {
        console.error(`Migration v${version} failed:`, error);
        throw new Error(`Migration to v${version} failed: ${error}`);
      }
    }
  }

  return {
    previousVersion,
    currentVersion: CURRENT_SCHEMA_VERSION,
    migrationsRun,
  };
}
