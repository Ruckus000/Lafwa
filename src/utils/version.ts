/**
 * Version Utilities
 * Single source of truth for language/version mapping
 */

import { LanguageSetting } from '../stores/settingsStore';

export type BibleVersion = 'ht' | 'fr' | 'en';

/**
 * Maps UI language to Bible version code
 * Used consistently across all queries and components
 */
export function getVersionFromLanguage(language: LanguageSetting): BibleVersion {
  return language; // Currently 1:1 mapping, but abstracted for future flexibility
}

/**
 * Truncates text at word boundary with ellipsis
 * Avoids cutting words mid-syllable
 */
export function truncateAtWordBoundary(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.5) {
    // Only use word boundary if it's in the latter half
    return truncated.slice(0, lastSpaceIndex) + suffix;
  }

  // Fallback to hard cut if word boundary is too early
  return truncated + suffix;
}

/**
 * Formats a verse reference for display
 */
export function formatVerseReference(
  book: string,
  chapter: number,
  verse: number | null,
  verseEnd?: number | null
): string {
  if (verse === null) {
    return `${book} ${chapter}`;
  }
  if (verseEnd && verseEnd > verse) {
    return `${book} ${chapter}:${verse}-${verseEnd}`;
  }
  return `${book} ${chapter}:${verse}`;
}
