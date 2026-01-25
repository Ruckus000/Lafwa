/**
 * useHistory Hook
 * Focused hook for reading history
 */

import { useState, useEffect, useCallback } from 'react';
import { getReadingHistory, recordReading, clearReadingHistory } from '../db/queries';
import { HistoryItem } from '../types/library';

interface UseHistoryResult {
  history: HistoryItem[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  record: (
    type: 'bible' | 'hymn',
    reference: string,
    metadata: { book?: string; chapter?: number; hymnNumber?: number }
  ) => Promise<void>;
  clear: () => Promise<void>;
}

export function useHistory(limit: number = 20): UseHistoryResult {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getReadingHistory(limit);
        if (isMounted) {
          setHistory(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load history'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [limit, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const record = useCallback(
    async (
      type: 'bible' | 'hymn',
      reference: string,
      metadata: { book?: string; chapter?: number; hymnNumber?: number }
    ) => {
      try {
        await recordReading(type, reference, metadata);
        // Don't refresh - history screen will reload when opened
      } catch (err) {
        console.error('Failed to record reading:', err);
      }
    },
    []
  );

  const clear = useCallback(async () => {
    try {
      await clearReadingHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  return {
    history,
    isLoading,
    error,
    refresh,
    record,
    clear,
  };
}
