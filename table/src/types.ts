import type { ColorType } from '@epdoc/type/colorspec';

// ── Column definition ──────────────────────────────────────────────────────

/**
 * Column definition for table output.
 *
 * @template T - The row data type
 */
export type Column<T> = {
  /** Property key from the data object. */
  key: keyof T;
  /** Column header text. */
  header: string;
  /** Fixed width. If omitted, width is auto-calculated from header and data. */
  width?: number;
  /**
   * Maximum visual width. Values exceeding this width are truncated with an
   * ellipsis character. Applied after formatting and coloring.
   */
  maxWidth?: number;
  /** Text alignment within the column (default: `'left'`). */
  align?: Alignment;
  /**
   * Custom formatter that converts a cell value to a display string.
   * Receives the cell value and the full row object for context-aware
   * formatting.
   */
  formatter?: (value: unknown, row: T) => string;
  /**
   * Returns a {@link ColorType} to apply to the formatted cell text, or
   * `undefined` to leave the cell unstyled. Evaluated per-cell so that
   * styling can vary by value or by other fields in the row.
   *
   * @example
   * ```ts
   * import { rgb24 } from '@std/fmt/colors';
   * const green = 0x51d67c;
   * const red = 0xef5867;
   *
   * // Simple foreground color (most common)
   * color: (_v, row) => row.status === 'running' ? green : red
   *
   * // Background color
   * color: (_v, row) => row.hot ? { bg: 0xff0000 } : undefined
   *
   * // Both foreground and background
   * color: (_v, row) => ({ fg: 0xffffff, bg: row.severity > 5 ? red : 0x333333 })
   *
   * // Full control with StyleFn
   * color: (_v, row) => row.status === 'running'
   *   ? (s) => rgb24(s, green)
   *   : (s) => rgb24(s, red)
   * ```
   */
  color?: (value: unknown, row: T) => ColorType | undefined;
};

// ── Column registry & builder ──────────────────────────────────────────────

/**
 * A declarative registry mapping data keys to column display properties.
 * Used with {@link buildColumns} to replace verbose switch-case column
 * construction.
 *
 * @template T - The row data type
 *
 * @example
 * ```ts
 * import { rgb24 } from '@std/fmt/colors';
 *
 * const COLS: ColumnRegistry<MyRow> = {
 *   id:   { header: 'ID',   align: 'left' },
 *   name: { header: 'Name', align: 'left', maxWidth: 20 },
 *   cpu:  { header: 'CPU%', align: 'right', formatter: (v) => formatPercent(v as number) },
 *   status: {
 *     header: 'Status',
 *     color: (v) => v === 'ok' ? (s) => rgb24(s, 0x51d67c) : undefined,
 *   },
 * };
 * const columns = buildColumns(['id', 'name', 'cpu', 'status'], COLS);
 * ```
 */
export type ColumnRegistry<T> = Partial<Record<keyof T, Omit<Column<T>, 'key'>>>;

/**
 * Options for table rendering.
 *
 * @template T - The row data type
 */
export interface Options<T> {
  /** Column definitions. */
  columns: Column<T>[];
  /** Data rows. */
  data: T[];
  /** Spacing (in spaces) between columns (default: `2`). */
  padding?: number;
  /**
   * Color or style applied to the header line text.
   *
   * @example
   * ```ts
   * import { bold, rgb24 } from '@std/fmt/colors';
   *
   * // Simple color
   * headerStyle: 0x58d1eb
   *
   * // With bold
   * headerStyle: (s) => bold(rgb24(s, 0x58d1eb))
   * ```
   */
  headerStyle?: ColorType;
  /**
   * Two {@link ColorType} specifications applied to alternating data rows
   * for zebra-striping. The first entry styles rows 0, 2, 4… (even indices).
   * The second entry styles rows 1, 3, 5… (odd indices).
   * Use `null` or `undefined` for either entry to apply no formatting to
   * that row type.
   *
   * @example
   * ```ts
   * // Background on even rows only:
   * rowStyles: [{ bg: 0x1a1a2e }, null]
   *
   * // Alternating backgrounds:
   * rowStyles: [{ bg: 0x1a1a2e }, { bg: 0x16213e }]
   *
   * // No styling:
   * rowStyles: [null, null]
   * ```
   */
  rowStyles?: [ColorType | null | undefined, ColorType | null | undefined];
  /**
   * When `true`, strips all ANSI color codes from output. Useful for writing
   * to files, logs, or terminals without color support.
   *
   * Note: The consumer should explicitly set this based on their output target.
   * For Deno programs, you can pass `Deno.noColor` to auto-detect based on
   * environment and TTY status.
   *
   * @default false
   *
   * @example
   * ```ts
   * // Explicit
   * const table = new TableRenderer({ columns, data, noColor: true });
   *
   * // Auto-detect in Deno
   * const table = new TableRenderer({ columns, data, noColor: Deno.noColor });
   * ```
   */
  noColor?: boolean;
  /**
   * Character used for divider lines (default: `'-'`).
   * Applied to the header separator and top/bottom borders.
   *
   * @example
   * ```ts
   * // Use box-drawing character
   * dividerChar: '─'
   *
   * // Use double-line character
   * dividerChar: '═'
   * ```
   */
  dividerChar?: string;
  /**
   * Color or style applied to divider lines.
   * Applied to the header separator and top/bottom borders.
   *
   * @example
   * ```ts
   * import { bold, rgb24 } from '@std/fmt/colors';
   *
   * // Simple color
   * dividerStyle: 0x888888
   *
   * // With bold
   * dividerStyle: (s) => bold(rgb24(s, 0x888888))
   * ```
   */
  dividerStyle?: ColorType;
  /**
   * When `true`, renders a divider line above the header row.
   * The divider uses `dividerChar` and `dividerStyle` for its appearance.
   *
   * @default false
   *
   * @example
   * ```ts
   * topBorder: true
   * ```
   */
  topBorder?: boolean;
  /**
   * When `true`, renders a divider line below the last data row.
   * The divider uses `dividerChar` and `dividerStyle` for its appearance.
   *
   * @default false
   *
   * @example
   * ```ts
   * bottomBorder: true
   * ```
   */
  bottomBorder?: boolean;
  /**
   * Border configuration. When enabled, renders full box-drawing borders
   * around the table with corners, junctions, and vertical pipes.
   *
   * When borders are enabled, the `padding` option is ignored as borders
   * provide visual column separation.
   *
   * @default undefined (borders disabled)
   *
   * @example
   * ```ts
   * import { TableRenderer } from '@epdoc/table';
   *
   * // Enable light borders
   * const table = new TableRenderer({
   *   columns,
   *   data,
   *   borders: {
   *     enabled: true,
   *     style: 'light',
   *   },
   * });
   *
   * // Enable heavy borders with color
   * const table2 = new TableRenderer({
   *   columns,
   *   data,
   *   borders: {
   *     enabled: true,
   *     style: 'heavy',
   *     color: 0x888888,
   *   },
   * });
   * ```
   */
  borders?: BorderConfig;
}

