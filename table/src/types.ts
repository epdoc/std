/**
 * A function that wraps text with ANSI styling. Compatible with all functions
 * from `@std/fmt/colors` (e.g. `bold`, `rgb24`, `dim`, `green`).
 *
 * @example
 * ```ts
 * import { bold, rgb24 } from '@std/fmt/colors';
 *
 * const headerStyle: StyleFn = (s) => bold(rgb24(s, 0x58d1eb));
 * const greenText: StyleFn = (s) => rgb24(s, 0x51d67c);
 * ```
 */
export type StyleFn = (text: string) => string;

/**
 * A color specification that can define foreground and/or background colors.
 * Used when you need explicit control over both text and background colors.
 *
 * @example
 * ```ts
 * // Background only
 * const bgRed: ColorSpec = { bg: 0xff0000 };
 *
 * // Foreground only
 * const fgGreen: ColorSpec = { fg: 0x00ff00 };
 *
 * // Both foreground and background
 * const whiteOnRed: ColorSpec = { fg: 0xffffff, bg: 0xff0000 };
 * ```
 */
export type ColorSpec = {
  /** Foreground (text) color as a hex number (e.g., 0x51d67c) */
  fg?: number;
  /** Background color as a hex number (e.g., 0x1a1a2e) */
  bg?: number;
};

/**
 * Flexible color/style specification accepted throughout the table API.
 *
 * - **`StyleFn`** — Full control with custom ANSI styling (bold, italic, etc.)
 * - **`number`** — Shorthand for foreground color (most common case)
 * - **`ColorSpec`** — Explicit foreground and/or background colors
 *
 * @example
 * ```ts
 * import { bold, rgb24 } from '@std/fmt/colors';
 *
 * // Foreground color shorthand (most common)
 * const redText: ColorType = 0xff0000;
 *
 * // Background color
 * const bgBlue: ColorType = { bg: 0x0000ff };
 *
 * // Both foreground and background
 * const whiteOnBlack: ColorType = { fg: 0xffffff, bg: 0x000000 };
 *
 * // Full control with StyleFn
 * const styledText: ColorType = (s) => bold(rgb24(s, 0x58d1eb));
 * ```
 */
export type ColorType = StyleFn | number | ColorSpec;

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
}

export type Alignment = 'left' | 'right' | 'center';

export type RowStyles = [ColorType | null | undefined, ColorType | null | undefined];
