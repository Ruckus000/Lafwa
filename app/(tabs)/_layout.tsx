import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function TabLayout() {
  const { colors } = useTheme();
  const { rs, safeAreaInsets } = useResponsive();
  const { language } = useSettingsStore();

  const tabLabels = {
    home: { ht: 'Lakay', fr: 'Accueil', en: 'Home' }[language],
    bible: { ht: 'Bib la', fr: 'Bible', en: 'Bible' }[language],
    hymns: { ht: 'Kantik', fr: 'Cantiques', en: 'Hymns' }[language],
    more: { ht: 'Plis', fr: 'Plus', en: 'More' }[language],
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: rs(60) + safeAreaInsets.bottom,
          paddingBottom: safeAreaInsets.bottom + rs(8),
          paddingTop: rs(8),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabLabels.home,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: tabLabels.bible,
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hymns"
        options={{
          title: tabLabels.hymns,
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
