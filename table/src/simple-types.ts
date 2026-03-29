import type { ColorSpec, StyleFn } from './types.ts';

/**
 * Named colors from @std/fmt/colors that can be used in the simple API.
 */
export type StdColorName =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite';

/**
 * Color specification for the simple API.
 * Can be a named color from @std/fmt/colors, a hex number, a ColorSpec with bg/fg,
 * or a style function.
 */
export type SimpleColor = StdColorName | number | ColorSpec | StyleFn;

/**
 * Format types available in the simple API.
 */
export type SimpleFormat = 'bytes' | 'percent' | 'uptime' | 'checkmark' | 'datetime' | 'number' | 'string';

/**
 * Options for datetime formatting.
 */
export interface DatetimeOptions {
  /** Format pattern using @epdoc/datetime tokens (default: 'yyyy-MM-dd HH:mm:ss') */
  pattern?: string;
  /** Timezone for display: 'local' (default) or 'utc' */
  timezone?: 'local' | 'utc';
}

/**
 * Column configuration options for the simple API.
 */
export interface SimpleColumnOptions<T> {
  /** Text alignment within the column (default: 'left') */
  align?: 'left' | 'right' | 'center';
  /** Column header text (default: formatted from key) */
  header?: string;
  /**
   * Cell color or color function.
   * Can be a named color, hex number, or function returning a color.
   */
  color?: SimpleColor | ((value: unknown, row: T) => SimpleColor | undefined);
  /** Maximum visual width (truncates with ellipsis if exceeded) */
  maxWidth?: number;
  /**
   * Built-in formatter type.
   * - 'bytes': Human-readable bytes (KiB, MiB, GiB, etc.)
   * - 'percent': Percentage with % sign
   * - 'uptime': Duration in days/hours/minutes
   * - 'checkmark': Boolean to ✔/✘ with green/red colors
   * - 'datetime': Date/time with pattern support
   * - 'number': Number formatting
   * - 'string': Default string conversion
   */
  format?: SimpleFormat;
  /** Number of decimal places for 'percent' and 'bytes' formatters */
  decimals?: number;
  /** Separator between value and unit for 'percent', 'bytes', 'uptime' */
  separator?: string;
  /** Datetime-specific options when format is 'datetime' */
  datetime?: DatetimeOptions;
}

/**
 * Options for the table() factory function.
 */
export interface SimpleOptions<T> {
  /** Array of column keys to display (default: all keys from first data row) */
  columns?: (keyof T)[];
  /** Custom color palette for named colors */
  colors?: Record<string, number>;
  /** Whether to auto-format camelCase keys to Title Case headers (default: true) */
  formatHeaders?: boolean;
}

/**
 * Builder interface for constructing tables with a fluent API.
 */
export interface TableBuilder<T> {
  /**
   * Set which columns to display and their order.
   * @param keys Array of property keys from the data type
   */
  columns(keys: (keyof T)[]): this;

  /**
   * Configure a single column with alignment shorthand.
   * @param key Property key from the data type
   * @param align Text alignment for the column
   */
  column(key: keyof T, align: 'left' | 'right' | 'center'): this;

  /**
   * Configure a single column with full options.
   * @param key Property key from the data type
   * @param options Column configuration options
   */
  column(key: keyof T, options: SimpleColumnOptions<T>): this;

  /**
   * Set the header row color/style.
   * @param color Named color, hex number, or style function
   */
  header(color: SimpleColor): this;

  /**
   * Hide the header row entirely.
   */
  noHeader(): this;

  /**
   * Enable zebra striping with optional colors.
   * @param color1 Color for even rows (0, 2, 4...) - default: subtle gray
   * @param color2 Color for odd rows (1, 3, 5...) - default: none
   */
  zebra(color1?: SimpleColor, color2?: SimpleColor): this;

  /**
   * Disable zebra striping.
   */
  noZebra(): this;

  /**
   * Enable borders with optional style and color.
   * @param style Border style preset (default: 'light')
   * @param color Border color (default: gray)
   */
  borders(style?: 'light' | 'heavy' | 'double', color?: SimpleColor): this;

  /**
   * Disable borders.
   */
  noBorders(): this;

  /**
   * Set the border color.
   * @param color Named color or hex number
   */
  borderColor(color: SimpleColor): this;

  /**
   * Set padding between columns (ignored when borders are enabled).
   * @param spaces Number of spaces between columns
   */
  padding(spaces: number): this;

  /**
   * Disable all color output (useful for files or non-TTY).
   */
  noColor(): this;

  /**
   * Override the data rows.
   * @param rows Array of data objects
   */
  data(rows: T[]): this;

  /**
   * Render and print the table to console.
   */
  print(): void;

  /**
   * Render the table as a single string.
   * @returns Formatted table with newline separators
   */
  toString(): string;

  /**
   * Render the table as an array of lines.
   * @returns Array of formatted strings (one per line)
   */
  render(): string[];
}
