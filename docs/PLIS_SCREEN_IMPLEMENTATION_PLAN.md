# Plis (More) Screen Implementation Plan

**Version:** 2.0  
**Created:** January 2026  
**Updated:** January 2026  
**Status:** Ready for Implementation

---

## Overview

This plan addresses the gaps identified in the Plis screen code review. The current implementation is approximately 30% complete with non-functional search, library items, and info sections.

**Goal:** Transform the Plis screen from a UI mockup into a fully functional settings and library hub.

**Design Principles Applied:**
- **YAGNI:** Build only what's needed now; no speculative features
- **KISS:** Use hooks over stores where possible; minimize abstraction layers
- **SRP:** Each file has one clear purpose
- **DRY:** Extract components only after 2-3 real repetitions exist

---

## Architecture Decisions

### Decision 1: Hooks Over Stores (KISS/YAGNI)

**Problem:** Original plan created 3 separate Zustand stores for related data.

**Decision:** Use custom hooks that call queries directly. Stores add unnecessary complexity when:
- Data doesn't need to be shared across distant components
- There's no need for optimistic updates yet
- The existing pattern (`useSearch`, `useDailyVerse`) uses hooks successfully

**Result:** Replace `libraryStore`, `highlightsStore`, `historyStore` with:
- `useLibrary()` - single hook for all library data
- Individual hooks for specific screens when needed

### Decision 2: Favorites = Bookmarks with type='hymn' (YAGNI)

**Problem:** Original plan was ambiguous about favorites table.

**Decision:** Reuse existing `bookmarks` table with `type='hymn'` for favorites. The schema already supports this:
```sql
CREATE TABLE IF NOT EXISTS bookmarks (
    type TEXT NOT NULL, -- 'bible' or 'hymn'
    reference_id INTEGER NOT NULL,
    ...
);
```

**Result:** No new table needed. Query favorites with `WHERE type = 'hymn'`.

### Decision 3: Runtime Schema Migrations (Required)

**Problem:** Database is bundled as asset; new tables won't exist for existing users.

**Decision:** Add migration system to `database.ts` that runs on app start.

---

## Parallel Execution Strategy

The work is divided into **5 independent tracks** that can be executed simultaneously. Track 5 depends on Tracks 1-4.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRACK 0 (Do First - 30 min)                    │
│                     Pre-Flight & Migrations                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 1 (Parallel)                          │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────┤
│   TRACK 1   │   TRACK 2   │   TRACK 3   │   TRACK 4   │  TRACK 5   │
│    Data     │ Navigation  │   i18n/     │ Components  │Integration │
│    Layer    │  & Routes   │   Labels    │  Extraction │  (WAIT)    │
│             │             │             │             │            │
│  ~1.5 hours │  ~2 hours   │  ~1 hour    │  ~1 hour    │  ~2 hours  │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2 (After Tracks 1-4)                       │
├─────────────────────────────────────────────────────────────────────┤
│                          TRACK 5                                    │
│                   Integration & Wiring                              │
│                        ~2 hours                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Track 0: Pre-Flight & Migrations (DO FIRST)

**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Blocks:** All other tracks

This track ensures the foundation is solid before parallel work begins.

### 0.1 Verify Build

```bash
cd /Users/jphilistin/Documents/Coding/Lafwa
npx expo start --clear
```

Confirm app builds and runs without errors.

### 0.2 Create Migration System

**File:** `src/db/migrations.ts`

```typescript
/**
 * Database Migration System
 * Handles schema updates for existing installations
 */

import { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_SCHEMA_VERSION = 2;

interface MigrationResult {
  previousVersion: number;
  currentVersion: number;
  migrationsRun: number[];
}

/**
 * Get current schema version from database
 */
async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    // Create version table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
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
 * Set schema version in database
 */
async function setSchemaVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync('DELETE FROM schema_version');
  await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [version]);
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
    migrationsRun 
  };
}
```

### 0.3 Update database.ts to Run Migrations

**File:** `src/db/database.ts` (modify existing)

Add migration call after database open:

```typescript
import { runMigrations } from './migrations';

export async function openDatabase() {
  // ... existing code to open database ...
  
  let db = await SQLite.openDatabaseAsync(DB_NAME);

  // ... existing verification code ...

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
```

### 0.4 Create Type Definitions

**File:** `src/types/library.ts`

```typescript
/**
 * Type definitions for library features
 */

// Highlight colors matching UX spec
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

// Database row types
export interface BookmarkRow {
  id: number;
  type: 'bible' | 'hymn';
  reference_id: number;
  created_at: string;
}

export interface HighlightRow {
  id: number;
  verse_id: number;
  color: HighlightColor;
  created_at: string;
}

export interface HistoryRow {
  id: number;
  type: 'bible' | 'hymn';
  reference: string;
  book: string | null;
  chapter: number | null;
  hymn_number: number | null;
  last_read_at: string;
  read_count: number;
}

// Enriched types with joined data
export interface Bookmark extends BookmarkRow {
  // For bible bookmarks
  book?: string;
  chapter?: number;
  verse?: number;
  text?: string;
  // For hymn bookmarks
  hymnNumber?: number;
  hymnTitle?: string;
}

export interface Highlight extends HighlightRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface HistoryItem extends HistoryRow {
  displayTitle: string;
}

// Library counts for Plis screen
export interface LibraryCounts {
  bookmarks: number;
  highlights: number;
  favorites: number;
}
```

### Track 0 Deliverables Checklist

- [ ] App builds and runs without errors
- [ ] `src/db/migrations.ts` created
- [ ] `src/db/database.ts` updated to call migrations
- [ ] `src/types/library.ts` created
- [ ] Migration tested: fresh install creates new tables
- [ ] Migration tested: existing install adds new tables

---

## Track 1: Data Layer

**Agent Assignment:** Agent A  
**Estimated Time:** 1.5 hours  
**Dependencies:** Track 0 complete  
**Blocks:** Track 5

### 1.1 Add Database Queries

**File:** `src/db/queries.ts` (add to existing)

