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
import { useBookmarks } from '../src/hooks/useBookmarks';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary';
import { Bookmark } from '../src/types/library';
import { navigateToBible, navigateToHymn } from '../src/utils/navigation';

function BookmarksScreenContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { bookmarks, isLoading, error, removeBookmark, refresh } = useBookmarks();

  const labels = {
    empty: { ht: 'Ou poko gen makè', fr: 'Aucun signet', en: 'No bookmarks yet' }[language],
    emptyHint: {
      ht: 'Peze sou yon vèsè pou ajoute makè',
      fr: 'Appuyez sur un verset pour ajouter un signet',
      en: 'Tap on a verse to add a bookmark',
    }[language],
    delete: { ht: 'Efase', fr: 'Supprimer', en: 'Delete' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    deleteConfirm: {
      ht: 'Efase makè sa a?',
      fr: 'Supprimer ce signet?',
      en: 'Delete this bookmark?',
    }[language],
    errorTitle: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: {
      ht: 'Pa kapab chaje makè yo',
      fr: 'Impossible de charger les signets',
      en: 'Unable to load bookmarks',
    }[language],
    retry: { ht: 'Eseye ankò', fr: 'Réessayer', en: 'Retry' }[language],
  };

  // Null-safe description builder
  const getItemDescription = useCallback((item: Bookmark): string => {
    if (item.type === 'bible') {
      return `${item.book ?? 'Unknown'} ${item.chapter ?? '?'}:${item.verse ?? '?'}`;
    }
    return `#${item.number ?? '?'} - ${item.title ?? 'Unknown'}`;
  }, []);

  const handleDelete = useCallback(
    (item: Bookmark) => {
      const itemDescription =
        item.type === 'bible'
          ? `${item.book ?? 'Unknown'} ${item.chapter ?? '?'}:${item.verse ?? '?'}`
          : `#${item.number ?? '?'} - ${item.title ?? 'Unknown'}`;

      Alert.alert(labels.delete, `${labels.deleteConfirm}\n\n${itemDescription}`, [
        { text: labels.cancel, style: 'cancel' },
        {
          text: labels.delete,
          style: 'destructive',
          onPress: () => removeBookmark(item.type, item.reference_id),
        },
      ]);
    },
    [labels.delete, labels.deleteConfirm, labels.cancel, removeBookmark]
  );

  const handlePress = useCallback(
    (item: Bookmark) => {
      if (item.type === 'bible' && item.book && item.chapter) {
        navigateToBible(router, {
          book: item.book,
          chapter: item.chapter,
          verse: item.verse,
        });
      } else if (item.type === 'hymn' && item.number) {
        navigateToHymn(router, { number: item.number });
      } else {
        router.push(item.type === 'bible' ? '/(tabs)/bible' : '/(tabs)/hymns');
      }
    },
    [router]
  );

  const deleteLabel = {
    ht: 'Efase',
    fr: 'Supprimer',
    en: 'Delete',
  }[language];

  const renderItem = useCallback(
    ({ item }: { item: Bookmark }) => {
      const itemDescription = getItemDescription(item);
      const previewText = item.text?.substring(0, 50) ?? item.title ?? '';
      const contentType =
        item.type === 'bible'
          ? { ht: 'Vèsè', fr: 'Verset', en: 'Verse' }[language]
          : { ht: 'Kantik', fr: 'Cantique', en: 'Hymn' }[language];

      const accessibilityLabel = `${contentType}: ${itemDescription}. ${previewText}`;

      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleDelete(item)}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons
              name={item.type === 'bible' ? 'book' : 'musical-notes'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{itemDescription}</Text>
            <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
              {item.text || item.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
            accessibilityLabel={deleteLabel}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [colors, language, getItemDescription, handlePress, handleDelete, deleteLabel]
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
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={[styles.list, bookmarks.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="bookmark-outline" title={labels.empty} hint={labels.emptyHint} />
        }
        onRefresh={refresh}
        refreshing={isLoading}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

// Wrap with ErrorBoundary for graceful error handling
export default function BookmarksScreen() {
  const { language } = useSettingsStore();
  const router = useRouter();

  return (
    <ScreenErrorBoundary
      screenName="BookmarksScreen"
      fallbackTitle={{
        ht: 'Pa kapab chaje makè yo',
        fr: 'Impossible de charger les signets',
        en: 'Unable to load bookmarks',
      }[language]}
      onGoBack={() => router.back()}
    >
      <BookmarksScreenContent />
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
    minHeight: 76,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  preview: { fontSize: 14 },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
