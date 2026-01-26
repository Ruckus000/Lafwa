/**
 * BibleReader Component
 * Reading view with swipe navigation and verse actions
 * Based on UX/UI Spec v1
 * 
 * NOTE: Simplified version without react-native-reanimated due to SDK 54 compatibility issues.
 * Swipe animations can be added back when reanimated stabilizes.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { BibleBook } from '../data/bibleBooks';
import { getChapter, toggleBookmark, isBookmarked } from '../db/queries';
import VerseActionSheet, { HighlightColor } from './VerseActionSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Verse = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  bookmarked?: boolean;
  highlightColor?: HighlightColor | null;
};

interface BibleReaderProps {
  book: BibleBook;
  chapter: number;
  version: 'ht' | 'fr';
  onChapterChange: (chapter: number) => void;
}

export default function BibleReader({ 
  book, 
  chapter, 
  version,
  onChapterChange,
}: BibleReaderProps) {
  const { colors, typography, spacing } = useTheme();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const language = useSettingsStore((state) => state.language);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const listRef = useRef<FlatList>(null);

  // Get book name based on version
  const bookName = version === 'ht' ? book.nameHt : book.nameFr;

  // Load chapter content
  useEffect(() => {
    loadContent();
  }, [book.nameHt, chapter, version]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Query uses the French name as stored in DB
      const data = await getChapter(book.nameFr, chapter, version);
      
      // Enrich with bookmark status
      const enriched = await Promise.all(
        (data as Verse[]).map(async (v) => {
          const bookmarked = await isBookmarked('bible', v.id);
          return { ...v, bookmarked, highlightColor: null };
        })
      );
      
      setVerses(enriched);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (e) {
      console.error('Error loading chapter:', e);
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  // Chapter navigation
  const goToNextChapter = useCallback(() => {
    if (chapter < book.chapters) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChapterChange(chapter + 1);
    }
  }, [chapter, book.chapters, onChapterChange]);

  const goToPreviousChapter = useCallback(() => {
    if (chapter > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChapterChange(chapter - 1);
    }
  }, [chapter, onChapterChange]);

  // Simple pan responder for swipe detection (no animations)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD && chapter < book.chapters) {
          goToNextChapter();
        } else if (gestureState.dx > SWIPE_THRESHOLD && chapter > 1) {
          goToPreviousChapter();
        }
      },
    })
  ).current;

  // Verse selection
  const handleVersePress = useCallback((verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVerse(verse);
    setShowActionSheet(true);
  }, []);

  // Action sheet handlers
  const handleHighlight = useCallback((color: HighlightColor) => {
    if (selectedVerse) {
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, highlightColor: color } : v
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const handleRemoveHighlight = useCallback(() => {
    if (selectedVerse) {
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, highlightColor: null } : v
        )
      );
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const handleToggleBookmark = useCallback(async () => {
    if (selectedVerse) {
      const newStatus = await toggleBookmark('bible', selectedVerse.id);
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, bookmarked: newStatus } : v
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const handleCopy = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, []);

  const handleShare = useCallback(() => {
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, []);

  const closeActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, []);

  // Get highlight background color
  const getHighlightStyle = (color: HighlightColor | null | undefined) => {
    if (!color) return {};
    const highlightColors = {
      yellow: { backgroundColor: '#fef08a' },
      green: { backgroundColor: '#bbf7d0' },
      blue: { backgroundColor: '#bae6fd' },
      pink: { backgroundColor: '#fecaca' },
    };
    return highlightColors[color] || {};
  };

  // Font size mapping
  const fontSizes = {
    XS: 14,
    S: 16,
    M: 18,
    L: 20,
    XL: 24,
  };
  const textSize = fontSizes[fontSize] || 18;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (verses.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          {language === 'ht' 
            ? 'Pa gen tèks disponib pou chapit sa a.' 
            : 'Aucun texte disponible pour ce chapitre.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content} {...panResponder.panHandlers}>
        <FlatList
          ref={listRef}
          data={verses}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedVerse?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleVersePress(item)}
                activeOpacity={0.7}
                style={[
                  styles.verseContainer,
                  getHighlightStyle(item.highlightColor),
                  isSelected && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[
                    styles.verseText,
                    { 
                      fontSize: textSize, 
                      lineHeight: textSize * 1.6,
                      color: colors.text,
                    },
                  ]}
                >
                  <Text style={[styles.verseNum, { color: colors.primary }]}>
                    {item.verse}{' '}
                  </Text>
                  {item.text}
                  {item.bookmarked && (
                    <Text style={styles.bookmarkIndicator}> 🔖</Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={[styles.chapterLabel, { color: colors.textTertiary }]}>
                {bookName} {chapter}
              </Text>
            </View>
          }
        />
      </View>

      {/* Chapter Navigation Hints */}
      {chapter > 1 && (
        <View style={[styles.navHint, styles.navHintLeft]}>
          <Text style={[styles.navHintText, { color: colors.textTertiary }]}>
            ‹ {chapter - 1}
          </Text>
        </View>
      )}
      {chapter < book.chapters && (
        <View style={[styles.navHint, styles.navHintRight]}>
          <Text style={[styles.navHintText, { color: colors.textTertiary }]}>
            {chapter + 1} ›
          </Text>
        </View>
      )}

      {/* Verse Action Sheet */}
      <VerseActionSheet
        visible={showActionSheet}
        verse={selectedVerse}
        isBookmarked={selectedVerse?.bookmarked || false}
        highlightColor={selectedVerse?.highlightColor}
        onClose={closeActionSheet}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onToggleBookmark={handleToggleBookmark}
        onCopy={handleCopy}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  verseContainer: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 4,
  },
  verseText: {
    fontFamily: 'System',
  },
  verseNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  bookmarkIndicator: {
    fontSize: 12,
  },
  footer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  chapterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  navHint: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    opacity: 0.3,
  },
  navHintLeft: {
    left: 8,
  },
  navHintRight: {
    right: 8,
  },
  navHintText: {
    fontSize: 24,
    fontWeight: '300',
  },
});
