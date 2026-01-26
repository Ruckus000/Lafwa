/**
 * HymnReader Component
 * Reading view for hymns with sections display
 * Based on UX/UI Spec v1
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import {
  getHymnWithSections,
  HymnWithSections,
  HymnSection,
  isHymnFavorite,
  toggleFavoriteHymn,
} from '../db/queries';

interface HymnReaderProps {
  hymnNumber: number;
  onPresentationMode?: () => void;
}

export default function HymnReader({ hymnNumber, onPresentationMode }: HymnReaderProps) {
  const { colors } = useTheme();
  const fontSize = useSettingsStore((state) => state.fontSize);
  const language = useSettingsStore((state) => state.language);
  const lineSpacing = useSettingsStore((state) => state.lineSpacing);

  const [hymn, setHymn] = useState<HymnWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

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

  // Load hymn content
  useEffect(() => {
    loadHymn();
  }, [hymnNumber]);

  const loadHymn = async () => {
    setLoading(true);
    try {
      const [hymnData, favorite] = await Promise.all([
        getHymnWithSections(hymnNumber),
        isHymnFavorite(hymnNumber),
      ]);
      setHymn(hymnData);
      setIsFavorite(favorite);
    } catch (e) {
      console.error('Error loading hymn:', e);
      setHymn(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = useCallback(async () => {
    if (hymn) {
      const newStatus = await toggleFavoriteHymn(hymn.id);
      setIsFavorite(newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hymn]);

  // Get section label based on type
  const getSectionLabel = (section: HymnSection): string => {
    if (section.section_type === 'refrain') {
      return { ht: 'Refren', fr: 'Refrain', en: 'Refrain' }[language];
    }
    const verseWord = { ht: 'Vèsè', fr: 'Couplet', en: 'Verse' }[language];
    return section.section_number ? `${verseWord} ${section.section_number}` : verseWord;
  };

  // Get section text based on language
  const getSectionText = (section: HymnSection): string => {
    if (language === 'ht' && section.text_ht) return section.text_ht;
    if (language === 'fr' && section.text_fr) return section.text_fr;
    // Fallback to available text
    return section.text_ht || section.text_fr || '';
  };

  // Get title based on language
  const getTitle = (): string => {
    if (!hymn) return '';
    if (language === 'ht' && hymn.title_ht) return hymn.title_ht;
    if (language === 'fr' && hymn.title_fr) return hymn.title_fr;
    return hymn.title_ht || hymn.title_fr || '';
  };

  const handleCopy = useCallback(async () => {
    if (!hymn) return;
    try {
      const title = getTitle();
      const sectionsText = hymn.sections
        .map((s) => `${getSectionLabel(s)}\n${getSectionText(s)}`)
        .join('\n\n');
      const fullText = `${title}\nChant d'Espérance #${hymn.number}\n\n${sectionsText}`;
      await Clipboard.setStringAsync(fullText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Copy failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [hymn, getTitle, getSectionLabel, getSectionText]);

  const handleShare = useCallback(async () => {
    if (!hymn) return;
    try {
      const title = getTitle();
      const sectionsText = hymn.sections.map((s) => getSectionText(s)).join('\n\n');
      const shareText = `${title}\nChant d'Espérance #${hymn.number}\n\n${sectionsText}\n\n— Lafwa`;
      await Share.share({ message: shareText });
    } catch (error) {
      if ((error as Error).message !== 'User did not share') {
        console.error('Share failed:', error);
      }
    }
  }, [hymn, getTitle, getSectionText]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hymn || hymn.sections.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          {{ ht: 'Pa gen tèks disponib pou kantik sa a.', fr: 'Aucun texte disponible pour ce cantique.', en: 'No text available for this hymn.' }[language]}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hymn Number */}
        <Text style={[styles.hymnNumber, { color: colors.primary }]}>
          {hymn.number}
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {getTitle()}
        </Text>

        {/* Sections */}
        {hymn.sections.map((section) => (
          <View
            key={section.id}
            style={[
              styles.section,
              section.section_type === 'refrain' && styles.refrainSection,
            ]}
          >
            {/* Section Label */}
            <Text style={[styles.sectionLabel, { color: section.section_type === 'refrain' ? colors.primary : colors.textTertiary }]}>
              {getSectionLabel(section)}
            </Text>

            {/* Section Text */}
            <Text
              style={[
                styles.sectionText,
                {
                  fontSize: textSize,
                  lineHeight: textSize * lineHeightMultiplier,
                  color: colors.text,
                },
                section.section_type === 'refrain' && styles.refrainText,
              ]}
            >
              {getSectionText(section)}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Chant d'Espérance #{hymn.number}
          </Text>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.actionButton}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#ef4444' : colors.textSecondary}
          />
        </TouchableOpacity>

        {onPresentationMode && (
          <TouchableOpacity
            onPress={onPresentationMode}
            style={styles.actionButton}
            accessibilityLabel="Presentation mode"
          >
            <Ionicons name="tv-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          accessibilityLabel="Share hymn"
        >
          <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopy}
          accessibilityLabel="Copy hymn"
        >
          <Ionicons name="copy-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  hymnNumber: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  refrainSection: {
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: 'System',
  },
  refrainText: {
    fontStyle: 'italic',
  },
  footer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
