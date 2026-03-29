import {
  black,
  blue,
  bold,
  brightBlue,
  brightCyan,
  brightGreen,
  brightMagenta,
  brightRed,
  brightWhite,
  brightYellow,
  cyan,
  gray,
  green,
  magenta,
  red,
  rgb24,
  white,
  yellow,
} from '@std/fmt/colors';
import { formatters as builtinFormatters } from './formatters.ts';
import { TableRenderer } from './render.ts';
import type {
  DatetimeOptions,
  SimpleColor,
  SimpleColumnOptions,
  SimpleFormat,
  SimpleOptions,
  StdColorName,
  TableBuilder,
} from './simple-types.ts';
import type { BorderStyle, ColorType, Column, StyleFn } from './types.ts';

// Default colors for the simple API
const DEFAULT_COLORS: Record<string, number> = {
  cyan: 0x58d1eb,
  green: 0x51d67c,
  red: 0xef5867,
  amber: 0xffb020,
  gray: 0x888888,
  lightGray: 0xaaaaaa,
  darkGray: 0x666666,
};

// Zebra stripe background colors
const ZEBRA_EVEN_BG = 0x1a1a2e;
const _ZEBRA_ODD_BG = 0x16213e;

// Map of @std/fmt/colors functions
const STD_COLORS: Record<StdColorName, (s: string) => string> = {
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
};

/**
 * Resolves a SimpleColor to a ColorType (StyleFn, number, or ColorSpec).
 */
function resolveSimpleColor(color: SimpleColor, palette: Record<string, number>): ColorType {
  // If it's already a function, return it
  if (typeof color === 'function') {
    return color as StyleFn;
  }

  // If it's a number, return it (hex color)
  if (typeof color === 'number') {
    return color;
  }

  // If it's an object, it's a ColorSpec - return as-is
  if (typeof color === 'object' && color !== null) {
    return color as ColorType;
  }

  // If it's a named color from @std/fmt/colors, use that
  if (color in STD_COLORS) {
    return STD_COLORS[color as StdColorName];
  }

  // If it's a custom color from the palette, return the hex value
  if (color in palette) {
    return palette[color];
  }

  // Fallback to the color as-is (might be a hex string or other format)
  const hexValue = parseInt(color, 16);
  if (!isNaN(hexValue)) {
    return hexValue;
  }

  // Default to no styling
  return (s: string) => s;
}

/**
 * Converts a SimpleColor to a StyleFn for consistent application.
 */
function colorToStyleFn(color: SimpleColor, palette: Record<string, number>): StyleFn {
  const resolved = resolveSimpleColor(color, palette);

  if (typeof resolved === 'function') {
    return resolved;
  }

  if (typeof resolved === 'number') {
    return (s: string) => rgb24(s, resolved);
  }

  // ColorSpec object - apply both foreground and background
  return (s: string): string => {
    let result = s;
    // Import bgRgb24 dynamically to avoid circular dependency
    // Actually, we need to import it properly
    // For now, just apply foreground
    if ('fg' in resolved && resolved.fg !== undefined) {
      result = rgb24(result, resolved.fg as number);
    }
    return result;
  };
}

/**
 * Creates a color function that can be used in column definitions.
 */
function createColorFn<T>(
  color: SimpleColor | ((value: unknown, row: T) => SimpleColor | undefined),
  palette: Record<string, number>,
): (value: unknown, row: T) => ColorType | undefined {
  if (typeof color === 'function' && color.length === 2) {
    // It's a value/row callback
    return (value: unknown, row: T): ColorType | undefined => {
      const result = (color as (value: unknown, row: T) => SimpleColor | undefined)(value, row);
      if (result === undefined) return undefined;
      return resolveSimpleColor(result, palette);
    };
  }

  // It's a static color
  const resolved = resolveSimpleColor(color as SimpleColor, palette);
  return () => resolved;
}

/**
 * Formats a camelCase string to Title Case.
 * Example: 'userName' -> 'User Name', 'emailAddress' -> 'Email Address'
 */
function camelCaseToTitleCase(str: string): string {
  return str
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Trim leading space if string started with capital
    .trim()
    // Capitalize first letter
    .replace(/^./, (char) => char.toUpperCase());
}

