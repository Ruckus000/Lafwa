/**
 * Hymns Tab Screen
 * Chant d'Espérance hymnal browsing
 * Based on UX/UI Spec v1
 * 
 * Note: Full implementation pending hymn content pipeline (Phase 2)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';

// Placeholder data until hymn content pipeline is complete
const placeholderHymns = [
  { id: 1, number: 1, title: 'Bondye, Koute Lapriyè M', firstLine: 'Bondye, koute lapriyè mwen...' },
  { id: 2, number: 2, title: 'Jezi Renmen M', firstLine: 'Jezi renmen m, mwen konnen sa...' },
  { id: 3, number: 42, title: 'Bon Bèje A', firstLine: 'Senyè se bèje mwen, mwen p ap manke...' },
  { id: 4, number: 100, title: 'Glwa Pou Bondye', firstLine: 'Glwa pou Bondye nan syèl la...' },
  { id: 5, number: 150, title: 'Louwanj Pou Senyè', firstLine: 'Louwanj, louwanj pou Senyè a...' },
  { id: 6, number: 200, title: 'Nan Syèl La', firstLine: 'Nan syèl la gen yon bèl peyi...' },
  { id: 7, number: 250, title: 'Kris Se Sèl Chemen', firstLine: 'Kris se sèl chemen, verite...' },
  { id: 8, number: 300, title: 'Mwen Gen Yon Zanmi', firstLine: 'Mwen gen yon zanmi ki fidèl...' },
];

export default function HymnsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ number?: string }>();
  const { colors, shadows, isDark } = useTheme();
  const language = useSettingsStore((state) => state.language);
  const [favorites, setFavorites] = useState<Set<number>>(new Set([2, 42, 200]));
  const [selectedHymnNumber, setSelectedHymnNumber] = useState<number | null>(null);

  // Handle deep link params (from search, bookmarks, favorites, history)
  useEffect(() => {
    if (params.number) {
      const num = parseInt(params.number, 10);
      if (!isNaN(num) && num > 0) {
        setSelectedHymnNumber(num);
        // TODO: Navigate to hymn detail view when implemented
        // For now, we just store the number for future use
        console.log(`[HymnsScreen] Deep link to hymn #${num}`);
      }
    }
  }, [params.number]);

  const toggleFavorite = (hymnId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(hymnId)) {
        next.delete(hymnId);
      } else {
        next.add(hymnId);
      }
      return next;
    });
  };

  const renderHymnItem = ({ item, index }: { item: typeof placeholderHymns[0]; index: number }) => (
    <TouchableOpacity
      style={[
        styles.hymnItem,
        index < placeholderHymns.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
      activeOpacity={0.7}
    >
      {/* Number Badge */}
      <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      
      {/* Content */}
      <View style={styles.hymnContent}>
        <Text style={[styles.hymnTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.hymnSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
          {item.firstLine}
        </Text>
      </View>
      
      {/* Favorite */}
      {favorites.has(item.id) && (
        <Ionicons name="heart" size={16} color="#ef4444" style={styles.favoriteIcon} />
      )}
      
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Chant d'Espérance
        </Text>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.surfaceHover }]}
          onPress={() => router.push('/search')}
          accessibilityLabel={{ ht: 'Chèche kantik', fr: 'Rechercher des cantiques', en: 'Search hymns' }[language]}
          accessibilityRole="button"
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Quick Jump Hint */}
      <TouchableOpacity 
        style={[styles.quickJumpHint, { backgroundColor: colors.surfaceHover }]}
      >
        <Text style={styles.quickJumpEmoji}>🎹</Text>
        <View style={styles.quickJumpContent}>
          <Text style={[styles.quickJumpTitle, { color: colors.text }]}>
            {{ ht: 'Antre nimewo kantik la', fr: 'Entrez le numéro du cantique', en: 'Enter hymn number' }[language]}
          </Text>
          <Text style={[styles.quickJumpSubtitle, { color: colors.textTertiary }]}>
            {{ ht: 'Tape nenpòt nimewo pou ale dirèk', fr: 'Tapez un numéro pour y aller', en: 'Type any number to jump directly' }[language]}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Hymn List */}
      <FlatList
        data={placeholderHymns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHymnItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              {{ ht: 'Kontni kantik yo ap vini byento...', fr: 'Le contenu des cantiques arrive bientôt...', en: 'Hymn content coming soon...' }[language]}
            </Text>
          </View>
        }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickJumpHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  quickJumpEmoji: {
    fontSize: 24,
  },
  quickJumpContent: {
    flex: 1,
  },
  quickJumpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickJumpSubtitle: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  hymnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hymnContent: {
    flex: 1,
    minWidth: 0,
  },
  hymnTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  hymnSubtitle: {
    fontSize: 13,
  },
  favoriteIcon: {
    marginRight: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
  },
});
