import React, { useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useFavorites } from '../src/hooks/useFavorites';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary';
import { Bookmark } from '../src/types/library';
import { navigateToHymn } from '../src/utils/navigation';

function FavoritesScreenContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { favorites, isLoading, error, removeFavorite, refresh } = useFavorites();

  const labels = {
    empty: {
      ht: 'Ou poko gen kantik favori',
      fr: 'Aucun cantique favori',
      en: 'No favorite hymns yet',
    }[language],
    emptyHint: {
      ht: 'Tape kè a sou yon kantik',
      fr: "Appuyez sur le cœur d'un cantique",
      en: 'Tap the heart on a hymn',
    }[language],
    delete: { ht: 'Efase', fr: 'Supprimer', en: 'Delete' }[language],
    deleteConfirm: {
      ht: 'Retire kantik sa a nan favori ou?',
      fr: 'Retirer ce cantique de vos favoris?',
      en: 'Remove this hymn from favorites?',
    }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    errorTitle: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: {
      ht: 'Pa kapab chaje favori yo',
      fr: 'Impossible de charger les favoris',
      en: 'Unable to load favorites',
    }[language],
    retry: { ht: 'Eseye ankò', fr: 'Réessayer', en: 'Retry' }[language],
  };

  // Null-safe description builder
  const getItemDescription = useCallback((item: Bookmark): string => {
    return `#${item.number ?? '?'} - ${item.title ?? 'Unknown'}`;
  }, []);

  const handleDelete = useCallback(
    (item: Bookmark) => {
      const description = `#${item.number ?? '?'} - ${item.title ?? 'Unknown'}`;
      Alert.alert(labels.delete, `${labels.deleteConfirm}\n\n${description}`, [
        { text: labels.cancel, style: 'cancel' },
        {
          text: labels.delete,
          style: 'destructive',
          onPress: () => removeFavorite(item.reference_id),
        },
      ]);
    },
    [labels.delete, labels.deleteConfirm, labels.cancel, removeFavorite]
  );

  const handlePress = useCallback(
    (item: Bookmark) => {
      if (item.number) {
        navigateToHymn(router, { number: item.number });
      } else {
        router.push('/(tabs)/hymns');
      }
    },
    [router]
  );

  const deleteLabel = {
    ht: 'Retire nan favori',
    fr: 'Retirer des favoris',
    en: 'Remove from favorites',
  }[language];

  const renderItem = useCallback(
    ({ item }: { item: Bookmark }) => {
      const hymnLabel = { ht: 'Kantik', fr: 'Cantique', en: 'Hymn' }[language];
      const number = item.number ?? '?';
      const title = item.title ?? 'Unknown';

      const accessibilityLabel = `${hymnLabel} ${number}, ${title}`;

      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleDelete(item)}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.numberText}>{number}</Text>
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
            accessibilityLabel={deleteLabel}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart-dislike-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [colors, language, handlePress, handleDelete, deleteLabel]
  );

  if (error && !isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title={labels.errorTitle}
          hint={labels.errorMessage}
          action={{ label: labels.retry, onPress: refresh }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => `favorite-${item.id}`}
        contentContainerStyle={[styles.list, favorites.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="heart-outline" title={labels.empty} hint={labels.emptyHint} />
        }
        onRefresh={refresh}
        refreshing={isLoading}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

// Wrap with ErrorBoundary for graceful error handling
export default function FavoritesScreen() {
  const { language } = useSettingsStore();
  const router = useRouter();

  return (
    <ScreenErrorBoundary
      screenName="FavoritesScreen"
      fallbackTitle={{
        ht: 'Pa kapab chaje favori yo',
        fr: 'Impossible de charger les favoris',
        en: 'Unable to load favorites',
      }[language]}
      onGoBack={() => router.back()}
    >
      <FavoritesScreenContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    minHeight: 60,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
