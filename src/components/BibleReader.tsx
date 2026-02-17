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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';
import { BibleBook } from '../data/bibleBooks';
import { 
  getChapterWithUserData, 
  VerseWithUserData,
  toggleBookmark, 
  addHighlight, 
  removeHighlight,
} from '../db/queries';
import VerseActionSheet, { HighlightColor } from './VerseActionSheet';
import VerseJumpSheet from './VerseJumpSheet';
import NoteEditor from './NoteEditor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Base height estimate for getItemLayout
const getBaseVerseHeight = (fontSize: string): number => {
  const heights: Record<string, number> = { XS: 48, S: 54, M: 60, L: 68, XL: 84 };
  return heights[fontSize] || 60;
};

interface BibleReaderProps {
  book: BibleBook;
  chapter: number;
  version: 'ht' | 'fr' | 'en';
  onChapterChange: (chapter: number) => void;
}

export default function BibleReader({ 
  book, 
  chapter, 
  version,
  onChapterChange,
}: BibleReaderProps) {
  const { colors } = useTheme();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const language = useSettingsStore((state) => state.language);
  const lineSpacing = useSettingsStore((state) => state.lineSpacing);
  const invalidateLibrary = useLibraryStore((state) => state.invalidate);

  const [verses, setVerses] = useState<VerseWithUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<VerseWithUserData | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showVerseJump, setShowVerseJump] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Multi-verse selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVerseIds, setSelectedVerseIds] = useState<Set<number>>(new Set());

  const listRef = useRef<FlatList>(null);

  // Get book name based on version
  const bookName = version === 'ht' ? book.nameHt : version === 'en' ? book.nameEn : book.nameFr;

  // Load chapter content - SINGLE QUERY (N+1 fix)
  useEffect(() => {
    loadContent();
  }, [book.nameHt, chapter, version]);

  // Save reading position
  useEffect(() => {
    useSettingsStore.getState().setLastReadBible(book.nameFr, chapter);
  }, [book.nameFr, chapter]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getChapterWithUserData(book.nameFr, chapter, version);
      setVerses(data);
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

  // Keep refs in sync so the mount-time PanResponder always calls fresh callbacks
  const goToNextChapterRef = useRef(goToNextChapter);
  const goToPreviousChapterRef = useRef(goToPreviousChapter);
  useEffect(() => {
    goToNextChapterRef.current = goToNextChapter;
    goToPreviousChapterRef.current = goToPreviousChapter;
  });

  // Simple pan responder for swipe detection (no animations)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          goToNextChapterRef.current();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          goToPreviousChapterRef.current();
        }
      },
    })
  ).current;

  // Clear selection when chapter changes
  useEffect(() => {
    setSelectionMode(false);
    setSelectedVerseIds(new Set());
  }, [book.nameHt, chapter]);

  // Verse selection
  const handleVersePress = useCallback((verse: VerseWithUserData) => {
    if (selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedVerseIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(verse.id)) {
          newSet.delete(verse.id);
          if (newSet.size === 0) {
            setSelectionMode(false);
          }
        } else {
          newSet.add(verse.id);
        }
        return newSet;
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedVerse(verse);
      setShowActionSheet(true);
    }
  }, [selectionMode]);

  const handleVerseLongPress = useCallback((verse: VerseWithUserData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedVerseIds(new Set([verse.id]));
  }, []);

  const getSelectedVerses = useCallback(() => {
    return verses.filter((v) => selectedVerseIds.has(v.id)).sort((a, b) => a.verse - b.verse);
  }, [verses, selectedVerseIds]);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedVerseIds(new Set());
  }, []);

  const showSelectionActions = useCallback(() => {
    const selected = getSelectedVerses();
    if (selected.length > 0) {
      setSelectedVerse(selected[0]);
      setShowActionSheet(true);
    }
  }, [getSelectedVerses]);

  // Action handlers with library cache invalidation
  const handleHighlight = useCallback(async (color: HighlightColor) => {
    const idsToHighlight = selectionMode ? Array.from(selectedVerseIds) : (selectedVerse ? [selectedVerse.id] : []);

    if (idsToHighlight.length > 0) {
      await Promise.all(idsToHighlight.map((id) => addHighlight(id, color)));
      setVerses((current) =>
        current.map((v) =>
          idsToHighlight.includes(v.id) ? { ...v, highlightColor: color } : v
        )
      );
      invalidateLibrary();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [selectedVerse, selectionMode, selectedVerseIds, clearSelection, invalidateLibrary]);

  const handleRemoveHighlight = useCallback(async () => {
    const idsToRemove = selectionMode ? Array.from(selectedVerseIds) : (selectedVerse ? [selectedVerse.id] : []);

    if (idsToRemove.length > 0) {
      await Promise.all(idsToRemove.map((id) => removeHighlight(id)));
      setVerses((current) =>
        current.map((v) =>
          idsToRemove.includes(v.id) ? { ...v, highlightColor: null } : v
        )
      );
      invalidateLibrary();
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [selectedVerse, selectionMode, selectedVerseIds, clearSelection, invalidateLibrary]);

  const handleToggleBookmark = useCallback(async () => {
    if (selectedVerse) {
      const newStatus = await toggleBookmark('bible', selectedVerse.id);
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, bookmarked: newStatus } : v
        )
      );
      invalidateLibrary();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
  }, [selectedVerse, invalidateLibrary]);

  const handleCopy = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [clearSelection]);

  const handleShare = useCallback(() => {
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [clearSelection]);

  const handleNote = useCallback(() => {
    setShowActionSheet(false);
    setShowNoteEditor(true);
  }, []);

  const handleNoteSaved = useCallback(() => {
    if (selectedVerse) {
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, hasNote: true } : v
        )
      );
      invalidateLibrary();
    }
    setShowNoteEditor(false);
    setSelectedVerse(null);
  }, [selectedVerse, invalidateLibrary]);

  const closeNoteEditor = useCallback(() => {
    setShowNoteEditor(false);
    setSelectedVerse(null);
  }, []);

  const closeActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [clearSelection]);

  const handleVerseJump = useCallback((verse: number) => {
    const index = verse - 1;
    if (index >= 0 && index < verses.length) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [verses.length]);

  // Highlight colors
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
  const fontSizes = { XS: 14, S: 16, M: 18, L: 20, XL: 24 };
  const textSize = fontSizes[fontSize] || 18;

  // Line spacing multiplier
  const lineSpacingMultipliers = { compact: 1.4, normal: 1.6, relaxed: 1.8 };
  const lineHeightMultiplier = lineSpacingMultipliers[lineSpacing] || 1.6;

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
          {{
            ht: 'Pa gen tèks disponib pou chapit sa a.',
            fr: 'Aucun texte disponible pour ce chapitre.',
            en: 'No text available for this chapter.'
          }[language]}
        </Text>
      </View>
    );
  }

  const selectionLabels = {
    selected: { ht: 'seleksyone', fr: 'sélectionné', en: 'selected' }[language],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Selection Mode Bar */}
      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={clearSelection} style={styles.selectionBarButton}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.selectionBarText}>
            {selectedVerseIds.size} {selectionLabels.selected}
          </Text>
          <TouchableOpacity onPress={showSelectionActions} style={styles.selectionBarButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content} {...panResponder.panHandlers}>
        <FlatList
          ref={listRef}
          data={verses}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          getItemLayout={(_, index) => ({
            length: getBaseVerseHeight(fontSize),
            offset: getBaseVerseHeight(fontSize) * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 100));
            wait.then(() => {
              if (listRef.current && info.index < verses.length) {
                const offset = info.averageItemLength * info.index;
                listRef.current.scrollToOffset({ offset, animated: true });
              }
            });
          }}
          renderItem={({ item }) => {
            const isSelected = selectedVerse?.id === item.id;
            const isInSelection = selectedVerseIds.has(item.id);
            return (
              <TouchableOpacity
                onPress={() => handleVersePress(item)}
                onLongPress={() => handleVerseLongPress(item)}
                delayLongPress={400}
                activeOpacity={0.7}
                style={[
                  styles.verseContainer,
                  getHighlightStyle(item.highlightColor),
                  isSelected && { backgroundColor: colors.primaryLight },
                  isInSelection && { backgroundColor: colors.primaryLight },
                ]}
                accessibilityLabel={`${item.verse}. ${item.text}`}
                accessibilityHint={{ ht: 'Peze lontan pou chwazi', fr: 'Appui long pour sélectionner', en: 'Long press to select' }[language]}
              >
                <Text
                  style={[
                    styles.verseText,
                    {
                      fontSize: textSize,
                      lineHeight: textSize * lineHeightMultiplier,
                      color: colors.text,
                    },
                  ]}
                >
                  <Text style={[styles.verseNum, { color: colors.primary }]}>
                    {item.verse}{' '}
                  </Text>
                  {item.text}
                  {item.hasNote && <Text style={styles.noteIndicator}> 📝</Text>}
                  {item.bookmarked && <Text style={styles.bookmarkIndicator}> 🔖</Text>}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.footer}
              onPress={() => setShowVerseJump(true)}
              activeOpacity={0.7}
              accessibilityLabel={{ ht: 'Ale nan vèsè', fr: 'Aller au verset', en: 'Go to verse' }[language]}
              accessibilityRole="button"
            >
              <Text style={[styles.chapterLabel, { color: colors.textTertiary }]}>
                {bookName} {chapter} · {verses.length} {{ ht: 'vèsè', fr: 'versets', en: 'verses' }[language]}
              </Text>
            </TouchableOpacity>
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
        verses={selectionMode ? getSelectedVerses() : undefined}
        isBookmarked={selectedVerse?.bookmarked || false}
        hasNote={selectedVerse?.hasNote}
        highlightColor={selectedVerse?.highlightColor}
        onClose={closeActionSheet}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onToggleBookmark={handleToggleBookmark}
        onNote={selectionMode ? undefined : handleNote}
        onCopy={handleCopy}
        onShare={handleShare}
      />

      {/* Verse Jump Sheet */}
      <VerseJumpSheet
        visible={showVerseJump}
        bookName={bookName}
        chapter={chapter}
        verseCount={verses.length}
        onSelectVerse={handleVerseJump}
        onClose={() => setShowVerseJump(false)}
      />

      {/* Note Editor - passes verse location instead of verse_id */}
      <NoteEditor
        visible={showNoteEditor}
        verse={selectedVerse ? {
          book: selectedVerse.book,
          chapter: selectedVerse.chapter,
          verse: selectedVerse.verse,
          text: selectedVerse.text,
        } : null}
        onClose={closeNoteEditor}
        onSave={handleNoteSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 100 },
  verseContainer: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 4,
  },
  verseText: { fontFamily: 'System' },
  verseNum: { fontSize: 12, fontWeight: '700' },
  bookmarkIndicator: { fontSize: 12 },
  noteIndicator: { fontSize: 12 },
  footer: { paddingTop: 40, paddingBottom: 20, alignItems: 'center' },
  chapterLabel: { fontSize: 14, fontWeight: '500' },
  emptyText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
  navHint: { position: 'absolute', top: '50%', marginTop: -20, opacity: 0.3 },
  navHintLeft: { left: 8 },
  navHintRight: { right: 8 },
  navHintText: { fontSize: 24, fontWeight: '300' },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  selectionBarButton: { padding: 8 },
  selectionBarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
