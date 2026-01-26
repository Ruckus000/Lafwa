/**
 * Hymns Tab Screen
 * Chant d'Espérance hymnal browsing
 * Based on UX/UI Spec v1
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { getAllHymns, HymnListItem, isHymnFavorite } from '../../src/db/queries';

export default function HymnsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ number?: string }>();
  const { colors, shadows, isDark } = useTheme();
  const language = useSettingsStore((state) => state.language);

  const [hymns, setHymns] = useState<HymnListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [numberInput, setNumberInput] = useState('');

  // Load hymns from database
  useEffect(() => {
    loadHymns();
  }, []);

  const loadHymns = async () => {
    setLoading(true);
    try {
      const data = await getAllHymns();
      setHymns(data);

      // Load favorites status
      const favSet = new Set<number>();
      for (const hymn of data) {
        const isFav = await isHymnFavorite(hymn.id);
        if (isFav) favSet.add(hymn.id);
      }
      setFavorites(favSet);
    } catch (e) {
      console.error('Error loading hymns:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle deep link params (from search, bookmarks, favorites, history)
  useEffect(() => {
    if (params.number) {
      const num = parseInt(params.number, 10);
      if (!isNaN(num) && num > 0) {
        router.push(`/hymn/${num}` as Href);
      }
    }
  }, [params.number]);

  // Navigate to hymn detail
  const handleHymnPress = useCallback((hymnNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/hymn/${hymnNumber}` as Href);
  }, [router]);

  // Handle quick jump
  const handleQuickJump = useCallback(() => {
    const num = parseInt(numberInput, 10);
    if (!isNaN(num) && num > 0 && num <= 800) {
      setShowNumberPicker(false);
      setNumberInput('');
      router.push(`/hymn/${num}` as Href);
    }
  }, [numberInput, router]);

  // Get title based on language
  const getTitle = (hymn: HymnListItem): string => {
    if (language === 'ht' && hymn.title_ht) return hymn.title_ht;
    if (language === 'fr' && hymn.title_fr) return hymn.title_fr;
    return hymn.title_ht || hymn.title_fr || `Kantik #${hymn.number}`;
  };

  const renderHymnItem = ({ item, index }: { item: HymnListItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.hymnItem,
        index < hymns.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
      activeOpacity={0.7}
      onPress={() => handleHymnPress(item.number)}
      accessibilityLabel={`Hymn ${item.number}: ${getTitle(item)}`}
      accessibilityRole="button"
    >
      {/* Number Badge */}
      <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>

      {/* Content */}
      <View style={styles.hymnContent}>
        <Text style={[styles.hymnTitle, { color: colors.text }]} numberOfLines={1}>
          {getTitle(item)}
        </Text>
      </View>

      {/* Favorite */}
      {favorites.has(item.id) && (
        <Ionicons name="heart" size={16} color="#ef4444" style={styles.favoriteIcon} />
      )}

      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

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
        onPress={() => setShowNumberPicker(true)}
        accessibilityLabel={{ ht: 'Antre nimewo kantik', fr: 'Entrer numéro de cantique', en: 'Enter hymn number' }[language]}
        accessibilityRole="button"
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
        data={hymns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHymnItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {{ ht: 'Pa gen kantik disponib', fr: 'Aucun cantique disponible', en: 'No hymns available' }[language]}
            </Text>
          </View>
        }
        ListFooterComponent={
          hymns.length > 0 ? (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                {hymns.length} {{ ht: 'kantik', fr: 'cantiques', en: 'hymns' }[language]}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Number Picker Modal */}
      <Modal
        visible={showNumberPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNumberPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNumberPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {{ ht: 'Antre nimewo kantik la', fr: 'Entrez le numéro du cantique', en: 'Enter hymn number' }[language]}
            </Text>
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={numberInput}
              onChangeText={setNumberInput}
              keyboardType="number-pad"
              placeholder="1-800"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              maxLength={3}
              onSubmitEditing={handleQuickJump}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceHover }]}
                onPress={() => {
                  setShowNumberPicker(false);
                  setNumberInput('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  {{ ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleQuickJump}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                  {{ ht: 'Ale', fr: 'Aller', en: 'Go' }[language]}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  favoriteIcon: {
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  numberInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
