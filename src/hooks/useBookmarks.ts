/**
 * useBookmarks Hook
 * Focused hook for bookmarks screen with library cache invalidation
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getBookmarks, toggleBookmark } from '../db/queries';
import { Bookmark } from '../types/library';
import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsStore } from '../stores/settingsStore';

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

  const decrementCount = useLibraryStore((state) => state.decrementCount);
  const invalidateLibrary = useLibraryStore((state) => state.invalidate);

  const removeBookmark = useCallback(
    async (bookmarkType: 'bible' | 'hymn', refId: number) => {
      // Optimistic update
      const previousBookmarks = [...bookmarks];
      setBookmarks((current) => current.filter((b) => !(b.type === bookmarkType && b.reference_id === refId)));
      decrementCount(bookmarkType === 'bible' ? 'bookmarks' : 'favorites');

      try {
        await toggleBookmark(bookmarkType, refId);
        invalidateLibrary();
      } catch (err) {
        // Rollback on error
        setBookmarks(previousBookmarks);
        
        const language = useSettingsStore.getState().language;
        const errorLabels = {
          title: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
          message: {
            ht: 'Pa kapab efase makè a. Tanpri eseye ankò.',
            fr: 'Impossible de supprimer le signet. Veuillez réessayer.',
            en: 'Unable to delete bookmark. Please try again.',
          }[language],
          ok: { ht: 'OK', fr: 'OK', en: 'OK' }[language],
        };

        Alert.alert(errorLabels.title, errorLabels.message, [{ text: errorLabels.ok }]);
      }
    },
    [bookmarks, decrementCount, invalidateLibrary]
  );

  return {
    bookmarks,
    isLoading,
    error,
    refresh,
    removeBookmark,
  };
}
