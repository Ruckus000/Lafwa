import { useState, useEffect } from 'react';
import { searchBible, searchHymns } from '../db/queries';
import {
  SearchResultItem,
  BibleSearchResult,
  HymnSearchResult,
} from '../types/search';

export interface UseSearchResult {
  results: SearchResultItem[];
  loading: boolean;
  error: Error | null;
}

export function useSearch(
  query: string,
  version: 'ht' | 'fr' | 'en' = 'ht'
): UseSearchResult {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [bibleRes, hymnsRes] = await Promise.all([
          searchBible(query, version),
          searchHymns(query),
        ]);

        if (cancelled) return;

        const combined: SearchResultItem[] = [
          ...(bibleRes as BibleSearchResult[]).map((b) => ({
            type: 'bible' as const,
            data: b,
          })),
          ...(hymnsRes as HymnSearchResult[]).map((h) => ({
            type: 'hymn' as const,
            data: h,
          })),
        ];

        setResults(combined);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error('Search failed'));
        console.error('[useSearch] Error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchData, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, version]);

  return { results, loading, error };
}
