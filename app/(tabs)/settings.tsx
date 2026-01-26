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
import { useSettingsStore, FontSizeSetting, LineSpacingSetting } from '../../src/stores/settingsStore';
import { useLibrary } from '../../src/hooks/useLibrary';

// Type definitions for library navigation
type LibraryRoute = '/bookmarks' | '/highlights' | '/favorites' | '/history' | '/notes';
type LibraryIcon = 'bookmark' | 'brush' | 'heart' | 'time' | 'document-text';

interface LibraryItem {
  icon: LibraryIcon;
  label: string;
  count: number | null;
  route: LibraryRoute;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, shadows, isDark } = useTheme();
  const {
    language,
    setLanguage,
    fontSize,
    setFontSize,
    lineSpacing,
    setLineSpacing,
    theme,
    setTheme,
  } = useSettingsStore();
  const { counts } = useLibrary();

  const labels = {
    title: { ht: 'Plis', fr: 'Plus', en: 'More' }[language],
    library: { ht: 'BIBLIYOTÈK', fr: 'BIBLIOTHÈQUE', en: 'LIBRARY' }[language],
    bookmarks: { ht: 'Makè', fr: 'Signets', en: 'Bookmarks' }[language],
    highlights: { ht: 'Sikle', fr: 'Surlignages', en: 'Highlights' }[language],
    notes: { ht: 'Nòt', fr: 'Notes', en: 'Notes' }[language],
    favorites: { ht: 'Favori', fr: 'Favoris', en: 'Favorites' }[language],
    history: { ht: 'Istwa', fr: 'Historique', en: 'History' }[language],
    settings: { ht: 'PARAMÈT', fr: 'PARAMÈTRES', en: 'SETTINGS' }[language],
    languageLabel: { ht: 'Lang', fr: 'Langue', en: 'Language' }[language],
    fontSizeLabel: { ht: 'Gwosè Tèks', fr: 'Taille du texte', en: 'Font Size' }[language],
    lineSpacingLabel: { ht: 'Espas Liy', fr: 'Espacement des lignes', en: 'Line Spacing' }[language],
    themeLabel: { ht: 'Tèm', fr: 'Thème', en: 'Theme' }[language],
    info: { ht: 'ENFÒMASYON', fr: 'INFORMATIONS', en: 'INFORMATION' }[language],
    about: { ht: 'Konsènan Lafwa', fr: 'À propos de Lafwa', en: 'About Lafwa' }[language],
    feedback: { ht: 'Voye Fidbak', fr: 'Envoyer des commentaires', en: 'Send Feedback' }[language],
  };

  const themeLabels = {
    light: { ht: 'Limyè', fr: 'Clair', en: 'Light' }[language],
    dark: { ht: 'Fènwa', fr: 'Sombre', en: 'Dark' }[language],
    sepia: { ht: 'Sepya', fr: 'Sépia', en: 'Sepia' }[language],
    system: { ht: 'Sistèm', fr: 'Système', en: 'System' }[language],
  };

  const lineSpacingLabels = {
    compact: { ht: 'Sere', fr: 'Compact', en: 'Compact' }[language],
    normal: { ht: 'Nòmal', fr: 'Normal', en: 'Normal' }[language],
    relaxed: { ht: 'Laj', fr: 'Aéré', en: 'Relaxed' }[language],
  };

  const lineSpacingOptions: LineSpacingSetting[] = ['compact', 'normal', 'relaxed'];

  const libraryItems: LibraryItem[] = [
    { icon: 'bookmark', label: labels.bookmarks, count: counts.bookmarks, route: '/bookmarks' },
    { icon: 'brush', label: labels.highlights, count: counts.highlights, route: '/highlights' },
    { icon: 'document-text', label: labels.notes, count: counts.notes, route: '/notes' },
    { icon: 'heart', label: labels.favorites, count: counts.favorites, route: '/favorites' },
    { icon: 'time', label: labels.history, count: null, route: '/history' },
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
                onPress={() => router.push(item.route as Href)}
              >
                <Ionicons name={item.icon} size={20} color={colors.primary} />
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
                {(['ht', 'fr', 'en'] as const).map((lang) => (
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
                      {lang === 'ht' ? 'Kreyòl' : lang === 'fr' ? 'Français' : 'English'}
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

            {/* Line Spacing */}
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLabel}>
                <Ionicons name="reorder-three" size={20} color={colors.primary} />
                <Text style={[styles.listLabel, { color: colors.text }]}>
                  {labels.lineSpacingLabel}
                </Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceHover }]}>
                {lineSpacingOptions.map((spacing) => (
                  <TouchableOpacity
                    key={spacing}
                    style={[
                      styles.segment,
                      lineSpacing === spacing && [
                        styles.segmentActive,
                        { backgroundColor: colors.surface },
                        shadows.card,
                      ],
                    ]}
                    onPress={() => setLineSpacing(spacing)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: lineSpacing === spacing ? colors.text : colors.textTertiary },
                      ]}
                    >
                      {lineSpacingLabels[spacing]}
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
              <View style={[styles.themeControl, { backgroundColor: colors.surfaceHover }]}>
                {(['light', 'sepia', 'dark', 'system'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeOption,
                      theme === t && [
                        styles.themeOptionActive,
                        { backgroundColor: colors.surface },
                        shadows.card,
                      ],
                    ]}
                    onPress={() => setTheme(t)}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
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
  themeControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    borderRadius: 10,
    marginLeft: 34,
    gap: 4,
  },
  themeOption: {
    flexBasis: '48%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  themeOptionActive: {},
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
