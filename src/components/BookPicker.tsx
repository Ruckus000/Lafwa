/**
 * BookPicker Component
 * Full-screen book selection with OT/NT toggle
 * Based on UX/UI Spec v1
 */

import React, { useState } from 'react';
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
import { bibleBooks, BibleBook, getBooksByTestament } from '../data/bibleBooks';
import { useSettingsStore } from '../stores/settingsStore';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 40 - COLUMN_GAP) / 2; // 20px padding each side

interface BookPickerProps {
  onSelectBook: (book: BibleBook) => void;
  onClose: () => void;
  onSearch?: () => void;
}

export default function BookPicker({ onSelectBook, onClose, onSearch }: BookPickerProps) {
  const { colors, typography, spacing, layout, shadows } = useTheme();
  const language = useSettingsStore((state) => state.language);
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');

  const books = getBooksByTestament(testament);
  const getBookName = (book: BibleBook) =>
    language === 'ht' ? book.nameHt : language === 'en' ? book.nameEn : book.nameFr;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {{ ht: 'Chwazi Liv', fr: 'Choisir un Livre', en: 'Choose Book' }[language]}
          </Text>
          {onSearch ? (
            <TouchableOpacity
              onPress={onSearch}
              style={[styles.searchButton, { backgroundColor: colors.surfaceHover }]}
              accessibilityLabel={{ ht: 'Chèche nan Bib la', fr: 'Rechercher dans la Bible', en: 'Search the Bible' }[language]}
              accessibilityRole="button"
            >
              <Ionicons name="search" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Testament Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceHover }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              testament === 'OT' && [styles.toggleActive, { backgroundColor: colors.surface }, shadows.card],
            ]}
            onPress={() => setTestament('OT')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: testament === 'OT' ? colors.text : colors.textTertiary },
              ]}
            >
              {{ ht: 'Ansyen', fr: 'Ancien', en: 'Old' }[language]}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              testament === 'NT' && [styles.toggleActive, { backgroundColor: colors.surface }, shadows.card],
            ]}
            onPress={() => setTestament('NT')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: testament === 'NT' ? colors.text : colors.textTertiary },
              ]}
            >
              {{ ht: 'Nouvo', fr: 'Nouveau', en: 'New' }[language]}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {books.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={[
                styles.bookCard,
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  width: CARD_WIDTH,
                },
                shadows.card,
              ]}
              onPress={() => onSelectBook(book)}
              activeOpacity={0.7}
            >
              <Text style={[styles.bookName, { color: colors.text }]} numberOfLines={1}>
                {getBookName(book)}
              </Text>
              <Text style={[styles.chapterCount, { color: colors.textTertiary }]}>
                {book.chapters} {{ ht: 'chapit', fr: 'chapitres', en: 'chapters' }[language]}
              </Text>
            </TouchableOpacity>
          ))}
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
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
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {},
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  bookCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: COLUMN_GAP,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 12,
  },
});
