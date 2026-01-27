/**
 * useNotes Hook
 * Manages notes list with optimistic updates and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { getAllNotes, deleteNote, getNotesCount, NoteWithVerse } from '../db/queries';
import { useSettingsStore } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';
import { getVersionFromLanguage } from '../utils/version';

interface UseNotesOptions {
  pageSize?: number;
}

interface UseNotesResult {
  notes: NoteWithVerse[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  removeNote: (note: NoteWithVerse) => Promise<boolean>;
}

export function useNotes(options: UseNotesOptions = {}): UseNotesResult {
  const { pageSize = 50 } = options;

  const [notes, setNotes] = useState<NoteWithVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  
  const language = useSettingsStore((state) => state.language);
  const version = getVersionFromLanguage(language);
  const decrementCount = useLibraryStore((state) => state.decrementCount);
  const invalidateLibrary = useLibraryStore((state) => state.invalidate);

  // Track if we're currently fetching to prevent duplicate requests
  const isFetching = useRef(false);

  const fetchNotes = useCallback(async (reset: boolean = false) => {
    if (isFetching.current && !reset) return;
    isFetching.current = true;

    if (reset) {
      setOffset(0);
      setIsLoading(true);
    }

    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const [fetchedNotes, count] = await Promise.all([
        getAllNotes(version, pageSize, currentOffset),
        reset ? getNotesCount() : Promise.resolve(totalCount),
      ]);

      if (reset) {
        setNotes(fetchedNotes);
        setTotalCount(count);
      } else {
        setNotes((prev) => [...prev, ...fetchedNotes]);
      }

      if (!reset) {
        setOffset(currentOffset + fetchedNotes.length);
      } else {
        setOffset(fetchedNotes.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notes'));
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [version, pageSize, offset, totalCount]);

  // Initial load and reload on language change
  useEffect(() => {
    fetchNotes(true);
  }, [version]);

  const refresh = useCallback(() => {
    fetchNotes(true);
  }, [fetchNotes]);

  const loadMore = useCallback(() => {
    if (!isLoading && notes.length < totalCount) {
      fetchNotes(false);
    }
  }, [isLoading, notes.length, totalCount, fetchNotes]);

  const removeNote = useCallback(
    async (note: NoteWithVerse): Promise<boolean> => {
      // Optimistic update - remove from local state immediately
      const previousNotes = [...notes];
      const previousCount = totalCount;

      setNotes((current) => current.filter((n) => n.id !== note.id));
      setTotalCount((count) => Math.max(0, count - 1));
      decrementCount('notes');

      try {
        await deleteNote(note.book, note.chapter, note.verse);
        // Invalidate library counts to ensure consistency
        invalidateLibrary();
        return true;
      } catch (err) {
        // Rollback on error
        setNotes(previousNotes);
        setTotalCount(previousCount);
        
        // Get localized error message
        const language = useSettingsStore.getState().language;
        const errorLabels = {
          title: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
          message: {
            ht: 'Pa kapab efase nòt la. Tanpri eseye ankò.',
            fr: 'Impossible de supprimer la note. Veuillez réessayer.',
            en: 'Unable to delete note. Please try again.',
          }[language],
          ok: { ht: 'OK', fr: 'OK', en: 'OK' }[language],
        };

        Alert.alert(errorLabels.title, errorLabels.message, [
          { text: errorLabels.ok },
        ]);

        return false;
      }
    },
    [notes, totalCount, decrementCount, invalidateLibrary]
  );

  const hasMore = notes.length < totalCount;

  return {
    notes,
    isLoading,
    error,
    totalCount,
    hasMore,
    refresh,
    loadMore,
    removeNote,
  };
}
