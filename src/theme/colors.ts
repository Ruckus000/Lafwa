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
export type ColorScheme = 'light' | 'dark';

// Get theme colors based on color scheme
export const getThemeColors = (scheme: ColorScheme) => {
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? colors.dark.bg : colors.light.bg,
    bgSecondary: isDark ? colors.dark.bgSecondary : colors.light.bgSecondary,
    surface: isDark ? colors.dark.surface : colors.light.surface,
    surfaceHover: isDark ? colors.dark.surfaceHover : colors.light.surfaceHover,
    border: isDark ? colors.dark.border : colors.light.border,
    borderStrong: isDark ? colors.dark.borderStrong : colors.light.borderStrong,
    text: isDark ? colors.dark.text : colors.light.text,
    textSecondary: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
    textTertiary: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
    textMuted: isDark ? colors.dark.textMuted : colors.light.textMuted,
    // Primary always accessible
    primary: colors.primary.ocean,
    primaryDark: colors.primary.oceanDark,
    primaryLight: isDark ? '#1e3a5f' : colors.primary.oceanLight,
  };
};
