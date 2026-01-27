/**
 * Home Tab
 * Daily engagement hub with verse of the day and quick actions
 * Based on UX/UI Spec v1
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useDailyVerse } from '../../src/hooks/useDailyVerse';
import { VerseCardSkeleton } from '../../src/components/VerseCardSkeleton';
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary';

// Time-based greetings
const getGreeting = (language: 'ht' | 'fr' | 'en') => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { text: { ht: 'Bonjou!', fr: 'Bonjour!', en: 'Good morning!' }[language], emoji: '☀️' };
  }
  if (hour >= 12 && hour < 18) {
    return { text: { ht: 'Bon aprè-midi!', fr: 'Bon après-midi!', en: 'Good afternoon!' }[language], emoji: '🌤' };
  }
  if (hour >= 18 && hour < 22) {
    return { text: { ht: 'Bonswa!', fr: 'Bonsoir!', en: 'Good evening!' }[language], emoji: '🌅' };
  }
  return { text: { ht: 'Bòn nwit!', fr: 'Bonne nuit!', en: 'Good night!' }[language], emoji: '🌙' };
};


function HomeScreenContent() {
  const router = useRouter();
  const { colors, shadows, isDark } = useTheme();
  const { rs, rf, rw } = useResponsive();
  const { language, lastReadBible, setTheme, theme } = useSettingsStore();

  const greeting = useMemo(() => getGreeting(language), [language]);

  // Theme toggle animation
  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  // Check for reduce motion accessibility setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  // Daily verse from database
  const {
    verse,
    isLoading: verseLoading,
    isBookmarked: verseBookmarked,
    handleBookmark,
    handleShare,
    handleReadMore,
  } = useDailyVerse();

  // Calculate responsive grid width for quick actions
  const actionCardWidth = rw(50, rs(12), 2);

  // Dynamic styles that depend on responsive values
  const dynamicStyles = useMemo(() => ({
    content: {
      padding: rs(20),
      paddingBottom: rs(100),
    },
    header: {
      marginBottom: rs(28),
    },
    greeting: {
      fontSize: rf(15),
    },
    title: {
      fontSize: rf(34),
    },
    themeButton: {
      width: rs(44),
      height: rs(44),
      borderRadius: rs(22),
    },
    verseCard: {
      borderRadius: rs(20),
      padding: rs(20),
      marginBottom: rs(24),
    },
    verseLabel: {
      fontSize: 14, // Fixed for accessibility
    },
    verseText: {
      fontSize: 22, // Fixed, prominent
      lineHeight: 35.2, // 1.6 ratio
    },
    verseAction: {
      width: rs(40),
      height: rs(40),
      borderRadius: rs(20),
    },
    sectionTitle: {
      fontSize: 14, // Fixed for accessibility
      marginBottom: rs(14),
    },
    continueCard: {
      padding: rs(16),
      borderRadius: rs(16),
    },
    continueIcon: {
      width: rs(52),
      height: rs(52),
      borderRadius: rs(12),
      marginRight: rs(12),
    },
    continueTitle: {
      fontSize: rf(17),
    },
    continueSubtitle: {
      fontSize: rf(14),
    },
    actionsGrid: {
      gap: rs(12),
    },
    actionCard: {
      width: actionCardWidth,
      padding: rs(16),
      borderRadius: rs(16),
    },
    actionIcon: {
      width: rs(48),
      height: rs(48),
      borderRadius: rs(12),
      marginBottom: rs(12),
    },
    actionLabel: {
      fontSize: rf(17),
    },
    actionDesc: {
      fontSize: rf(14),
    },
  }), [rs, rf, actionCardWidth]);

  const toggleTheme = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Determine new theme
    const newTheme = theme === 'system'
      ? (isDark ? 'light' : 'dark')
      : (theme === 'dark' ? 'light' : 'dark');

    // Animate icon rotation (skip if reduce motion is enabled)
    if (!reduceMotion) {
      Animated.spring(rotateAnim, {
        toValue: newTheme === 'dark' ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      rotateAnim.setValue(newTheme === 'dark' ? 1 : 0);
    }

    setTheme(newTheme);
  };

  const quickActions = [
    {
      icon: 'book',
      label: { ht: 'Bib la', fr: 'Bible', en: 'Bible' }[language],
      desc: { ht: '66 liv', fr: '66 livres', en: '66 books' }[language],
      onPress: () => router.push('/bible'),
    },
    {
      icon: 'musical-notes',
      label: { ht: 'Kantik', fr: 'Cantiques', en: 'Hymns' }[language],
      desc: { ht: '800+ chante', fr: '800+ chants', en: '800+ hymns' }[language],
      onPress: () => router.push('/hymns'),
    },
    {
      icon: 'search',
      label: { ht: 'Chèche', fr: 'Rechercher', en: 'Search' }[language],
      desc: { ht: 'Bib & Kantik', fr: 'Bible & Cantiques', en: 'Bible & Hymns' }[language],
      onPress: () => router.push('/search'),
    },
    {
      icon: 'heart',
      label: { ht: 'Favori', fr: 'Favoris', en: 'Favorites' }[language],
      desc: { ht: 'Makè yo', fr: 'Signets', en: 'Bookmarks' }[language],
      onPress: () => router.push('/favorites' as Href),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <View>
            <Text style={[styles.greeting, dynamicStyles.greeting, { color: colors.textTertiary }]}>
              {greeting.emoji} {greeting.text}
            </Text>
            <Text style={[styles.title, dynamicStyles.title, { color: colors.text }]}>Lafwa</Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeButton, dynamicStyles.themeButton, { backgroundColor: colors.surfaceHover }]}
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            accessibilityRole="button"
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                  {
                    scale: rotateAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0.85, 1],
                    }),
                  },
                ],
              }}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={rs(22)}
                color={colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Verse of the Day */}
        {verseLoading ? (
          <VerseCardSkeleton />
        ) : verse ? (
          <TouchableOpacity
            onPress={handleReadMore}
            activeOpacity={0.9}
            style={[
              styles.verseCard,
              dynamicStyles.verseCard,
              {
                backgroundColor: isDark ? colors.surface : colors.primaryLight,
                borderColor: colors.border,
              },
              !isDark && shadows.card,
            ]}
          >
            <View style={styles.verseHeader}>
              <Text style={[styles.verseLabel, dynamicStyles.verseLabel, { color: colors.primary }]}>
                {{ ht: 'Vèsè Jounen An', fr: 'Verset du Jour', en: 'Verse of the Day' }[language]}
              </Text>
            </View>

            <Text
              style={[styles.verseText, dynamicStyles.verseText, { color: colors.text }]}
              numberOfLines={4}
            >
              "{verse.text}"
            </Text>

            <View style={styles.verseFooter}>
              <Text style={[styles.verseRef, { color: colors.textSecondary }]}>
                {verse.reference}
              </Text>
              <View style={styles.verseActions}>
                <TouchableOpacity
                  onPress={handleBookmark}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.verseAction, dynamicStyles.verseAction, { backgroundColor: colors.bg }]}
                >
                  <Ionicons
                    name={verseBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={rs(20)}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.verseAction, dynamicStyles.verseAction, { backgroundColor: colors.bg }]}
                >
                  <Ionicons name="share-outline" size={rs(20)} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Continue Reading */}
        {lastReadBible && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { color: colors.textTertiary }]}>
              {{ ht: 'KONTINYE', fr: 'CONTINUER', en: 'CONTINUE' }[language]}
            </Text>
            <TouchableOpacity
              style={[
                styles.continueCard,
                dynamicStyles.continueCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadows.card,
              ]}
              onPress={() => router.push('/bible')}
              activeOpacity={0.7}
            >
              <View style={[styles.continueIcon, dynamicStyles.continueIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="book" size={rs(26)} color={colors.primary} />
              </View>
              <View style={styles.continueText}>
                <Text style={[styles.continueTitle, dynamicStyles.continueTitle, { color: colors.text }]}>
                  {lastReadBible.book} {lastReadBible.chapter}
                </Text>
                <Text style={[styles.continueSubtitle, dynamicStyles.continueSubtitle, { color: colors.textTertiary }]}>
                  {{ ht: 'Kontinye li', fr: 'Continuer la lecture', en: 'Continue reading' }[language]}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={rs(22)} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { color: colors.textTertiary }]}>
            {{ ht: 'AKSYON RAPID', fr: 'ACCÈS RAPIDE', en: 'QUICK ACCESS' }[language]}
          </Text>
          <View style={[styles.actionsGrid, dynamicStyles.actionsGrid]}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.actionCard,
                  dynamicStyles.actionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  shadows.card,
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, dynamicStyles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={action.icon as any} size={rs(26)} color={colors.primary} />
                </View>
                <Text style={[styles.actionLabel, dynamicStyles.actionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
                <Text style={[styles.actionDesc, dynamicStyles.actionDesc, { color: colors.textTertiary }]}>
                  {action.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Wrap with ErrorBoundary for graceful error handling
export default function HomeScreen() {
  const { language } = useSettingsStore();
  const router = useRouter();

  return (
    <ScreenErrorBoundary
      screenName="HomeScreen"
      fallbackTitle={{
        ht: 'Paj lakay pa kapab chaje',
        fr: 'Page d\'accueil impossible à charger',
        en: 'Home page could not load',
      }[language]}
      onGoBack={() => router.push('/bible')}
    >
      <HomeScreenContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  themeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseCard: {
    borderWidth: 1,
  },
  verseHeader: {
    marginBottom: 12,
  },
  verseLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  verseText: {
    fontStyle: 'italic',
    marginBottom: 16,
  },
  verseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseRef: {
    fontSize: 15,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verseAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  continueIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    flex: 1,
  },
  continueTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  continueSubtitle: {},
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    borderWidth: 1,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDesc: {},
});
