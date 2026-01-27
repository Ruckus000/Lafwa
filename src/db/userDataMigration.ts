/**
 * User Data Migration Module
 * Handles backup and restore of user data when bundled database content is updated.
 * Uses natural keys to preserve data across database replacements.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { HighlightColor } from '../types/library';

// Backup data types using natural keys (not row IDs)
interface BackupBibleBookmark {
  type: 'bible';
  book: string;
  chapter: number;
  verse: number;
  version: string;
  created_at: string;
}

interface BackupHymnBookmark {
  type: 'hymn';
  hymnNumber: number;
  created_at: string;
}

type BackupBookmark = BackupBibleBookmark | BackupHymnBookmark;

interface BackupHighlight {
  book: string;
  chapter: number;
  verse: number;
  version: string;
  color: HighlightColor;
  created_at: string;
}

interface BackupNote {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  created_at: string;
  updated_at: string;
}

interface BackupHistory {
  type: 'bible' | 'hymn';
  reference: string;
  book: string | null;
  chapter: number | null;
  hymn_number: number | null;
  last_read_at: string;
  read_count: number;
}

export interface UserDataBackup {
  bookmarks: BackupBookmark[];
  highlights: BackupHighlight[];
  notes: BackupNote[];
  history: BackupHistory[];
}

export interface RestoreResult {
  restored: number;
  orphaned: number;
  details: {
    bookmarks: { restored: number; orphaned: number };
    highlights: { restored: number; orphaned: number };
    notes: { restored: number; orphaned: number };
    history: { restored: number; orphaned: number };
  };
}

/**
 * Check if a table exists in the database
 */
async function tableExists(db: SQLiteDatabase, tableName: string): Promise<boolean> {
  const result = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return !!result;
}

/**
 * Backup all user data using natural keys.
 * This allows restoration after database content is replaced.
 * Handles fresh installs where user tables may not exist yet.
 */
export async function backupUserData(db: SQLiteDatabase): Promise<UserDataBackup> {
  let bibleBookmarks: BackupBibleBookmark[] = [];
  let hymnBookmarks: BackupHymnBookmark[] = [];
  let highlights: BackupHighlight[] = [];
  let notes: BackupNote[] = [];
  let history: BackupHistory[] = [];

  // Only backup if tables exist (they won't on fresh install before migrations)
  const hasBookmarks = await tableExists(db, 'bookmarks');
  const hasHighlights = await tableExists(db, 'highlights');
  const hasNotes = await tableExists(db, 'notes');
  const hasHistory = await tableExists(db, 'reading_history');

  if (hasBookmarks) {
    // Backup bible bookmarks with natural keys
    bibleBookmarks = await db.getAllAsync<BackupBibleBookmark>(`
      SELECT
        'bible' as type,
        v.book,
        v.chapter,
        v.verse,
        v.version,
        b.created_at
      FROM bookmarks b
      JOIN bible_verses v ON b.reference_id = v.id
      WHERE b.type = 'bible'
    `);

    // Backup hymn bookmarks using hymn number (stable identifier)
    hymnBookmarks = await db.getAllAsync<BackupHymnBookmark>(`
      SELECT
        'hymn' as type,
        h.number as hymnNumber,
        b.created_at
      FROM bookmarks b
      JOIN hymns h ON b.reference_id = h.id
      WHERE b.type = 'hymn'
    `);
  }

  if (hasHighlights) {
    // Backup highlights with natural keys
    highlights = await db.getAllAsync<BackupHighlight>(`
      SELECT
        v.book,
        v.chapter,
        v.verse,
        v.version,
        h.color,
        h.created_at
      FROM highlights h
      JOIN bible_verses v ON h.verse_id = v.id
    `);
  }

  if (hasNotes) {
    // Notes already use natural keys (book/chapter/verse)
    notes = await db.getAllAsync<BackupNote>(`
      SELECT book, chapter, verse, text, created_at, updated_at
      FROM notes
    `);
  }

  if (hasHistory) {
    // History already uses natural keys
    history = await db.getAllAsync<BackupHistory>(`
      SELECT type, reference, book, chapter, hymn_number, last_read_at, read_count
      FROM reading_history
    `);
  }

  const backup: UserDataBackup = {
    bookmarks: [...bibleBookmarks, ...hymnBookmarks],
    highlights,
    notes,
    history,
  };

  console.log(
    `Backed up: ${backup.bookmarks.length} bookmarks, ` +
    `${backup.highlights.length} highlights, ` +
    `${backup.notes.length} notes, ` +
    `${backup.history.length} history items`
  );

  return backup;
}

