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
export function bytes(options?: BytesOptions | Integer): (bytes: unknown) => string {
  const opts: BytesOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 1, separator: ' ', ...options };

  const decimals = opts.decimals ?? 1;
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');
    if (num === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

    const i = Math.floor(Math.log(num) / Math.log(k));
    const val = num / Math.pow(k, i);

    const unit = opts.unitColor ? rgb24(sizes[i], opts.unitColor) : sizes[i];
    return `${val.toFixed(dm)}${separator}${unit}`;
  };
}
