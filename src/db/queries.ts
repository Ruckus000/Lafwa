import { openDatabase } from './database';
import { getDayOfYear } from '../domain/dailyVerse';
import { getBookByName } from '../data/bibleBooks';
import {
  LibraryCounts,
  Bookmark,
  Highlight,
  HistoryItem,
  HighlightColor,
} from '../types/library';

// ============================================
// BIBLE QUERIES
// ============================================

export const searchBible = async (query: string, version: 'ht' | 'fr' | 'en' = 'ht') => {
  const db = await openDatabase();
  // Using FTS5 match
  const sanitized = query.replace(/"/g, '""');
  const sql = `
    SELECT b.* 
    FROM bible_verses b
    JOIN bible_fts f ON b.id = f.rowid
    WHERE bible_fts MATCH ? AND b.version = ?
    ORDER BY rank
    LIMIT 20;
  `;
  return await db.getAllAsync(sql, [sanitized, version]);
};

/**
 * Get chapter verses with user data (bookmarks, highlights, notes)
 * SINGLE QUERY - fixes the N+1 performance problem
 */
export interface VerseWithUserData {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  bookmarked: boolean;
  highlightColor: HighlightColor | null;
  hasNote: boolean;
}

export const getChapterWithUserData = async (
  book: string,
  chapter: number,
  version: 'ht' | 'fr' | 'en' = 'ht'
): Promise<VerseWithUserData[]> => {
  const db = await openDatabase();

  const rows = await db.getAllAsync<{
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
    bookmark_id: number | null;
    highlight_color: HighlightColor | null;
    note_id: number | null;
  }>(
    `
    SELECT 
      v.id,
      v.book,
      v.chapter,
      v.verse,
      v.text,
      v.version,
      b.id as bookmark_id,
      h.color as highlight_color,
      n.id as note_id
    FROM bible_verses v
    LEFT JOIN bookmarks b ON v.id = b.reference_id AND b.type = 'bible'
    LEFT JOIN highlights h ON v.id = h.verse_id
    LEFT JOIN notes n ON v.book = n.book AND v.chapter = n.chapter AND v.verse = n.verse
    WHERE v.book = ? AND v.chapter = ? AND v.version = ?
    ORDER BY v.verse ASC
    `,
    [book, chapter, version]
  );

  return rows.map((row) => ({
    id: row.id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    version: row.version,
    bookmarked: row.bookmark_id !== null,
    highlightColor: row.highlight_color,
    hasNote: row.note_id !== null,
  }));
};

/**
 * @deprecated Use getChapterWithUserData for better performance
 */
export const getChapter = async (book: string, chapter: number, version: 'ht' | 'fr' | 'en' = 'ht') => {
  const db = await openDatabase();
  return await db.getAllAsync(
    'SELECT * FROM bible_verses WHERE book = ? AND chapter = ? AND version = ? ORDER BY verse ASC',
    [book, chapter, version]
  );
};

export const getBookList = async () => {
  const db = await openDatabase();
  // Get unique books from one version to be fast
  return await db.getAllAsync('SELECT DISTINCT book FROM bible_verses WHERE version = "ht" ORDER BY id ASC');
};

// ============================================
// HYMN QUERIES
// ============================================

export const searchHymns = async (query: string) => {
  const db = await openDatabase();
  const sanitized = query.replace(/"/g, '""');
  const sql = `
    SELECT h.* 
    FROM hymns h
    JOIN hymns_fts f ON h.id = f.rowid
    WHERE hymns_fts MATCH ?
    ORDER BY rank
    LIMIT 20;
  `;
  return await db.getAllAsync(sql, [sanitized]);
};

export const getHymnByNumber = async (number: number) => {
  const db = await openDatabase();
  return await db.getFirstAsync('SELECT * FROM hymns WHERE number = ?', [number]);
};

export interface HymnSection {
  id: number;
  section_type: 'verse' | 'refrain';
  section_number: number | null;
  display_order: number;
  text_fr: string | null;
  text_ht: string | null;
}

export interface HymnWithSections {
  id: number;
  number: number;
  title_fr: string | null;
  title_ht: string | null;
  sections: HymnSection[];
}

export async function getHymnWithSections(hymnNumber: number): Promise<HymnWithSections | null> {
  const db = await openDatabase();

  const hymn = await db.getFirstAsync<{
    id: number;
    number: number;
    title_fr: string | null;
    title_ht: string | null;
  }>('SELECT id, number, title_fr, title_ht FROM hymns WHERE number = ?', [hymnNumber]);

  if (!hymn) return null;

  const sections = await db.getAllAsync<HymnSection>(
    'SELECT id, section_type, section_number, display_order, text_fr, text_ht FROM hymn_sections WHERE hymn_id = ? ORDER BY display_order',
    [hymn.id]
  );

  return { ...hymn, sections };
}

export interface HymnListItem {
  id: number;
  number: number;
  title_fr: string | null;
  title_ht: string | null;
}

export async function getAllHymns(): Promise<HymnListItem[]> {
  const db = await openDatabase();
  return await db.getAllAsync<HymnListItem>(
    'SELECT id, number, title_fr, title_ht FROM hymns ORDER BY number'
  );
}

// ============================================
// BOOKMARK QUERIES
// ============================================

export const toggleBookmark = async (type: 'bible' | 'hymn', id: number) => {
  const db = await openDatabase();
  const existing = await db.getFirstAsync('SELECT id FROM bookmarks WHERE type = ? AND reference_id = ?', [type, id]);
  if (existing) {
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [(existing as any).id]);
    return false; // Removed
  } else {
    await db.runAsync('INSERT INTO bookmarks (type, reference_id) VALUES (?, ?)', [type, id]);
    return true; // Added
  }
};

export const getBookmarks = async (type: 'bible' | 'hymn'): Promise<Bookmark[]> => {
  const db = await openDatabase();
  if (type === 'bible') {
    return await db.getAllAsync<Bookmark>(`
      SELECT b.*, v.book, v.chapter, v.verse, v.text
      FROM bookmarks b
      JOIN bible_verses v ON b.reference_id = v.id
      WHERE b.type = 'bible'
      ORDER BY b.created_at DESC
    `);
  } else {
    return await db.getAllAsync<Bookmark>(`
      SELECT b.*, h.number, h.title
      FROM bookmarks b
      JOIN hymns h ON b.reference_id = h.id
      WHERE b.type = 'hymn'
      ORDER BY b.created_at DESC
    `);
  }
};

export const isBookmarked = async (type: 'bible' | 'hymn', id: number) => {
  const db = await openDatabase();
  const result = await db.getFirstAsync('SELECT id FROM bookmarks WHERE type = ? AND reference_id = ?', [type, id]);
  return !!result;
};

// ============================================
// HIGHLIGHT QUERIES
// ============================================

export async function getAllHighlights(version: 'ht' | 'fr' | 'en' = 'ht'): Promise<Highlight[]> {
  const db = await openDatabase();

  return await db.getAllAsync<Highlight>(
    `
    SELECT h.*, v.book, v.chapter, v.verse, v.text
    FROM highlights h
    JOIN bible_verses v ON h.verse_id = v.id
    WHERE v.version = ?
    ORDER BY h.created_at DESC
    LIMIT 100
  `,
    [version]
  );
}

export async function addHighlight(verseId: number, color: HighlightColor): Promise<number> {
  const db = await openDatabase();

  // Upsert: update color if exists, insert if not
  await db.runAsync(
    `
    INSERT INTO highlights (verse_id, color) VALUES (?, ?)
    ON CONFLICT(verse_id) DO UPDATE SET color = excluded.color
  `,
    [verseId, color]
  );

  const result = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM highlights WHERE verse_id = ?',
    [verseId]
  );

  return result?.id ?? 0;
}