```typescript
import { 
  Bookmark, 
  Highlight, 
  HistoryItem, 
  LibraryCounts,
  HighlightColor 
} from '../types/library';

// ============================================
// COUNT QUERIES
// ============================================

export async function getLibraryCounts(): Promise<LibraryCounts> {
  const db = await openDatabase();
  
  const [bookmarksResult, highlightsResult, favoritesResult] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookmarks WHERE type = ?', ['bible']),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM highlights'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookmarks WHERE type = ?', ['hymn']),
  ]);
  
  return {
    bookmarks: bookmarksResult?.count ?? 0,
    highlights: highlightsResult?.count ?? 0,
    favorites: favoritesResult?.count ?? 0,
  };
}

// ============================================
// BOOKMARK QUERIES (existing + enhanced)
// ============================================

export async function getAllBookmarks(type?: 'bible' | 'hymn'): Promise<Bookmark[]> {
  const db = await openDatabase();
  
  if (type === 'bible' || !type) {
    const bibleBookmarks = await db.getAllAsync<Bookmark>(`
      SELECT b.*, v.book, v.chapter, v.verse, v.text
      FROM bookmarks b
      JOIN bible_verses v ON b.reference_id = v.id
      WHERE b.type = 'bible'
      ORDER BY b.created_at DESC
      LIMIT 100
    `);
    if (type === 'bible') return bibleBookmarks;
  }
  
  if (type === 'hymn' || !type) {
    const hymnBookmarks = await db.getAllAsync<Bookmark>(`
      SELECT b.*, h.number as hymnNumber, h.title_ht as hymnTitle
      FROM bookmarks b
      JOIN hymns h ON b.reference_id = h.id
      WHERE b.type = 'hymn'
      ORDER BY b.created_at DESC
      LIMIT 100
    `);
    if (type === 'hymn') return hymnBookmarks;
  }
  
  // Return both if no type specified
  const [bible, hymn] = await Promise.all([
    getAllBookmarks('bible'),
    getAllBookmarks('hymn'),
  ]);
  return [...bible, ...hymn];
}

// Note: toggleBookmark, isBookmarked already exist in queries.ts

// ============================================
// HIGHLIGHT QUERIES
// ============================================

export async function getAllHighlights(version: 'ht' | 'fr' = 'ht'): Promise<Highlight[]> {
  const db = await openDatabase();
  
  return await db.getAllAsync<Highlight>(`
    SELECT h.*, v.book, v.chapter, v.verse, v.text
    FROM highlights h
    JOIN bible_verses v ON h.verse_id = v.id
    WHERE v.version = ?
    ORDER BY h.created_at DESC
    LIMIT 100
  `, [version]);
}

export async function addHighlight(verseId: number, color: HighlightColor): Promise<number> {
  const db = await openDatabase();
  
  // Upsert: update color if exists, insert if not
  await db.runAsync(`
    INSERT INTO highlights (verse_id, color) VALUES (?, ?)
    ON CONFLICT(verse_id) DO UPDATE SET color = excluded.color
  `, [verseId, color]);
  
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
  
  const rows = await db.getAllAsync<HistoryItem>(`
    SELECT *,
      CASE 
        WHEN type = 'bible' THEN book || ' ' || chapter
        ELSE 'Kantik #' || hymn_number
      END as displayTitle
    FROM reading_history
    ORDER BY last_read_at DESC
    LIMIT ?
  `, [limit]);
  
  return rows;
}

export async function recordReading(
  type: 'bible' | 'hymn',
  reference: string,
  metadata: { book?: string; chapter?: number; hymnNumber?: number }
): Promise<void> {
  const db = await openDatabase();
  
  await db.runAsync(`
    INSERT INTO reading_history (type, reference, book, chapter, hymn_number)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(type, reference) DO UPDATE SET
      last_read_at = CURRENT_TIMESTAMP,
      read_count = read_count + 1
  `, [
    type,
    reference,
    metadata.book ?? null,
    metadata.chapter ?? null,
    metadata.hymnNumber ?? null,
  ]);
}

export async function clearReadingHistory(): Promise<void> {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM reading_history');
}

// ============================================
// FAVORITES (uses bookmarks table with type='hymn')
// ============================================

export async function getFavoriteHymns(): Promise<Bookmark[]> {
  return getAllBookmarks('hymn');
}

export async function toggleFavoriteHymn(hymnId: number): Promise<boolean> {
  return toggleBookmark('hymn', hymnId);
}

export async function isHymnFavorite(hymnId: number): Promise<boolean> {
  return isBookmarked('hymn', hymnId);
}
```

### 1.2 Create Custom Hooks

**File:** `src/hooks/useLibrary.ts`

```typescript
/**
 * useLibrary Hook
 * Single hook for all library data (KISS principle)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getLibraryCounts,
  getAllBookmarks,
  getAllHighlights,
  getReadingHistory,
  toggleBookmark,
  removeHighlight,
  clearReadingHistory,
} from '../db/queries';
import { 
  LibraryCounts, 
  Bookmark, 
  Highlight, 
  HistoryItem 
} from '../types/library';
import { useSettingsStore } from '../stores/settingsStore';

interface UseLibraryReturn {
  // Counts for Plis screen
  counts: LibraryCounts;
  countsLoading: boolean;
  refreshCounts: () => Promise<void>;
  
  // Full data for detail screens
  bookmarks: Bookmark[];
  highlights: Highlight[];
  history: HistoryItem[];
  dataLoading: boolean;
  
  // Actions
  loadBookmarks: () => Promise<void>;
  loadHighlights: () => Promise<void>;
  loadHistory: () => Promise<void>;
  removeBookmark: (type: 'bible' | 'hymn', id: number) => Promise<void>;
  removeHighlightById: (verseId: number) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export function useLibrary(): UseLibraryReturn {
  const { bibleVersion } = useSettingsStore();
  
  // Counts (loaded immediately for Plis screen)
  const [counts, setCounts] = useState<LibraryCounts>({ bookmarks: 0, highlights: 0, favorites: 0 });
  const [countsLoading, setCountsLoading] = useState(true);
  
  // Full data (loaded on demand for detail screens)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Load counts on mount
  useEffect(() => {
    refreshCounts();
  }, []);
  
  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const result = await getLibraryCounts();
      setCounts(result);
    } catch (error) {
      console.error('Failed to load library counts:', error);
    } finally {
      setCountsLoading(false);
    }
  }, []);
  
  const loadBookmarks = useCallback(async () => {
    setDataLoading(true);
    try {
      const result = await getAllBookmarks();
      setBookmarks(result);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);
  
  const loadHighlights = useCallback(async () => {
    setDataLoading(true);
    try {
      const result = await getAllHighlights(bibleVersion);
      setHighlights(result);
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setDataLoading(false);
    }
  }, [bibleVersion]);
  
  const loadHistory = useCallback(async () => {
    setDataLoading(true);
    try {
      const result = await getReadingHistory();
      setHistory(result);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);
  
  const removeBookmarkAction = useCallback(async (type: 'bible' | 'hymn', id: number) => {
    await toggleBookmark(type, id);
    await Promise.all([refreshCounts(), loadBookmarks()]);
  }, [refreshCounts, loadBookmarks]);
  
  const removeHighlightById = useCallback(async (verseId: number) => {
    await removeHighlight(verseId);
    await Promise.all([refreshCounts(), loadHighlights()]);
  }, [refreshCounts, loadHighlights]);
  
  const clearHistoryAction = useCallback(async () => {
    await clearReadingHistory();
    setHistory([]);
  }, []);
  
  return {
    counts,
    countsLoading,
    refreshCounts,
    bookmarks,
    highlights,
    history,
    dataLoading,
    loadBookmarks,
    loadHighlights,
    loadHistory,
    removeBookmark: removeBookmarkAction,
    removeHighlightById,
    clearHistory: clearHistoryAction,
  };
}
```

