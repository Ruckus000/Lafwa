/**
 * Type definitions for library features
 */

// Highlight colors matching UX spec
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

// Database row types
export interface BookmarkRow {
  id: number;
  type: 'bible' | 'hymn';
  reference_id: number;
  created_at: string;
}

export interface HighlightRow {
  id: number;
  verse_id: number;
  color: HighlightColor;
  created_at: string;
}

export interface HistoryRow {
  id: number;
  type: 'bible' | 'hymn';
  reference: string;
  book: string | null;
  chapter: number | null;
  hymn_number: number | null;
  last_read_at: string;
  read_count: number;
}

// Enriched types with joined data
export interface Bookmark extends BookmarkRow {
  // For bible bookmarks
  book?: string;
  chapter?: number;
  verse?: number;
  text?: string;
  // For hymn bookmarks
  number?: number;
  title?: string;
}

export interface Highlight extends HighlightRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface HistoryItem extends HistoryRow {
  displayTitle: string;
}

// Library counts for Plis screen
export interface LibraryCounts {
  bookmarks: number;
  highlights: number;
  favorites: number;
  notes: number;
}