export async function removeHighlight(verseId: number): Promise<void> {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM highlights WHERE verse_id = ?', [verseId]);
}

export async function getHighlightForVerse(verseId: number): Promise<HighlightColor | null> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ color: HighlightColor }>(
    'SELECT color FROM highlights WHERE verse_id = ?',
    [verseId]
  );
  return result?.color ?? null;
}

// ============================================
// HISTORY QUERIES
// ============================================

export async function getReadingHistory(limit: number = 20): Promise<HistoryItem[]> {
  const db = await openDatabase();

  const rows = await db.getAllAsync<HistoryItem>(
    `
    SELECT *,
      CASE
        WHEN type = 'bible' THEN book || ' ' || chapter
        ELSE 'Kantik #' || hymn_number
      END as displayTitle
    FROM reading_history
    ORDER BY last_read_at DESC
    LIMIT ?
  `,
    [limit]
  );

  return rows;
}

export async function recordReading(
  type: 'bible' | 'hymn',
  reference: string,
  metadata: { book?: string; chapter?: number; hymnNumber?: number }
): Promise<void> {
  const db = await openDatabase();

  await db.runAsync(
    `
    INSERT INTO reading_history (type, reference, book, chapter, hymn_number)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(type, reference) DO UPDATE SET
      last_read_at = CURRENT_TIMESTAMP,
      read_count = read_count + 1
  `,
    [type, reference, metadata.book ?? null, metadata.chapter ?? null, metadata.hymnNumber ?? null]
  );
}

