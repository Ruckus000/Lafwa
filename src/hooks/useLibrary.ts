/**
 * useLibrary Hook
 * Thin wrapper around libraryStore for component consumption
 */

import { useEffect } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { LibraryCounts } from '../types/library';

interface UseLibraryResult {
  counts: LibraryCounts;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useLibrary(): UseLibraryResult {
  const counts = useLibraryStore((state) => state.counts);
  const isLoading = useLibraryStore((state) => state.isLoading);
  const error = useLibraryStore((state) => state.error);
  const fetchCounts = useLibraryStore((state) => state.fetchCounts);
  const invalidate = useLibraryStore((state) => state.invalidate);

  // Fetch on mount if needed
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    isLoading,
    error,
    refresh: invalidate,
  };
}

// Re-export store for direct access when needed
export { useLibraryStore };
