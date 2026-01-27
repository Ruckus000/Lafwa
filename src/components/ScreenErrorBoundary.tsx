/**
 * ScreenErrorBoundary Component
 * A convenience wrapper that automatically uses current theme and language.
 * Use this for wrapping screens/major components.
 * 
 * SAFETY: This component uses defensive hook access with hardcoded fallbacks.
 * If useSettingsStore or useColorScheme fail (e.g., during Zustand hydration
 * race conditions or corrupt AsyncStorage), we fall back to safe defaults
 * rather than crashing the error boundary itself.
 * 
 * @example
 * // In a screen component:
 * <ScreenErrorBoundary screenName="BibleReader" onGoBack={() => router.back()}>
 *   <BibleReader {...props} />
 * </ScreenErrorBoundary>
 */

import React, { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { useSettingsStore } from '../stores/settingsStore';
import { ColorScheme } from '../theme/colors';

// Hardcoded fallbacks - these MUST work even if all stores/hooks fail
const FALLBACK_LANGUAGE = 'ht' as const;
const FALLBACK_THEME = 'light' as const;
const FALLBACK_COLOR_SCHEME: ColorScheme = 'light';

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  /** Identifier for error logging */
  screenName?: string;
  /** Custom error title */
  fallbackTitle?: string;
  /** Custom error hint */
  fallbackHint?: string;
  /** Called when user taps "Try Again" */
  onReset?: () => void;
  /** Called when user taps "Go Back" */
  onGoBack?: () => void;
}

/**
 * Safe hook accessor - returns fallback if hook throws
 */
function useSafeSettingsStore<T>(selector: (state: any) => T, fallback: T): T {
  try {
    return useSettingsStore(selector);
  } catch (e) {
    if (__DEV__) {
      console.warn('[ScreenErrorBoundary] useSettingsStore failed, using fallback:', e);
    }
    return fallback;
  }
}

export function ScreenErrorBoundary({
  children,
  screenName,
  fallbackTitle,
  fallbackHint,
  onReset,
  onGoBack,
}: ScreenErrorBoundaryProps) {
  // Defensive hook access with fallbacks
  let systemScheme: 'light' | 'dark' | null | undefined;
  try {
    systemScheme = useColorScheme();
  } catch (e) {
    if (__DEV__) {
      console.warn('[ScreenErrorBoundary] useColorScheme failed:', e);
    }
    systemScheme = null;
  }

  const themeSetting = useSafeSettingsStore((state) => state.theme, FALLBACK_THEME);
  const language = useSafeSettingsStore((state) => state.language, FALLBACK_LANGUAGE);

  // Determine effective color scheme with defensive fallback
  let colorScheme: ColorScheme;
  try {
    if (themeSetting === 'system') {
      colorScheme = systemScheme === 'dark' ? 'dark' : 'light';
    } else if (themeSetting === 'dark' || themeSetting === 'light' || themeSetting === 'sepia') {
      colorScheme = themeSetting;
    } else {
      colorScheme = FALLBACK_COLOR_SCHEME;
    }
  } catch {
    colorScheme = FALLBACK_COLOR_SCHEME;
  }

  return (
    <ErrorBoundary
      language={language}
      colorScheme={colorScheme}
      screenName={screenName}
      fallbackTitle={fallbackTitle}
      fallbackHint={fallbackHint}
      onReset={onReset}
      onGoBack={onGoBack}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ScreenErrorBoundary;
