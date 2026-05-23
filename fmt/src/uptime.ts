import { Duration } from '@epdoc/duration';
import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

/**
 * Options for configuring the uptime/duration formatter.
 */
export interface UptimeOptions {
  /** Separator between value and unit (default: '') */
  separator?: string;
  /** Optional hex color for unit suffixes (e.g., 0x888888) */
  unitColor?: number;
  /** Number of time units to display (default: 3) */
  units?: Integer;
}

/**
 * Factory function that creates an uptime/duration formatter.
 * Formats seconds elapsed into compact narrow format using @epdoc/duration.
 *
 * @param options - Formatting options
 * @returns A formatter function: `(seconds: unknown) => string`
 *
 * @example
 * ```ts
 * uptime()(3661);                    // "1h01m01s"
 * uptime({ separator: ' ' })(3661);  // "1 h 01 m 01 s"
 * uptime({ units: 2 })(2700090);     // "31d06h"
 * ```
 */
export function uptime(options?: UptimeOptions): (seconds: unknown) => string {
  const opts: UptimeOptions = { separator: '', units: 3, ...options };
  const separator = opts.separator ?? '';
  const units = opts.units ?? 3;

  return (value: unknown): string => {
    const seconds = Number(value);
    if (isNaN(seconds)) return String(value ?? '');

    const formatted = new Duration.Formatter().narrow.adaptive(units).format(seconds * 1000);

    if (separator === '' && !opts.unitColor) {
      return formatted;
    }

    const parts = formatted.match(/(\d+)([a-z]+)/gi) || [];
    if (parts.length === 0) return formatted;

    return parts.map((part) => {
      const match = part.match(/^(\d+)([a-z]+)$/i);
      if (!match) return part;

      const [, value, unit] = match;
      const styledUnit = opts.unitColor ? rgb24(unit, opts.unitColor) : unit;
      return `${value}${separator}${styledUnit}`;
    }).join(separator);
  };
}
