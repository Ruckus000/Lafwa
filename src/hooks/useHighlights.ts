/**
 * useHighlights Hook
 * Focused hook for highlights screen and verse highlighting with library cache invalidation
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  getAllHighlights,
  addHighlight,
  removeHighlight,
  getHighlightForVerse,
} from '../db/queries';
import { Highlight, HighlightColor } from '../types/library';
import { useSettingsStore } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';

interface UseHighlightsResult {
  highlights: Highlight[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  highlight: (verseId: number, color: HighlightColor) => Promise<void>;
  unhighlight: (verseId: number) => Promise<void>;
  getColor: (verseId: number) => Promise<HighlightColor | null>;
}

export function useHighlights(): UseHighlightsResult {
  const { bibleVersion } = useSettingsStore();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchHighlights() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAllHighlights(bibleVersion);
        if (isMounted) {
          setHighlights(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load highlights'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHighlights();

    return () => {
      isMounted = false;
    };
  }, [bibleVersion, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const decrementCount = useLibraryStore((state) => state.decrementCount);
  const incrementCount = useLibraryStore((state) => state.incrementCount);
  const invalidateLibrary = useLibraryStore((state) => state.invalidate);

  const highlightVerse = useCallback(
    async (verseId: number, color: HighlightColor) => {
      // Check if this is a new highlight or color change
      const existingHighlight = highlights.find((h) => h.verse_id === verseId);
      const isNew = !existingHighlight;

      try {
        await addHighlight(verseId, color);
        if (isNew) {
          incrementCount('highlights');
        }
        invalidateLibrary();
        refresh();
      } catch (err) {
        console.error('Failed to highlight verse:', err);
      }
    },
    [highlights, refresh, incrementCount, invalidateLibrary]
  );

  const unhighlightVerse = useCallback(
    async (verseId: number) => {
      // Optimistic update
      const previousHighlights = [...highlights];
      setHighlights((current) => current.filter((h) => h.verse_id !== verseId));
      decrementCount('highlights');

      try {
        await removeHighlight(verseId);
        invalidateLibrary();
      } catch (err) {
        // Rollback on error
        setHighlights(previousHighlights);
        
        const language = useSettingsStore.getState().language;
        const errorLabels = {
          title: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
          message: {
            ht: 'Pa kapab efase sikle a. Tanpri eseye ankò.',
            fr: 'Impossible de supprimer le surlignage. Veuillez réessayer.',
            en: 'Unable to remove highlight. Please try again.',
          }[language],
          ok: { ht: 'OK', fr: 'OK', en: 'OK' }[language],
        };

        Alert.alert(errorLabels.title, errorLabels.message, [{ text: errorLabels.ok }]);
      }
    },
    [highlights, decrementCount, invalidateLibrary]
  );

  const getColor = useCallback(async (verseId: number): Promise<HighlightColor | null> => {
    return getHighlightForVerse(verseId);
  }, []);

  return {
    highlights,
    isLoading,
    error,
    refresh,
    highlight: highlightVerse,
    unhighlight: unhighlightVerse,
    getColor,
  };
}
