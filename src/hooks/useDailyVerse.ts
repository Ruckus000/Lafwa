/**
 * Daily Verse Hook
 * React hook for daily verse data and actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getDailyVerse,
  DailyVerse,
  toggleBookmark,
  isBookmarked,
} from '../db/queries';
import { useSettingsStore } from '../stores/settingsStore';

interface UseDailyVerseResult {
  verse: DailyVerse | null;
  isLoading: boolean;
  error: Error | null;
  isBookmarked: boolean;
  handleBookmark: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleReadMore: () => void;
  refetch: () => void;
}

export function useDailyVerse(): UseDailyVerseResult {
  const router = useRouter();
  const { bibleVersion } = useSettingsStore();

  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch daily verse
  useEffect(() => {
    let isMounted = true;

    async function fetchVerse() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getDailyVerse(bibleVersion);

        if (!isMounted) return;

        setVerse(result);

        // Check bookmark status
        if (result?.verseId) {
          const isMarked = await isBookmarked('bible', result.verseId);
          if (isMounted) setBookmarked(isMarked);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err : new Error('Failed to load daily verse')
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchVerse();

    return () => {
      isMounted = false;
    };
  }, [bibleVersion, retryCount]);

  // Retry/refetch
  const refetch = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // Bookmark action
  const handleBookmark = useCallback(async () => {
    if (!verse?.verseId) return;

    try {
      const added = await toggleBookmark('bible', verse.verseId);
      setBookmarked(added);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  }, [verse?.verseId]);

  // Share action
  const handleShare = useCallback(async () => {
    if (!verse) return;

    const shareText = `"${verse.text}"\n\n— ${verse.reference}\n\nvia Lafwa App`;

    try {
      await Share.share({
        message: shareText,
      });
    } catch (err) {
      // User cancelled or share failed - silent fail is OK
      console.log('Share cancelled or failed:', err);
    }
  }, [verse]);

  // Navigate to full chapter
  const handleReadMore = useCallback(() => {
    if (!verse) return;

    router.push({
      pathname: '/bible',
      params: {
        book: verse.book,
        chapter: verse.chapter.toString(),
        verse: verse.verseStart.toString(),
      },
    });
  }, [verse, router]);

  return {
    verse,
    isLoading,
    error,
    isBookmarked: bookmarked,
    handleBookmark,
    handleShare,
    handleReadMore,
    refetch,
  };
}
