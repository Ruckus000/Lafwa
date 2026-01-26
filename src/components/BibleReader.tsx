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
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { BibleBook } from '../data/bibleBooks';
import { getChapter, toggleBookmark, isBookmarked, addHighlight, removeHighlight, getHighlightForVerse, hasNoteForVerse } from '../db/queries';
import VerseActionSheet, { HighlightColor } from './VerseActionSheet';
import VerseJumpSheet from './VerseJumpSheet';
import NoteEditor from './NoteEditor';

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
  hasNote?: boolean;
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
  const { colors, typography, spacing } = useTheme();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const language = useSettingsStore((state) => state.language);
  const lineSpacing = useSettingsStore((state) => state.lineSpacing);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showVerseJump, setShowVerseJump] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Multi-verse selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVerseIds, setSelectedVerseIds] = useState<Set<number>>(new Set());

  const listRef = useRef<FlatList>(null);

  // Get book name based on version
  const bookName = version === 'ht' ? book.nameHt : version === 'en' ? book.nameEn : book.nameFr;

  // Load chapter content
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
      // Query uses the French name as stored in DB
      const data = await getChapter(book.nameFr, chapter, version);
      
      // Enrich with bookmark status, highlight color, and note status
      const enriched = await Promise.all(
        (data as Verse[]).map(async (v) => {
          const [bookmarked, highlightColor, hasNote] = await Promise.all([
            isBookmarked('bible', v.id),
            getHighlightForVerse(v.id),
            hasNoteForVerse(v.id),
          ]);
          return { ...v, bookmarked, highlightColor, hasNote };
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

  // Clear selection when chapter changes
  useEffect(() => {
    setSelectionMode(false);
    setSelectedVerseIds(new Set());
  }, [book.nameHt, chapter]);

  // Verse selection
  const handleVersePress = useCallback((verse: Verse) => {
    if (selectionMode) {
      // In selection mode, toggle this verse
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedVerseIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(verse.id)) {
          newSet.delete(verse.id);
          // Exit selection mode if no verses selected
          if (newSet.size === 0) {
            setSelectionMode(false);
          }
        } else {
          newSet.add(verse.id);
        }
        return newSet;
      });
    } else {
      // Normal mode: show action sheet for single verse
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedVerse(verse);
      setShowActionSheet(true);
    }
  }, [selectionMode]);

  // Long press to enter selection mode
  const handleVerseLongPress = useCallback((verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedVerseIds(new Set([verse.id]));
  }, []);

  // Get selected verses as array
  const getSelectedVerses = useCallback(() => {
    return verses.filter((v) => selectedVerseIds.has(v.id)).sort((a, b) => a.verse - b.verse);
  }, [verses, selectedVerseIds]);

  // Get selection range text
  const getSelectionRangeText = useCallback(() => {
    const selected = getSelectedVerses();
    if (selected.length === 0) return '';
    if (selected.length === 1) {
      return `v.${selected[0].verse}`;
    }
    const first = selected[0].verse;
    const last = selected[selected.length - 1].verse;
    // Check if consecutive
    const isConsecutive = selected.every((v, i) =>
      i === 0 || v.verse === selected[i - 1].verse + 1
    );
    if (isConsecutive) {
      return `v.${first}-${last}`;
    }
    return `${selected.length} {{ ht: 'vèsè', fr: 'versets', en: 'verses' }[language]}`;
  }, [getSelectedVerses, language]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedVerseIds(new Set());
  }, []);

  // Show action sheet for selected verses
  const showSelectionActions = useCallback(() => {
    const selected = getSelectedVerses();
    if (selected.length > 0) {
      // Use first verse for action sheet (for single-verse actions like notes)
      setSelectedVerse(selected[0]);
      setShowActionSheet(true);
    }
  }, [getSelectedVerses]);

  // Action sheet handlers
  const handleHighlight = useCallback(async (color: HighlightColor) => {
    const idsToHighlight = selectionMode ? Array.from(selectedVerseIds) : (selectedVerse ? [selectedVerse.id] : []);

    if (idsToHighlight.length > 0) {
      // Apply highlight to all selected verses
      await Promise.all(idsToHighlight.map((id) => addHighlight(id, color)));
      setVerses((current) =>
        current.map((v) =>
          idsToHighlight.includes(v.id) ? { ...v, highlightColor: color } : v
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [selectedVerse, selectionMode, selectedVerseIds, clearSelection]);

  const handleRemoveHighlight = useCallback(async () => {
    const idsToRemove = selectionMode ? Array.from(selectedVerseIds) : (selectedVerse ? [selectedVerse.id] : []);

    if (idsToRemove.length > 0) {
      await Promise.all(idsToRemove.map((id) => removeHighlight(id)));
      setVerses((current) =>
        current.map((v) =>
          idsToRemove.includes(v.id) ? { ...v, highlightColor: null } : v
        )
      );
    }
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [selectedVerse, selectionMode, selectedVerseIds, clearSelection]);

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
    // Update the verse's hasNote status
    if (selectedVerse) {
      setVerses((current) =>
        current.map((v) =>
          v.id === selectedVerse.id ? { ...v, hasNote: true } : v
        )
      );
    }
    setShowNoteEditor(false);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const closeNoteEditor = useCallback(() => {
    setShowNoteEditor(false);
    setSelectedVerse(null);
  }, []);

  const closeActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedVerse(null);
    clearSelection();
  }, [clearSelection]);

  // Verse jump handler
  const handleVerseJump = useCallback((verse: number) => {
    const index = verse - 1; // verses are 1-indexed
    if (index >= 0 && index < verses.length) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [verses.length]);

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

  // Line spacing multiplier
  const lineSpacingMultipliers = {
    compact: 1.4,
    normal: 1.6,
    relaxed: 1.8,
  };
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

  // Selection bar labels
  const selectionLabels = {
    selected: { ht: 'seleksyone', fr: 'sélectionné', en: 'selected' }[language],
    actions: { ht: 'Aksyon', fr: 'Actions', en: 'Actions' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
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
                  {item.hasNote && (
                    <Text style={styles.noteIndicator}> 📝</Text>
                  )}
                  {item.bookmarked && (
                    <Text style={styles.bookmarkIndicator}> 🔖</Text>
                  )}
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

      {/* Note Editor */}
      <NoteEditor
        visible={showNoteEditor}
        verse={selectedVerse}
        onClose={closeNoteEditor}
        onSave={handleNoteSaved}
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
  noteIndicator: {
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
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  selectionBarButton: {
    padding: 8,
  },
  selectionBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
