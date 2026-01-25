/**
 * Lafwa Design System - Typography
 * Based on UX/UI Spec v1
 * 
 * Note: Inter font should be loaded via expo-font
 * Fallback: System font
 */

import { TextStyle } from 'react-native';

// Type Scale
export const typography = {
  // Display - Home screen titles
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38.4, // 1.2
  },

  // Title 1 - Screen titles, hymn numbers
  title1: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 31.2, // 1.3
  },

  // Title 2 - Section headers
  title2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26, // 1.3
  },

  // Title 3 - Card titles, book names
  title3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 25.2, // 1.4
  },

  // Body Large - Bible text, hymn lyrics
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28.8, // 1.6
  },

  // Body - Default body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24, // 1.5
  },

  // Body Small - Secondary info, metadata
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21, // 1.5
  },

  // Caption - Labels, timestamps
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16.8, // 1.4
  },

  // Label - Section headers, UI labels (uppercase)
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 19.6, // 1.4
    letterSpacing: 0.5,
  },

  // Verse Number - Superscript verse numbers
  verseNumber: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 12, // 1.0
  },
} as const;

// Font Size Settings (User Adjustable)
export type FontSizeSetting = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const fontSizeScale: Record<FontSizeSetting, {
  bodyLarge: number;
  body: number;
  bodySmall: number;
  caption: number;
}> = {
  XS: { bodyLarge: 16, body: 14, bodySmall: 13, caption: 12 },
  S: { bodyLarge: 18, body: 15, bodySmall: 14, caption: 13 },
  M: { bodyLarge: 20, body: 17, bodySmall: 15, caption: 13 }, // Default
  L: { bodyLarge: 22, body: 19, bodySmall: 17, caption: 14 },
  XL: { bodyLarge: 26, body: 23, bodySmall: 19, caption: 16 },
};

// Helper to get adjusted typography based on user setting
export const getAdjustedTypography = (setting: FontSizeSetting = 'M') => {
  const scale = fontSizeScale[setting];
  return {
    ...typography,
    bodyLarge: {
      ...typography.bodyLarge,
      fontSize: scale.bodyLarge,
      lineHeight: scale.bodyLarge * 1.6,
    },
    body: {
      ...typography.body,
      fontSize: scale.body,
      lineHeight: scale.body * 1.5,
    },
    bodySmall: {
      ...typography.bodySmall,
      fontSize: scale.bodySmall,
      lineHeight: scale.bodySmall * 1.5,
    },
    caption: {
      ...typography.caption,
      fontSize: scale.caption,
      lineHeight: scale.caption * 1.4,
    },
  };
};
