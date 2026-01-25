import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function TabLayout() {
  const { colors } = useTheme();
  const { rs, safeAreaInsets } = useResponsive();

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
          title: 'Lakay',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bib la',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hymns"
        options={{
          title: 'Kantik',
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Plis',
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
