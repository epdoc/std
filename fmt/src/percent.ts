import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

/**
 * Options for configuring the percentage formatter.
 */
export interface PercentOptions {
  /** Number of decimal places (default: 2) */
  decimals?: Integer;
  /** Separator between value and percent sign (default: ' ') */
  separator?: string;
  /** Optional hex color for the percent sign (e.g., 0x888888) */
  unitColor?: number;
}

/**
 * Factory function that creates a percentage formatter.
 * Converts a ratio (0..1) to a percentage string.
 *
 * @param options - Formatting options or number of decimals for backward compat
 * @returns A formatter function: `(ratio: unknown) => string`
 *
 * @example
 * ```ts
 * percent()(0.5);                    // "50.00 %"
 * percent({ decimals: 0 })(0.5);     // "50 %"
 * percent({ separator: '' })(0.5);   // "50.00%"
 * ```
 */
export function percent(options?: PercentOptions | Integer): (ratio: unknown) => string {
  const opts: PercentOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 2, separator: ' ', ...options };

  const decimals = opts.decimals ?? 2;
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const unit = opts.unitColor ? rgb24('%', opts.unitColor) : '%';
    const pct = num * 100;
    if (pct < 0.01 && pct > 0) {
      return `<0.01${separator}${unit}`;
    }

    return `${pct.toFixed(decimals)}${separator}${unit}`;
  };
}
