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
import { useHighlights } from '../src/hooks/useHighlights';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { Highlight, HighlightColor } from '../src/types/library';
import { navigateToBible } from '../src/utils/navigation';

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
  const { highlights, isLoading, error, unhighlight, refresh } = useHighlights();

  const labels = {
    empty: { ht: 'Ou poko sikle anyen', fr: 'Aucun surlignage', en: 'No highlights yet' }[language],
    emptyHint: {
      ht: 'Peze sou yon vèsè pou sikle li',
      fr: 'Appuyez sur un verset pour le surligner',
      en: 'Tap on a verse to highlight it',
    }[language],
    delete: { ht: 'Efase', fr: 'Supprimer', en: 'Delete' }[language],
    deleteConfirm: {
      ht: 'Efase sikle sa a?',
      fr: 'Supprimer ce surlignage?',
      en: 'Remove this highlight?',
    }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    errorTitle: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: {
      ht: 'Pa kapab chaje sikle yo',
      fr: 'Impossible de charger les surlignages',
      en: 'Unable to load highlights',
    }[language],
    retry: { ht: 'Eseye ankò', fr: 'Réessayer', en: 'Retry' }[language],
  };

  const handleDelete = useCallback(
    (item: Highlight) => {
      const reference = `${item.book} ${item.chapter}:${item.verse}`;
      Alert.alert(labels.delete, `${labels.deleteConfirm}\n\n${reference}`, [
        { text: labels.cancel, style: 'cancel' },
        {
          text: labels.delete,
          style: 'destructive',
          onPress: () => unhighlight(item.verse_id),
        },
      ]);
    },
    [labels.delete, labels.deleteConfirm, labels.cancel, unhighlight]
  );

  const handlePress = useCallback(
    (item: Highlight) => {
      navigateToBible(router, {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
      });
    },
    [router]
  );

  const deleteLabel = {
    ht: 'Efase',
    fr: 'Supprimer',
    en: 'Delete',
  }[language];

  const renderItem = useCallback(
    ({ item }: { item: Highlight }) => {
      const reference = `${item.book} ${item.chapter}:${item.verse}`;
      const colorName = {
        yellow: { ht: 'jòn', fr: 'jaune', en: 'yellow' }[language],
        green: { ht: 'vèt', fr: 'vert', en: 'green' }[language],
        blue: { ht: 'ble', fr: 'bleu', en: 'blue' }[language],
        pink: { ht: 'woz', fr: 'rose', en: 'pink' }[language],
      }[item.color];

      const highlightedLabel = {
        ht: 'Sikle',
        fr: 'Surligné en',
        en: 'Highlighted',
      }[language];
      const previewText = item.text?.substring(0, 50) ?? '';

      const accessibilityLabel = `${reference}. ${previewText}. ${highlightedLabel} ${colorName}`;

      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleDelete(item)}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_COLORS[item.color] }]} />
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{reference}</Text>
            <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
              {item.text}
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
        data={highlights}
        renderItem={renderItem}
        keyExtractor={(item) => `highlight-${item.id}`}
        contentContainerStyle={[styles.list, highlights.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState icon="brush-outline" title={labels.empty} hint={labels.emptyHint} />
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  preview: { fontSize: 14 },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
