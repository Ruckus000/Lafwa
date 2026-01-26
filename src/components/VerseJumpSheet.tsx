/**
 * VerseJumpSheet Component
 * Modal with grid of verse numbers for quick navigation
 * Based on UX/UI Spec v1
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const CELL_GAP = 8;
const CELLS_PER_ROW = 6;
const CELL_SIZE = Math.min(44, (width - GRID_PADDING * 2 - CELL_GAP * (CELLS_PER_ROW - 1)) / CELLS_PER_ROW);

interface VerseJumpSheetProps {
  visible: boolean;
  bookName: string;
  chapter: number;
  verseCount: number;
  currentVerse?: number;
  onSelectVerse: (verse: number) => void;
  onClose: () => void;
}

export default function VerseJumpSheet({
  visible,
  bookName,
  chapter,
  verseCount,
  currentVerse,
  onSelectVerse,
  onClose,
}: VerseJumpSheetProps) {
  const { colors, shadows } = useTheme();
  const language = useSettingsStore((state) => state.language);

  const verses = Array.from({ length: verseCount }, (_, i) => i + 1);

  const labels = {
    title: { ht: 'Ale nan vèsè', fr: 'Aller au verset', en: 'Go to verse' }[language],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {labels.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              {bookName} {chapter}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Verse Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {verses.map((verse) => {
                const isActive = verse === currentVerse;
                return (
                  <TouchableOpacity
                    key={verse}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                      !isActive && shadows.card,
                    ]}
                    onPress={() => {
                      onSelectVerse(verse);
                      onClose();
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={`Verse ${verse}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: isActive ? '#fff' : colors.text },
                      ]}
                    >
                      {verse}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: GRID_PADDING,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    justifyContent: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