/**
 * Creates a formatter function based on the format type.
 */
function createFormatter(
  format: SimpleFormat,
  decimals?: number,
  separator?: string,
  datetime?: DatetimeOptions,
): (value: unknown) => string {
  switch (format) {
    case 'bytes': {
      const opts = decimals !== undefined ? { decimals, separator } : { separator };
      return builtinFormatters.bytes(opts as { decimals?: number; separator?: string });
    }

    case 'percent': {
      const opts = decimals !== undefined ? { decimals, separator } : { separator };
      return builtinFormatters.percent(opts as { decimals?: number; separator?: string });
    }

    case 'uptime': {
      const opts = { separator, units: 3 };
      return builtinFormatters.uptime(opts);
    }

    case 'checkmark': {
      const green = 0x51d67c;
      const red = 0xef5867;
      return (value: unknown): string => {
        const isTrue = Boolean(value);
        const checkmark = isTrue ? '✔' : '✘';
        // Return with ANSI color codes
        return rgb24(checkmark, isTrue ? green : red);
      };
    }

    case 'datetime': {
      return (value: unknown): string => {
        if (value === null || value === undefined) return '';

        // Parse the input value to a Date
        let date: Date;
        if (value instanceof Date) {
          date = value;
        } else if (typeof value === 'number') {
          // Assume epoch milliseconds if large, seconds if small
          date = new Date(value > 10000000000 ? value : value * 1000);
        } else if (typeof value === 'string') {
          date = new Date(value);
        } else {
          return String(value);
        }

        if (isNaN(date.getTime())) {
          return String(value);
        }

        // Get datetime options
        const pattern = datetime?.pattern ?? 'yyyy-MM-dd HH:mm:ss';
        const timezone = datetime?.timezone ?? 'local';

        // Format using @epdoc/datetime pattern format
        // For now, implement basic formatting here
        // TODO: Integrate with @epdoc/datetime when available
        const d = timezone === 'utc' ? new Date(date.toISOString()) : date;
        const utc = timezone === 'utc';

        return formatDateTime(d, pattern, utc);
      };
    }

    case 'number': {
      return (value: unknown): string => {
        if (typeof value === 'number') {
          return decimals !== undefined ? value.toFixed(decimals) : String(value);
        }
        return String(value ?? '');
      };
    }

    case 'string':
    default: {
      return (value: unknown): string => String(value ?? '');
    }
  }
}

/**
 * Formats a date according to a pattern string.
 * Supports common datetime format tokens.
 */
function formatDateTime(date: Date, pattern: string, utc: boolean): string {
  const pad2 = (n: number): string => n.toString().padStart(2, '0');

  // Get date components
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() : date.getMonth();
  const day = utc ? date.getUTCDate() : date.getDate();
  const hours = utc ? date.getUTCHours() : date.getHours();
  const minutes = utc ? date.getUTCMinutes() : date.getMinutes();
  const seconds = utc ? date.getUTCSeconds() : date.getSeconds();
  const milliseconds = utc ? date.getUTCMilliseconds() : date.getMilliseconds();

  // Day of week for EEE/EEEE
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayNarrow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Months for MMM/MMMM
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 12-hour format helpers
  const hours12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';

  // Replace tokens
  return pattern
    .replace(/yyyy/g, year.toString())
    .replace(/yy/g, (year % 100).toString().padStart(2, '0'))
    .replace(/MMMM/g, months[month])
    .replace(/MMM/g, monthsShort[month])
    .replace(/MM/g, pad2(month + 1))
    .replace(/M(?!a)/g, (month + 1).toString())
    .replace(/EEEE/g, weekdays[utc ? date.getUTCDay() : date.getDay()])
    .replace(/EEE/g, weekdayShort[utc ? date.getUTCDay() : date.getDay()])
    .replace(/EE/g, weekdayNarrow[utc ? date.getUTCDay() : date.getDay()])
    .replace(/dd/g, pad2(day))
    .replace(/d(?!e)/g, day.toString())
    .replace(/HH/g, pad2(hours))
    .replace(/H/g, hours.toString())
    .replace(/hh/g, pad2(hours12))
    .replace(/h/g, hours12.toString())
    .replace(/mm/g, pad2(minutes))
    .replace(/ss/g, pad2(seconds))
    .replace(/SSS/g, pad2(milliseconds).padStart(3, '0'))
    .replace(/a/g, ampm)
    .replace(/Z/g, utc ? 'Z' : formatTimezoneOffset(date));
}

