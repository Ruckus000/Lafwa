/**
 * Settings Store
 * Manages user preferences with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontSizeSetting } from '../theme/typography';

// Re-export for convenience
export type { FontSizeSetting };

export type ThemeSetting = 'light' | 'dark' | 'sepia' | 'system';
export type LanguageSetting = 'ht' | 'fr' | 'en';
export type LineSpacingSetting = 'compact' | 'normal' | 'relaxed';

interface SettingsState {
  // Display
  fontSize: FontSizeSetting;
  theme: ThemeSetting;
  lineSpacing: LineSpacingSetting;
  keepScreenAwake: boolean;

  // Language
  language: LanguageSetting;
  bibleVersion: LanguageSetting;

  // Reading
  lastReadBible: {
    book: string;
    chapter: number;
  } | null;
  lastReadHymn: number | null;

  // Actions
  setFontSize: (size: FontSizeSetting) => void;
  setTheme: (theme: ThemeSetting) => void;
  setLineSpacing: (spacing: LineSpacingSetting) => void;
  setKeepScreenAwake: (value: boolean) => void;
  setLanguage: (lang: LanguageSetting) => void;
  setBibleVersion: (version: LanguageSetting) => void;
  setLastReadBible: (book: string, chapter: number) => void;
  setLastReadHymn: (hymnNumber: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      fontSize: 'M',
      theme: 'system',
      lineSpacing: 'normal',
      keepScreenAwake: false,
      language: 'ht',
      bibleVersion: 'ht',
      lastReadBible: null,
      lastReadHymn: null,

      // Actions
      setFontSize: (fontSize) => set({ fontSize }),
      setTheme: (theme) => set({ theme }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setKeepScreenAwake: (keepScreenAwake) => set({ keepScreenAwake }),
      setLanguage: (language) => set({ language }),
      setBibleVersion: (bibleVersion) => set({ bibleVersion }),
      setLastReadBible: (book, chapter) => set({ lastReadBible: { book, chapter } }),
      setLastReadHymn: (hymnNumber) => set({ lastReadHymn: hymnNumber }),
    }),
    {
      name: 'lafwa-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
