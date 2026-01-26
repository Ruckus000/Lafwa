/**
 * useNotes Hook
 * Focused hook for notes screen
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllNotes, deleteNote } from '../db/queries';
import { NoteWithVerse } from '../db/queries';
import { useSettingsStore } from '../stores/settingsStore';

interface UseNotesResult {
  notes: NoteWithVerse[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  removeNote: (verseId: number) => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<NoteWithVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const language = useSettingsStore((state) => state.language);

  // Map UI language to Bible version
  const version = language === 'ht' ? 'ht' : language === 'en' ? 'en' : 'fr';

  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAllNotes(version);
        if (isMounted) {
          setNotes(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load notes'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
      isMounted = false;
    };
  }, [version, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const removeNote = useCallback(
    async (verseId: number) => {
      try {
        await deleteNote(verseId);
        refresh();
      } catch (err) {
        console.error('Failed to remove note:', err);
      }
    },
    [refresh]
  );

  return {
    notes,
    isLoading,
    error,
    refresh,
    removeNote,
  };
}
