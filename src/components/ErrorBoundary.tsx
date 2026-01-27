/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays a fallback UI.
 * 
 * LIMITATIONS (be aware):
 * - Does NOT catch: event handlers, async code, native crashes, SQLite errors
 * - "Try Again" only works if the error was transient (rare)
 * - Consider adding Sentry/Bugsnag for production error tracking
 * 
 * @example
 * <ErrorBoundary fallbackTitle="Kantik pa chaje" onReset={() => router.back()}>
 *   <HymnReader hymnNumber={42} />
 * </ErrorBoundary>
 */

import React, { Component, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors, ColorScheme } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error log storage key
const ERROR_LOG_KEY = 'lafwa-error-log';
const MAX_ERROR_LOGS = 20;

interface ErrorLogEntry {
  timestamp: string;
  componentStack?: string;
  error: string;
  screen?: string;
}

// Translations for error messages
const translations = {
  ht: {
    defaultTitle: 'Yon bagay pa mache',
    defaultHint: 'Nou regrèt sa. Tanpri eseye ankò.',
    tryAgain: 'Eseye Ankò',
    goBack: 'Retounen',
    showDetails: 'Montre detay',
    hideDetails: 'Kache detay',
  },
  fr: {
    defaultTitle: 'Quelque chose s\'est mal passé',
    defaultHint: 'Nous sommes désolés. Veuillez réessayer.',
    tryAgain: 'Réessayer',
    goBack: 'Retour',
    showDetails: 'Afficher les détails',
    hideDetails: 'Masquer les détails',
  },
  en: {
    defaultTitle: 'Something went wrong',
    defaultHint: 'We\'re sorry. Please try again.',
    tryAgain: 'Try Again',
    goBack: 'Go Back',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
  },
};

type Language = 'ht' | 'fr' | 'en';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom title to show on error */
  fallbackTitle?: string;
  /** Custom hint text */
  fallbackHint?: string;
  /** Called when user taps "Try Again" - defaults to resetting error state */
  onReset?: () => void;
  /** Called when user taps "Go Back" - if not provided, button is hidden */
  onGoBack?: () => void;
  /** Current language for translations */
  language?: Language;
  /** Current color scheme */
  colorScheme?: ColorScheme;
  /** Identifier for error logging (e.g., "BibleReader", "HymnReader") */
  screenName?: string;
  /** Show technical details in dev mode */
  showDetailsInDev?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    this.logError(error, errorInfo);

    // In development, also log to console
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    try {
      const entry: ErrorLogEntry = {
        timestamp: new Date().toISOString(),
        error: `${error.name}: ${error.message}`,
        componentStack: errorInfo.componentStack || undefined,
        screen: this.props.screenName,
      };

      // Get existing logs
      const existingLogs = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs: ErrorLogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];

      // Add new entry, keep only recent ones
      logs.unshift(entry);
      const trimmedLogs = logs.slice(0, MAX_ERROR_LOGS);

      // Save back
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
    } catch (logError) {
      // Don't crash while logging errors
      if (__DEV__) {
        console.warn('Failed to log error:', logError);
      }
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const {
      children,
      fallbackTitle,
      fallbackHint,
      onGoBack,
      language = 'ht',
      colorScheme = 'light',
      showDetailsInDev = true,
    } = this.props;

    const { hasError, error, errorInfo, showDetails } = this.state;

    if (!hasError) {
      return children;
    }

    const colors = getThemeColors(colorScheme);
    const t = translations[language];
    const isDev = __DEV__;

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHover }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {fallbackTitle || t.defaultTitle}
        </Text>

        {/* Hint */}
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {fallbackHint || t.defaultHint}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={this.handleReset}
            accessibilityLabel={t.tryAgain}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={18} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t.tryAgain}</Text>
          </TouchableOpacity>

          {onGoBack && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onGoBack}
              accessibilityLabel={t.goBack}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {t.goBack}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dev Details Toggle */}
        {isDev && showDetailsInDev && error && (
          <View style={styles.devSection}>
            <TouchableOpacity
              onPress={this.toggleDetails}
              style={styles.detailsToggle}
              accessibilityLabel={showDetails ? t.hideDetails : t.showDetails}
            >
              <Text style={[styles.detailsToggleText, { color: colors.textTertiary }]}>
                {showDetails ? t.hideDetails : t.showDetails}
              </Text>
              <Ionicons
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            {showDetails && (
              <ScrollView
                style={[styles.detailsContainer, { backgroundColor: colors.surfaceHover }]}
                contentContainerStyle={styles.detailsContent}
              >
                <Text style={[styles.errorName, { color: colors.text }]}>
                  {error.name}: {error.message}
                </Text>
                {errorInfo?.componentStack && (
                  <Text style={[styles.stackTrace, { color: colors.textTertiary }]}>
                    {errorInfo.componentStack.trim()}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  }
}

/**
 * Helper to retrieve error logs for debugging
 * Usage: const logs = await getErrorLogs();
 */
export async function getErrorLogs(): Promise<ErrorLogEntry[]> {
  try {
    const logs = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to clear error logs
 */
export async function clearErrorLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
  } catch {
    // Ignore
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  devSection: {
    marginTop: 32,
    width: '100%',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  detailsToggleText: {
    fontSize: 12,
  },
  detailsContainer: {
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 200,
  },
  detailsContent: {
    padding: 12,
  },
  errorName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
});

export default ErrorBoundary;
