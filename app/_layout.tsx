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

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Library screens */}
        <Stack.Screen name="library" options={{ headerShown: false }} />

        {/* Modal screens */}
        <Stack.Screen
          name="search"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Standard push screens */}
        <Stack.Screen
          name="about"
          options={{
            headerShown: true,
            title: language === 'ht' ? 'Konsènan Lafwa' : 'À propos de Lafwa',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            headerShown: true,
            title: language === 'ht' ? 'Voye Fidbak' : 'Envoyer des commentaires',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
