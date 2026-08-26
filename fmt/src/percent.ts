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

  const decimals = Math.min(Math.max(opts.decimals ?? 2, 0), 100);
  const separator = opts.separator ?? ' ';
  const minPct = Math.pow(10, -decimals);

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const pct = num * 100;
    const unit = opts.unitColor ? rgb24('%', opts.unitColor) : '%';
    const absPct = Math.abs(pct);
    if (absPct > 0 && absPct < minPct) {
      return pct > 0 ? `<${minPct}${separator}${unit}` : `>-${minPct}${separator}${unit}`;
    }

    return `${pct.toFixed(decimals)}${separator}${unit}`;
  };
}
