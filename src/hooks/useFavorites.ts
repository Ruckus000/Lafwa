/**
 * useFavorites Hook
 * Alias for hymn bookmarks (favorites = bookmarks with type='hymn')
 */

import { useBookmarks } from './useBookmarks';
import { Bookmark } from '../types/library';

interface UseFavoritesResult {
  favorites: Bookmark[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  removeFavorite: (hymnId: number) => Promise<void>;
}

export function useFavorites(): UseFavoritesResult {
  const { bookmarks, isLoading, error, refresh, removeBookmark } = useBookmarks('hymn');

  return {
    favorites: bookmarks,
    isLoading,
    error,
    refresh,
    removeFavorite: (hymnId: number) => removeBookmark('hymn', hymnId),
  };
}