/**
 * Formats the timezone offset for local time.
 */
function formatTimezoneOffset(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * TableBuilder class that provides a fluent API for constructing tables.
 */
class TableBuilderImpl<T> implements TableBuilder<T> {
  #data: T[];
  #columns: (keyof T)[];
  #columnConfigs: Map<keyof T, SimpleColumnOptions<T>>;
  #palette: Record<string, number>;
  #formatHeaders: boolean;
  #headerColor?: SimpleColor;
  #showHeader: boolean;
  #zebraEnabled: boolean;
  #zebraColor1?: SimpleColor;
  #zebraColor2?: SimpleColor;
  #bordersEnabled: boolean;
  #borderStyle: BorderStyle;
  #borderColor?: SimpleColor;
  #padding: number;
  #noColor: boolean;

  constructor(data: T[], options: SimpleOptions<T> = {}) {
    this.#data = data;
    this.#columns = options.columns ??
      (data.length > 0 && data[0] !== null && typeof data[0] === 'object'
        ? Object.keys(data[0] as object) as (keyof T)[]
        : []);
    this.#columnConfigs = new Map();
    this.#palette = { ...DEFAULT_COLORS, ...(options.colors ?? {}) };
    this.#formatHeaders = options.formatHeaders ?? true;
    this.#showHeader = true;
    this.#zebraEnabled = false;
    this.#bordersEnabled = true;
    this.#borderStyle = 'light';
    this.#padding = 2;
    this.#noColor = false;
  }

  columns(keys: (keyof T)[]): this {
    this.#columns = keys;
    return this;
  }

  column(key: keyof T, alignOrOptions: 'left' | 'right' | 'center' | SimpleColumnOptions<T>): this {
    if (typeof alignOrOptions === 'string') {
      // Alignment shorthand
      const existing = this.#columnConfigs.get(key) ?? {};
      this.#columnConfigs.set(key, { ...existing, align: alignOrOptions });
    } else {
      // Full options
      this.#columnConfigs.set(key, alignOrOptions);
    }
    return this;
  }

  header(color: SimpleColor): this {
    this.#headerColor = color;
    this.#showHeader = true;
    return this;
  }

  noHeader(): this {
    this.#showHeader = false;
    return this;
  }

  zebra(color1?: SimpleColor, color2?: SimpleColor): this {
    this.#zebraEnabled = true;
    this.#zebraColor1 = color1 ?? { bg: ZEBRA_EVEN_BG };
    this.#zebraColor2 = color2;
    return this;
  }

  noZebra(): this {
    this.#zebraEnabled = false;
    return this;
  }

  borders(style?: 'light' | 'heavy' | 'double', color?: SimpleColor): this {
    this.#bordersEnabled = true;
    if (style) this.#borderStyle = style;
    if (color) this.#borderColor = color;
    return this;
  }

  noBorders(): this {
    this.#bordersEnabled = false;
    return this;
  }

  borderColor(color: SimpleColor): this {
    this.#borderColor = color;
    return this;
  }

  padding(spaces: number): this {
    this.#padding = spaces;
    return this;
  }

  noColor(): this {
    this.#noColor = true;
    return this;
  }

  data(rows: T[]): this {
    this.#data = rows;
    return this;
  }

  /**
   * Builds the column definitions for TableRenderer.
   */
  #buildColumnDefs(): Column<T>[] {
    return this.#columns.map((key) => {
      const config = this.#columnConfigs.get(key) ?? {};
      const header = config.header ?? (this.#formatHeaders ? camelCaseToTitleCase(String(key)) : String(key));

      const column: Column<T> = {
        key,
        header,
        align: config.align ?? 'left',
      };

      if (config.maxWidth !== undefined) {
        column.maxWidth = config.maxWidth;
      }

      if (config.format) {
        // Create formatter for built-in formats
        const formatter = createFormatter(
          config.format,
          config.decimals,
          config.separator,
          config.datetime,
        );
        column.formatter = formatter as (value: unknown, row: T) => string;
      }

      if (config.color) {
        column.color = createColorFn(config.color, this.#palette);
      }

      return column;
    });
  }

  /**
   * Builds the TableRenderer instance.
   */
  #buildRenderer(): TableRenderer<T> {
    const columns = this.#buildColumnDefs();

    const options: {
      columns: Column<T>[];
      data: T[];
      padding?: number;
      headerStyle?: ColorType;
      rowStyles?: [ColorType | null | undefined, ColorType | null | undefined];
      borders?: { enabled: boolean; style?: BorderStyle; color?: ColorType };
      noColor?: boolean;
    } = {
      columns,
      data: this.#data,
    };

    // Only set padding if borders are disabled
    if (!this.#bordersEnabled) {
      options.padding = this.#padding;
    }

    // Header style
    if (this.#showHeader && this.#headerColor) {
      const headerStyleFn = colorToStyleFn(this.#headerColor, this.#palette);
      // Wrap with bold for headers
      options.headerStyle = (s: string) => bold(headerStyleFn(s));
    }

    // Zebra striping
    if (this.#zebraEnabled) {
      options.rowStyles = [
        this.#zebraColor1 ? colorToStyleFn(this.#zebraColor1, this.#palette) : null,
        this.#zebraColor2 ? colorToStyleFn(this.#zebraColor2, this.#palette) : null,
      ];
    }

    // Borders
    if (this.#bordersEnabled) {
      options.borders = {
        enabled: true,
        style: this.#borderStyle,
      };

      if (this.#borderColor) {
        options.borders.color = resolveSimpleColor(this.#borderColor, this.#palette);
      } else {
        options.borders.color = 0x666666; // Default gray
      }
    }

    // No color
    if (this.#noColor) {
      options.noColor = true;
    }

    return new TableRenderer(options);
  }

  print(): void {
    this.#buildRenderer().print();
  }

  toString(): string {
    return this.#buildRenderer().toString();
  }

  render(): string[] {
    return this.#buildRenderer().render();
  }
}

/**
 * Factory function for creating a table with a simple, intuitive API.
 *
 * @param data Array of data objects to display in the table
 * @param columnsOrOptions Either an array of column keys to display, or options object
 * @returns A TableBuilder for configuring and rendering the table
 *
 * @example Basic usage with auto-discovered columns
 * ```ts
 * table(users).print();
 * ```
 *
 * @example Select specific columns
 * ```ts
 * table(users, ['id', 'name', 'email']).print();
 * ```
 *
 * @example With options and chainable configuration
 * ```ts
 * table(users, { formatHeaders: false })
 *   .column('id', 'right')
 *   .column('status', { color: 'green' })
 *   .header('cyan')
 *   .borders()
 *   .print();
 * ```
 */
export function table<T>(data: T[], columnsOrOptions?: (keyof T)[] | SimpleOptions<T>): TableBuilder<T> {
  let options: SimpleOptions<T> = {};

  if (Array.isArray(columnsOrOptions)) {
    // First argument is column keys array
    options = { columns: columnsOrOptions };
  } else if (columnsOrOptions) {
    // First argument is options object
    options = columnsOrOptions;
  }

  return new TableBuilderImpl(data, options);
}

/**
 * Creates a custom color palette for use with named colors in the simple API.
 *
 * @param palette Record mapping color names to hex values
 * @returns The palette object for use in table options
 *
 * @example
 * ```ts
 * const myColors = defineColors({
 *   primary: 0x58d1eb,
 *   success: 0x51d67c,
 *   danger: 0xef5867,
 * });
 *
 * table(data, { colors: myColors })
 *   .header('primary')
 *   .column('status', { color: 'success' })
 *   .print();
 * ```
 */
export function defineColors(palette: Record<string, number>): Record<string, number> {
  return { ...DEFAULT_COLORS, ...palette };
}