export async function clearReadingHistory(): Promise<void> {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM reading_history');
}

// ============================================
// FAVORITES (uses bookmarks table with type='hymn')
// ============================================

export async function getFavoriteHymns(): Promise<Bookmark[]> {
  return getBookmarks('hymn');
}

export async function toggleFavoriteHymn(hymnId: number): Promise<boolean> {
  return toggleBookmark('hymn', hymnId);
}

export async function isHymnFavorite(hymnId: number): Promise<boolean> {
  return isBookmarked('hymn', hymnId);
}

// ============================================
// DAILY VERSE
// ============================================

export interface DailyVerse {
  dayOfYear: number;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  theme: string | null;
  verseId: number;
  text: string;
  reference: string;
}

interface DailyVerseRow {
  dayOfYear: number;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  theme: string | null;
  verseId: number;
  text: string;
}

/**
 * Retrieves the daily verse for today (or a specific day).
 */
export const getDailyVerse = async (
  version: 'ht' | 'fr' | 'en' = 'ht',
  dayOverride?: number
): Promise<DailyVerse | null> => {
  const db = await openDatabase();
  const today = dayOverride ?? getDayOfYear();

  const sql = `
    SELECT
      dv.day_of_year as dayOfYear,
      dv.book,
      dv.chapter,
      dv.verse_start as verseStart,
      dv.verse_end as verseEnd,
      dv.theme,
      bv.id as verseId,
      CASE
        WHEN dv.verse_end IS NULL THEN bv.text
        ELSE (
          SELECT GROUP_CONCAT(text, ' ')
          FROM bible_verses
          WHERE book = dv.book
            AND chapter = dv.chapter
            AND verse >= dv.verse_start
            AND verse <= dv.verse_end
            AND version = ?
          ORDER BY verse
        )
      END as text
    FROM daily_verses dv
    JOIN bible_verses bv
      ON bv.book = dv.book
      AND bv.chapter = dv.chapter
      AND bv.verse = dv.verse_start
      AND bv.version = ?
    WHERE dv.day_of_year = ?
    LIMIT 1
  `;

  const result = await db.getFirstAsync<DailyVerseRow>(sql, [version, version, today]);

  if (!result) {
    console.warn(`No daily verse found for day ${today}`);
    return null;
  }

  const reference = formatVerseReferenceInternal(
    result.book,
    result.chapter,
    result.verseStart,
    result.verseEnd,
    version
  );

  return { ...result, reference };
};

function formatVerseReferenceInternal(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  version: 'ht' | 'fr' | 'en'
): string {
  const bookData = getBookByName(book);
  let localizedBook = book;
  if (bookData) {
    if (version === 'ht') localizedBook = bookData.nameHt;
    else if (version === 'en') localizedBook = bookData.nameEn;
    else localizedBook = bookData.nameFr;
  }
  const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
  return `${localizedBook} ${chapter}:${verseRange}`;
}

// ============================================
// LIBRARY COUNTS
// ============================================

export async function getLibraryCounts(): Promise<LibraryCounts> {
  const db = await openDatabase();

  const [bookmarksResult, highlightsResult, favoritesResult, notesResult] = await Promise.all([
    db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks WHERE type = ?',
      ['bible']
    ),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM highlights'),
    db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks WHERE type = ?',
      ['hymn']
    ),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notes'),
  ]);

  return {
    bookmarks: bookmarksResult?.count ?? 0,
    highlights: highlightsResult?.count ?? 0,
    favorites: favoritesResult?.count ?? 0,
    notes: notesResult?.count ?? 0,
  };
}

// ============================================
// NOTES QUERIES (Language-agnostic - v4 schema)
// ============================================

