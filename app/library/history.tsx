import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useHistory } from '../../src/hooks/useHistory';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { EmptyState } from '../../src/components/EmptyState';
import { HistoryItem } from '../../src/types/library';
import { navigateToBible, navigateToHymn } from '../../src/utils/navigation';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { history, isLoading, clear, refresh } = useHistory();

  const labels = {
    empty: { ht: 'Pa gen istwa', fr: 'Aucun historique', en: 'No history' }[language],
    emptyHint: { ht: 'Kòmanse li Bib la oswa kantik yo', fr: 'Commencez à lire la Bible ou les cantiques', en: 'Start reading the Bible or hymns' }[language],
    clearAll: { ht: 'Efase tout', fr: 'Tout effacer', en: 'Clear all' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
  };

  const handleClearAll = () => {
    Alert.alert(labels.clearAll, '', [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.clearAll,
        style: 'destructive',
        onPress: clear,
      },
    ]);
  };

  const handlePress = (item: HistoryItem) => {
    if (item.type === 'bible' && item.book && item.chapter) {
      navigateToBible(router, {
        book: item.book,
        chapter: item.chapter,
      });
    } else if (item.type === 'hymn' && item.hymn_number) {
      navigateToHymn(router, {
        number: item.hymn_number,
      });
    } else {
      // Fallback if data is incomplete
      router.push(item.type === 'bible' ? '/bible' : '/hymns');
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handlePress(item)}
    >
      <Ionicons
        name={item.type === 'bible' ? 'book-outline' : 'musical-notes-outline'}
        size={20}
        color={colors.primary}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.displayTitle}</Text>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>
          {new Date(item.last_read_at).toLocaleDateString()}
          {item.read_count > 1 && ` • ${item.read_count}x`}
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
      {history.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { borderColor: colors.border }]}
          onPress={handleClearAll}
        >
          <Text style={[styles.clearText, { color: colors.primary }]}>{labels.clearAll}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, history.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title={labels.empty} hint={labels.emptyHint} />
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
  clearButton: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearText: { fontSize: 14, fontWeight: '600' },
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
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 13 },
});
