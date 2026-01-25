/**
 * useTheme Hook
 * Provides theme colors based on system color scheme
 */

import { useColorScheme } from 'react-native';
import { getThemeColors, colors, ColorScheme } from '../theme/colors';
import { typography, getAdjustedTypography, FontSizeSetting } from '../theme/typography';
import { spacing, layout, shadows } from '../theme/spacing';

export function useTheme(fontSizeSetting: FontSizeSetting = 'M') {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const isDark = scheme === 'dark';
  
  const themeColors = getThemeColors(scheme);
  const adjustedTypography = getAdjustedTypography(fontSizeSetting);
  
  return {
    // Color scheme info
    isDark,
    scheme,
    
    // Theme colors (adjusted for light/dark)
    colors: themeColors,
    
    // Raw color palette (for specific needs)
    palette: colors,
    
    // Typography (adjusted for font size setting)
    typography: adjustedTypography,
    
    // Spacing
    spacing,
    layout,
    
    // Shadows (none in dark mode)
    shadows: isDark ? { card: shadows.none, cardLarge: shadows.none } : shadows,
  };
}

export type Theme = ReturnType<typeof useTheme>;