export interface NoteWithVerse {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  verseText: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get note for a specific verse location (language-agnostic)
 */
export async function getNoteForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<string | null> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ text: string }>(
    'SELECT text FROM notes WHERE book = ? AND chapter = ? AND verse = ?',
    [book, chapter, verse]
  );
  return result?.text ?? null;
}

/**
 * Check if a note exists for a verse location
 */
export async function hasNoteForVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<boolean> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notes WHERE book = ? AND chapter = ? AND verse = ?',
    [book, chapter, verse]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Save or update a note for a verse
 */
export async function saveNote(
  book: string,
  chapter: number,
  verse: number,
  text: string
): Promise<void> {
  const db = await openDatabase();

  if (text.trim() === '') {
    // Delete note if text is empty
    await db.runAsync(
      'DELETE FROM notes WHERE book = ? AND chapter = ? AND verse = ?',
      [book, chapter, verse]
    );
    return;
  }

  // Upsert: insert or update
  await db.runAsync(
    `
    INSERT INTO notes (book, chapter, verse, text) VALUES (?, ?, ?, ?)
    ON CONFLICT(book, chapter, verse) DO UPDATE SET
      text = excluded.text,
      updated_at = CURRENT_TIMESTAMP
    `,
    [book, chapter, verse, text.trim()]
  );
}

/**
 * Delete a note by location
 */
export async function deleteNote(
  book: string,
  chapter: number,
  verse: number
): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    'DELETE FROM notes WHERE book = ? AND chapter = ? AND verse = ?',
    [book, chapter, verse]
  );
}

/**
 * Get all notes with verse text for display
 * Now language-agnostic - works regardless of which language user is viewing
 *
 * @param version - Used only to get verse text for preview, not for filtering notes
 * @param limit - Max notes to return (default 100)
 * @param offset - Pagination offset (default 0)
 */
export async function getAllNotes(
  version: 'ht' | 'fr' | 'en' = 'ht',
  limit: number = 100,
  offset: number = 0
): Promise<NoteWithVerse[]> {
  const db = await openDatabase();

  return await db.getAllAsync<NoteWithVerse>(
    `
    SELECT
      n.id,
      n.book,
      n.chapter,
      n.verse,
      n.text,
      COALESCE(v.text, '') as verseText,
      n.created_at,
      n.updated_at
    FROM notes n
    LEFT JOIN bible_verses v ON 
      n.book = v.book AND 
      n.chapter = v.chapter AND 
      n.verse = v.verse AND 
      v.version = ?
    ORDER BY n.updated_at DESC
    LIMIT ? OFFSET ?
    `,
    [version, limit, offset]
  );
}

/**
 * Get total count of notes (for pagination)
 */
export async function getNotesCount(): Promise<number> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notes'
  );
  return result?.count ?? 0;
}

// ============================================
// LEGACY NOTES API (for backward compatibility during migration)
// These will be removed after all components are updated
// ============================================

/**
 * @deprecated Use getNoteForVerse(book, chapter, verse) instead
 */
export async function getNoteForVerseById(verseId: number): Promise<string | null> {
  const db = await openDatabase();
  // Get verse details first, then look up note by location
  const verse = await db.getFirstAsync<{ book: string; chapter: number; verse: number }>(
    'SELECT book, chapter, verse FROM bible_verses WHERE id = ?',
    [verseId]
  );
  if (!verse) return null;
  return getNoteForVerse(verse.book, verse.chapter, verse.verse);
}

/**
 * @deprecated Use saveNote(book, chapter, verse, text) instead
 */
export async function saveNoteById(verseId: number, text: string): Promise<void> {
  const db = await openDatabase();
  const verse = await db.getFirstAsync<{ book: string; chapter: number; verse: number }>(
    'SELECT book, chapter, verse FROM bible_verses WHERE id = ?',
    [verseId]
  );
  if (!verse) {
    console.error('Cannot save note: verse not found for id', verseId);
    return;
  }
  return saveNote(verse.book, verse.chapter, verse.verse, text);
}

/**
 * @deprecated Use hasNoteForVerse(book, chapter, verse) instead
 */
export async function hasNoteForVerseById(verseId: number): Promise<boolean> {
  const db = await openDatabase();
  const verse = await db.getFirstAsync<{ book: string; chapter: number; verse: number }>(
    'SELECT book, chapter, verse FROM bible_verses WHERE id = ?',
    [verseId]
  );
  if (!verse) return false;
  return hasNoteForVerse(verse.book, verse.chapter, verse.verse);
}
