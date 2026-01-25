/**
 * useLibrary Hook
 * Single hook for library counts (KISS principle)
 */

import { useState, useEffect, useCallback } from 'react';
import { getLibraryCounts } from '../db/queries';
import { LibraryCounts } from '../types/library';

interface UseLibraryResult {
  counts: LibraryCounts;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useLibrary(): UseLibraryResult {
  const [counts, setCounts] = useState<LibraryCounts>({
    bookmarks: 0,
    highlights: 0,
    favorites: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchCounts() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getLibraryCounts();
        if (isMounted) {
          setCounts(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load library counts'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return {
    counts,
    isLoading,
    error,
    refresh,
  };
}
