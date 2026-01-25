/**
 * Lafwa Design System - Spacing
 * Based on UX/UI Spec v1
 * 
 * All spacing uses a 4px base unit
 */

export const spacing = {
  1: 4,   // Tight gaps, inline spacing
  2: 8,   // Icon-to-text gaps, compact lists
  3: 12,  // Default element gaps
  4: 16,  // Section padding, card padding
  5: 20,  // Screen horizontal padding
  6: 24,  // Section separation
  8: 32,  // Major section breaks
  10: 40, // Screen top/bottom padding
  12: 48, // Large decorative spacing
} as const;

// Common layout values
export const layout = {
  screenPadding: spacing[5], // 20px
  cardPadding: spacing[4],   // 16px
  cardRadius: 12,
  cardRadiusLarge: 16,
  buttonRadius: 8,
  buttonRadiusPill: 24,
  
  // Touch targets (minimum 44px for accessibility)
  touchTarget: 44,
  touchTargetSmall: 40,
  
  // Tab bar
  tabBarHeight: 56,
  
  // List items
  listItemHeight: 56,
  listItemHeightCompact: 48,
  listItemHeightLarge: 72,
  
  // Bottom sheet
  bottomSheetRadius: 16,
  bottomSheetHandle: { width: 40, height: 4 },
  bottomSheetMaxHeight: 0.7, // 70% of screen
} as const;

// Shadow presets
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  // No shadows in dark mode - rely on surface colors
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;
