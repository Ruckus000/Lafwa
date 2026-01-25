/**
 * useResponsive Hook
 * Provides responsive scaling utilities for device-aware layouts
 */

import { useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { layout } from '../theme/spacing';

// Breakpoint definitions
export const BREAKPOINTS = {
  small: 360,     // Very small phones (iPhone SE, older Android)
  standard: 414,  // Standard phones (iPhone 12/13/14)
  large: 480,     // Large phones (iPhone Pro Max, Galaxy Note)
  tablet: 768,    // Tablets
} as const;

export type Breakpoint = 'small' | 'standard' | 'large' | 'tablet';

// Scale factors per breakpoint
const SCALE_FACTORS: Record<Breakpoint, number> = {
  small: 0.9,
  standard: 1.0,
  large: 1.08,
  tablet: 1.15,
};

/**
 * Determine breakpoint from screen width
 */
const getBreakpoint = (width: number): Breakpoint => {
  if (width < BREAKPOINTS.small) return 'small';
  if (width < BREAKPOINTS.standard) return 'small';
  if (width < BREAKPOINTS.large) return 'standard';
  if (width < BREAKPOINTS.tablet) return 'large';
  return 'tablet';
};

export interface ResponsiveValues {
  // Device dimensions
  width: number;
  height: number;

  // Breakpoint info
  breakpoint: Breakpoint;
  scaleFactor: number;

  // Device type booleans
  isSmallPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;

  // Safe area insets
  safeAreaInsets: EdgeInsets;

  // Utility functions
  rs: (value: number) => number;
  rf: (value: number) => number;
  rw: (percentage: number, gap?: number, columns?: number) => number;
}

/**
 * Hook for responsive scaling utilities
 *
 * @returns ResponsiveValues object with dimensions, breakpoint info, and scaling functions
 *
 * @example
 * const { rs, rf, rw, breakpoint } = useResponsive();
 *
 * // Responsive spacing
 * <View style={{ padding: rs(20) }} />
 *
 * // Responsive font
 * <Text style={{ fontSize: rf(16) }} />
 *
 * // Responsive grid width (50% with 12px gap, 2 columns)
 * <View style={{ width: rw(50, 12, 2) }} />
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  const breakpoint = useMemo(() => getBreakpoint(width), [width]);
  const scaleFactor = SCALE_FACTORS[breakpoint];

  // Device type booleans
  const isSmallPhone = breakpoint === 'small';
  const isLargePhone = breakpoint === 'large';
  const isTablet = breakpoint === 'tablet';

  /**
   * Responsive spacing - scales value based on screen width
   * @param value - Base spacing value in pixels
   * @returns Scaled spacing value
   */
  const rs = useCallback((value: number): number => {
    return Math.round(value * scaleFactor);
  }, [scaleFactor]);

  /**
   * Responsive font - scales font size with minimum floor
   * @param baseValue - Base font size in pixels
   * @returns Scaled font size (minimum 12px for accessibility)
   */
  const rf = useCallback((baseValue: number): number => {
    const scaled = baseValue * scaleFactor;
    // Ensure minimum 12px for accessibility
    return Math.round(Math.max(scaled, 12));
  }, [scaleFactor]);

  /**
   * Responsive width - calculates actual width for grid items
   * Accounts for screen padding and gaps between columns
   *
   * @param percentage - Desired width as percentage (e.g., 50 for 50%)
   * @param gap - Gap between columns in pixels (default: 0)
   * @param columns - Number of columns (default: 1)
   * @returns Calculated pixel width
   */
  const rw = useCallback((
    percentage: number,
    gap: number = 0,
    columns: number = 1
  ): number => {
    const screenPadding = rs(layout.screenPadding);
    const availableWidth = width - (screenPadding * 2);
    const totalGaps = gap * (columns - 1);
    const widthForColumns = availableWidth - totalGaps;
    return Math.floor((widthForColumns * percentage) / 100);
  }, [width, rs]);

  return {
    width,
    height,
    breakpoint,
    scaleFactor,
    isSmallPhone,
    isLargePhone,
    isTablet,
    safeAreaInsets,
    rs,
    rf,
    rw,
  };
}
