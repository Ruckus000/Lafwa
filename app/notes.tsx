/**
 * Notes Screen
 * Displays all personal notes on Bible verses
 * Language-agnostic: notes persist across language switches
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useNotes } from '../src/hooks/useNotes';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary';
import { NoteWithVerse } from '../src/db/queries';
import { navigateToBible } from '../src/utils/navigation';
import { truncateAtWordBoundary } from '../src/utils/version';

function NotesScreenContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { 
    notes, 
    isLoading, 
    error, 
    hasMore, 
    totalCount,
    refresh, 
    loadMore, 
    removeNote 
  } = useNotes({ pageSize: 50 });

  const labels = {
    empty: { ht: 'Ou poko gen nòt', fr: 'Aucune note', en: 'No notes yet' }[language],
    emptyHint: {
      ht: 'Peze sou yon vèsè pou ajoute nòt',
      fr: 'Appuyez sur un verset pour ajouter une note',
      en: 'Tap on a verse to add a note',
    }[language],
    delete: { ht: 'Efase', fr: 'Supprimer', en: 'Delete' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    deleteConfirm: {
      ht: 'Efase nòt sa a?',
      fr: 'Supprimer cette note?',
      en: 'Delete this note?',
    }[language],
    errorTitle: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: {
      ht: 'Pa kapab chaje nòt yo',
      fr: 'Impossible de charger les notes',
      en: 'Unable to load notes',
    }[language],
    retry: { ht: 'Eseye ankò', fr: 'Réessayer', en: 'Retry' }[language],
    loadingMore: { ht: 'Chaje...', fr: 'Chargement...', en: 'Loading...' }[language],
    longPressHint: {
      ht: 'Peze lontan pou efase',
      fr: 'Appui long pour supprimer',
      en: 'Long press to delete',
    }[language],
  };

  const handleDelete = useCallback(
    (item: NoteWithVerse) => {
      const reference = `${item.book} ${item.chapter}:${item.verse}`;

      Alert.alert(labels.delete, `${labels.deleteConfirm}\n\n${reference}`, [
        { text: labels.cancel, style: 'cancel' },
        {
          text: labels.delete,
          style: 'destructive',
          onPress: () => removeNote(item),
        },
      ]);
    },
    [labels, removeNote]
  );

  const handlePress = useCallback(
    (item: NoteWithVerse) => {
      navigateToBible(router, {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: NoteWithVerse }) => {
      const reference = `${item.book} ${item.chapter}:${item.verse}`;
      const notePreview = truncateAtWordBoundary(item.text, 100);
      const versePreview = item.verseText 
        ? truncateAtWordBoundary(item.verseText, 60) 
        : '';

      const accessibilityLabel = `${reference}. ${notePreview}`;

      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleDelete(item)}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={labels.longPressHint}
          accessibilityRole="button"
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.reference, { color: colors.text }]}>{reference}</Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.text}
            </Text>
            {versePreview ? (
              <Text style={[styles.versePreview, { color: colors.textTertiary }]} numberOfLines={1}>
                "{versePreview}"
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
            accessibilityLabel={labels.delete}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [colors, handlePress, handleDelete, labels]
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          {labels.loadingMore}
        </Text>
      </View>
    );
  }, [hasMore, colors, labels]);

  if (error && !isLoading && notes.length === 0) {
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
        data={notes}
        renderItem={renderItem}
        keyExtractor={(item) => `note-${item.id}`}
        contentContainerStyle={[styles.list, notes.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState icon="document-text-outline" title={labels.empty} hint={labels.emptyHint} />
          )
        }
        ListFooterComponent={renderFooter}
        onRefresh={refresh}
        refreshing={isLoading && notes.length === 0}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

// Wrap with error boundary for graceful error handling
export default function NotesScreen() {
  const { language } = useSettingsStore();
  const router = useRouter();

  return (
    <ScreenErrorBoundary
      screenName="NotesScreen"
      fallbackTitle={{
        ht: 'Pa kapab chaje nòt yo',
        fr: 'Impossible de charger les notes',
        en: 'Unable to load notes',
      }[language]}
      onGoBack={() => router.back()}
    >
      <NotesScreenContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    minHeight: 88,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: { flex: 1 },
  reference: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  noteText: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  versePreview: { fontSize: 12, fontStyle: 'italic' },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
});
