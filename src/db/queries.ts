import { openDatabase } from './database';

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
