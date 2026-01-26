import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function LibraryLayout() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const titles = {
    bookmarks: { ht: 'Makè', fr: 'Signets', en: 'Bookmarks' }[language],
    highlights: { ht: 'Sikle', fr: 'Surlignages', en: 'Highlights' }[language],
    favorites: { ht: 'Favori', fr: 'Favoris', en: 'Favorites' }[language],
    history: { ht: 'Istwa', fr: 'Historique', en: 'History' }[language],
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: { ht: 'Retounen', fr: 'Retour', en: 'Back' }[language],
      }}
    >
      <Stack.Screen name="bookmarks" options={{ title: titles.bookmarks }} />
      <Stack.Screen name="highlights" options={{ title: titles.highlights }} />
      <Stack.Screen name="favorites" options={{ title: titles.favorites }} />
      <Stack.Screen name="history" options={{ title: titles.history }} />
    </Stack>
  );
}
