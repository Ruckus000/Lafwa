/**
 * Lafwa Design System - Colors
 * Based on UX/UI Spec v1
 */

export const colors = {
  // Primary Colors
  primary: {
    ocean: '#1a56db',
    oceanDark: '#1e429f',
    oceanLight: '#e1effe',
  },

  // Neutral Colors (Light Mode)
  light: {
    bg: '#ffffff',
    bgSecondary: '#f3f4f6',
    surface: '#ffffff',
    surfaceHover: '#f3f4f6',
    border: '#e5e7eb',
    borderStrong: 'rgba(0,0,0,0.1)',
    text: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6b7280',
    textMuted: '#9ca3af',
  },

  // Dark Mode Colors
  dark: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    borderStrong: 'rgba(255,255,255,0.1)',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    textMuted: '#475569',
  },

  // Sepia Mode Colors (reading comfort)
  sepia: {
    bg: '#f5f0e1',
    bgSecondary: '#ebe4d3',
    surface: '#f5f0e1',
    surfaceHover: '#e5dece',
    border: '#d4cdc0',
    borderStrong: 'rgba(91, 70, 54, 0.15)',
    text: '#5b4636',
    textSecondary: '#7a6b5d',
    textTertiary: '#998b7d',
    textMuted: '#b8a99a',
  },

  // Highlight Colors (Verse Marking)
  highlights: {
    yellow: { bg: '#fef08a', border: '#fde047' },
    green: { bg: '#bbf7d0', border: '#86efac' },
    blue: { bg: '#bae6fd', border: '#7dd3fc' },
    pink: { bg: '#fecaca', border: '#fca5a5' },
  },

  // Semantic Colors
  semantic: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Special
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Theme helper type
export type ColorScheme = 'light' | 'dark' | 'sepia';

// Get theme colors based on color scheme
export const getThemeColors = (scheme: ColorScheme) => {
  const isDark = scheme === 'dark';
  const isSepia = scheme === 'sepia';

  const themeColors = isSepia ? colors.sepia : (isDark ? colors.dark : colors.light);

  return {
    bg: themeColors.bg,
    bgSecondary: themeColors.bgSecondary,
    surface: themeColors.surface,
    surfaceHover: themeColors.surfaceHover,
    border: themeColors.border,
    borderStrong: themeColors.borderStrong,
    text: themeColors.text,
    textSecondary: themeColors.textSecondary,
    textTertiary: themeColors.textTertiary,
    textMuted: themeColors.textMuted,
    // Primary colors - adjusted for sepia
    primary: isSepia ? '#8b6914' : colors.primary.ocean,
    primaryDark: isSepia ? '#6b4f0f' : colors.primary.oceanDark,
    primaryLight: isSepia ? '#e8dfc9' : (isDark ? '#1e3a5f' : colors.primary.oceanLight),
  };
};
