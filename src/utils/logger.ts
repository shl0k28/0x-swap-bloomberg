/**
 * Structured logger used across the app without noisy production console output.
 */
export const logger = {
  info(event: string, details?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${event}`, details ?? {});
    }
  },
  warn(event: string, details?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${event}`, details ?? {});
    }
  },
  error(event: string, details?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${event}`, details ?? {});
    }
  },
};
