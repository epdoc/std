import { Duration } from '@epdoc/duration';
import type { Integer } from '@epdoc/type';
import { rgb24 } from '@std/fmt/colors';

/**
 * Options for percentage formatter.
 */
export interface PercentOptions {
  /** Number of decimal places (default: 2) */
  decimals?: Integer;
  /** Separator between value and unit (default: ' ') */
  separator?: string;
  /** Optional color for unit as hex number (e.g., 0x888888) */
  unitColor?: number;
}

/**
 * Options for bytes formatter.
 */
export interface BytesOptions {
  /** Number of decimal places (default: 1) */
  decimals?: Integer;
  /** Separator between value and unit (default: ' ') */
  separator?: string;
  /** Optional color for unit as hex number (e.g., 0x888888) */
  unitColor?: number;
}

/**
 * Options for uptime formatter.
 */

/**
 * Options for boolean formatter.
 */
export interface BoolFormatterOptions {
  /** Character or string to display for truthy values. Default: '✓' */
  trueChar?: string;
  /** Character or string to display for falsy values. Default: '✗' */
  falseChar?: string;
  /** Hex color for truthy values. Default: 0x51d67c (green) */
  trueColor?: number;
  /** Hex color for falsy values. Default: 0xef5867 (red) */
  falseColor?: number;
}

/**
 * Preset boolean style configurations.
 * Each entry defines true/false display characters and default colors.
 */
export const BOOL_PRESETS = {
  check: { trueChar: '✓', falseChar: '✗', trueColor: 0x51d67c, falseColor: 0xef5867 },
  checkBold: { trueChar: '✔', falseChar: '✖', trueColor: 0x51d67c, falseColor: 0xef5867 },
  circle: { trueChar: '●', falseChar: '○', trueColor: 0x51d67c, falseColor: 0xef5867 },
  circleDot: { trueChar: '●', falseChar: '‧', trueColor: 0x51d67c, falseColor: 0xef5867 },
  yesno: { trueChar: 'yes', falseChar: 'no', trueColor: 0x51d67c, falseColor: 0xef5867 },
  truefalse: { trueChar: 'true', falseChar: 'false', trueColor: 0x51d67c, falseColor: 0xef5867 },
} as const;

/**
 * Inferred preset name type from {@link BOOL_PRESETS}.
 */
export type BoolPresetName = keyof typeof BOOL_PRESETS;

/**
 * Options for uptime formatter.
 */
export interface UptimeOptions {
  /** Separator between value and unit (default: '') */
  separator?: string;
  /** Optional color for unit as hex number (e.g., 0x888888) */
  unitColor?: number;
  /** Number of time units to display (default: 3) */
  units?: Integer;
}

/**
 * Factory function that creates a percentage formatter for table columns.
 *
 * @param options - Formatting options or number of decimals for backward compatibility
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * // Default: space separation
 * formatter: formatters.percent(2)  // "45.2 %"
 *
 * // No space
 * formatter: formatters.percent({ decimals: 2, separator: '' })  // "45.2%"
 *
 * // With colored unit
 * formatter: formatters.percent({ decimals: 2, unitColor: 0x888888 })  // "45.2 %"
 * ```
 */
function percent(options?: PercentOptions | Integer): (ratio: unknown) => string {
  // Handle backward compatibility: number argument
  const opts: PercentOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 2, separator: ' ', ...options };

  const decimals = opts.decimals ?? 2;
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const unit = opts.unitColor ? rgb24('%', opts.unitColor) : '%';
    const percent = num * 100;
    if (percent < 0.01 && percent > 0) {
      return `<0.01${separator}${unit}`;
    }

    return `${percent.toFixed(decimals)}${separator}${unit}`;
  };
}

/**
 * Factory function that creates a bytes formatter for table columns.
 * Formats bytes into human-readable format using binary units (GiB, MiB, etc).
 *
 * @param options - Formatting options or number of decimals for backward compatibility
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * // Default: space separation
 * formatter: formatters.bytes(1)  // "45.2 MiB"
 *
 * // No space
 * formatter: formatters.bytes({ decimals: 1, separator: '' })  // "45.2MiB"
 *
 * // With colored unit
 * formatter: formatters.bytes({ decimals: 1, unitColor: 0x888888 })  // "45.2 MiB"
 * ```
 */
function bytes(options?: BytesOptions | Integer): (bytes: unknown) => string {
  // Handle backward compatibility: number argument
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

/**
 * Factory function that creates an uptime/duration formatter for table columns.
 * Formats seconds into human-readable duration using @epdoc/duration.
 *
 * @param options - Formatting options
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * // Default: no space separation (Duration.Formatter handles formatting)
 * formatter: formatters.uptime()  // "31d06h21m"
 *
 * // With space separation
 * formatter: formatters.uptime({ separator: ' ' })  // "31d 06h 21m"
 *
 * // With colored units
 * formatter: formatters.uptime({ unitColor: 0x888888 })  // "31d06h21m" (units colored)
 *
 * // Custom number of units
 * formatter: formatters.uptime({ units: 2 })  // "31d06h" (only 2 units)
 * ```
 */
function uptime(options?: UptimeOptions): (seconds: unknown) => string {
  const opts: UptimeOptions = { separator: '', units: 3, ...options };
  const separator = opts.separator ?? '';
  const units = opts.units ?? 3;

  return (value: unknown): string => {
    const seconds = Number(value);
    if (isNaN(seconds)) return String(value ?? '');

    const formatted = new Duration.Formatter().narrow.adaptive(units).format(seconds * 1000);

    // If no separator and no color, return as-is
    if (separator === '' && !opts.unitColor) {
      return formatted;
    }

    // Parse the formatted string and apply separator/color
    // Duration.Formatter().narrow outputs like "31d06h21m"
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

/**
 * Factory function that creates a boolean formatter for table columns.
 * Renders boolean values as styled characters or text with configurable presets.
 *
 * @param options - Preset name from {@link BOOL_PRESETS} or custom configuration
 * @returns A formatter function compatible with Column.formatter
 *
 * @example
 * ```ts
 * // Default check preset with green/red coloring
 * formatter: formatters.bool()  // "✓" / "✗"
 *
 * // Preset name
 * formatter: formatters.bool('circleDot')  // "●" / "‧"
 *
 * // Custom configuration
 * formatter: formatters.bool({ trueChar: 'YES', falseChar: 'no', trueColor: 0x00ff00 })
 * ```
 */
function bool(options?: BoolPresetName | BoolFormatterOptions): (value: unknown) => string {
  const defaults: BoolFormatterOptions = { trueChar: '✓', falseChar: '✗', trueColor: 0x51d67c, falseColor: 0xef5867 };
  let config: BoolFormatterOptions;

  if (typeof options === 'string') {
    config = { ...BOOL_PRESETS[options] };
  } else if (options) {
    config = { ...defaults, ...options };
  } else {
    config = { ...defaults };
  }

  const trueChar = config.trueChar ?? '✓';
  const falseChar = config.falseChar ?? '✗';
  const trueColor = config.trueColor;
  const falseColor = config.falseColor;

  return (value: unknown): string => {
    const isTrue = Boolean(value);
    const char = isTrue ? trueChar : falseChar;
    const color = isTrue ? trueColor : falseColor;
    if (color !== undefined) {
      return rgb24(char, color);
    }
    return char;
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
  bool,
};
