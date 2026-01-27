/**
 * Bible Tab
 * Navigation flow: BookPicker → ChapterPicker → Reading View
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { BibleBook, getBookByName } from '../../src/data/bibleBooks';
import BookPicker from '../../src/components/BookPicker';
import ChapterPicker from '../../src/components/ChapterPicker';
import BibleReader from '../../src/components/BibleReader';
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary';

type Screen = 'bookPicker' | 'chapterPicker' | 'reader';

export default function BibleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    bibleVersion,
    setBibleVersion,
    lastReadBible,
    setLastReadBible,
    language,
  } = useSettingsStore();

  // Deep linking params (from daily verse "read more")
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();

  // Navigation state
  const [screen, setScreen] = useState<Screen>('bookPicker');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Handle deep linking from daily verse or restore last read position
  useEffect(() => {
    if (params.book && params.chapter) {
      // Deep link takes priority
      const bookData = getBookByName(params.book);
      if (bookData) {
        setSelectedBook(bookData);
        setSelectedChapter(parseInt(params.chapter, 10));
        setScreen('reader');
      }
    } else if (lastReadBible && !selectedBook) {
      // Restore last reading position on initial load
      const bookData = getBookByName(lastReadBible.book);
      if (bookData) {
        setSelectedBook(bookData);
        setSelectedChapter(lastReadBible.chapter);
        setScreen('reader');
      }
    }
  }, [params.book, params.chapter, lastReadBible]);

  // Handle book selection
  const handleSelectBook = useCallback((book: BibleBook) => {
    setSelectedBook(book);
    setScreen('chapterPicker');
  }, []);

  // Handle chapter selection
  const handleSelectChapter = useCallback((chapter: number) => {
    setSelectedChapter(chapter);
    setScreen('reader');
    if (selectedBook) {
      setLastReadBible(selectedBook.nameHt, chapter);
    }
  }, [selectedBook, setLastReadBible]);

  // Handle chapter change from swipe in reader
  const handleChapterChange = useCallback((newChapter: number) => {
    setSelectedChapter(newChapter);
    if (selectedBook) {
      setLastReadBible(selectedBook.nameHt, newChapter);
    }
  }, [selectedBook, setLastReadBible]);

  // Toggle language
  const toggleVersion = useCallback(() => {
    setBibleVersion(bibleVersion === 'ht' ? 'fr' : 'ht');
  }, [bibleVersion, setBibleVersion]);

  // Navigation handlers
  const goToBookPicker = useCallback(() => {
    setScreen('bookPicker');
  }, []);

  const goToChapterPicker = useCallback(() => {
    setScreen('chapterPicker');
  }, []);

  // Render Book Picker
  if (screen === 'bookPicker') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <BookPicker
          onSelectBook={handleSelectBook}
          onClose={() => {
            // If we have a previous selection, go back to reader
            if (selectedBook && selectedChapter) {
              setScreen('reader');
            }
          }}
          onSearch={() => router.push('/search')}
        />
      </SafeAreaView>
    );
  }

  // Render Chapter Picker
  if (screen === 'chapterPicker' && selectedBook) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ChapterPicker
          book={selectedBook}
          currentChapter={selectedChapter}
          onSelectChapter={handleSelectChapter}
          onBack={goToBookPicker}
        />
      </SafeAreaView>
    );
  }

  // Render Reading View
  if (screen === 'reader' && selectedBook) {
    const bookName = language === 'ht' ? selectedBook.nameHt : selectedBook.nameFr;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={goToChapterPicker} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={goToBookPicker}
            style={[styles.titleButton, { backgroundColor: colors.surfaceHover }]}
          >
            <Text style={[styles.titleText, { color: colors.text }]}>
              {bookName} {selectedChapter}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleVersion}
            style={[styles.versionBadge, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.versionText, { color: colors.primary }]}>
              {bibleVersion.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reader - wrapped in error boundary for graceful degradation */}
        <ScreenErrorBoundary
          screenName="BibleReader"
          fallbackTitle={{
            ht: 'Pa kapab montre chapit sa a',
            fr: 'Impossible d\'afficher ce chapitre',
            en: 'Unable to display this chapter',
          }[language]}
          onGoBack={goToBookPicker}
        >
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            version={bibleVersion}
            onChapterChange={handleChapterChange}
          />
        </ScreenErrorBoundary>
      </SafeAreaView>
    );
  }

  // Fallback - should not reach here
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <BookPicker
        onSelectBook={handleSelectBook}
        onClose={() => {}}
        onSearch={() => router.push('/search')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