**File:** `src/hooks/useBookmarks.ts`

```typescript
/**
 * useBookmarks Hook
 * Focused hook for bookmarks screen
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllBookmarks, toggleBookmark } from '../db/queries';
import { Bookmark } from '../types/library';

export function useBookmarks(type?: 'bible' | 'hymn') {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllBookmarks(type);
      setBookmarks(result);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [type]);
  
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);
  
  const removeBookmark = useCallback(async (bookmarkType: 'bible' | 'hymn', refId: number) => {
    await toggleBookmark(bookmarkType, refId);
    await loadBookmarks();
  }, [loadBookmarks]);
  
  return { bookmarks, isLoading, error, refresh: loadBookmarks, removeBookmark };
}
```

**File:** `src/hooks/useHighlights.ts`

```typescript
/**
 * useHighlights Hook
 * Focused hook for highlights screen and verse highlighting
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getAllHighlights, 
  addHighlight, 
  removeHighlight, 
  getHighlightForVerse 
} from '../db/queries';
import { Highlight, HighlightColor } from '../types/library';
import { useSettingsStore } from '../stores/settingsStore';

export function useHighlights() {
  const { bibleVersion } = useSettingsStore();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadHighlights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllHighlights(bibleVersion);
      setHighlights(result);
    } catch (err) {
      setError('Failed to load highlights');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [bibleVersion]);
  
  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);
  
  const highlight = useCallback(async (verseId: number, color: HighlightColor) => {
    await addHighlight(verseId, color);
    await loadHighlights();
  }, [loadHighlights]);
  
  const unhighlight = useCallback(async (verseId: number) => {
    await removeHighlight(verseId);
    await loadHighlights();
  }, [loadHighlights]);
  
  const getColor = useCallback(async (verseId: number): Promise<HighlightColor | null> => {
    return getHighlightForVerse(verseId);
  }, []);
  
  return { 
    highlights, 
    isLoading, 
    error, 
    refresh: loadHighlights, 
    highlight, 
    unhighlight,
    getColor,
  };
}
```

**File:** `src/hooks/useHistory.ts`

```typescript
/**
 * useHistory Hook
 * Focused hook for reading history
 */

import { useState, useEffect, useCallback } from 'react';
import { getReadingHistory, recordReading, clearReadingHistory } from '../db/queries';
import { HistoryItem } from '../types/library';

export function useHistory(limit: number = 20) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getReadingHistory(limit);
      setHistory(result);
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);
  
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  
  const record = useCallback(async (
    type: 'bible' | 'hymn',
    reference: string,
    metadata: { book?: string; chapter?: number; hymnNumber?: number }
  ) => {
    await recordReading(type, reference, metadata);
    // Don't reload - history screen will reload when opened
  }, []);
  
  const clear = useCallback(async () => {
    await clearReadingHistory();
    setHistory([]);
  }, []);
  
  return { history, isLoading, error, refresh: loadHistory, record, clear };
}
```

**File:** `src/hooks/useFavorites.ts`

```typescript
/**
 * useFavorites Hook
 * Alias for hymn bookmarks (favorites = bookmarks with type='hymn')
 */

import { useBookmarks } from './useBookmarks';

export function useFavorites() {
  const { bookmarks, isLoading, error, refresh, removeBookmark } = useBookmarks('hymn');
  
  return {
    favorites: bookmarks,
    isLoading,
    error,
    refresh,
    removeFavorite: (hymnId: number) => removeBookmark('hymn', hymnId),
  };
}
```

### Track 1 Deliverables Checklist

- [ ] `src/types/library.ts` created (from Track 0)
- [ ] `src/db/queries.ts` updated with all new queries
- [ ] `src/hooks/useLibrary.ts` created
- [ ] `src/hooks/useBookmarks.ts` created
- [ ] `src/hooks/useHighlights.ts` created
- [ ] `src/hooks/useHistory.ts` created
- [ ] `src/hooks/useFavorites.ts` created
- [ ] All functions have TypeScript types
- [ ] Queries tested: counts return correct numbers
- [ ] Queries tested: CRUD operations work

---

## Track 2: Navigation & Routes

**Agent Assignment:** Agent B  
**Estimated Time:** 2 hours  
**Dependencies:** Track 0 complete  
**Blocks:** Track 5

### 2.1 Update Root Layout (CRITICAL)

**File:** `app/_layout.tsx` (modify existing)

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Library screens */}
        <Stack.Screen 
          name="library" 
          options={{ headerShown: false }} 
        />
        
        {/* Modal screens */}
        <Stack.Screen 
          name="search" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        
        {/* Standard push screens */}
        <Stack.Screen 
          name="about" 
          options={{ 
            headerShown: true,
            title: 'Konsènan Lafwa',
          }} 
        />
        <Stack.Screen 
          name="feedback" 
          options={{ 
            headerShown: true,
            title: 'Voye Fidbak',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
```

### 2.2 Create Library Stack Layout

**File:** `app/library/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function LibraryLayout() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  
  const titles = {
    bookmarks: language === 'ht' ? 'Makè' : 'Signets',
    highlights: language === 'ht' ? 'Sikle' : 'Surlignages',
    favorites: language === 'ht' ? 'Favori' : 'Favoris',
    history: language === 'ht' ? 'Istwa' : 'Historique',
  };
  
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: language === 'ht' ? 'Retounen' : 'Retour',
      }}
    >
      <Stack.Screen name="bookmarks" options={{ title: titles.bookmarks }} />
      <Stack.Screen name="highlights" options={{ title: titles.highlights }} />
      <Stack.Screen name="favorites" options={{ title: titles.favorites }} />
      <Stack.Screen name="history" options={{ title: titles.history }} />
    </Stack>
  );
}
```

### 2.3 Create Bookmarks Screen

**File:** `app/library/bookmarks.tsx`

```typescript
import React, { useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useBookmarks } from '../../src/hooks/useBookmarks';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components';
import { Bookmark } from '../../src/types/library';

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { bookmarks, isLoading, removeBookmark, refresh } = useBookmarks();
  
  const labels = {
    empty: language === 'ht' ? 'Ou poko gen makè' : 'Aucun signet',
    emptyHint: language === 'ht' 
      ? 'Peze sou yon vèsè pou ajoute makè' 
      : 'Appuyez sur un verset pour ajouter un signet',
    delete: language === 'ht' ? 'Efase' : 'Supprimer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleDelete = (item: Bookmark) => {
    Alert.alert(
      labels.delete,
      '',
      [
        { text: labels.cancel, style: 'cancel' },
        { 
          text: labels.delete, 
          style: 'destructive',
          onPress: () => removeBookmark(item.type, item.reference_id),
        },
      ]
    );
  };

  const handlePress = (item: Bookmark) => {
    if (item.type === 'bible') {
      // Navigate to Bible reader at this verse
      router.push('/bible');
    } else {
      // Navigate to hymn
      router.push('/hymns');
    }
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handlePress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <Ionicons 
          name={item.type === 'bible' ? 'book' : 'musical-notes'} 
          size={20} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.type === 'bible' 
            ? `${item.book} ${item.chapter}:${item.verse}`
            : `#${item.hymnNumber} - ${item.hymnTitle}`
          }
        </Text>
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
          {item.text || item.hymnTitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={[styles.list, bookmarks.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState 
            icon="bookmark-outline" 
            title={labels.empty} 
            hint={labels.emptyHint} 
          />
        }
        onRefresh={refresh}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  preview: { fontSize: 14 },
});
```

### 2.4 Create Highlights Screen

**File:** `app/library/highlights.tsx`

```typescript
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useHighlights } from '../../src/hooks/useHighlights';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components';
import { Highlight, HighlightColor } from '../../src/types/library';

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  blue: '#bae6fd',
  pink: '#fecaca',
};

