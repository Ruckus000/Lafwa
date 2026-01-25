/**
 * VerseActionSheet Component
 * Bottom sheet with verse actions: highlight, bookmark, copy, share
 * Based on UX/UI Spec v1
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { colors as themeColors } from '../theme/colors';

const { height } = Dimensions.get('window');

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

interface VerseActionSheetProps {
  visible: boolean;
  verse: {
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
  isBookmarked: boolean;
  highlightColor?: HighlightColor | null;
  onClose: () => void;
  onHighlight: (color: HighlightColor) => void;
  onRemoveHighlight: () => void;
  onToggleBookmark: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export default function VerseActionSheet({
  visible,
  verse,
  isBookmarked,
  highlightColor,
  onClose,
  onHighlight,
  onRemoveHighlight,
  onToggleBookmark,
  onCopy,
  onShare,
}: VerseActionSheetProps) {
  const { colors, shadows, layout } = useTheme();
  const language = useSettingsStore((state) => state.language);

  if (!verse) return null;

  const highlightColors: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

  const handleCopy = async () => {
    const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const textToCopy = `${verse.text}\n— ${reference}`;
    await Clipboard.setStringAsync(textToCopy);
    onCopy();
  };

  const handleShare = async () => {
    const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
    try {
      await Share.share({
        message: `"${verse.text}"\n— ${reference}\n\nvia Lafwa`,
      });
      onShare();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const labels = {
    highlight: language === 'ht' ? 'Sikle' : 'Surligner',
    bookmark: language === 'ht' ? 'Makè' : 'Marquer',
    copy: language === 'ht' ? 'Kopye' : 'Copier',
    share: language === 'ht' ? 'Pataje' : 'Partager',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View 
          style={[
            styles.sheet,
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            shadows.card,
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Highlight Colors */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              {labels.highlight}
            </Text>
            <View style={styles.colorRow}>
              {highlightColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: themeColors.highlights[color].bg },
                    highlightColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => {
                    if (highlightColor === color) {
                      onRemoveHighlight();
                    } else {
                      onHighlight(color);
                    }
                  }}
                >
                  {highlightColor === color && (
                    <Ionicons name="checkmark" size={16} color="#333" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onToggleBookmark}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {labels.bookmark}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {labels.copy}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {labels.share}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonActive: {
    borderWidth: 2,
    borderColor: '#333',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
