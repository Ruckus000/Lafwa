/**
 * Hymn Detail Screen
 * Displays individual hymn with HymnReader and PresentationMode
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { getHymnWithSections, HymnWithSections, isHymnFavorite, toggleFavoriteHymn } from '../../src/db/queries';
import HymnReader from '../../src/components/HymnReader';
import PresentationMode from '../../src/components/PresentationMode';

export default function HymnDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ number: string }>();
  const { colors, isDark } = useTheme();
  const language = useSettingsStore((state) => state.language);

  const hymnNumber = parseInt(params.number, 10);

  const [hymn, setHymn] = useState<HymnWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  // Load hymn data for header and presentation mode
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

  const handlePresentationMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPresentation(true);
  }, []);

  const getTitle = (): string => {
    if (!hymn) return '';
    if (language === 'ht' && hymn.title_ht) return hymn.title_ht;
    if (language === 'fr' && hymn.title_fr) return hymn.title_fr;
    return hymn.title_ht || hymn.title_fr || '';
  };

  // Show presentation mode
  if (showPresentation && hymn && hymn.sections.length > 0) {
    return (
      <PresentationMode
        hymnNumber={hymn.number}
        title={getTitle()}
        sections={hymn.sections}
        onExit={() => setShowPresentation(false)}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!hymn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {{ ht: 'Kantik', fr: 'Cantique', en: 'Hymn' }[language]} #{hymnNumber}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            {{ ht: 'Kantik sa a pa disponib', fr: 'Ce cantique n\'est pas disponible', en: 'This hymn is not available' }[language]}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            #{hymn.number}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.headerButton}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ef4444' : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePresentationMode}
            style={styles.headerButton}
            accessibilityLabel="Presentation mode"
          >
            <Ionicons name="tv-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hymn Reader */}
      <HymnReader
        hymnNumber={hymnNumber}
        onPresentationMode={handlePresentationMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