export default function HighlightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { highlights, isLoading, unhighlight, refresh } = useHighlights();
  
  const labels = {
    empty: language === 'ht' ? 'Ou poko sikle anyen' : 'Aucun surlignage',
    emptyHint: language === 'ht' 
      ? 'Peze sou yon vèsè pou sikle li' 
      : 'Appuyez sur un verset pour le surligner',
    delete: language === 'ht' ? 'Efase' : 'Supprimer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleDelete = (item: Highlight) => {
    Alert.alert(
      labels.delete,
      '',
      [
        { text: labels.cancel, style: 'cancel' },
        { 
          text: labels.delete, 
          style: 'destructive',
          onPress: () => unhighlight(item.verse_id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Highlight }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push('/bible')}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_COLORS[item.color] }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.book} {item.chapter}:{item.verse}
        </Text>
        <Text 
          style={[styles.preview, { color: colors.textTertiary }]} 
          numberOfLines={2}
        >
          {item.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={highlights}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, highlights.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState 
            icon="brush-outline" 
            title={labels.empty} 
            hint={labels.emptyHint} 
          />
        }
        onRefresh={refresh}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  preview: { fontSize: 14 },
});
```

### 2.5 Create Favorites Screen

**File:** `app/library/favorites.tsx`

```typescript
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components';
import { Bookmark } from '../../src/types/library';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { favorites, isLoading, removeFavorite, refresh } = useFavorites();
  
  const labels = {
    empty: language === 'ht' ? 'Ou poko gen kantik favori' : 'Aucun cantique favori',
    emptyHint: language === 'ht' 
      ? 'Tape kè a sou yon kantik' 
      : 'Appuyez sur le cœur d\'un cantique',
    delete: language === 'ht' ? 'Efase' : 'Supprimer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleDelete = (item: Bookmark) => {
    Alert.alert(
      labels.delete,
      '',
      [
        { text: labels.cancel, style: 'cancel' },
        { 
          text: labels.delete, 
          style: 'destructive',
          onPress: () => removeFavorite(item.reference_id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push('/hymns')}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numberText}>{item.hymnNumber}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.hymnTitle}
        </Text>
      </View>
      <Ionicons name="heart" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, favorites.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState 
            icon="heart-outline" 
            title={labels.empty} 
            hint={labels.emptyHint} 
          />
        }
        onRefresh={refresh}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
});
```

### 2.6 Create History Screen

**File:** `app/library/history.tsx`

```typescript
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useHistory } from '../../src/hooks/useHistory';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components';
import { HistoryItem } from '../../src/types/library';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { history, isLoading, clear, refresh } = useHistory();
  
  const labels = {
    empty: language === 'ht' ? 'Pa gen istwa' : 'Aucun historique',
    emptyHint: language === 'ht' 
      ? 'Kòmanse li Bib la oswa kantik yo' 
      : 'Commencez à lire la Bible ou les cantiques',
    clearAll: language === 'ht' ? 'Efase tout' : 'Tout effacer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleClearAll = () => {
    Alert.alert(
      labels.clearAll,
      '',
      [
        { text: labels.cancel, style: 'cancel' },
        { 
          text: labels.clearAll, 
          style: 'destructive',
          onPress: clear,
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(item.type === 'bible' ? '/bible' : '/hymns')}
    >
      <Ionicons 
        name={item.type === 'bible' ? 'book-outline' : 'musical-notes-outline'} 
        size={20} 
        color={colors.primary} 
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.displayTitle}
        </Text>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>
          {new Date(item.last_read_at).toLocaleDateString()}
          {item.read_count > 1 && ` • ${item.read_count}x`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {history.length > 0 && (
        <TouchableOpacity 
          style={[styles.clearButton, { borderColor: colors.border }]}
          onPress={handleClearAll}
        >
          <Text style={[styles.clearText, { color: colors.primary }]}>
            {labels.clearAll}
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, history.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState 
            icon="time-outline" 
            title={labels.empty} 
            hint={labels.emptyHint} 
          />
        }
        onRefresh={refresh}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clearButton: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 13 },
});
```

### 2.7 Create Search Screen

**File:** `app/search.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useSearch } from '../src/hooks/useSearch';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, bibleVersion } = useSettingsStore();
  const inputRef = useRef<TextInput>(null);
  
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query, bibleVersion);
  
  const labels = {
    placeholder: language === 'ht' 
      ? 'Chèche nan Bib la ak Kantik yo...' 
      : 'Rechercher dans la Bible et les Cantiques...',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
    noResults: language === 'ht' ? 'Pa gen rezilta' : 'Aucun résultat',
    noResultsHint: language === 'ht' ? 'Eseye lòt mo' : 'Essayez d\'autres mots',
    bible: language === 'ht' ? 'Bib la' : 'Bible',
    hymns: language === 'ht' ? 'Kantik' : 'Cantiques',
  };

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const bibleResults = results.filter(r => r.type === 'bible');
  const hymnResults = results.filter(r => r.type === 'hymn');

  const renderResult = ({ item }: { item: any }) => {
    const isBible = item.type === 'bible';
    const data = item.data;
    
    return (
      <TouchableOpacity
        style={[styles.resultItem, { borderColor: colors.border }]}
        onPress={() => {
          router.back();
          router.push(isBible ? '/bible' : '/hymns');
        }}
      >
        <Ionicons 
          name={isBible ? 'book-outline' : 'musical-notes-outline'} 
          size={18} 
          color={colors.primary} 
        />
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {isBible 
              ? `${data.book} ${data.chapter}:${data.verse}`
              : `#${data.number} - ${data.title_ht || data.title_fr}`
            }
          </Text>
          <Text style={[styles.resultSnippet, { color: colors.textTertiary }]} numberOfLines={2}>
            {data.text || data.title_ht || data.title_fr}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
        {count}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search Header */}
        <View style={styles.header}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceHover }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder={labels.placeholder}
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              {labels.cancel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {query.length < 3 ? (
          <View style={styles.hint}>
            <Text style={{ color: colors.textTertiary }}>
              {language === 'ht' ? 'Tape omwen 3 lèt' : 'Tapez au moins 3 lettres'}
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.hint}>
            <Text style={{ color: colors.textTertiary }}>
              {language === 'ht' ? 'Ap chèche...' : 'Recherche...'}
            </Text>
          </View>
        ) : results.length === 0 ? (
          <EmptyState 
            icon="search-outline" 
            title={labels.noResults} 
            hint={labels.noResultsHint} 
          />
        ) : (
          <FlatList
            data={[
              ...(bibleResults.length > 0 ? [{ type: 'header', title: labels.bible, count: bibleResults.length }] : []),
              ...bibleResults,
              ...(hymnResults.length > 0 ? [{ type: 'header', title: labels.hymns, count: hymnResults.length }] : []),
              ...hymnResults,
            ]}
            renderItem={({ item }) => 
              item.type === 'header' 
                ? renderSectionHeader(item.title, item.count)
                : renderResult({ item })
            }
            keyExtractor={(item, index) => 
              item.type === 'header' ? `header-${index}` : `${item.type}-${item.data?.id || index}`
            }
            contentContainerStyle={styles.results}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  results: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 14,
  },
});
```

### 2.8 Create About Screen

**File:** `app/about.tsx`

```typescript
import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  
  const content = {
    tagline: language === 'ht' 
      ? 'Lafwa soti nan tande' 
      : 'La foi vient de ce qu\'on entend',
    mission: language === 'ht'
      ? 'Lafwa se yon aplikasyon gratis ki pèmèt Ayisyen yo gen aksè a Bib la ak Chant d\'Espérance san entènèt.'
      : 'Lafwa est une application gratuite permettant aux Haïtiens d\'accéder à la Bible et aux Chants d\'Espérance hors ligne.',
    version: 'Version 1.0.0',
    credits: language === 'ht' ? 'Rekonesans' : 'Remerciements',
    bibleCredit: language === 'ht'
      ? 'Tèks Bib la disponib grasa jenerozite tradiktè yo.'
      : 'Le texte biblique est disponible grâce à la générosité des traducteurs.',
    hymnCredit: language === 'ht'
      ? 'Chant d\'Espérance disponib avèk pèmisyon.'
      : 'Chants d\'Espérance disponibles avec permission.',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo placeholder */}
        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>Lafwa</Text>
        </View>
        
        <Text style={[styles.tagline, { color: colors.textTertiary }]}>
          "{content.tagline}"
        </Text>
        
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          {content.version}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.body, { color: colors.text }]}>
            {content.mission}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {content.credits}
          </Text>
          <Text style={[styles.body, { color: colors.textTertiary }]}>
            {content.bibleCredit}
          </Text>
          <Text style={[styles.body, { color: colors.textTertiary }]}>
            {content.hymnCredit}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
