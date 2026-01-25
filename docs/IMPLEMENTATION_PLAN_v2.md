# Lafwa Implementation Plan v2

## Critical Fixes & Architecture Overhaul

**Status:** Draft  
**Date:** January 25, 2026  
**Addresses:** Database corruption, user data loss, hymn content quality, schema mismatch, CI gaps

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Redesign: Dual Database Strategy](#2-architecture-redesign-dual-database-strategy)
3. [Schema Overhaul](#3-schema-overhaul)
4. [Hymn Content Pipeline](#4-hymn-content-pipeline)
5. [Database Module Rewrite](#5-database-module-rewrite)
6. [CI/CD Integrity Pipeline](#6-cicd-integrity-pipeline)
7. [Migration Strategy](#7-migration-strategy)
8. [Testing Requirements](#8-testing-requirements)
9. [Implementation Phases](#9-implementation-phases)
10. [Appendix: File Changes Checklist](#10-appendix-file-changes-checklist)

---

## 1. Executive Summary

### Problems Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| Self-healing deletes user data | 🔴 Critical | Users lose all bookmarks, highlights, history |
| Hymn data is 96% incomplete | 🔴 Critical | 29 entries vs 800+ promised; includes spam |
| Schema doesn't match PRD | 🟠 High | Presentation mode impossible, no bilingual support |
| No CI integrity checks | 🟠 High | Corrupt assets can ship to production |
| Root cause never identified | 🟡 Medium | Problem will recur |

### Solution Overview

1. **Dual Database Architecture** — Separate immutable content (Bible, hymns) from mutable user data (bookmarks, highlights)
2. **Proper Hymn Sourcing** — Partner with license holder for structured data export; abandon scraping
3. **PRD-Compliant Schema** — Implement `hymn_sections` table for verse/refrain structure
4. **CI/CD Guardrails** — Hash verification, row count assertions, schema validation on every build
5. **Safe Self-Healing** — Backup user data before any content database reset

---

## 2. Architecture Redesign: Dual Database Strategy

### Current Architecture (Broken)

```
lafwa.db
├── bible_verses (content - immutable)
├── hymns (content - immutable)
├── bookmarks (user data - mutable)
├── highlights (user data - mutable)
└── ... FTS tables
```

**Problem:** Resetting `lafwa.db` to fix content corruption destroys user data.

### New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SQLite/                                  │
├─────────────────────────────────────────────────────────────┤
│  content.db (bundled asset, read-only)                      │
│  ├── bible_books                                            │
│  ├── bible_verses                                           │
│  ├── bible_fts                                              │
│  ├── hymns                                                  │
│  ├── hymn_sections                                          │
│  └── hymns_fts                                              │
├─────────────────────────────────────────────────────────────┤
│  user.db (created on first launch, read-write)              │
│  ├── bookmarks                                              │
│  ├── highlights                                             │
│  ├── reading_history                                        │
│  ├── favorites                                              │
│  └── user_settings                                          │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

| Benefit | Description |
|---------|-------------|
| Safe content updates | Can replace `content.db` without touching user data |
| Smaller OTA updates | User data doesn't need to be in asset bundle |
| Clear separation of concerns | Content team vs app team responsibilities |
| Easier backup/export | User data is one small file |

### Implementation Notes

```typescript
// src/db/database.ts - New dual database approach

const CONTENT_DB = 'content.db';  // Bundled, immutable
const USER_DB = 'user.db';        // Created on device, mutable

export async function openContentDatabase() {
  // Copy from assets if needed, verify integrity
  // This is the ONLY database that gets "self-healed"
}

export async function openUserDatabase() {
  // Create if not exists, run migrations
  // NEVER delete this without explicit user consent
}
```

---

## 3. Schema Overhaul

### 3.1 Content Database Schema (`content.db`)

```sql
-- ===========================================
-- CONTENT DATABASE SCHEMA (content.db)
-- Bundled with app, read-only at runtime
-- ===========================================

-- Version tracking for migrations
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO schema_version (version) VALUES (1);

-- Bible Books (metadata)
CREATE TABLE bible_books (
    id INTEGER PRIMARY KEY,                    -- 1-66 canonical order
    name_ht TEXT NOT NULL,                     -- Kreyòl name (e.g., "Jenèz")
    name_fr TEXT NOT NULL,                     -- French name (e.g., "Genèse")
    abbreviation TEXT NOT NULL,                -- Short form (e.g., "Jen")
    testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapter_count INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
);

-- Bible Verses
CREATE TABLE bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text_ht TEXT,                              -- Kreyòl text (nullable if version unavailable)
    text_fr TEXT,                              -- French text (nullable if version unavailable)
    UNIQUE(book_id, chapter, verse)
);

CREATE INDEX idx_bible_verses_lookup ON bible_verses(book_id, chapter);

-- Hymns (master record)
CREATE TABLE hymns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL,                   -- Hymn number (1-800+)
    title_ht TEXT,                             -- Kreyòl title
    title_fr TEXT,                             -- French title  
    first_line_ht TEXT,                        -- For search/display
    first_line_fr TEXT,
    category TEXT,                             -- e.g., 'adoration', 'louange', 'noël'
    has_kreyol BOOLEAN DEFAULT 0,              -- Quick filter flag
    has_french BOOLEAN DEFAULT 0,
    UNIQUE(number)
);

-- Hymn Sections (verses and refrains - CRITICAL for presentation mode)
CREATE TABLE hymn_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hymn_id INTEGER NOT NULL REFERENCES hymns(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('verse', 'refrain', 'bridge', 'coda')),
    section_number INTEGER,                    -- NULL for refrain, 1/2/3 for verses
    display_order INTEGER NOT NULL,            -- Order to display in presentation mode
    text_ht TEXT,                              -- Kreyòl lyrics
    text_fr TEXT,                              -- French lyrics
    UNIQUE(hymn_id, display_order)
);

CREATE INDEX idx_hymn_sections_hymn ON hymn_sections(hymn_id, display_order);

-- FTS5 for Bible search
CREATE VIRTUAL TABLE bible_fts USING fts5(
    text_ht,
    text_fr,
    content='bible_verses',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'   -- Handle Kreyòl accents
);

-- FTS5 for Hymn search (searches titles and all section lyrics)
CREATE VIRTUAL TABLE hymns_fts USING fts5(
    title_ht,
    title_fr,
    first_line_ht,
    first_line_fr,
    content='hymns',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER bible_fts_ai AFTER INSERT ON bible_verses BEGIN
    INSERT INTO bible_fts(rowid, text_ht, text_fr) VALUES (new.id, new.text_ht, new.text_fr);
END;

CREATE TRIGGER bible_fts_ad AFTER DELETE ON bible_verses BEGIN
    INSERT INTO bible_fts(bible_fts, rowid, text_ht, text_fr) VALUES('delete', old.id, old.text_ht, old.text_fr);
END;

CREATE TRIGGER hymns_fts_ai AFTER INSERT ON hymns BEGIN
    INSERT INTO hymns_fts(rowid, title_ht, title_fr, first_line_ht, first_line_fr) 
    VALUES (new.id, new.title_ht, new.title_fr, new.first_line_ht, new.first_line_fr);
END;

CREATE TRIGGER hymns_fts_ad AFTER DELETE ON hymns BEGIN
    INSERT INTO hymns_fts(hymns_fts, rowid, title_ht, title_fr, first_line_ht, first_line_fr) 
    VALUES('delete', old.id, old.title_ht, old.title_fr, old.first_line_ht, old.first_line_fr);
END;

-- Verse of the Day pool
CREATE TABLE verse_of_day (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id),
    day_of_year INTEGER,                       -- 1-366, NULL means random pool
    UNIQUE(day_of_year)
);
```

### 3.2 User Database Schema (`user.db`)

```sql
-- ===========================================
-- USER DATABASE SCHEMA (user.db)
-- Created on device, user owns this data
-- ===========================================

CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO schema_version (version) VALUES (1);

-- Bookmarks
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('verse', 'hymn')),
    content_id INTEGER NOT NULL,               -- References content.db bible_verses.id or hymns.id
    note TEXT,                                 -- Optional user note
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_type, content_id)
);

-- Highlights (Bible verses only)
CREATE TABLE highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verse_id INTEGER NOT NULL,                 -- References content.db bible_verses.id
    color TEXT NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(verse_id)                           -- One highlight per verse
);

-- Favorites (Hymns only - separate from bookmarks for quick access)
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hymn_id INTEGER NOT NULL,                  -- References content.db hymns.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hymn_id)
);

-- Reading History
CREATE TABLE reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('bible', 'hymn')),
    reference TEXT NOT NULL,                   -- "Jen 3" or "Hymn 42"
    content_id INTEGER,                        -- Optional: specific verse or hymn ID
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_accessed ON reading_history(accessed_at DESC);

-- User Settings (key-value store)
CREATE TABLE user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO user_settings (key, value) VALUES 
    ('language', 'ht'),
    ('bible_version', 'ht'),
    ('font_size', 'M'),
    ('theme', 'system'),
    ('keep_screen_awake', 'false'),
    ('daily_reminder', 'false'),
    ('daily_reminder_time', '07:00');
```

---

## 4. Hymn Content Pipeline

### 4.1 Current Problem

The scraper (`scripts/scrape_hymns.ts`) crawls `chandesperansonline.com` and produces:
- Blog posts instead of hymns
- Advertisements and promotions
- Duplicate entries
- Flat unstructured lyrics (no verse/refrain separation)
- Only 29 entries instead of 800+

### 4.2 Recommended Solution: Direct Partnership

**You claim written permission from the license holder.** Leverage this:

```
┌─────────────────────────────────────────────────────────────┐
│  OPTION A: Request Structured Export (Preferred)            │
├─────────────────────────────────────────────────────────────┤
│  Contact: cesperance.com / license holder                   │
│  Request: JSON/CSV export with:                             │
│    - Hymn number                                            │
│    - Title (French + Kreyòl if available)                   │
│    - Sections array with type (verse/refrain) + text        │
│    - Category/theme tags                                    │
│  Estimated hymns: 800+                                      │
│  Timeline: 1-2 weeks for data delivery                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  OPTION B: Manual Digitization (Fallback)                   │
├─────────────────────────────────────────────────────────────┤
│  Source: Physical Chant d'Espérance hymnal book             │
│  Process:                                                   │
│    1. OCR scan or manual transcription                      │
│    2. Native speaker QA review                              │
│    3. Structured JSON with verse/refrain markup             │
│  Timeline: 4-6 weeks for 800 hymns                          │
│  Cost: ~$500-1000 for transcription services                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  OPTION C: Improved Scraper (Not Recommended)               │
├─────────────────────────────────────────────────────────────┤
│  Problems:                                                  │
│    - Site structure inconsistent                            │
│    - Blog posts mixed with hymns                            │
│    - No verse/refrain structure in HTML                     │
│    - Requires constant maintenance                          │
│  If forced to use, see Section 4.3                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Hymn Data Format Specification

Regardless of source, hymn data should be normalized to this format:

```typescript
// src/assets/data/hymns.schema.ts

interface HymnSource {
  number: number;                    // 1-800+
  title_ht?: string;                 // Kreyòl title
  title_fr?: string;                 // French title
  category?: string;                 // 'adoration', 'louange', 'noël', etc.
  sections: HymnSection[];
}

interface HymnSection {
  type: 'verse' | 'refrain' | 'bridge' | 'coda';
  number?: number;                   // For verses: 1, 2, 3...
  text_ht?: string;                  // Kreyòl lyrics
  text_fr?: string;                  // French lyrics
}

// Example:
const hymn42: HymnSource = {
  number: 42,
  title_fr: "À toi la gloire",
  title_ht: "Pou ou laglwa",
  category: "resurrection",
  sections: [
    { type: 'verse', number: 1, text_fr: "À toi la gloire, ô Ressuscité!\nÀ toi la victoire pour l'éternité!" },
    { type: 'refrain', text_fr: "Brillant de lumière, l'ange est descendu..." },
    { type: 'verse', number: 2, text_fr: "Vois-le paraître: c'est lui, c'est Jésus..." },
    // ... etc
  ]
};
```

### 4.4 Improved Scraper (If Option C Required)

If you must scrape, here's a hardened approach:

```typescript
// scripts/scrape_hymns_v2.ts

// KNOWN GOOD hymn URLs - manually verified
// This is the key difference: curated list, not auto-discovery
const KNOWN_HYMN_URLS: Record<number, string> = {
  1: 'https://chandesperansonline.com/.../hymn-1-...',
  2: 'https://chandesperansonline.com/2018/05/24/du-ciel-bientot-jesus-va-revenir-2/',
  // ... manually add verified URLs for all 800 hymns
};

// Validation: reject bad data
function validateHymn(hymn: any): boolean {
  if (!hymn.number || hymn.number < 1 || hymn.number > 1000) return false;
  if (!hymn.title || hymn.title.length < 3) return false;
  if (!hymn.sections || hymn.sections.length === 0) return false;
  
  // Must have at least one verse with substantial content
  const hasRealContent = hymn.sections.some(
    (s: HymnSection) => s.text && s.text.length > 50
  );
  if (!hasRealContent) return false;
  
  // Title shouldn't be an ad
  const adKeywords = ['mp3', 'download', 'subscribe', 'lesson', 'app', 'iphone', 'ipad'];
  if (adKeywords.some(kw => hymn.title.toLowerCase().includes(kw))) return false;
  
  return true;
}
```

---

## 5. Database Module Rewrite

### 5.1 New Database Manager

```typescript
// src/db/database.ts

import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const CONTENT_DB_NAME = 'content.db';
const USER_DB_NAME = 'user.db';

let contentDb: SQLite.SQLiteDatabase | null = null;
let userDb: SQLite.SQLiteDatabase | null = null;

// Expected content for integrity checks
const CONTENT_INTEGRITY = {
  bible_verses: { minRows: 60000, maxRows: 70000 },
  hymns: { minRows: 700, maxRows: 900 },
  hymn_sections: { minRows: 3000, maxRows: 6000 },
  bible_books: { minRows: 66, maxRows: 66 },
};

/**
 * Open the content database (bundled, read-only content)
 * This is the only database that gets "self-healed" on corruption
 */
export async function openContentDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (contentDb) return contentDb;

  const dbFolder = FileSystem.documentDirectory + 'SQLite/';
  const dbPath = dbFolder + CONTENT_DB_NAME;

  // Ensure directory exists
  const folderInfo = await FileSystem.getInfoAsync(dbFolder);
  if (!folderInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbFolder, { intermediates: true });
  }

  // Copy from assets if not present
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    console.log('[ContentDB] Copying from assets...');
    await copyContentAsset(dbPath);
  }

  // Open and verify
  contentDb = await SQLite.openDatabaseAsync(CONTENT_DB_NAME);
  
  const isValid = await verifyContentIntegrity(contentDb);
  if (!isValid) {
    console.warn('[ContentDB] Integrity check failed, resetting...');
    await contentDb.closeAsync();
    await FileSystem.deleteAsync(dbPath, { idempotent: true });
    await copyContentAsset(dbPath);
    contentDb = await SQLite.openDatabaseAsync(CONTENT_DB_NAME);
    
    // Verify again - if still bad, the asset itself is corrupt
    const stillValid = await verifyContentIntegrity(contentDb);
    if (!stillValid) {
      throw new Error('Content database asset is corrupt. App reinstall required.');
    }
  }

  return contentDb;
}

/**
 * Open the user database (created on device, contains user data)
 * This database is NEVER automatically deleted
 */
export async function openUserDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (userDb) return userDb;

  const dbFolder = FileSystem.documentDirectory + 'SQLite/';
  const dbPath = dbFolder + USER_DB_NAME;

  // Ensure directory exists
  const folderInfo = await FileSystem.getInfoAsync(dbFolder);
  if (!folderInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbFolder, { intermediates: true });
  }

  // Check if exists
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  const isNewDb = !fileInfo.exists;

  userDb = await SQLite.openDatabaseAsync(USER_DB_NAME);

  if (isNewDb) {
    console.log('[UserDB] Initializing new user database...');
    await initializeUserSchema(userDb);
  } else {
    // Run migrations if needed
    await migrateUserDatabase(userDb);
  }

  return userDb;
}

/**
 * Export user data for backup
 */
export async function exportUserData(): Promise<object> {
  const db = await openUserDatabase();
  
  const bookmarks = await db.getAllAsync('SELECT * FROM bookmarks');
  const highlights = await db.getAllAsync('SELECT * FROM highlights');
  const favorites = await db.getAllAsync('SELECT * FROM favorites');
  const settings = await db.getAllAsync('SELECT * FROM user_settings');
  
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    bookmarks,
    highlights,
    favorites,
    settings,
  };
}

/**
 * Import user data from backup
 */
export async function importUserData(data: any): Promise<void> {
  if (data.version !== 1) {
    throw new Error(`Unsupported backup version: ${data.version}`);
  }
  
  const db = await openUserDatabase();
  
  await db.execAsync('BEGIN TRANSACTION');
  try {
    // Clear existing data
    await db.execAsync('DELETE FROM bookmarks');
    await db.execAsync('DELETE FROM highlights');
    await db.execAsync('DELETE FROM favorites');
    
    // Import data...
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

---

## 6. CI/CD Integrity Pipeline

### 6.1 Pre-Build Verification Script

```typescript
// scripts/verify_content_db.ts

const CHECKS: IntegrityCheck[] = [
  {
    table: 'bible_books',
    minRows: 66,
    maxRows: 66,
    requiredColumns: ['id', 'name_ht', 'name_fr', 'testament', 'chapter_count'],
  },
  {
    table: 'bible_verses',
    minRows: 60000,
    maxRows: 70000,
    requiredColumns: ['id', 'book_id', 'chapter', 'verse', 'text_ht', 'text_fr'],
  },
  {
    table: 'hymns',
    minRows: 700,
    maxRows: 900,
    requiredColumns: ['id', 'number', 'title_ht', 'title_fr'],
  },
  {
    table: 'hymn_sections',
    minRows: 3000,
    maxRows: 6000,
    requiredColumns: ['id', 'hymn_id', 'section_type', 'display_order'],
  },
];

// Additional checks:
// - No duplicate hymn numbers
// - FTS tables exist
// - Hash calculation for deployment verification
```

### 6.2 GitHub Actions Workflow

```yaml
# .github/workflows/verify-content.yml

name: Verify Content Database

on:
  push:
    paths:
      - 'src/assets/content.db'
      - 'scripts/generate_db.ts'
      - 'src/assets/data/raw/**'
  pull_request:
    paths:
      - 'src/assets/content.db'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Verify content database integrity
        run: npx ts-node scripts/verify_content_db.ts
      - name: Check hash matches committed hash
        run: |
          COMPUTED=$(sha256sum src/assets/content.db | cut -d' ' -f1)
          COMMITTED=$(cat src/assets/content.db.sha256)
          if [ "$COMPUTED" != "$COMMITTED" ]; then
            echo "❌ Hash mismatch!"
            exit 1
          fi
```

### 6.3 Pre-Commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

if git diff --cached --name-only | grep -q "src/assets/content.db"; then
  echo "📦 Content database modified, running verification..."
  npx ts-node scripts/verify_content_db.ts
  
  if [ $? -ne 0 ]; then
    echo "❌ Content database verification failed. Commit aborted."
    exit 1
  fi
  
  git add src/assets/content.db.sha256
fi
```

---

## 7. Migration Strategy

### 7.1 Migrating Existing Users

```typescript
// src/db/migration_v1_to_v2.ts

export async function migrateFromV1(): Promise<MigrationResult> {
  // 1. Check if old database exists
  // 2. Check if already migrated (user.db exists)
  // 3. Extract user data from old database
  // 4. Create new user.db with migrated data
  // 5. Backup old database (don't delete yet)
  // 6. Delete old database
}
```

### 7.2 App Startup Flow

```typescript
// src/App.tsx or app/_layout.tsx

async function initialize() {
  // Step 1: Run migration if needed (v1 → v2)
  const migrationResult = await migrateFromV1();
  
  // Step 2: Open databases
  await openContentDatabase();
  await openUserDatabase();
}
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

- Content database opens successfully
- Bible books table has 66 rows
- Hymns have sections
- Self-healing works on corrupt content
- User database creates with correct schema
- Bookmarks persist correctly

### 8.2 Integration Tests

- Hymn presentation mode returns sections in correct order
- Both languages supported for hymns
- Search works across both databases

### 8.3 E2E Tests (Detox)

- Navigate to hymns tab
- Jump to hymn by number
- Enter and navigate presentation mode
- Exit presentation mode

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1) - 26 hrs
- Dual database architecture
- New schemas
- Update queries
- CI verification script
- Unit tests

### Phase 2: Content Pipeline (Week 2) - 22 hrs
- Contact license holder
- Design data format
- Build import script
- Import and validate hymns
- Generate content.db

### Phase 3: Migration & UI Updates (Week 3) - 30 hrs
- v1→v2 migration script
- Update Hymn list screen
- Build Presentation mode
- Update Bible reader
- Update search

### Phase 4: Testing & Polish (Week 4) - 36 hrs
- Integration tests
- E2E tests
- Beta testing
- Bug fixes
- Performance optimization

**Total: ~114 hours (3-4 weeks)**

---

## 10. Appendix: File Changes Checklist

### Files to Create
- [ ] `src/db/database.ts` (rewrite)
- [ ] `src/db/queries.ts` (rewrite)
- [ ] `src/db/schemas/content.sql`
- [ ] `src/db/schemas/user.sql`
- [ ] `src/db/migration_v1_to_v2.ts`
- [ ] `src/assets/content.db` (regenerated)
- [ ] `src/assets/content.db.sha256`
- [ ] `scripts/verify_content_db.ts`
- [ ] `.github/workflows/verify-content.yml`
- [ ] `.husky/pre-commit`

### Files to Delete
- [ ] `src/assets/lafwa.db`
- [ ] `scripts/generate_db.ts`
- [ ] `scripts/verify_db_integrity.ts`
- [ ] `scripts/scrape_hymns.ts`

### Files to Modify
- [ ] `app/(tabs)/bible.tsx`
- [ ] `app/(tabs)/hymns.tsx`
- [ ] `src/components/BibleReader.tsx`
- [ ] `src/components/HymnDetail.tsx`
- [ ] `package.json`

---

## Conclusion

This plan addresses the fundamental architectural flaws:

1. **Dual database architecture** protects user data from content updates
2. **Proper hymn sourcing** ensures 800+ hymns with verse/refrain structure
3. **PRD-compliant schema** enables presentation mode and bilingual support
4. **CI/CD guardrails** prevent shipping corrupt assets
5. **Safe migration** preserves existing user data

**Priority:** Phase 1 (foundation) and Phase 2 (content pipeline) unblock all other work.

---

*Document prepared: January 25, 2026*
