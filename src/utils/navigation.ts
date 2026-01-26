/**
 * Navigation helpers for deep linking to content
 *
 * Single source of truth for constructing navigation URLs.
 * All screens should use these helpers instead of building URLs manually.
 */

import { Router } from 'expo-router';
import { getBookByName, BibleBook } from '../data/bibleBooks';

export interface BibleNavigationParams {
  book: string;
  chapter: number;
  verse?: number;
}

export interface HymnNavigationParams {
  number: number;
}

/**
 * Navigate to a specific Bible verse
 */
export function navigateToBible(
  router: Router,
  params: BibleNavigationParams
): void {
  const { book, chapter, verse } = params;

  // Validate book
  const bookData = getBookByName(book);
  if (!bookData) {
    console.warn(`[navigation] Invalid book name: ${book}`);
    router.push('/bible');
    return;
  }

  // Validate chapter
  if (chapter < 1 || chapter > bookData.chapters) {
    console.warn(`[navigation] Invalid chapter ${chapter} for ${book} (max: ${bookData.chapters})`);
    router.push('/bible');
    return;
  }

  // Navigate with params
  router.push({
    pathname: '/bible',
    params: {
      book: bookData.nameFr, // Use French name for DB query consistency
      chapter: chapter.toString(),
      ...(verse !== undefined && verse > 0 && { verse: verse.toString() }),
    },
  });
}

/**
 * Navigate to a specific hymn
 */
export function navigateToHymn(
  router: Router,
  params: HymnNavigationParams
): void {
  const { number } = params;

  // Validate hymn number
  if (number < 1 || number > 1000) {
    console.warn(`[navigation] Invalid hymn number: ${number}`);
    router.push('/hymns');
    return;
  }

  router.push({
    pathname: '/hymns',
    params: { number: number.toString() },
  });
}

/**
 * Navigate based on content type - convenience wrapper
 */
export function navigateToContent(
  router: Router,
  type: 'bible' | 'hymn',
  params: BibleNavigationParams | HymnNavigationParams
): void {
  if (type === 'bible') {
    navigateToBible(router, params as BibleNavigationParams);
  } else {
    navigateToHymn(router, params as HymnNavigationParams);
  }
}