```

### 2.9 Create Feedback Screen

**File:** `app/feedback.tsx`

```typescript
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  
  const labels = {
    title: language === 'ht' ? 'Voye Fidbak' : 'Envoyer des commentaires',
    description: language === 'ht'
      ? 'Nou ta renmen tande ou! Pataje ide w oswa rapòte pwoblèm.'
      : 'Nous aimerions vous entendre! Partagez vos idées ou signalez des problèmes.',
    emailButton: language === 'ht' ? 'Voye Imèl' : 'Envoyer un email',
    emailSent: language === 'ht' ? 'Mèsi!' : 'Merci!',
  };

  const sendEmail = async () => {
    const subject = encodeURIComponent('Lafwa Feedback');
    const url = `mailto:feedback@lafwa.app?subject=${subject}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open email app');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open email app');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="chatbubbles" size={48} color={colors.primary} />
        </View>
        
        <Text style={[styles.description, { color: colors.textTertiary }]}>
          {labels.description}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={sendEmail}
        >
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.buttonText}>{labels.emailButton}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Track 2 Deliverables Checklist

- [ ] `app/_layout.tsx` updated with new routes
- [ ] `app/library/_layout.tsx` created
- [ ] `app/library/bookmarks.tsx` created
- [ ] `app/library/highlights.tsx` created
- [ ] `app/library/favorites.tsx` created
- [ ] `app/library/history.tsx` created
- [ ] `app/search.tsx` created
- [ ] `app/about.tsx` created
- [ ] `app/feedback.tsx` created
- [ ] All screens handle loading/empty states
- [ ] Navigation tested: Plis → Library screens → back
- [ ] Navigation tested: Plis → Search (modal) → back
- [ ] Navigation tested: Plis → About/Feedback → back

---

## Track 3: Internationalization (i18n)

**Agent Assignment:** Agent C  
**Estimated Time:** 1 hour  
**Dependencies:** None  
**Blocks:** Track 5

### 3.1 Create Labels Utility

**File:** `src/localization/labels.ts`

```typescript
/**
 * Centralized labels for i18n
 * Simple key-value structure (KISS principle)
 */

export type SupportedLanguage = 'ht' | 'fr';

type LabelValue = { ht: string; fr: string };

// Flat structure for simplicity - no deeply nested objects
export const LABELS = {
  // Tab names
  TAB_HOME: { ht: 'Lakay', fr: 'Accueil' },
  TAB_BIBLE: { ht: 'Bib la', fr: 'Bible' },
  TAB_HYMNS: { ht: 'Kantik', fr: 'Cantiques' },
  TAB_MORE: { ht: 'Plis', fr: 'Plus' },
  
  // Section headers
  SECTION_LIBRARY: { ht: 'BIBLIYOTÈK', fr: 'BIBLIOTHÈQUE' },
  SECTION_SETTINGS: { ht: 'PARAMÈT', fr: 'PARAMÈTRES' },
  SECTION_INFO: { ht: 'ENFÒMASYON', fr: 'INFORMATIONS' },
  SECTION_QUICK_ACTIONS: { ht: 'AKSYON RAPID', fr: 'ACCÈS RAPIDE' },
  SECTION_CONTINUE: { ht: 'KONTINYE', fr: 'CONTINUER' },
  
  // Library items
  LIBRARY_BOOKMARKS: { ht: 'Makè', fr: 'Signets' },
  LIBRARY_HIGHLIGHTS: { ht: 'Sikle', fr: 'Surlignages' },
  LIBRARY_FAVORITES: { ht: 'Favori', fr: 'Favoris' },
  LIBRARY_HISTORY: { ht: 'Istwa', fr: 'Historique' },
  
  // Settings
  SETTINGS_LANGUAGE: { ht: 'Lang', fr: 'Langue' },
  SETTINGS_FONT_SIZE: { ht: 'Gwosè Tèks', fr: 'Taille du texte' },
  SETTINGS_THEME: { ht: 'Tèm', fr: 'Thème' },
  
  // Theme options
  THEME_LIGHT: { ht: 'Limyè', fr: 'Clair' },
  THEME_DARK: { ht: 'Fènwa', fr: 'Sombre' },
  THEME_SYSTEM: { ht: 'Sistèm', fr: 'Système' },
  
  // Info items
  INFO_ABOUT: { ht: 'Konsènan Lafwa', fr: 'À propos de Lafwa' },
  INFO_FEEDBACK: { ht: 'Voye Fidbak', fr: 'Envoyer des commentaires' },
  
  // Search
  SEARCH_PLACEHOLDER: { 
    ht: 'Chèche nan Bib la ak Kantik yo...', 
    fr: 'Rechercher dans la Bible et les Cantiques...' 
  },
  SEARCH_NO_RESULTS: { ht: 'Pa gen rezilta', fr: 'Aucun résultat' },
  SEARCH_TRY_OTHER: { ht: 'Eseye lòt mo', fr: 'Essayez d\'autres mots' },
  
  // Empty states
  EMPTY_BOOKMARKS_TITLE: { ht: 'Ou poko gen makè', fr: 'Aucun signet' },
  EMPTY_BOOKMARKS_HINT: { 
    ht: 'Peze sou yon vèsè pou ajoute makè', 
    fr: 'Appuyez sur un verset pour ajouter un signet' 
  },
  EMPTY_HIGHLIGHTS_TITLE: { ht: 'Ou poko sikle anyen', fr: 'Aucun surlignage' },
  EMPTY_HIGHLIGHTS_HINT: { 
    ht: 'Peze sou yon vèsè pou sikle li', 
    fr: 'Appuyez sur un verset pour le surligner' 
  },
  EMPTY_FAVORITES_TITLE: { ht: 'Ou poko gen kantik favori', fr: 'Aucun cantique favori' },
  EMPTY_FAVORITES_HINT: { 
    ht: 'Tape kè a sou yon kantik', 
    fr: 'Appuyez sur le cœur d\'un cantique' 
  },
  EMPTY_HISTORY_TITLE: { ht: 'Pa gen istwa', fr: 'Aucun historique' },
  EMPTY_HISTORY_HINT: { 
    ht: 'Kòmanse li Bib la oswa kantik yo', 
    fr: 'Commencez à lire la Bible ou les cantiques' 
  },
  
  // Actions
  ACTION_DELETE: { ht: 'Efase', fr: 'Supprimer' },
  ACTION_CANCEL: { ht: 'Anile', fr: 'Annuler' },
  ACTION_CLEAR_ALL: { ht: 'Efase tout', fr: 'Tout effacer' },
  
  // Greetings
  GREETING_MORNING: { ht: 'Bonjou!', fr: 'Bonjour!' },
  GREETING_AFTERNOON: { ht: 'Bon aprè-midi!', fr: 'Bon après-midi!' },
  GREETING_EVENING: { ht: 'Bonswa!', fr: 'Bonsoir!' },
  GREETING_NIGHT: { ht: 'Bòn nwit!', fr: 'Bonne nuit!' },
  
  // Verse of day
  VERSE_OF_DAY: { ht: 'Vèsè Jounen An', fr: 'Verset du Jour' },
  
  // Quick actions
  QUICK_BIBLE: { ht: 'Bib la', fr: 'Bible' },
  QUICK_HYMNS: { ht: 'Kantik', fr: 'Cantiques' },
  QUICK_SEARCH: { ht: 'Chèche', fr: 'Rechercher' },
  QUICK_FAVORITES: { ht: 'Favori', fr: 'Favoris' },
} as const;

export type LabelKey = keyof typeof LABELS;

/**
 * Get a label in the specified language
 */
export function getLabel(key: LabelKey, language: SupportedLanguage): string {
  return LABELS[key][language];
}

/**
 * Get time-based greeting
 */
export function getGreeting(language: SupportedLanguage): { text: string; emoji: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: LABELS.GREETING_MORNING[language], emoji: '☀️' };
  }
  if (hour >= 12 && hour < 18) {
    return { text: LABELS.GREETING_AFTERNOON[language], emoji: '🌤' };
  }
  if (hour >= 18 && hour < 22) {
    return { text: LABELS.GREETING_EVENING[language], emoji: '🌅' };
  }
  return { text: LABELS.GREETING_NIGHT[language], emoji: '🌙' };
}
```

### 3.2 Create useLabels Hook

**File:** `src/hooks/useLabels.ts`

```typescript
/**
 * useLabels Hook
 * Provides type-safe access to localized labels
 */

