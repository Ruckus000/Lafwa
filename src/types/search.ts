/**
 * Search result type definitions
 */

export interface BibleSearchResult {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: 'ht' | 'fr' | 'en';
}

export interface HymnSearchResult {
  id: number;
  number: number;
  title_ht: string | null;
  title_fr: string | null;
  first_line: string | null;
}

export interface SearchResultItem {
  type: 'bible' | 'hymn';
  data: BibleSearchResult | HymnSearchResult;
}

export interface BibleSearchResultItem {
  type: 'bible';
  data: BibleSearchResult;
}

export interface HymnSearchResultItem {
  type: 'hymn';
  data: HymnSearchResult;
}

// Type guards
export function isBibleResult(item: SearchResultItem): item is BibleSearchResultItem {
  return item.type === 'bible';
}

export function isHymnResult(item: SearchResultItem): item is HymnSearchResultItem {
  return item.type === 'hymn';
}
