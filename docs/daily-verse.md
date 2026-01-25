# Implementation Plan: Daily Verse Feature (Option B - Database-Driven)

**Version**: 1.0  
**Author**: Claude  
**Date**: January 25, 2026  
**Status**: Draft for Review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Requirements Traceability](#2-requirements-traceability)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Database Design](#4-database-design)
5. [Domain Logic](#5-domain-logic)
6. [Data Access Layer](#6-data-access-layer)
7. [UI Integration](#7-ui-integration)
8. [Data Seeding Strategy](#8-data-seeding-strategy)
9. [Migration Strategy](#9-migration-strategy)
10. [Error Handling](#10-error-handling)
11. [Testing Strategy](#11-testing-strategy)
12. [Performance Analysis](#12-performance-analysis)
13. [Security Considerations](#13-security-considerations)
14. [Rollout Plan](#14-rollout-plan)
15. [Appendix: Edge Cases](#15-appendix-edge-cases)

---

## 1. Overview

### 1.1 Problem Statement

The Home screen requires a "Verse of the Day" feature that:

- Displays a different curated Bible verse each day
- Works 100% offline
- Supports both Kreyòl (ht) and French (fr) languages
- Allows users to bookmark, share, and navigate to the full verse context

Current state: Hardcoded single verse in UI component. No rotation, no database integration.

### 1.2 Solution Summary

Implement a database-driven daily verse system using:

- New `daily_verses` table mapping day-of-year → verse reference
- Pure domain function for date-to-index calculation
- Query function joining daily_verses → bible_verses
- React hook for clean UI consumption

### 1.3 Scope

**In Scope:**

- Database schema for daily verses
- Seed data for 366 curated verses
- Query and domain logic
- Home screen integration
- Bookmark/share/navigate actions

**Out of Scope:**

- Multiple verse plans (future enhancement)
- User-defined verse lists (future enhancement)
- Push notifications for daily verse (separate feature)
- Verse image generation for sharing (separate feature)

### 1.4 Principles Alignment

| Principle | How We Apply It                                                         |
| --------- | ----------------------------------------------------------------------- |
| **SRP**   | Separate files for: schema, domain logic, queries, UI hook, component   |
| **DRY**   | Single `getDayOfYear()` function; single source of truth for verse list |
| **KISS**  | Simple day-of-year mod; no over-engineered caching or state management  |
| **YAGNI** | No multi-plan support until requested; no server sync infrastructure    |

---

## 2. Requirements Traceability

### 2.1 PRD Requirements

| PRD Ref      | Requirement                                                         | Implementation                               |
| ------------ | ------------------------------------------------------------------- | -------------------------------------------- |
| §4.2.1       | "Verse of the Day (rotates daily from curated list, works offline)" | `daily_verses` table + day-of-year selection |
| §4.2.1       | "Continue Reading"                                                  | Separate feature (already exists)            |
| §5.4.1 PE-01 | "Save verse bookmarks locally"                                      | Reuse existing `toggleBookmark()`            |

### 2.2 UX/UI Spec Requirements

| Spec Ref | Requirement                                         | Implementation                      |
| -------- | --------------------------------------------------- | ----------------------------------- |
| §3.1.2   | Verse of the Day Card with bookmark/share/read more | Wire existing UI to real data       |
| §3.1.2   | Scripture reference display                         | Query returns formatted reference   |
| §3.1.2   | Max 4 lines with ellipsis                           | UI truncation (already implemented) |

### 2.3 Acceptance Criteria

```gherkin
Feature: Daily Verse Display

  Scenario: User opens app on a given day
    Given the app has been installed with seed data
    And the current date is January 15, 2026
    When the user opens the Home tab
    Then they see the verse assigned to day 15 of the year
    And the verse displays in their selected language (ht or fr)

  Scenario: User opens app on consecutive days
    Given the user opened the app on January 15
    When they open the app on January 16
    Then they see a different verse (day 16)

  Scenario: User bookmarks the daily verse
    Given the daily verse is displayed
    When the user taps the bookmark icon
    Then the verse is saved to their bookmarks
    And the bookmark icon changes to filled state

  Scenario: User taps "Read more" on daily verse
    Given the daily verse is John 3:16
    When the user taps "Read more" or the verse card
    Then they navigate to Bible reader at John chapter 3
    And the reader scrolls to verse 16

  Scenario: Leap year handling
    Given the current year is 2028 (leap year)
    And the date is December 31
    When the user opens the app
    Then they see the verse for day 366

  Scenario: Offline functionality
    Given the user has no internet connection
    When they open the Home tab
    Then the daily verse loads instantly from local database
```

---

## 3. Architecture Decision Records

### ADR-001: Database Table vs. Code Array

**Context:** Daily verses can be stored as (A) TypeScript array in code, or (B) database table.

**Decision:** Database table (Option B)

**Rationale:**

- Verses join directly to `bible_verses` table, ensuring referential integrity
- Future extensibility: multiple plans, user lists, A/B testing
- Content updates via database migration, not code deployment
- Consistent with existing architecture pattern (hymns, bible_verses)

**Consequences:**

- Requires database migration for existing users
- Seed data must be carefully validated
- Slightly more complex than array approach

**Alternatives Rejected:**

- Code array: Simpler but inconsistent with architecture; no referential integrity

---

### ADR-002: Day Selection Algorithm

**Context:** Need deterministic mapping from date → verse index.

**Decision:** Use day-of-year (1-366) as direct foreign key.

**Rationale:**

- Simple and predictable: January 1 = day 1, December 31 = day 365/366
- No hash functions or random seeds needed
- Users can predict tomorrow's verse (feature, not bug, for devotional planning)
- Easy to debug: "What verse shows on March 15?" → Look up day 74

**Consequences:**

- Must handle leap years (day 366)
- All users see same verse on same calendar day (acceptable for V1)

**Alternatives Rejected:**

- Hash of date string: Unpredictable, harder to debug
- User-specific seed: Adds complexity, not requested
- Week-based rotation: Doesn't meet "daily" requirement

---

### ADR-003: Timezone Handling

**Context:** Different users are in different timezones. When does "today" change?

**Decision:** Use device local time.

**Rationale:**

- Offline-first means no server to provide authoritative time
- Users expect the verse to change at midnight _their_ time
- Consistent with how other daily features work (streaks, reminders)

**Consequences:**

- User traveling across timezones may see verse change mid-day
- Two users in different timezones see different verses at same UTC moment

**Alternatives Rejected:**

- UTC-based: Verse changes at 7pm EST, confusing for users
- Server time: Violates offline-first principle

---

### ADR-004: Verse Reference Storage

**Context:** How to reference a verse in `daily_verses` table?

**Decision:** Store `book`, `chapter`, `verse` as separate columns with composite index.

**Rationale:**

- Matches `bible_verses` table structure for easy joins
- Allows validation against actual Bible data
- No string parsing needed at runtime

**Consequences:**

- Three columns instead of one reference string
- Insert statements are slightly more verbose

**Alternatives Rejected:**

- Single reference string ("Jan 3:16"): Requires parsing, error-prone, no FK validation
- Foreign key to `bible_verses.id`: IDs are auto-increment, fragile across DB rebuilds

---

## 4. Database Design

### 4.1 Schema Definition

```sql
-- ============================================================
-- Daily Verses Table
-- Maps day-of-year (1-366) to a specific Bible verse reference
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Day of year: 1-366 (366 for leap years)
    -- This is the lookup key, not a date
    day_of_year INTEGER NOT NULL,

    -- Verse reference (matches bible_verses structure)
    book TEXT NOT NULL,           -- e.g., 'Jan' (Kreyòl book name)
    chapter INTEGER NOT NULL,     -- e.g., 3
    verse_start INTEGER NOT NULL, -- e.g., 16
    verse_end INTEGER,            -- NULL for single verse, or end verse for range

    -- Metadata
    theme TEXT,                   -- Optional: 'hope', 'faith', 'love', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT day_of_year_range CHECK (day_of_year >= 1 AND day_of_year <= 366),
    CONSTRAINT chapter_positive CHECK (chapter >= 1),
    CONSTRAINT verse_positive CHECK (verse_start >= 1),
    CONSTRAINT verse_range_valid CHECK (verse_end IS NULL OR verse_end >= verse_start)
);

-- Unique constraint: one verse per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_verses_day
    ON daily_verses(day_of_year);

-- Index for theme-based queries (future use)
CREATE INDEX IF NOT EXISTS idx_daily_verses_theme
    ON daily_verses(theme) WHERE theme IS NOT NULL;
```

### 4.2 Schema Decisions Explained

| Column                  | Decision           | Rationale                                                                                        |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `day_of_year`           | INTEGER 1-366      | Direct lookup key; CHECK constraint prevents invalid values                                      |
| `book`                  | TEXT (Kreyòl name) | Matches `bible_verses.book` for joining; Kreyòl is app default                                   |
| `verse_end`             | NULLABLE           | Allows single verses (NULL) or ranges (e.g., John 3:16-17)                                       |
| `theme`                 | NULLABLE TEXT      | Future: filter by theme for special occasions; YAGNI for V1 display                              |
| No FK to `bible_verses` | Intentional        | `bible_verses` has composite key; FK would require knowing exact row ID which varies per version |

### 4.3 Data Integrity Validation

Before any insert, validate that the verse exists:

```sql
-- Validation query (run during seeding, not at runtime)
SELECT COUNT(*)
FROM bible_verses
WHERE book = ? AND chapter = ? AND verse = ? AND version = 'ht';
-- Must return 1; if 0, the daily verse reference is invalid
```

### 4.4 Why Not Foreign Key?

The `bible_verses` table has both Kreyòl and French versions. A daily verse reference like "John 3:16" maps to TWO rows (one per version). We can't FK to a single row. Instead, we:

1. Store the canonical reference (book, chapter, verse)
2. Join at query time with version filter
3. Validate during seeding that both versions exist

---

## 5. Domain Logic

### 5.1 File Structure

```
src/
  domain/
    dailyVerse.ts      # Pure functions for date logic
```

**Why a new `domain/` directory?**  
Following the architecture boundary guidance: pure business rules in `/domain`, no DB/UI imports. This function has no dependencies and can be unit tested in isolation.

### 5.2 Day-of-Year Calculation

```typescript
/**
 * @file src/domain/dailyVerse.ts
 * Pure domain functions for daily verse selection.
 * No external dependencies - easily testable.
 */

/**
 * Calculates the day of year (1-366) for a given date.
 *
 * @param date - The date to calculate for (defaults to now)
 * @returns Day of year: 1 for Jan 1, 365/366 for Dec 31
 *
 * @example
 * getDayOfYear(new Date('2026-01-01')) // returns 1
 * getDayOfYear(new Date('2026-12-31')) // returns 365
 * getDayOfYear(new Date('2028-12-31')) // returns 366 (leap year)
 */
export function getDayOfYear(date: Date = new Date()): number {
  // Create date at start of year in local timezone
  const startOfYear = new Date(date.getFullYear(), 0, 1)

  // Calculate difference in milliseconds
  const diffMs = date.getTime() - startOfYear.getTime()

  // Convert to days (add 1 because Jan 1 = day 1, not day 0)
  const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1

  return dayOfYear
}

/**
 * Determines if a year is a leap year.
 *
 * @param year - Four-digit year
 * @returns true if leap year
 *
 * @example
 * isLeapYear(2024) // true
 * isLeapYear(2025) // false
 * isLeapYear(2000) // true (divisible by 400)
 * isLeapYear(1900) // false (divisible by 100 but not 400)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Gets the total days in a year.
 *
 * @param year - Four-digit year
 * @returns 365 or 366
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

/**
 * Normalizes day of year for non-leap years.
 * If database has 366 entries but current year has 365 days,
 * day 366 (Dec 31 of leap year) maps to day 365.
 *
 * This ensures Dec 31 always shows a verse, even in non-leap years.
 *
 * @param dayOfYear - Raw day of year (1-366)
 * @param year - The year to normalize for
 * @returns Normalized day (1-365 for non-leap, 1-366 for leap)
 */
export function normalizeDayOfYear(dayOfYear: number, year: number): number {
  const maxDay = getDaysInYear(year)
  return Math.min(dayOfYear, maxDay)
}
```

### 5.3 Design Decisions

**Q: Why not just use `date.getDay()` or similar?**  
A: `getDay()` returns day of week (0-6), not day of year. There's no native JS method for day-of-year.

**Q: Why handle leap years explicitly?**  
A: If we store 366 verses but query on day 366 in a non-leap year (impossible date), we'd get no results. The normalization ensures Dec 31 always works.

**Q: Why use local timezone?**  
A: See ADR-003. User expects verse to change at their midnight, and we can't rely on server time for offline-first app.

---

## 6. Data Access Layer

### 6.1 File Modifications

```
src/
  db/
    queries.ts         # Add getDailyVerse function
```

### 6.2 Query Implementation

```typescript
/**
 * Add to: src/db/queries.ts
 */

import { getDayOfYear } from '../domain/dailyVerse'

// Type definitions
export interface DailyVerse {
  // From daily_verses table
  dayOfYear: number
  book: string
  chapter: number
  verseStart: number
  verseEnd: number | null
  theme: string | null

  // From bible_verses join
  verseId: number // For bookmark reference
  text: string // Verse text in requested version

  // Computed
  reference: string // Formatted: "Jan 3:16" or "Jan 3:16-17"
}

/**
 * Retrieves the daily verse for today (or a specific day).
 *
 * @param version - Bible version ('ht' or 'fr')
 * @param dayOverride - Optional day of year override (for testing)
 * @returns The daily verse with full text, or null if not found
 *
 * @example
 * const verse = await getDailyVerse('ht');
 * // { dayOfYear: 15, book: 'Jan', chapter: 3, verseStart: 16, ... }
 */
export async function getDailyVerse(
  version: 'ht' | 'fr' = 'ht',
  dayOverride?: number,
): Promise<DailyVerse | null> {
  const db = await openDatabase()

  const today = dayOverride ?? getDayOfYear()

  // Query joins daily_verses with bible_verses
  // For verse ranges, we concatenate the text of all verses
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
  `

  const result = await db.getFirstAsync<DailyVerse>(sql, [
    version,
    version,
    today,
  ])

  if (!result) {
    console.warn(`No daily verse found for day ${today}`)
    return null
  }

  // Add computed reference string
  const reference = formatVerseReference(
    result.book,
    result.chapter,
    result.verseStart,
    result.verseEnd,
    version,
  )

  return { ...result, reference }
}

/**
 * Formats a verse reference string.
 *
 * @example
 * formatVerseReference('Jan', 3, 16, null, 'ht') // "Jan 3:16"
 * formatVerseReference('Jan', 3, 16, 17, 'fr')   // "Jean 3:16-17"
 */
function formatVerseReference(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  version: 'ht' | 'fr',
): string {
  // Get localized book name
  const bookData = getBookByName(book)
  const localizedBook = version === 'fr' && bookData ? bookData.nameFr : book

  const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`

  return `${localizedBook} ${chapter}:${verseRange}`
}

/**
 * Gets verse ID for bookmarking.
 * When daily verse is a range, returns the first verse's ID.
 *
 * @param book - Book name
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @param version - Bible version
 * @returns Verse ID or null
 */
export async function getVerseId(
  book: string,
  chapter: number,
  verse: number,
  version: 'ht' | 'fr',
): Promise<number | null> {
  const db = await openDatabase()

  const result = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
    [book, chapter, verse, version],
  )

  return result?.id ?? null
}
```

### 6.3 Query Design Decisions

**Q: Why GROUP_CONCAT for ranges?**  
A: A daily verse might span multiple verses (e.g., Psalm 23:1-3). We need to return all text concatenated.

**Q: Why not use a subquery for single verses too?**  
A: Optimization. Single verses are the common case (95%+). The CASE statement avoids unnecessary subquery execution.

**Q: Why return `verseId`?**  
A: The bookmark system uses `bible_verses.id` as `reference_id`. We need this to bookmark the daily verse.

---

## 7. UI Integration

### 7.1 Custom Hook

```
src/
  hooks/
    useDailyVerse.ts   # New file
```

```typescript
/**
 * @file src/hooks/useDailyVerse.ts
 * React hook for daily verse data and actions.
 */

import { useState, useEffect, useCallback } from 'react'
import { Share, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import {
  getDailyVerse,
  DailyVerse,
  toggleBookmark,
  isBookmarked,
} from '../db/queries'
import { useSettingsStore } from '../stores/settingsStore'

interface UseDailyVerseResult {
  verse: DailyVerse | null
  isLoading: boolean
  error: Error | null
  isBookmarked: boolean

  // Actions
  handleBookmark: () => Promise<void>
  handleShare: () => Promise<void>
  handleReadMore: () => void
}

export function useDailyVerse(): UseDailyVerseResult {
  const router = useRouter()
  const { bibleVersion, language } = useSettingsStore()

  const [verse, setVerse] = useState<DailyVerse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [bookmarked, setBookmarked] = useState(false)

  // Fetch daily verse
  useEffect(() => {
    let isMounted = true

    async function fetchVerse() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getDailyVerse(bibleVersion)

        if (!isMounted) return

        setVerse(result)

        // Check bookmark status
        if (result?.verseId) {
          const isMarked = await isBookmarked('bible', result.verseId)
          if (isMounted) setBookmarked(isMarked)
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error ? err : new Error('Failed to load daily verse'),
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchVerse()

    return () => {
      isMounted = false
    }
  }, [bibleVersion])

  // Bookmark action
  const handleBookmark = useCallback(async () => {
    if (!verse?.verseId) return

    try {
      const added = await toggleBookmark('bible', verse.verseId)
      setBookmarked(added)
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }, [verse?.verseId])

  // Share action
  const handleShare = useCallback(async () => {
    if (!verse) return

    const shareText = `"${verse.text}"\n\n— ${verse.reference}\n\nvia Lafwa App`

    try {
      await Share.share({
        message: shareText,
      })
    } catch (err) {
      // User cancelled or share failed - silent fail is OK
      console.log('Share cancelled or failed:', err)
    }
  }, [verse])

  // Navigate to full chapter
  const handleReadMore = useCallback(() => {
    if (!verse) return

    // Navigate to Bible reader at this chapter
    // The Bible tab will need to accept route params (see Section 7.3)
    router.push({
      pathname: '/bible',
      params: {
        book: verse.book,
        chapter: verse.chapter.toString(),
        verse: verse.verseStart.toString(),
      },
    })
  }, [verse, router])

  return {
    verse,
    isLoading,
    error,
    isBookmarked: bookmarked,
    handleBookmark,
    handleShare,
    handleReadMore,
  }
}
```

### 7.2 Home Screen Updates

```typescript
/**
 * Updates to: app/(tabs)/index.tsx
 *
 * Replace the hardcoded VERSE_OF_DAY with hook usage.
 */

// Remove this:
// const VERSE_OF_DAY = { ... };

// Add import:
import { useDailyVerse } from '../../src/hooks/useDailyVerse';

// In component:
export default function HomeScreen() {
  // ... existing code ...

  const {
    verse,
    isLoading,
    error,
    isBookmarked,
    handleBookmark,
    handleShare,
    handleReadMore,
  } = useDailyVerse();

  // ... existing code ...

  // Update Verse of the Day card:
  return (
    // ... existing JSX ...

    {/* Verse of the Day */}
    {isLoading ? (
      <VerseCardSkeleton /> // See 7.4
    ) : error ? (
      <VerseCardError onRetry={() => { /* trigger refetch */ }} />
    ) : verse ? (
      <TouchableOpacity
        onPress={handleReadMore}
        activeOpacity={0.9}
        style={[styles.verseCard, ...]}
      >
        <View style={styles.verseHeader}>
          <Text style={styles.verseLabel}>
            {language === 'ht' ? 'Vèsè Jounen An' : 'Verset du Jour'}
          </Text>
        </View>

        <Text
          style={styles.verseText}
          numberOfLines={4}
        >
          "{verse.text}"
        </Text>

        <View style={styles.verseFooter}>
          <Text style={styles.verseRef}>{verse.reference}</Text>

          <View style={styles.verseActions}>
            <TouchableOpacity
              onPress={handleBookmark}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ) : (
      <VerseCardEmpty />
    )}

    // ... rest of JSX ...
  );
}
```

### 7.3 Bible Tab Route Params

The Bible tab needs to accept optional route parameters for deep linking:

```typescript
/**
 * Updates to: app/(tabs)/bible.tsx
 *
 * Add support for route params to open specific chapter/verse.
 */

import { useLocalSearchParams } from 'expo-router'

export default function BibleScreen() {
  const params = useLocalSearchParams<{
    book?: string
    chapter?: string
    verse?: string
  }>()

  // ... existing state ...

  // Handle incoming params (deep link from daily verse)
  useEffect(() => {
    if (params.book && params.chapter) {
      const bookData = getBookByName(params.book)
      if (bookData) {
        setSelectedBook(bookData)
        setSelectedChapter(parseInt(params.chapter, 10))
        setScreen('reader')

        // TODO: Scroll to specific verse if params.verse provided
        // This requires adding scrollToVerse prop to BibleReader
      }
    }
  }, [params.book, params.chapter, params.verse])

  // ... rest of component ...
}
```

### 7.4 Loading State Component

```typescript
/**
 * New file: src/components/VerseCardSkeleton.tsx
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function VerseCardSkeleton() {
  const { colors } = useTheme();

  // Shimmer animation (simplified)
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Animated.View
        style={[styles.label, { backgroundColor: colors.mist, opacity }]}
      />
      <Animated.View
        style={[styles.line, { backgroundColor: colors.mist, opacity }]}
      />
      <Animated.View
        style={[styles.line, styles.lineShort, { backgroundColor: colors.mist, opacity }]}
      />
      <Animated.View
        style={[styles.reference, { backgroundColor: colors.mist, opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    width: 100,
    height: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  line: {
    width: '100%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  lineShort: {
    width: '60%',
  },
  reference: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginTop: 16,
  },
});
```

---

## 8. Data Seeding Strategy

### 8.1 Curation Guidelines

The 366 verses should be:

- **Diverse**: Mix of OT and NT, different themes, various book lengths
- **Accessible**: Avoid obscure passages requiring heavy context
- **Encouraging**: Emphasize hope, faith, love (primary use case is daily encouragement)
- **Complete thoughts**: Don't cut verses mid-sentence

**Suggested theme distribution:**

- Hope/Encouragement: 25%
- Faith/Trust: 20%
- Love: 15%
- Wisdom/Guidance: 15%
- Praise/Worship: 10%
- Comfort in trials: 10%
- Miscellaneous: 5%

### 8.2 Seed Data Format

```typescript
/**
 * New file: scripts/seedDailyVerses.ts
 *
 * Run during database build (not at runtime).
 */

interface DailyVerseSeed {
  day: number // 1-366
  book: string // Kreyòl book name (matches bible_verses.book)
  chapter: number
  verseStart: number
  verseEnd?: number // Optional for ranges
  theme?: string
}

// Example entries (full list would have 366)
export const DAILY_VERSES: DailyVerseSeed[] = [
  // January
  { day: 1, book: 'Jenèz', chapter: 1, verseStart: 1, theme: 'creation' },
  {
    day: 2,
    book: 'Sòm',
    chapter: 23,
    verseStart: 1,
    verseEnd: 3,
    theme: 'comfort',
  },
  { day: 3, book: 'Jan', chapter: 3, verseStart: 16, theme: 'love' },
  { day: 4, book: 'Women', chapter: 8, verseStart: 28, theme: 'hope' },
  { day: 5, book: 'Filip', chapter: 4, verseStart: 13, theme: 'faith' },
  // ... 361 more entries ...
  { day: 365, book: 'Revelasyon', chapter: 21, verseStart: 5, theme: 'hope' },
  {
    day: 366,
    book: 'Revelasyon',
    chapter: 22,
    verseStart: 21,
    theme: 'blessing',
  }, // Leap year
]
```

### 8.3 Validation Script

```typescript
/**
 * Part of: scripts/seedDailyVerses.ts
 *
 * Validates all seed data against actual Bible content.
 */

async function validateSeedData(db: SQLiteDatabase): Promise<string[]> {
  const errors: string[] = []

  for (const verse of DAILY_VERSES) {
    // Check day is valid
    if (verse.day < 1 || verse.day > 366) {
      errors.push(`Day ${verse.day}: Invalid day number`)
      continue
    }

    // Check verse exists in Kreyòl
    const htResult = await db.getFirstAsync(
      'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
      [verse.book, verse.chapter, verse.verseStart, 'ht'],
    )

    if (!htResult) {
      errors.push(
        `Day ${verse.day}: ${verse.book} ${verse.chapter}:${verse.verseStart} not found in Kreyòl`,
      )
    }

    // Check verse exists in French
    const frResult = await db.getFirstAsync(
      'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
      [verse.book, verse.chapter, verse.verseStart, 'fr'],
    )

    if (!frResult) {
      errors.push(
        `Day ${verse.day}: ${verse.book} ${verse.chapter}:${verse.verseStart} not found in French`,
      )
    }

    // Check verse range if applicable
    if (verse.verseEnd) {
      for (let v = verse.verseStart; v <= verse.verseEnd; v++) {
        const rangeResult = await db.getFirstAsync(
          'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
          [verse.book, verse.chapter, v, 'ht'],
        )
        if (!rangeResult) {
          errors.push(
            `Day ${verse.day}: ${verse.book} ${verse.chapter}:${v} (in range) not found`,
          )
        }
      }
    }
  }

  // Check for duplicate days
  const days = DAILY_VERSES.map((v) => v.day)
  const duplicates = days.filter((day, index) => days.indexOf(day) !== index)
  for (const dup of duplicates) {
    errors.push(`Day ${dup}: Duplicate entry`)
  }

  // Check for missing days
  for (let day = 1; day <= 366; day++) {
    if (!days.includes(day)) {
      errors.push(`Day ${day}: Missing entry`)
    }
  }

  return errors
}
```

### 8.4 Insert Script

```typescript
/**
 * Part of: scripts/seedDailyVerses.ts
 */

async function seedDailyVerses(db: SQLiteDatabase): Promise<void> {
  // Validate first
  const errors = await validateSeedData(db)
  if (errors.length > 0) {
    console.error('Validation errors:')
    errors.forEach((e) => console.error(`  - ${e}`))
    throw new Error(
      `${errors.length} validation errors found. Fix seed data before continuing.`,
    )
  }

  // Clear existing data
  await db.runAsync('DELETE FROM daily_verses')

  // Insert in batches for performance
  const BATCH_SIZE = 50
  for (let i = 0; i < DAILY_VERSES.length; i += BATCH_SIZE) {
    const batch = DAILY_VERSES.slice(i, i + BATCH_SIZE)

    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
    const values = batch.flatMap((v) => [
      v.day,
      v.book,
      v.chapter,
      v.verseStart,
      v.verseEnd ?? null,
      v.theme ?? null,
    ])

    await db.runAsync(
      `INSERT INTO daily_verses (day_of_year, book, chapter, verse_start, verse_end, theme) 
       VALUES ${placeholders}`,
      values,
    )
  }

  console.log(`Seeded ${DAILY_VERSES.length} daily verses`)
}
```

---

## 9. Migration Strategy

### 9.1 Migration Approach

Since this is V1 development (not a live app update), we add the schema directly to `schema.sql` and rebuild the database asset.

**For future live app updates**, migrations would use:

1. Version number in user_settings
2. Migration scripts that run on app open
3. Expo OTA to deliver new database asset

### 9.2 Schema Addition

Add to `src/db/schema.sql`:

```sql
-- ============================================================
-- Daily Verses (added in v1.0)
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_verses (
    -- ... full schema from Section 4.1 ...
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_verses_day
    ON daily_verses(day_of_year);
```

### 9.3 Database Build Script

Update the database build process:

```bash
# scripts/build-database.sh

# 1. Create fresh database
sqlite3 lafwa.db < src/db/schema.sql

# 2. Import Bible data
node scripts/importBible.js

# 3. Import hymns data
node scripts/importHymns.js

# 4. Seed daily verses (NEW)
npx ts-node scripts/seedDailyVerses.ts

# 5. Build FTS indexes
sqlite3 lafwa.db "INSERT INTO bible_fts(bible_fts) VALUES('rebuild');"

# 6. Optimize
sqlite3 lafwa.db "VACUUM; ANALYZE;"

# 7. Copy to assets
cp lafwa.db src/assets/lafwa.db
```

---

## 10. Error Handling

### 10.1 Error Scenarios

| Scenario                               | Likelihood | Impact | Handling                                    |
| -------------------------------------- | ---------- | ------ | ------------------------------------------- |
| No verse for today (missing seed data) | Very Low   | High   | Return null; show fallback UI               |
| Database not initialized               | Low        | High   | Caught by existing DB init; shows app error |
| Verse text missing (bad FK)            | Very Low   | Medium | Return null; log warning                    |
| Invalid day of year (impossible)       | Impossible | N/A    | Domain function can't return invalid day    |

### 10.2 Fallback Strategy

If `getDailyVerse()` returns `null`:

1. **UI shows graceful fallback** - "Unable to load verse" with refresh option
2. **Do NOT hardcode a default verse** - Masks the bug, harder to detect
3. **Log to crash reporting** - We want to know if this happens in production

```typescript
// In useDailyVerse hook
if (!result) {
  // Log for debugging (use your crash reporting service)
  console.warn('[DailyVerse] No verse found for day', today)

  // Consider sending to analytics
  // analytics.track('daily_verse_missing', { day: today });
}
```

### 10.3 Retry Logic

```typescript
// In useDailyVerse hook, add retry capability
const [retryCount, setRetryCount] = useState(0)

const handleRetry = useCallback(() => {
  setRetryCount((c) => c + 1)
}, [])

useEffect(() => {
  // ... fetch logic ...
}, [bibleVersion, retryCount]) // retryCount triggers refetch
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
/**
 * File: __tests__/domain/dailyVerse.test.ts
 */

import {
  getDayOfYear,
  isLeapYear,
  normalizeDayOfYear,
} from '../../src/domain/dailyVerse'

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    expect(getDayOfYear(new Date('2026-01-01'))).toBe(1)
  })

  it('returns 32 for February 1', () => {
    expect(getDayOfYear(new Date('2026-02-01'))).toBe(32)
  })

  it('returns 365 for December 31 in non-leap year', () => {
    expect(getDayOfYear(new Date('2026-12-31'))).toBe(365)
  })

  it('returns 366 for December 31 in leap year', () => {
    expect(getDayOfYear(new Date('2028-12-31'))).toBe(366)
  })

  it('handles leap day (Feb 29)', () => {
    expect(getDayOfYear(new Date('2028-02-29'))).toBe(60)
  })

  it('handles day after leap day correctly', () => {
    expect(getDayOfYear(new Date('2028-03-01'))).toBe(61)
  })
})

describe('isLeapYear', () => {
  it('returns true for years divisible by 4', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2028)).toBe(true)
  })

  it('returns false for years divisible by 100 but not 400', () => {
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2100)).toBe(false)
  })

  it('returns true for years divisible by 400', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(2400)).toBe(true)
  })

  it('returns false for regular non-leap years', () => {
    expect(isLeapYear(2025)).toBe(false)
    expect(isLeapYear(2026)).toBe(false)
  })
})

describe('normalizeDayOfYear', () => {
  it('returns same day for valid day in leap year', () => {
    expect(normalizeDayOfYear(366, 2028)).toBe(366)
  })

  it('clamps day 366 to 365 in non-leap year', () => {
    expect(normalizeDayOfYear(366, 2026)).toBe(365)
  })

  it('returns same day for regular days', () => {
    expect(normalizeDayOfYear(100, 2026)).toBe(100)
  })
})
```

### 11.2 Integration Tests

```typescript
/**
 * File: __tests__/db/dailyVerse.integration.test.ts
 */

import { getDailyVerse } from '../../src/db/queries'
import { setupTestDatabase, teardownTestDatabase } from '../testUtils'

describe('getDailyVerse', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it('returns verse for valid day', async () => {
    const verse = await getDailyVerse('ht', 1)

    expect(verse).not.toBeNull()
    expect(verse!.dayOfYear).toBe(1)
    expect(verse!.book).toBeTruthy()
    expect(verse!.text).toBeTruthy()
    expect(verse!.reference).toMatch(/\d+:\d+/)
  })

  it('returns French text when version is fr', async () => {
    const htVerse = await getDailyVerse('ht', 1)
    const frVerse = await getDailyVerse('fr', 1)

    expect(htVerse!.reference).not.toBe(frVerse!.reference)
    // Text should differ (different language)
    expect(htVerse!.text).not.toBe(frVerse!.text)
  })

  it('returns null for invalid day', async () => {
    const verse = await getDailyVerse('ht', 999)
    expect(verse).toBeNull()
  })

  it('handles verse ranges', async () => {
    // Assuming day 2 is Psalm 23:1-3 (a range)
    const verse = await getDailyVerse('ht', 2)

    if (verse?.verseEnd) {
      // Text should contain multiple verses
      expect(verse.text.length).toBeGreaterThan(100)
      expect(verse.reference).toMatch(/\d+-\d+/)
    }
  })

  it('all 366 days have valid verses', async () => {
    for (let day = 1; day <= 366; day++) {
      const verse = await getDailyVerse('ht', day)
      expect(verse).not.toBeNull()
      expect(verse!.verseId).toBeGreaterThan(0)
    }
  })
})
```

### 11.3 UI Tests

```typescript
/**
 * File: __tests__/components/HomeScreen.test.tsx
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

// Mock the hook
jest.mock('../../src/hooks/useDailyVerse', () => ({
  useDailyVerse: () => ({
    verse: {
      dayOfYear: 1,
      book: 'Jan',
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      theme: 'love',
      verseId: 123,
      text: 'Test verse text',
      reference: 'Jan 3:16',
    },
    isLoading: false,
    error: null,
    isBookmarked: false,
    handleBookmark: jest.fn(),
    handleShare: jest.fn(),
    handleReadMore: jest.fn(),
  }),
}));

describe('HomeScreen - Daily Verse', () => {
  it('displays verse text', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/"Test verse text"/)).toBeTruthy();
  });

  it('displays verse reference', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Jan 3:16')).toBeTruthy();
  });

  it('calls handleBookmark when bookmark pressed', async () => {
    const mockHandleBookmark = jest.fn();
    jest.spyOn(require('../../src/hooks/useDailyVerse'), 'useDailyVerse')
      .mockReturnValue({
        ...existingMock,
        handleBookmark: mockHandleBookmark,
      });

    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('verse-bookmark-button'));

    expect(mockHandleBookmark).toHaveBeenCalled();
  });
});
```

### 11.4 Edge Case Tests

```typescript
/**
 * File: __tests__/domain/dailyVerse.edge.test.ts
 */

describe('Edge Cases', () => {
  describe('Timezone boundaries', () => {
    it('handles midnight correctly', () => {
      const midnight = new Date('2026-01-15T00:00:00')
      const almostMidnight = new Date('2026-01-14T23:59:59')

      expect(getDayOfYear(midnight)).toBe(15)
      expect(getDayOfYear(almostMidnight)).toBe(14)
    })
  })

  describe('Year transitions', () => {
    it('handles New Years Eve to New Years Day', () => {
      const dec31 = new Date('2026-12-31T23:59:59')
      const jan1 = new Date('2027-01-01T00:00:00')

      expect(getDayOfYear(dec31)).toBe(365)
      expect(getDayOfYear(jan1)).toBe(1)
    })
  })

  describe('DST transitions', () => {
    // Note: This depends on device locale
    it('handles spring forward', () => {
      // March 8, 2026 - DST starts in US
      const beforeDST = new Date('2026-03-08T01:59:00')
      const afterDST = new Date('2026-03-08T03:00:00')

      // Both should be day 67
      expect(getDayOfYear(beforeDST)).toBe(67)
      expect(getDayOfYear(afterDST)).toBe(67)
    })
  })
})
```

---

## 12. Performance Analysis

### 12.1 Query Performance

**Expected query execution:**

- Table size: 366 rows
- Index on `day_of_year`: O(log n) lookup = ~9 comparisons
- Single row result + 1 join to `bible_verses`

**Benchmark target:** < 10ms on low-end device

```sql
-- Query plan analysis
EXPLAIN QUERY PLAN
SELECT * FROM daily_verses dv
JOIN bible_verses bv ON ...
WHERE dv.day_of_year = 15;

-- Expected output:
-- SEARCH daily_verses USING INDEX idx_daily_verses_day (day_of_year=?)
-- SEARCH bible_verses USING INDEX ... (book=? AND chapter=? AND verse=? AND version=?)
```

### 12.2 Memory Impact

| Item               | Size  | Notes                       |
| ------------------ | ----- | --------------------------- |
| daily_verses table | ~50KB | 366 rows × ~140 bytes/row   |
| Index              | ~8KB  | Small unique index          |
| Query result       | ~1KB  | Single row with joined text |

**Total added storage:** ~60KB (well within budget)

### 12.3 Caching Strategy

**Decision: No caching needed**

Rationale:

- Query is fast (< 10ms)
- Data changes only once per day
- Hook already prevents re-fetch on re-render (useEffect dependencies)
- Adding cache adds complexity for minimal gain (KISS/YAGNI)

If performance issues arise in production, consider:

- Zustand store for daily verse (persist across app restarts)
- Cache invalidation at midnight

---

## 13. Security Considerations

### 13.1 Risk Assessment

| Risk                      | Severity | Likelihood | Mitigation                                                          |
| ------------------------- | -------- | ---------- | ------------------------------------------------------------------- |
| SQL injection in query    | High     | None       | Parameterized queries used throughout                               |
| User-submitted verse data | High     | None       | No user input; data is curated at build time                        |
| Data tampering            | Low      | Very Low   | SQLite file is in app sandbox; Expo code signing prevents tampering |

### 13.2 Input Validation

The only "input" is the day of year, which is:

1. Calculated from system date (not user input)
2. Passed as parameterized query value
3. Constrained by domain function to return 1-366

**No additional validation needed.**

### 13.3 Data Privacy

This feature:

- Does not collect any user data
- Does not transmit anything over network
- Bookmark data stays local (existing feature)

**No privacy concerns.**

---

## 14. Rollout Plan

### 14.1 Implementation Phases

| Phase              | Duration | Tasks                                          | Exit Criteria              |
| ------------------ | -------- | ---------------------------------------------- | -------------------------- |
| 1. Schema & Domain | 2 hours  | Add schema, write domain functions, unit tests | All unit tests pass        |
| 2. Data Layer      | 3 hours  | Write queries, integration tests               | Query returns correct data |
| 3. Seed Data       | 4 hours  | Curate 366 verses, validation script           | All verses validated       |
| 4. UI Integration  | 2 hours  | Hook, component updates                        | Feature works end-to-end   |
| 5. Polish          | 2 hours  | Loading states, error handling, edge cases     | QA pass                    |
| 6. Documentation   | 1 hour   | Update README, inline docs                     | PR ready                   |

**Total estimated effort:** 14 hours

### 14.2 Code Review Checklist

Before PR approval, verify:

- [ ] Schema follows existing patterns
- [ ] Domain functions are pure (no side effects)
- [ ] Queries use parameterized statements
- [ ] All 366 days have valid verse mappings
- [ ] French and Kreyòl versions both work
- [ ] Bookmark integration works
- [ ] Share functionality works
- [ ] "Read more" navigates correctly
- [ ] Loading state displays properly
- [ ] Error state displays properly
- [ ] Leap year (day 366) works
- [ ] Unit tests cover edge cases
- [ ] Integration tests verify DB queries
- [ ] No console.log statements in production code
- [ ] TypeScript types are complete (no `any`)

### 14.3 QA Test Scenarios

| Scenario        | Steps                          | Expected Result                        |
| --------------- | ------------------------------ | -------------------------------------- |
| Basic display   | Open app                       | Today's verse displays                 |
| Language switch | Change language to FR          | Verse updates to French                |
| Bookmark        | Tap bookmark icon              | Icon fills; verse appears in Bookmarks |
| Share           | Tap share icon                 | System share sheet appears             |
| Read more       | Tap verse card                 | Bible opens to correct chapter         |
| Offline         | Enable airplane mode, open app | Verse displays (no loading)            |
| Date change     | Change device date to tomorrow | Different verse displays               |
| Leap year       | Set date to Dec 31, 2028       | Verse displays (day 366)               |

---

## 15. Appendix: Edge Cases

### 15.1 Leap Year Handling

**Problem:** Non-leap years have 365 days. If we store 366 verses, day 366 is never accessed except in leap years.

**Solution:**

- Store verse for day 366 (leap day spillover)
- In leap years: Dec 31 = day 366
- In non-leap years: Dec 31 = day 365; day 366 verse is unused

**Alternative considered:** Show day 366 verse on Dec 31 of non-leap years
**Rejected:** Would mean Dec 31 always shows same verse, breaking rotation

### 15.2 Device Date Manipulation

**Problem:** User could manually change device date to see different verses.

**Decision:** Allow it. Not a security concern—users can already read any verse in the Bible.

### 15.3 Time Zone Changes

**Problem:** User traveling or changing timezone.

**Decision:** Accept potential verse change mid-day. This is rare and not harmful.

### 15.4 Future Date Verses

**Problem:** User sets date to year 2099.

**Decision:** Works fine. `getDayOfYear()` doesn't care about year—returns day within that year.

### 15.5 Database Corruption

**Problem:** Daily verses table corrupted or missing.

**Handling:**

1. Query returns null
2. UI shows error state
3. User can force refresh
4. If persistent, existing database reset logic will restore from asset

---
