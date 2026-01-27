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
import { useHistory } from '../src/hooks/useHistory';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary';
import { HistoryItem } from '../src/types/library';
import { navigateToBible, navigateToHymn } from '../src/utils/navigation';

function HistoryScreenContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { history, isLoading, error, clear, refresh } = useHistory();

  const labels = {
    empty: { ht: 'Pa gen istwa', fr: 'Aucun historique', en: 'No history' }[language],
    emptyHint: {
      ht: 'Kòmanse li Bib la oswa kantik yo',
      fr: 'Commencez à lire la Bible ou les cantiques',
      en: 'Start reading the Bible or hymns',
    }[language],
    clearAll: { ht: 'Efase tout', fr: 'Tout effacer', en: 'Clear all' }[language],
    clearConfirm: {
      ht: 'Efase tout istwa lekti ou?',
      fr: 'Effacer tout votre historique de lecture?',
      en: 'Clear all your reading history?',
    }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    errorTitle: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: {
      ht: 'Pa kapab chaje istwa',
      fr: "Impossible de charger l'historique",
      en: 'Unable to load history',
    }[language],
    retry: { ht: 'Eseye ankò', fr: 'Réessayer', en: 'Retry' }[language],
  };

  const handleClearAll = useCallback(() => {
    Alert.alert(labels.clearAll, labels.clearConfirm, [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.clearAll,
        style: 'destructive',
        onPress: clear,
      },
    ]);
  }, [labels.clearAll, labels.clearConfirm, labels.cancel, clear]);

  const handlePress = useCallback(
    (item: HistoryItem) => {
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
        router.push(item.type === 'bible' ? '/(tabs)/bible' : '/(tabs)/hymns');
      }
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      const dateString = new Date(item.last_read_at).toLocaleDateString(
        language === 'ht' ? 'fr-HT' : language === 'fr' ? 'fr-FR' : 'en-US',
        { month: 'short', day: 'numeric' }
      );
      const countString = item.read_count > 1 ? ` \u2022 ${item.read_count}x` : '';

      const readLabel = { ht: 'Li', fr: 'Lu le', en: 'Read' }[language];
      const accessibilityLabel = `${item.displayTitle}. ${readLabel} ${dateString}${countString}`;

      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress(item)}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <Ionicons
            name={item.type === 'bible' ? 'book-outline' : 'musical-notes-outline'}
            size={20}
            color={colors.primary}
          />
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{item.displayTitle}</Text>
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {dateString}
              {countString}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      );
    },
    [colors, language, handlePress]
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
      {history.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { borderColor: colors.border }]}
          onPress={handleClearAll}
          accessibilityLabel={labels.clearAll}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.clearText, { color: colors.primary }]}>{labels.clearAll}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => `history-${item.id}`}
        contentContainerStyle={[styles.list, history.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title={labels.empty} hint={labels.emptyHint} />
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
export default function HistoryScreen() {
  const { language } = useSettingsStore();
  const router = useRouter();

  return (
    <ScreenErrorBoundary
      screenName="HistoryScreen"
      fallbackTitle={{
        ht: 'Pa kapab chaje istwa',
        fr: "Impossible de charger l'historique",
        en: 'Unable to load history',
      }[language]}
      onGoBack={() => router.back()}
    >
      <HistoryScreenContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
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
    minHeight: 64,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 13 },
});
