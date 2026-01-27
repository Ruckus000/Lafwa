/**
 * Library Store
 * Global state for library counts with cache invalidation
 * 
 * Usage:
 * - Subscribe: const { counts } = useLibraryStore()
 * - Invalidate: useLibraryStore.getState().invalidate()
 * - Invalidate specific: useLibraryStore.getState().invalidateType('notes')
 */

import { create } from 'zustand';
import { getLibraryCounts } from '../db/queries';
import { LibraryCounts } from '../types/library';

interface LibraryState {
  counts: LibraryCounts;
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null;

  // Actions
  fetchCounts: () => Promise<void>;
  invalidate: () => void;
  invalidateType: (type: keyof LibraryCounts) => void;
  
  // Optimistic updates
  incrementCount: (type: keyof LibraryCounts) => void;
  decrementCount: (type: keyof LibraryCounts) => void;
}

// Cache TTL: 30 seconds
const CACHE_TTL = 30 * 1000;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  counts: {
    bookmarks: 0,
    highlights: 0,
    favorites: 0,
    notes: 0,
  },
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchCounts: async () => {
    const state = get();
    
    // Skip if already loading
    if (state.isLoading) return;

    // Skip if cache is fresh
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_TTL) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const counts = await getLibraryCounts();
      set({
        counts,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to load library counts'),
        isLoading: false,
      });
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
    // Trigger immediate refetch
    get().fetchCounts();
  },

  invalidateType: (type: keyof LibraryCounts) => {
    // For now, just invalidate everything
    // Could be optimized to only refetch specific type
    get().invalidate();
  },

  // Optimistic increment - call before async operation
  incrementCount: (type: keyof LibraryCounts) => {
    set((state) => ({
      counts: {
        ...state.counts,
        [type]: state.counts[type] + 1,
      },
    }));
  },

  // Optimistic decrement - call before async operation
  decrementCount: (type: keyof LibraryCounts) => {
    set((state) => ({
      counts: {
        ...state.counts,
        [type]: Math.max(0, state.counts[type] - 1),
      },
    }));
  },
}));

// Initialize on first import
useLibraryStore.getState().fetchCounts();