export type Alignment = 'left' | 'right' | 'center';

export type RowStyles = [ColorType | null | undefined, ColorType | null | undefined];

// ── Border types ───────────────────────────────────────────────────────────

/**
 * Box-drawing character set for table borders.
 *
 * @example
 * ```ts
 * const lightBorders: BorderCharSet = {
 *   topLeft: '┌',
 *   topRight: '┐',
 *   bottomLeft: '└',
 *   bottomRight: '┘',
 *   horizontal: '─',
 *   vertical: '│',
 *   topJunction: '┬',
 *   bottomJunction: '┴',
 *   leftJunction: '├',
 *   rightJunction: '┤',
 *   crossJunction: '┼',
 * };
 * ```
 */
export interface BorderCharSet {
  /** Top-left corner character (e.g., `┌`) */
  topLeft: string;
  /** Top-right corner character (e.g., `┐`) */
  topRight: string;
  /** Bottom-left corner character (e.g., `└`) */
  bottomLeft: string;
  /** Bottom-right corner character (e.g., `┘`) */
  bottomRight: string;
  /** Horizontal line character (e.g., `─`) */
  horizontal: string;
  /** Vertical line character (e.g., `│`) */
  vertical: string;
  /** Top junction character (e.g., `┬`) */
  topJunction: string;
  /** Bottom junction character (e.g., `┴`) */
  bottomJunction: string;
  /** Left junction character (e.g., `├`) */
  leftJunction: string;
  /** Right junction character (e.g., `┤`) */
  rightJunction: string;
  /** Cross junction character (e.g., `┼`) */
  crossJunction: string;
}

/**
 * Border style presets for table borders.
 *
 * - `'light'` — Light box-drawing characters: `┌─┬─┐` / `├─┼─┤` / `└─┴─┘`
 * - `'heavy'` — Heavy box-drawing characters: `┏━┳━┓` / `┣━╋━┫` / `┗━┻━┛`
 * - `'double'` — Double-line box-drawing characters: `╔═╦═╗` / `╠═╬═╣` / `╚═╩═╝`
 * - `'custom'` — Use custom character set provided via `chars` property
 */
export type BorderStyle = 'light' | 'heavy' | 'double' | 'custom';

/**
 * Border configuration for table rendering.
 *
 * @example
 * ```ts
 * // Enable light borders with gray color
 * const borders: BorderConfig = {
 *   enabled: true,
 *   style: 'light',
 *   color: 0x888888,
 * };
 *
 * // Enable custom borders
 * const customBorders: BorderConfig = {
 *   enabled: true,
 *   style: 'custom',
 *   chars: {
 *     topLeft: '+',
 *     topRight: '+',
 *     // ... other characters
 *   },
 * };
 * ```
 */
export interface BorderConfig {
  /**
   * Enable full box-drawing borders (corners, junctions, vertical pipes).
   *
   * @default false
   */
  enabled: boolean;

  /**
   * Border style preset. Use `'custom'` to provide your own character set.
   *
   * @default 'light'
   */
  style?: BorderStyle;

  /**
   * Color for all border characters.
   * Can be a hex number (e.g., `0x888888`), ColorSpec object, or StyleFn.
   *
   * @example
   * ```ts
   * // Hex color
   * color: 0x888888
   *
   * // ColorSpec
   * color: { fg: 0xffffff, bg: 0x000000 }
   *
   * // StyleFn
   * import { rgb24 } from '@std/fmt/colors';
   * color: (s) => rgb24(s, 0x888888)
   * ```
   */
  color?: ColorType;

  /**
   * Custom border character set. Only used when `style` is `'custom'`.
   */
  chars?: BorderCharSet;
}

/**
 * Predefined border character sets for common box-drawing styles.
 *
 * @example
 * ```ts
 * const lightChars = BORDER_STYLES.light;
 * const heavyChars = BORDER_STYLES.heavy;
 * ```
 */
export const BORDER_STYLES: Record<Exclude<BorderStyle, 'custom'>, BorderCharSet> = {
  light: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    topJunction: '┬',
    bottomJunction: '┴',
    leftJunction: '├',
    rightJunction: '┤',
    crossJunction: '┼',
  },
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    topJunction: '┳',
    bottomJunction: '┻',
    leftJunction: '┣',
    rightJunction: '┫',
    crossJunction: '╋',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    topJunction: '╦',
    bottomJunction: '╩',
    leftJunction: '╠',
    rightJunction: '╣',
    crossJunction: '╬',
  },
};