import { useMemo, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { LABELS, LabelKey, getLabel, getGreeting } from '../localization/labels';

export function useLabels() {
  const language = useSettingsStore((state) => state.language);
  
  // Generic label getter
  const t = useCallback((key: LabelKey): string => {
    return getLabel(key, language);
  }, [language]);
  
  // Greeting getter
  const greeting = useMemo(() => getGreeting(language), [language]);
  
  // Pre-computed common label groups for convenience
  const sections = useMemo(() => ({
    library: t('SECTION_LIBRARY'),
    settings: t('SECTION_SETTINGS'),
    info: t('SECTION_INFO'),
    quickActions: t('SECTION_QUICK_ACTIONS'),
    continue: t('SECTION_CONTINUE'),
  }), [t]);
  
  const library = useMemo(() => ({
    bookmarks: t('LIBRARY_BOOKMARKS'),
    highlights: t('LIBRARY_HIGHLIGHTS'),
    favorites: t('LIBRARY_FAVORITES'),
    history: t('LIBRARY_HISTORY'),
  }), [t]);
  
  const theme = useMemo(() => ({
    light: t('THEME_LIGHT'),
    dark: t('THEME_DARK'),
    system: t('THEME_SYSTEM'),
  }), [t]);
  
  return {
    t,
    language,
    greeting,
    sections,
    library,
    theme,
  };
}
```

### Track 3 Deliverables Checklist

- [ ] `src/localization/labels.ts` created
- [ ] `src/hooks/useLabels.ts` created
- [ ] All labels have both 'ht' and 'fr' translations
- [ ] Labels are flat structure (KISS)
- [ ] Type safety maintained

---

## Track 4: Component Extraction

**Agent Assignment:** Agent D  
**Estimated Time:** 1 hour  
**Dependencies:** None  
**Blocks:** Track 5

### 4.1 Create SectionCard Component

**File:** `src/components/SectionCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SectionCard({ title, children, style }: SectionCardProps) {
  const { colors, shadows, isDark } = useTheme();
  
  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.title, { color: colors.textTertiary }]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !isDark && shadows.card,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
```

### 4.2 Create ListItem Component

**File:** `src/components/ListItem.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface ListItemProps {
  icon?: IoniconsName;
  label: string;
  value?: string | number | null;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}

export function ListItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  isLast = false,
  rightElement,
}: ListItemProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {icon && <Ionicons name={icon} size={20} color={colors.primary} />}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {value !== undefined && value !== null && (
        <Text style={[styles.value, { color: colors.textTertiary }]}>{value}</Text>
      )}
      {rightElement}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
  value: { fontSize: 14 },
});
```

### 4.3 Create SegmentedControl Component

**File:** `src/components/SegmentedControl.tsx`

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SegmentOption<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  size?: 'default' | 'small';
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  size = 'default',
}: SegmentedControlProps<T>) {
  const { colors, shadows, isDark } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceHover }]}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              size === 'small' && styles.segmentSmall,
              isSelected && [
                styles.segmentActive,
                { backgroundColor: colors.surface },
                !isDark && shadows.card,
              ],
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.text,
                size === 'small' && styles.textSmall,
                { color: isSelected ? colors.text : colors.textTertiary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 4, borderRadius: 10 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentSmall: { paddingVertical: 6 },
  segmentActive: {},
  text: { fontSize: 13, fontWeight: '600' },
  textSmall: { fontSize: 12 },
});
```

