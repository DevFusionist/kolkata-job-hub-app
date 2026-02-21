import { format } from 'date-fns';

/**
 * Format a timestamp for display. Returns fallback if the value is missing or invalid.
 */
export function safeFormatDate(
  value: string | number | Date | null | undefined,
  formatStr: string,
  fallback = '--'
): string {
  if (value == null || value === '') return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : format(d, formatStr);
}
