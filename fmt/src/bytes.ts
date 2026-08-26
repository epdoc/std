import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

/**
 * Options for configuring the byte-size formatter.
 */
export interface BytesOptions {
  /** Number of decimal places (default: 1) */
  decimals?: Integer;
  /** Separator between value and unit (default: ' ') */
  separator?: string;
  /** Optional hex color for the unit suffix (e.g., 0x888888) */
  unitColor?: number;
}

/**
 * Factory function that creates a byte-size formatter.
 * Formats byte values into human-readable binary units (B, KiB, MiB, GiB, etc.).
 *
 * @param options - Formatting options or number of decimals for backward compat
 * @returns A formatter function: `(bytes: unknown) => string`
 *
 * @example
 * ```ts
 * bytes()(1048576);               // "1.0 MiB"
 * bytes({ decimals: 0 })(1536);   // "2 KiB"
 * bytes({ separator: '' })(500);  // "500B"
 * ```
 */
const SIZES = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

export function bytes(options?: BytesOptions | Integer): (bytes: unknown) => string {
  const opts: BytesOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 1, separator: ' ', ...options };

  const decimals = Math.min(Math.max(opts.decimals ?? 1, 0), 100);
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    if (abs === 0) {
      const unit = opts.unitColor ? rgb24(SIZES[0], opts.unitColor) : SIZES[0];
      return `0${separator}${unit}`;
    }

    let i = 0;
    let scaled = abs;
    while (scaled >= 1024 && i < SIZES.length - 1) {
      scaled /= 1024;
      i++;
    }
    const val = abs / Math.pow(1024, i);

    const unit = opts.unitColor ? rgb24(SIZES[i], opts.unitColor) : SIZES[i];
    return `${sign}${val.toFixed(decimals)}${separator}${unit}`;
  };
}
