import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useSearch } from '../src/hooks/useSearch';
import { useSettingsStore } from '../src/stores/settingsStore';
import { EmptyState } from '../src/components/EmptyState';
import { navigateToBible, navigateToHymn } from '../src/utils/navigation';
import {
  SearchResultItem,
  BibleSearchResult,
  HymnSearchResult,
  isBibleResult,
  isHymnResult,
} from '../src/types/search';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, bibleVersion } = useSettingsStore();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query, bibleVersion);

  const labels = {
    placeholder: { ht: 'Chèche nan Bib la ak Kantik yo...', fr: 'Rechercher dans la Bible et les Cantiques...', en: 'Search Bible and Hymns...' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
    noResults: { ht: 'Pa gen rezilta', fr: 'Aucun résultat', en: 'No results' }[language],
    noResultsHint: { ht: 'Eseye lòt mo', fr: "Essayez d'autres mots", en: 'Try different words' }[language],
    bible: { ht: 'Bib la', fr: 'Bible', en: 'Bible' }[language],
    hymns: { ht: 'Kantik', fr: 'Cantiques', en: 'Hymns' }[language],
    minChars: { ht: 'Tape omwen 3 lèt', fr: 'Tapez au moins 3 lettres', en: 'Type at least 3 characters' }[language],
    searching: { ht: 'Ap chèche...', fr: 'Recherche...', en: 'Searching...' }[language],
  };

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const bibleResults = results.filter((r): r is SearchResultItem & { type: 'bible'; data: BibleSearchResult } => r.type === 'bible');
  const hymnResults = results.filter((r): r is SearchResultItem & { type: 'hymn'; data: HymnSearchResult } => r.type === 'hymn');

  const handleResultPress = (item: SearchResultItem) => {
    router.back();
    if (isBibleResult(item)) {
      navigateToBible(router, {
        book: item.data.book,
        chapter: item.data.chapter,
        verse: item.data.verse,
      });
    } else if (isHymnResult(item)) {
      navigateToHymn(router, {
        number: item.data.number,
      });
    }
  };

  const renderResult = ({ item }: { item: SearchResultItem }) => {
    const isBible = isBibleResult(item);
    const data = item.data;

    const title = isBible
      ? `${(data as BibleSearchResult).book} ${(data as BibleSearchResult).chapter}:${(data as BibleSearchResult).verse}`
      : `#${(data as HymnSearchResult).number} - ${(data as HymnSearchResult).title_ht || (data as HymnSearchResult).title_fr}`;

    const snippet = isBible
      ? (data as BibleSearchResult).text
      : (data as HymnSearchResult).title_ht || (data as HymnSearchResult).title_fr || '';

    return (
      <TouchableOpacity
        style={[styles.resultItem, { borderColor: colors.border }]}
        onPress={() => handleResultPress(item)}
        accessibilityLabel={title}
        accessibilityHint={isBible ? labels.bible : labels.hymns}
        accessibilityRole="button"
      >
        <Ionicons
          name={isBible ? 'book-outline' : 'musical-notes-outline'}
          size={18}
          color={colors.primary}
        />
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.resultSnippet, { color: colors.textTertiary }]} numberOfLines={2}>
            {snippet}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{count}</Text>
    </View>
  );

  type HeaderItem = { type: 'header'; title: string; count: number };
  type ListItem = SearchResultItem | HeaderItem;

  const combinedData: ListItem[] = [
    ...(bibleResults.length > 0
      ? [{ type: 'header' as const, title: labels.bible || '', count: bibleResults.length }]
      : []),
    ...bibleResults,
    ...(hymnResults.length > 0
      ? [{ type: 'header' as const, title: labels.hymns || '', count: hymnResults.length }]
      : []),
    ...hymnResults,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search Header */}
        <View style={styles.header}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceHover }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder={labels.placeholder}
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>{labels.cancel}</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {query.length < 3 ? (
          <View style={styles.hint}>
            <Text style={{ color: colors.textTertiary }}>{labels.minChars}</Text>
          </View>
        ) : loading ? (
          <View style={styles.hint}>
            <Text style={{ color: colors.textTertiary }}>{labels.searching}</Text>
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title={labels.noResults}
            hint={labels.noResultsHint}
          />
        ) : (
          <FlatList
            data={combinedData}
            renderItem={({ item }: { item: ListItem }) =>
              item.type === 'header'
                ? renderSectionHeader(item.title, item.count)
                : renderResult({ item })
            }
            keyExtractor={(item: ListItem, index) =>
              item.type === 'header'
                ? `header-${index}`
                : `${item.type}-${item.data.id || index}`
            }
            contentContainerStyle={styles.results}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  results: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 14,
  },
});
