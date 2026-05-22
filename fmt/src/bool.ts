import { palette } from '@epdoc/colors';
import { rgb24 } from '@std/fmt/colors';

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
  bold?: boolean;
  dim?: boolean;
}

/**
 * Predefined boolean display styles for table columns.
 * Each preset specifies distinct characters for true/false values along with their colors.
 * All presets use different characters to ensure compatibility with no-color mode rendering.
 */
export const BOOL_PRESETS = {
  check: { trueChar: '✓', falseChar: '✗', trueColor: palette.green, falseColor: palette.red } as BoolFormatterOptions,
  checkBold: {
    trueChar: '✔',
    falseChar: '✖',
    trueColor: palette.green,
    falseColor: palette.red,
  } as BoolFormatterOptions,
  circle: {
    trueChar: '●',
    falseChar: '○',
    trueColor: palette.green,
    falseColor: palette.slate,
  } as BoolFormatterOptions,
  circleRed: {
    trueChar: '●',
    falseChar: '●',
    trueColor: palette.green,
    falseColor: palette.red,
  } as BoolFormatterOptions,
  circleOpenRed: {
    trueChar: '●',
    falseChar: '○',
    trueColor: palette.green,
    falseColor: palette.red,
  } as BoolFormatterOptions,
  circleDot: {
    trueChar: '●',
    falseChar: '‧',
    trueColor: palette.green,
    falseColor: palette.slate,
  } as BoolFormatterOptions,
  yesno: {
    trueChar: 'yes',
    falseChar: 'no',
    trueColor: palette.green,
    falseColor: palette.red,
  } as BoolFormatterOptions,
  truefalse: {
    trueChar: 'true',
    falseChar: 'false',
    trueColor: 0x51d67c,
    falseColor: 0xef5867,
  } as BoolFormatterOptions,
  square: { trueChar: '■', falseChar: '□', trueColor: 0x51d67c, falseColor: 0xef5867 } as BoolFormatterOptions,
  arrow: { trueChar: '▲', falseChar: '▼', trueColor: 0x51d67c, falseColor: 0xef5867 } as BoolFormatterOptions,
  toggle: { trueChar: 'ON', falseChar: 'OFF', trueColor: 0x51d67c, falseColor: 0xef5867 } as BoolFormatterOptions,
} as const;

/**
 * Inferred preset name type from {@link BOOL_PRESETS}.
 */
export type BoolPresetName = keyof typeof BOOL_PRESETS;

/**
 * Factory function that creates a boolean formatter.
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
export function bool(options?: BoolPresetName | BoolFormatterOptions): (value: unknown) => string {
  // 1. Resolve configuration immediately during initialization
  let config: BoolFormatterOptions;

  if (typeof options === 'string') {
    config = BOOL_PRESETS[options] || BOOL_PRESETS.check;
  } else if (options) {
    config = { ...BOOL_PRESETS.check, ...options };
  } else {
    config = BOOL_PRESETS.check;
  }

  // 2. Extract final values once
  const trueChar = config.trueChar ?? '✓';
  const falseChar = config.falseChar ?? '✗';
  const { trueColor, falseColor } = config;

  // 3. The returned closure now has zero configuration overhead
  return (value: unknown): string => {
    const isTrue = Boolean(value);
    const char = isTrue ? trueChar : falseChar;
    const color = isTrue ? trueColor : falseColor;

    return color !== undefined ? rgb24(char, color) : char;
  };
}
