/**
 * useTheme Hook
 * Provides theme colors based on user preference or system color scheme
 */

import { useColorScheme } from 'react-native';
import { getThemeColors, colors, ColorScheme } from '../theme/colors';
import { typography, getAdjustedTypography, FontSizeSetting } from '../theme/typography';
import { spacing, layout, shadows } from '../theme/spacing';
import { useSettingsStore } from '../stores/settingsStore';

export function useTheme(fontSizeSetting: FontSizeSetting = 'M') {
  const systemScheme = useColorScheme();
  const themeSetting = useSettingsStore((state) => state.theme);

  // Determine effective scheme: respect user preference, fall back to system
  const scheme: ColorScheme =
    themeSetting === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeSetting;

  const isDark = scheme === 'dark';
  const isSepia = scheme === 'sepia';
  
  const themeColors = getThemeColors(scheme);
  const adjustedTypography = getAdjustedTypography(fontSizeSetting);
  
  return {
    // Color scheme info
    isDark,
    isSepia,
    scheme,

    // Theme colors (adjusted for light/dark/sepia)
    colors: themeColors,

    // Raw color palette (for specific needs)
    palette: colors,

    // Typography (adjusted for font size setting)
    typography: adjustedTypography,

    // Spacing
    spacing,
    layout,

    // Shadows (none in dark mode, subtle in sepia)
    shadows: isDark ? { card: shadows.none, cardLarge: shadows.none } : shadows,
  };
}

export type Theme = ReturnType<typeof useTheme>;
