/**
 * Global Error Handler Setup
 * Catches errors that ErrorBoundary misses:
 * - Async errors (promises, setTimeout)
 * - Event handler errors
 * - Native module errors
 * 
 * Call setupGlobalErrorHandler() once at app startup.
 * 
 * In production, these errors are logged to AsyncStorage.
 * In development, they're also logged to console.
 * 
 * Consider integrating Sentry/Bugsnag for production monitoring.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GLOBAL_ERROR_LOG_KEY = 'lafwa-global-error-log';
const MAX_GLOBAL_ERROR_LOGS = 50;

interface GlobalErrorLogEntry {
  timestamp: string;
  type: 'unhandled-promise' | 'global-error' | 'unknown';
  error: string;
  stack?: string;
  isFatal?: boolean;
}

/**
 * Log error to AsyncStorage
 */
async function logGlobalError(entry: GlobalErrorLogEntry): Promise<void> {
  try {
    const existingLogs = await AsyncStorage.getItem(GLOBAL_ERROR_LOG_KEY);
    const logs: GlobalErrorLogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];

    logs.unshift(entry);
    const trimmedLogs = logs.slice(0, MAX_GLOBAL_ERROR_LOGS);

    await AsyncStorage.setItem(GLOBAL_ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
  } catch {
    // Silently fail - we don't want error logging to cause more errors
  }
}

/**
 * Sets up global error handlers for React Native
 * Should be called once at app initialization
 */
export function setupGlobalErrorHandler(): void {
  // Get reference to the original error handler
  const originalHandler = ErrorUtils.getGlobalHandler();

  // Set custom global error handler
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const entry: GlobalErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'global-error',
      error: `${error.name}: ${error.message}`,
      stack: error.stack,
      isFatal,
    };

    // Log to AsyncStorage
    logGlobalError(entry);

    // In dev, also log to console
    if (__DEV__) {
      console.error(`[GlobalErrorHandler] ${isFatal ? 'FATAL' : 'Non-fatal'} error:`, error);
    }

    // Call original handler to preserve default behavior
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  // Note: This is a polyfill pattern since React Native's handling varies
  const originalRejectionHandler = (global as any).onunhandledrejection;

  (global as any).onunhandledrejection = (event: { reason: any }) => {
    const reason = event?.reason;
    const errorMessage =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : String(reason);

    const entry: GlobalErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'unhandled-promise',
      error: errorMessage,
      stack: reason instanceof Error ? reason.stack : undefined,
    };

    logGlobalError(entry);

    if (__DEV__) {
      console.warn('[GlobalErrorHandler] Unhandled promise rejection:', reason);
    }

    if (originalRejectionHandler) {
      originalRejectionHandler(event);
    }
  };
}

/**
 * Retrieve all global error logs
 */
export async function getGlobalErrorLogs(): Promise<GlobalErrorLogEntry[]> {
  try {
    const logs = await AsyncStorage.getItem(GLOBAL_ERROR_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all global error logs
 */
export async function clearGlobalErrorLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GLOBAL_ERROR_LOG_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get combined error logs (ErrorBoundary + Global)
 * Useful for debugging screens
 */
export async function getAllErrorLogs(): Promise<{
  boundaryErrors: any[];
  globalErrors: GlobalErrorLogEntry[];
}> {
  const { getErrorLogs } = await import('../components/ErrorBoundary');
  const [boundaryErrors, globalErrors] = await Promise.all([
    getErrorLogs(),
    getGlobalErrorLogs(),
  ]);
  return { boundaryErrors, globalErrors };
}
