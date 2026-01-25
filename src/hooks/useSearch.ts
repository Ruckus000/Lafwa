import { useState, useEffect } from 'react';
import { searchBible, searchHymns } from '../db/queries';

export function useSearch(query: string, version: 'ht' | 'fr' = 'ht') {
    const [results, setResults] = useState<{ type: string, data: any }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const bibleRes = await searchBible(query, version);
                const hymnsRes = await searchHymns(query);

                const combined = [
                    ...bibleRes.map(b => ({ type: 'bible', data: b })),
                    ...hymnsRes.map(h => ({ type: 'hymn', data: h }))
                ];
                setResults(combined);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchData, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, version]);

    return { results, loading };
}
