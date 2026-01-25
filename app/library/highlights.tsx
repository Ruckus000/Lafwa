import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useHighlights } from '../../src/hooks/useHighlights';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components/EmptyState';
import { Highlight, HighlightColor } from '../../src/types/library';

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  blue: '#bae6fd',
  pink: '#fecaca',
};

export default function HighlightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { highlights, isLoading, unhighlight, refresh } = useHighlights();

  const labels = {
    empty: language === 'ht' ? 'Ou poko sikle anyen' : 'Aucun surlignage',
    emptyHint:
      language === 'ht'
        ? 'Peze sou yon vèsè pou sikle li'
        : 'Appuyez sur un verset pour le surligner',
    delete: language === 'ht' ? 'Efase' : 'Supprimer',
    cancel: language === 'ht' ? 'Anile' : 'Annuler',
  };

  const handleDelete = (item: Highlight) => {
    Alert.alert(labels.delete, '', [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.delete,
        style: 'destructive',
        onPress: () => unhighlight(item.verse_id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Highlight }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push('/bible')}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_COLORS[item.color] }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.book} {item.chapter}:{item.verse}
        </Text>
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
          {item.text}
        </Text>
      </View>
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
        data={highlights}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, highlights.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="brush-outline" title={labels.empty} hint={labels.emptyHint} />
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  preview: { fontSize: 14 },
});
