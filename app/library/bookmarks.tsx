import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useBookmarks } from '../../src/hooks/useBookmarks';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components/EmptyState';
import { Bookmark } from '../../src/types/library';
import { navigateToBible, navigateToHymn } from '../../src/utils/navigation';

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { bookmarks, isLoading, removeBookmark, refresh } = useBookmarks();

  const labels = {
    empty: { ht: 'Ou poko gen makè', fr: 'Aucun signet', en: 'No bookmarks yet' }[language],
    emptyHint: { ht: 'Peze sou yon vèsè pou ajoute makè', fr: 'Appuyez sur un verset pour ajouter un signet', en: 'Tap on a verse to add a bookmark' }[language],
    delete: { ht: 'Efase', fr: 'Supprimer', en: 'Delete' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
  };

  const handleDelete = (item: Bookmark) => {
    Alert.alert(labels.delete, '', [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.delete,
        style: 'destructive',
        onPress: () => removeBookmark(item.type, item.reference_id),
      },
    ]);
  };

  const handlePress = (item: Bookmark) => {
    if (item.type === 'bible' && item.book && item.chapter) {
      navigateToBible(router, {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
      });
    } else if (item.type === 'hymn' && item.number) {
      navigateToHymn(router, {
        number: item.number,
      });
    } else {
      // Fallback if data is incomplete
      router.push(item.type === 'bible' ? '/bible' : '/hymns');
    }
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handlePress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name={item.type === 'bible' ? 'book' : 'musical-notes'}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.type === 'bible'
            ? `${item.book} ${item.chapter}:${item.verse}`
            : `#${item.number} - ${item.title}`}
        </Text>
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
          {item.text || item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>
            {{ ht: 'Ap chaje...', fr: 'Chargement...', en: 'Loading...' }[language]}
          </Text>
        </View>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});