### 4.4 Create EmptyState Component

**File:** `src/components/EmptyState.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon: IoniconsName;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {hint && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: 40,
  },
  title: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  hint: { fontSize: 14, textAlign: 'center' },
});
```

### 4.5 Create Component Index

**File:** `src/components/index.ts` (CREATE NEW)

```typescript
/**
 * Component exports
 * Import from '@/components' or '../../src/components'
 */

export { SectionCard } from './SectionCard';
export { ListItem } from './ListItem';
export { SegmentedControl } from './SegmentedControl';
export { EmptyState } from './EmptyState';
export { VerseCardSkeleton } from './VerseCardSkeleton';

// Existing components (if they don't have index exports)
export { BibleReader } from './BibleReader';
export { BookPicker } from './BookPicker';
export { ChapterPicker } from './ChapterPicker';
export { VerseActionSheet } from './VerseActionSheet';
```

### Track 4 Deliverables Checklist

- [ ] `src/components/SectionCard.tsx` created
- [ ] `src/components/ListItem.tsx` created
- [ ] `src/components/SegmentedControl.tsx` created
- [ ] `src/components/EmptyState.tsx` created
- [ ] `src/components/index.ts` created (new file)
- [ ] All components use `useTheme` hook
- [ ] All components have TypeScript interfaces
- [ ] IoniconsName type properly defined

---

## Track 5: Integration & Wiring

**Agent Assignment:** Agent E (or primary agent)  
**Estimated Time:** 2 hours  
**Dependencies:** Tracks 0-4 complete  
**Blocks:** None

### 5.1 Refactor settings.tsx (Plis Screen)

**File:** `app/(tabs)/settings.tsx`

Replace the entire file with:

```typescript
/**
 * Plis (More) Tab
 * Library, Settings, and Info hub
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useLabels } from '../../src/hooks/useLabels';
import { useLibrary } from '../../src/hooks/useLibrary';
import { useSettingsStore, FontSizeSetting } from '../../src/stores/settingsStore';
import { SectionCard, ListItem, SegmentedControl } from '../../src/components';

type IoniconsName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, sections, library, theme: themeLabels } = useLabels();
  const { counts, refreshCounts } = useLibrary();
  const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettingsStore();

  // Refresh counts when screen gains focus
  useEffect(() => {
    refreshCounts();
  }, []);

  const libraryItems: Array<{
    icon: IoniconsName;
    label: string;
    count: number | null;
    route: string;
  }> = [
    { icon: 'bookmark', label: library.bookmarks, count: counts.bookmarks, route: '/library/bookmarks' },
    { icon: 'brush', label: library.highlights, count: counts.highlights, route: '/library/highlights' },
    { icon: 'heart', label: library.favorites, count: counts.favorites, route: '/library/favorites' },
    { icon: 'time', label: library.history, count: null, route: '/library/history' },
  ];

  const fontSizeOptions: Array<{ value: FontSizeSetting; label: string }> = [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('TAB_MORE')}</Text>

        {/* Search Bar (navigates to search modal) */}
        <ListItem
          icon="search"
          label={t('SEARCH_PLACEHOLDER')}
          onPress={() => router.push('/search')}
          showChevron={false}
        />

        {/* Library Section */}
        <SectionCard title={sections.library}>
          {libraryItems.map((item, index) => (
            <ListItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              value={item.count}
              onPress={() => router.push(item.route as any)}
              isLast={index === libraryItems.length - 1}
            />
          ))}
        </SectionCard>

        {/* Settings Section */}
        <SectionCard title={sections.settings}>
          <ListItem
            icon="language"
            label={t('SETTINGS_LANGUAGE')}
            showChevron={false}
            rightElement={
              <SegmentedControl
                options={[
                  { value: 'ht' as const, label: 'Kreyòl' },
                  { value: 'fr' as const, label: 'Français' },
                ]}
                selected={language}
                onChange={setLanguage}
              />
            }
          />
          <ListItem
            icon="text"
            label={t('SETTINGS_FONT_SIZE')}
            showChevron={false}
            rightElement={
              <SegmentedControl
                options={fontSizeOptions}
                selected={fontSize}
                onChange={setFontSize}
                size="small"
              />
            }
          />
          <ListItem
            icon={isDark ? 'moon' : 'sunny'}
            label={t('SETTINGS_THEME')}
            showChevron={false}
            isLast
            rightElement={
              <SegmentedControl
                options={[
                  { value: 'light' as const, label: themeLabels.light },
                  { value: 'dark' as const, label: themeLabels.dark },
                  { value: 'system' as const, label: themeLabels.system },
                ]}
                selected={theme}
                onChange={setTheme}
                size="small"
              />
            }
          />
        </SectionCard>

        {/* Info Section */}
        <SectionCard title={sections.info}>
          <ListItem
            icon="information-circle"
            label={t('INFO_ABOUT')}
            onPress={() => router.push('/about')}
          />
          <ListItem
            icon="chatbubble"
            label={t('INFO_FEEDBACK')}
            onPress={() => router.push('/feedback')}
            isLast
          />
        </SectionCard>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Lafwa v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  version: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
```

