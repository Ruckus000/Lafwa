/**
 * useBookmarks Hook
 * Focused hook for bookmarks screen
 */

import { useState, useEffect, useCallback } from 'react';
import { getBookmarks, toggleBookmark } from '../db/queries';
import { Bookmark } from '../types/library';

interface UseBookmarksResult {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  removeBookmark: (type: 'bible' | 'hymn', refId: number) => Promise<void>;
}

export function useBookmarks(type?: 'bible' | 'hymn'): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchBookmarks() {
      setIsLoading(true);
      setError(null);

      try {
        if (type) {
          const result = await getBookmarks(type);
          if (isMounted) {
            setBookmarks(result as Bookmark[]);
          }
        } else {
          // Fetch both types
          const [bibleBookmarks, hymnBookmarks] = await Promise.all([
            getBookmarks('bible'),
            getBookmarks('hymn'),
          ]);
          if (isMounted) {
            setBookmarks([...(bibleBookmarks as Bookmark[]), ...(hymnBookmarks as Bookmark[])]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load bookmarks'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBookmarks();

    return () => {
      isMounted = false;
    };
  }, [type, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const removeBookmark = useCallback(
    async (bookmarkType: 'bible' | 'hymn', refId: number) => {
      try {
        await toggleBookmark(bookmarkType, refId);
        refresh();
      } catch (err) {
        console.error('Failed to remove bookmark:', err);
      }
    },
    [refresh]
  );

  return {
    bookmarks,
    isLoading,
    error,
    refresh,
    removeBookmark,
  };
}
