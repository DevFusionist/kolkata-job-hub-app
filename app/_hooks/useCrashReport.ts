import { useCallback } from "react";

/**
 * Crash/error reporting hook. Logs to console in __DEV__; can be wired to
 * a backend or analytics service (e.g. Sentry, Firebase Crashlytics) later.
 */
export function useCrashReport() {
  const reportError = useCallback((error: Error, context?: Record<string, unknown>) => {
    if (__DEV__) {
      console.error("[CrashReport]", error.message, error.stack, context);
    }
    // TODO: send to backend or analytics when available
    // e.g. await analyticsService.captureException(error, context);
  }, []);

  return { reportError };
}
