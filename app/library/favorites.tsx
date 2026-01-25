import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components/EmptyState';
import { Bookmark } from '../../src/types/library';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { favorites, isLoading, removeFavorite, refresh } = useFavorites();

  const labels = {
    empty: language === 'ht' ? 'Ou poko gen kantik favori' : 'Aucun cantique favori',
    emptyHint:
      language === 'ht'
        ? 'Tape kè a sou yon kantik'
        : "Appuyez sur le cœur d'un cantique",
    delete: language === 'ht' ? 'Efase' : 'Supprimer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleDelete = (item: Bookmark) => {
    Alert.alert(labels.delete, '', [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.delete,
        style: 'destructive',
        onPress: () => removeFavorite(item.reference_id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push('/hymns')}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      </View>
      <Ionicons name="heart" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={{ color: colors.textTertiary }}>
            {language === 'ht' ? 'Ap chaje...' : 'Chargement...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, favorites.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="heart-outline" title={labels.empty} hint={labels.emptyHint} />
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
});
