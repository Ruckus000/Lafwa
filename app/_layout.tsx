import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Load fonts here if needed, e.g. Inter
  });
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Centralized screen titles
  const screenTitles = {
    bookmarks: { ht: 'Makè', fr: 'Signets', en: 'Bookmarks' }[language],
    highlights: { ht: 'Sikle', fr: 'Surlignages', en: 'Highlights' }[language],
    favorites: { ht: 'Favori', fr: 'Favoris', en: 'Favorites' }[language],
    history: { ht: 'Istwa', fr: 'Historique', en: 'History' }[language],
    about: { ht: 'Konsènan Lafwa', fr: 'À propos de Lafwa', en: 'About Lafwa' }[language],
    feedback: { ht: 'Voye Fidbak', fr: 'Envoyer des commentaires', en: 'Send Feedback' }[language],
  };

  const backTitle = { ht: 'Retounen', fr: 'Retour', en: 'Back' }[language];

  // Shared header style for push screens
  const pushScreenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerBackTitle: backTitle,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Library screens - now at root level with proper back navigation */}
        <Stack.Screen
          name="bookmarks"
          options={{ ...pushScreenOptions, title: screenTitles.bookmarks }}
        />
        <Stack.Screen
          name="highlights"
          options={{ ...pushScreenOptions, title: screenTitles.highlights }}
        />
        <Stack.Screen
          name="favorites"
          options={{ ...pushScreenOptions, title: screenTitles.favorites }}
        />
        <Stack.Screen
          name="history"
          options={{ ...pushScreenOptions, title: screenTitles.history }}
        />

        {/* Modal screens */}
        <Stack.Screen
          name="search"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Info screens */}
        <Stack.Screen
          name="about"
          options={{ ...pushScreenOptions, title: screenTitles.about }}
        />
        <Stack.Screen
          name="feedback"
          options={{ ...pushScreenOptions, title: screenTitles.feedback }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
