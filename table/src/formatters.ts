import { Duration } from '@epdoc/duration';
import type { Integer } from '@epdoc/type';

/**
 * Factory function that creates a percentage formatter for table columns.
 *
 * @param decimals - Number of decimal places (default: 2)
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * const columns = [
 *   { key: 'cpu', header: 'CPU%', formatter: formatters.percent(2) }
 * ];
 * ```
 */
function percent(decimals: Integer = 2): (value: unknown) => string {
  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const percent = num * 100;
    if (percent < 0.01 && percent > 0) {
      return '<0.01%';
    }
    return `${percent.toFixed(decimals)}%`;
  };
}

/**
 * Factory function that creates a bytes formatter for table columns.
 * Formats bytes into human-readable format using binary units (GiB, MiB, etc).
 *
 * @param decimals - Number of decimal places (default: 1)
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * const columns = [
 *   { key: 'memory', header: 'MEMORY', formatter: formatters.bytes(1) }
 * ];
 * ```
 */
function bytes(decimals: Integer = 1): (value: unknown) => string {
  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');
    if (num === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

    const i = Math.floor(Math.log(num) / Math.log(k));
    const val = num / Math.pow(k, i);

    return `${val.toFixed(dm)} ${sizes[i]}`;
  };
}

/**
 * Factory function that creates an uptime/duration formatter for table columns.
 * Formats seconds into human-readable duration using @epdoc/duration.
 *
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * const columns = [
 *   { key: 'uptime', header: 'UPTIME', formatter: formatters.uptime() }
 * ];
 * // Output examples: "31d06h21m", "1h01m", "45s"
 * ```
 */
function uptime(): (value: unknown) => string {
  return (value: unknown): string => {
    const seconds = Number(value);
    if (isNaN(seconds)) return String(value ?? '');

    return new Duration.Formatter().narrow.adaptive(3).format(seconds * 1000);
  };
}

/**
 * Collection of formatter factory functions for common table column data types.
 *
 * Each formatter is a factory function that returns a Column-compatible
 * formatter: `(value: unknown) => string`.
 */
export const formatters = {
  percent,
  bytes,
  uptime,
};
