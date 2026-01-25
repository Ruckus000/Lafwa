import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function LibraryLayout() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const titles = {
    bookmarks: language === 'ht' ? 'Makè' : 'Signets',
    highlights: language === 'ht' ? 'Sikle' : 'Surlignages',
    favorites: language === 'ht' ? 'Favori' : 'Favoris',
    history: language === 'ht' ? 'Istwa' : 'Historique',
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: language === 'ht' ? 'Retounen' : 'Retour',
      }}
    >
      <Stack.Screen name="bookmarks" options={{ title: titles.bookmarks }} />
      <Stack.Screen name="highlights" options={{ title: titles.highlights }} />
      <Stack.Screen name="favorites" options={{ title: titles.favorites }} />
      <Stack.Screen name="history" options={{ title: titles.history }} />
    </Stack>
  );
}