### 5.2 Update Home Screen Labels

**File:** `app/(tabs)/index.tsx`

Update to use `useLabels` hook. Key changes:

```typescript
// Add import
import { useLabels } from '../../src/hooks/useLabels';

// Replace getGreeting function usage
const { t, greeting } = useLabels();

// Replace hardcoded labels in quickActions
const quickActions = [
  {
    icon: 'book',
    label: t('QUICK_BIBLE'),
    desc: '66 liv',
    onPress: () => router.push('/bible'),
  },
  {
    icon: 'musical-notes',
    label: t('QUICK_HYMNS'),
    desc: '800+ chante',
    onPress: () => router.push('/hymns'),
  },
  // ...
];

// Replace section titles
<Text style={...}>{t('SECTION_CONTINUE')}</Text>
<Text style={...}>{t('SECTION_QUICK_ACTIONS')}</Text>
```

### 5.3 Update Tab Layout Labels

**File:** `app/(tabs)/_layout.tsx`

```typescript
import { useLabels } from '../../src/hooks/useLabels';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLabels();
  
  return (
    <Tabs ...>
      <Tabs.Screen
        name="index"
        options={{ title: t('TAB_HOME'), ... }}
      />
      <Tabs.Screen
        name="bible"
        options={{ title: t('TAB_BIBLE'), ... }}
      />
      <Tabs.Screen
        name="hymns"
        options={{ title: t('TAB_HYMNS'), ... }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('TAB_MORE'), ... }}
      />
    </Tabs>
  );
}
```

### 5.4 Integration Testing

Run these tests manually after integration:

| Test | Steps | Expected |
|------|-------|----------|
| Library navigation | Tap each library item | Opens correct screen |
| Library counts | Add bookmark, return to Plis | Count increments |
| Search modal | Tap search bar | Modal opens, keyboard shows |
| Search results | Type "Jan" | Bible & Hymn results appear |
| Language switch | Toggle to Français | All labels update instantly |
| Theme switch | Toggle dark mode | UI updates, persists on restart |
| About screen | Tap About | Shows app info |
| Feedback | Tap Feedback → Send Email | Opens email client |
| Back navigation | Use back gestures | Returns to Plis screen |

### Track 5 Deliverables Checklist

- [ ] `app/(tabs)/settings.tsx` refactored completely
- [ ] `app/(tabs)/index.tsx` updated to use `useLabels`
- [ ] `app/(tabs)/_layout.tsx` updated to use `useLabels`
- [ ] Library counts display actual database values
- [ ] All navigation works correctly
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All integration tests pass

---

## Testing Requirements

### Unit Tests to Create

**File:** `__tests__/hooks/useLibrary.test.ts`

```typescript
// Test: counts load correctly
// Test: refresh updates counts
// Test: error handling works
```

**File:** `__tests__/db/queries.test.ts`

```typescript
// Test: getLibraryCounts returns correct structure
// Test: getAllBookmarks returns bookmarks
// Test: addHighlight creates highlight
// Test: removeHighlight deletes highlight
// Test: recordReading creates/updates history
```

### Integration Tests

**File:** `__tests__/integration/plis-screen.test.ts`

```typescript
// Test: Plis screen renders without error
// Test: Library items show correct counts
// Test: Navigation to sub-screens works
// Test: Settings persist across sessions
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration fails on existing install | Medium | High | Test with populated DB; add error recovery |
| FlatList performance with 100+ items | Low | Medium | Already using FlatList with keyExtractor |
| Labels missing for new features | Medium | Low | TypeScript will catch missing keys |
| Navigation routes not found | Low | Medium | Test each route before Track 5 |

---

## Success Criteria

The implementation is complete when:

1. ✅ App builds without errors
2. ✅ Migrations run successfully on fresh and existing installs
3. ✅ All library screens show real data
4. ✅ Library counts update when data changes
5. ✅ Search modal works with results grouped
6. ✅ All settings persist and take effect
7. ✅ Labels switch instantly on language change
8. ✅ No hardcoded strings in modified files
9. ✅ All navigation paths work correctly
10. ✅ No TypeScript errors or console warnings

---

## Appendix: Complete File Manifest

### New Files (Create)

```
src/
├── db/
│   └── migrations.ts              # Track 0
├── types/
│   └── library.ts                 # Track 0
├── localization/
│   └── labels.ts                  # Track 3
├── hooks/
│   ├── useLabels.ts               # Track 3
│   ├── useLibrary.ts              # Track 1
│   ├── useBookmarks.ts            # Track 1
│   ├── useHighlights.ts           # Track 1
│   ├── useHistory.ts              # Track 1
│   └── useFavorites.ts            # Track 1
├── components/
│   ├── SectionCard.tsx            # Track 4
│   ├── ListItem.tsx               # Track 4
│   ├── SegmentedControl.tsx       # Track 4
│   ├── EmptyState.tsx             # Track 4
│   └── index.ts                   # Track 4

app/
├── search.tsx                     # Track 2
├── about.tsx                      # Track 2
├── feedback.tsx                   # Track 2
└── library/
    ├── _layout.tsx                # Track 2
    ├── bookmarks.tsx              # Track 2
    ├── highlights.tsx             # Track 2
    ├── favorites.tsx              # Track 2
    └── history.tsx                # Track 2

__tests__/
├── hooks/
│   └── useLibrary.test.ts         # Track 5
├── db/
│   └── queries.test.ts            # Track 5
└── integration/
    └── plis-screen.test.ts        # Track 5
```

### Files to Modify

```
src/db/database.ts                 # Track 0 (add migration call)
src/db/queries.ts                  # Track 1 (add new queries)
app/_layout.tsx                    # Track 2 (register routes)
app/(tabs)/settings.tsx            # Track 5 (full rewrite)
app/(tabs)/index.tsx               # Track 5 (use useLabels)
app/(tabs)/_layout.tsx             # Track 5 (use useLabels)
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial plan |
| 2.0 | Jan 2026 | Added Track 0 (migrations), simplified stores to hooks, clarified favorites=bookmarks, added root layout update, added type definitions, added test requirements |

---

*Document reviewed and updated following YAGNI/KISS/SRP/DRY principles*
