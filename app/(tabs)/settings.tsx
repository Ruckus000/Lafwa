/**
 * More Tab (Settings & Tools)
 * Library, Settings, and Info sections
 * Based on UX/UI Spec v1
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore, FontSizeSetting } from '../../src/stores/settingsStore';
import { useLibrary } from '../../src/hooks/useLibrary';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, shadows, isDark } = useTheme();
  const {
    language,
    setLanguage,
    fontSize,
    setFontSize,
    theme,
    setTheme,
  } = useSettingsStore();
  const { counts } = useLibrary();

  const labels = {
    title: language === 'ht' ? 'Plis' : 'Plus',
    search: language === 'ht' ? 'Chèche nan Bib la ak Kantik yo...' : 'Rechercher dans la Bible et les Cantiques...',
    library: language === 'ht' ? 'BIBLIYOTÈK' : 'BIBLIOTHÈQUE',
    bookmarks: language === 'ht' ? 'Makè' : 'Signets',
    highlights: language === 'ht' ? 'Sikle' : 'Surlignages',
    favorites: language === 'ht' ? 'Favori' : 'Favoris',
    history: language === 'ht' ? 'Istwa' : 'Historique',
    settings: language === 'ht' ? 'PARAMÈT' : 'PARAMÈTRES',
    languageLabel: language === 'ht' ? 'Lang' : 'Langue',
    fontSizeLabel: language === 'ht' ? 'Gwosè Tèks' : 'Taille du texte',
    themeLabel: language === 'ht' ? 'Tèm' : 'Thème',
    info: language === 'ht' ? 'ENFÒMASYON' : 'INFORMATIONS',
    about: language === 'ht' ? 'Konsènan Lafwa' : 'À propos de Lafwa',
    feedback: language === 'ht' ? 'Voye Fidbak' : 'Envoyer des commentaires',
  };

  const themeLabels = {
    light: language === 'ht' ? 'Limyè' : 'Clair',
    dark: language === 'ht' ? 'Fènwa' : 'Sombre',
    system: language === 'ht' ? 'Sistèm' : 'Système',
  };

  const libraryItems = [
    { icon: 'bookmark', label: labels.bookmarks, count: counts.bookmarks, route: '/library/bookmarks' },
    { icon: 'brush', label: labels.highlights, count: counts.highlights, route: '/library/highlights' },
    { icon: 'heart', label: labels.favorites, count: counts.favorites, route: '/library/favorites' },
    { icon: 'time', label: labels.history, count: null, route: '/library/history' },
  ];

  const fontSizeOptions: FontSizeSetting[] = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>{labels.title}</Text>

        {/* Search Bar */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surfaceHover }]}
          activeOpacity={0.7}
          onPress={() => router.push('/search' as Href)}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
            {labels.search}
          </Text>
        </TouchableOpacity>

        {/* Library Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            {labels.library}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            {libraryItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.listItem,
                  index < libraryItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
              >
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                <Text style={[styles.listLabel, { color: colors.text }]}>{item.label}</Text>
                {item.count !== null && (
                  <Text style={[styles.listCount, { color: colors.textTertiary }]}>
                    {item.count}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            {labels.settings}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            {/* Language */}
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLabel}>
                <Ionicons name="language" size={20} color={colors.primary} />
                <Text style={[styles.listLabel, { color: colors.text }]}>
                  {labels.languageLabel}
                </Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceHover }]}>
                {(['ht', 'fr'] as const).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.segment,
                      language === lang && [
                        styles.segmentActive,
                        { backgroundColor: colors.surface },
                        shadows.card,
                      ],
                    ]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: language === lang ? colors.text : colors.textTertiary },
                      ]}
                    >
                      {lang === 'ht' ? 'Kreyòl' : 'Français'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Font Size */}
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLabel}>
                <Ionicons name="text" size={20} color={colors.primary} />
                <Text style={[styles.listLabel, { color: colors.text }]}>
                  {labels.fontSizeLabel}
                </Text>
              </View>
              <View style={[styles.fontSizeControl, { backgroundColor: colors.surfaceHover }]}>
                {fontSizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeOption,
                      fontSize === size && [
                        styles.fontSizeActive,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text
                      style={[
                        styles.fontSizeText,
                        { color: fontSize === size ? '#fff' : colors.textTertiary },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Theme */}
            <View style={styles.settingItemLast}>
              <View style={styles.settingLabel}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
                <Text style={[styles.listLabel, { color: colors.text }]}>
                  {labels.themeLabel}
                </Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceHover }]}>
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.segment,
                      styles.segmentSmall,
                      theme === t && [
                        styles.segmentActive,
                        { backgroundColor: colors.surface },
                        shadows.card,
                      ],
                    ]}
                    onPress={() => setTheme(t)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        styles.segmentTextSmall,
                        { color: theme === t ? colors.text : colors.textTertiary },
                      ]}
                    >
                      {themeLabels[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            {labels.info}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <TouchableOpacity
              style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => router.push('/about' as Href)}
            >
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.listLabel, { color: colors.text }]}>{labels.about}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listItem}
              activeOpacity={0.7}
              onPress={() => router.push('/feedback' as Href)}
            >
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
              <Text style={[styles.listLabel, { color: colors.text }]}>{labels.feedback}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Lafwa v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 28,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  listCount: {
    fontSize: 14,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemLast: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    marginLeft: 34,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentSmall: {
    paddingVertical: 6,
  },
  segmentActive: {},
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextSmall: {
    fontSize: 12,
  },
  fontSizeControl: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    marginLeft: 34,
  },
  fontSizeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  fontSizeActive: {},
  fontSizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
