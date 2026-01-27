/**
 * ScreenErrorBoundary Component
 * A convenience wrapper that automatically uses current theme and language.
 * Use this for wrapping screens/major components.
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

export function ScreenErrorBoundary({
  children,
  screenName,
  fallbackTitle,
  fallbackHint,
  onReset,
  onGoBack,
}: ScreenErrorBoundaryProps) {
  const systemScheme = useColorScheme();
  const themeSetting = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);

  // Determine effective color scheme
  const colorScheme: ColorScheme =
    themeSetting === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeSetting;

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
