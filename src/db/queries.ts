import { openDatabase } from './database';
import { getDayOfYear } from '../domain/dailyVerse';
import { getBookByName } from '../data/bibleBooks';

export const searchBible = async (query: string, version: 'ht' | 'fr' = 'ht') => {
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

// ... existing imports

export const getChapter = async (book: string, chapter: number, version: 'ht' | 'fr' = 'ht') => {
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

export const searchHymns = async (query: string) => {
  // ... existing code
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
}

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

export const getBookmarks = async (type: 'bible' | 'hymn') => {
  const db = await openDatabase();
  if (type === 'bible') {
    return await db.getAllAsync(`
            SELECT b.*, v.book, v.chapter, v.verse, v.text 
            FROM bookmarks b
            JOIN bible_verses v ON b.reference_id = v.id
            WHERE b.type = 'bible'
            ORDER BY b.created_at DESC
        `);
  } else {
    return await db.getAllAsync(`
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

// Daily Verse Types
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
 *
 * @param version - Bible version ('ht' or 'fr')
 * @param dayOverride - Optional day of year override (for testing)
 * @returns The daily verse with full text, or null if not found
 */
export const getDailyVerse = async (
  version: 'ht' | 'fr' = 'ht',
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

  const reference = formatVerseReference(
    result.book,
    result.chapter,
    result.verseStart,
    result.verseEnd,
    version
  );

  return { ...result, reference };
};

/**
 * Formats a verse reference string with localized book name.
 * The database stores French book names, so we translate to Haitian when needed.
 */
function formatVerseReference(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  version: 'ht' | 'fr'
): string {
  const bookData = getBookByName(book);
  // Database has French names; translate to Haitian if needed
  const localizedBook = bookData
    ? (version === 'ht' ? bookData.nameHt : bookData.nameFr)
    : book;
  const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
  return `${localizedBook} ${chapter}:${verseRange}`;
}
