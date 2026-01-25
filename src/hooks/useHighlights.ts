/**
 * useHighlights Hook
 * Focused hook for highlights screen and verse highlighting
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllHighlights,
  addHighlight,
  removeHighlight,
  getHighlightForVerse,
} from '../db/queries';
import { Highlight, HighlightColor } from '../types/library';
import { useSettingsStore } from '../stores/settingsStore';

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

  const highlightVerse = useCallback(
    async (verseId: number, color: HighlightColor) => {
      try {
        await addHighlight(verseId, color);
        refresh();
      } catch (err) {
        console.error('Failed to highlight verse:', err);
      }
    },
    [refresh]
  );

  const unhighlightVerse = useCallback(
    async (verseId: number) => {
      try {
        await removeHighlight(verseId);
        refresh();
      } catch (err) {
        console.error('Failed to unhighlight verse:', err);
      }
    },
    [refresh]
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