/**
 * Restore user data after database replacement.
 * Looks up new row IDs using natural keys.
 * Returns count of restored and orphaned items.
 */
export async function restoreUserData(
  db: SQLiteDatabase,
  backup: UserDataBackup
): Promise<RestoreResult> {
  const result: RestoreResult = {
    restored: 0,
    orphaned: 0,
    details: {
      bookmarks: { restored: 0, orphaned: 0 },
      highlights: { restored: 0, orphaned: 0 },
      notes: { restored: 0, orphaned: 0 },
      history: { restored: 0, orphaned: 0 },
    },
  };

  // Restore bible bookmarks
  for (const bm of backup.bookmarks) {
    if (bm.type === 'bible') {
      const verse = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
        [bm.book, bm.chapter, bm.verse, bm.version]
      );
      if (verse) {
        try {
          await db.runAsync(
            'INSERT OR IGNORE INTO bookmarks (type, reference_id, created_at) VALUES (?, ?, ?)',
            ['bible', verse.id, bm.created_at]
          );
          result.details.bookmarks.restored++;
        } catch (e) {
          console.warn('Failed to restore bible bookmark:', e);
          result.details.bookmarks.orphaned++;
        }
      } else {
        result.details.bookmarks.orphaned++;
      }
    } else {
      // Hymn bookmark
      const hymn = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM hymns WHERE number = ?',
        [bm.hymnNumber]
      );
      if (hymn) {
        try {
          await db.runAsync(
            'INSERT OR IGNORE INTO bookmarks (type, reference_id, created_at) VALUES (?, ?, ?)',
            ['hymn', hymn.id, bm.created_at]
          );
          result.details.bookmarks.restored++;
        } catch (e) {
          console.warn('Failed to restore hymn bookmark:', e);
          result.details.bookmarks.orphaned++;
        }
      } else {
        result.details.bookmarks.orphaned++;
      }
    }
  }

  // Restore highlights
  for (const hl of backup.highlights) {
    const verse = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
      [hl.book, hl.chapter, hl.verse, hl.version]
    );
    if (verse) {
      try {
        await db.runAsync(
          'INSERT OR IGNORE INTO highlights (verse_id, color, created_at) VALUES (?, ?, ?)',
          [verse.id, hl.color, hl.created_at]
        );
        result.details.highlights.restored++;
      } catch (e) {
        console.warn('Failed to restore highlight:', e);
        result.details.highlights.orphaned++;
      }
    } else {
      result.details.highlights.orphaned++;
    }
  }

  // Restore notes (direct insert - already uses natural keys)
  for (const note of backup.notes) {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO notes (book, chapter, verse, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [note.book, note.chapter, note.verse, note.text, note.created_at, note.updated_at]
      );
      result.details.notes.restored++;
    } catch (e) {
      console.warn('Failed to restore note:', e);
      result.details.notes.orphaned++;
    }
  }

  // Restore history (direct insert - already uses natural keys)
  for (const h of backup.history) {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO reading_history (type, reference, book, chapter, hymn_number, last_read_at, read_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [h.type, h.reference, h.book, h.chapter, h.hymn_number, h.last_read_at, h.read_count]
      );
      result.details.history.restored++;
    } catch (e) {
      console.warn('Failed to restore history item:', e);
      result.details.history.orphaned++;
    }
  }

  // Calculate totals
  result.restored =
    result.details.bookmarks.restored +
    result.details.highlights.restored +
    result.details.notes.restored +
    result.details.history.restored;

  result.orphaned =
    result.details.bookmarks.orphaned +
    result.details.highlights.orphaned +
    result.details.notes.orphaned +
    result.details.history.orphaned;

  console.log(
    `Restored ${result.restored} items, ${result.orphaned} orphaned. ` +
    `Details: bookmarks=${result.details.bookmarks.restored}/${result.details.bookmarks.orphaned}, ` +
    `highlights=${result.details.highlights.restored}/${result.details.highlights.orphaned}, ` +
    `notes=${result.details.notes.restored}/${result.details.notes.orphaned}, ` +
    `history=${result.details.history.restored}/${result.details.history.orphaned}`
  );

  return result;
}
