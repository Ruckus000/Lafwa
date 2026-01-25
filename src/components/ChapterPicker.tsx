/**
 * ChapterPicker Component
 * Grid of chapter numbers for selected book
 * Based on UX/UI Spec v1
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BibleBook } from '../data/bibleBooks';
import { useSettingsStore } from '../stores/settingsStore';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const CELL_GAP = 8;
const CELLS_PER_ROW = 6;
const CELL_SIZE = (width - GRID_PADDING * 2 - CELL_GAP * (CELLS_PER_ROW - 1)) / CELLS_PER_ROW;

interface ChapterPickerProps {
  book: BibleBook;
  currentChapter?: number;
  onSelectChapter: (chapter: number) => void;
  onBack: () => void;
}

export default function ChapterPicker({ 
  book, 
  currentChapter, 
  onSelectChapter, 
  onBack 
}: ChapterPickerProps) {
  const { colors, spacing, shadows } = useTheme();
  const language = useSettingsStore((state) => state.language);

  const bookName = language === 'ht' ? book.nameHt : book.nameFr;
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{bookName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Chapter Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {chapters.map((chapter) => {
            const isActive = chapter === currentChapter;
            return (
              <TouchableOpacity
                key={chapter}
                style={[
                  styles.cell,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                  !isActive && shadows.card,
                ]}
                onPress={() => onSelectChapter(chapter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cellText,
                    { color: isActive ? '#fff' : colors.text },
                  ]}
                >
                  {chapter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: GRID_PADDING,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
