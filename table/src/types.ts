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
  align?: 'left' | 'right';
  /**
   * Custom formatter that converts a cell value to a display string.
   * Receives the cell value and the full row object for context-aware
   * formatting.
   */
  formatter?: (value: unknown, row: T) => string;
  /**
   * Returns a {@link StyleFn} to apply to the formatted cell text, or
   * `undefined` to leave the cell unstyled. Evaluated per-cell so that
   * styling can vary by value or by other fields in the row.
   *
   * @example
   * ```ts
   * import { rgb24 } from '@std/fmt/colors';
   * const green = 0x51d67c;
   * const red = 0xef5867;
   *
   * color: (_v, row) => row.status === 'running'
   *   ? (s) => rgb24(s, green)
   *   : (s) => rgb24(s, red)
   * ```
   */
  color?: (value: unknown, row: T) => StyleFn | undefined;
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
   * Style function applied to the header line text.
   *
   * @example
   * ```ts
   * import { bold, rgb24 } from '@std/fmt/colors';
   * headerStyle: (s) => bold(rgb24(s, 0x58d1eb))
   * ```
   */
  headerStyle?: StyleFn;
  /**
   * Two {@link StyleFn} functions applied to alternating data rows
   * for zebra-striping. The first function styles rows 0, 2, 4… (even indices).
   * The second function styles rows 1, 3, 5… (odd indices).
   * Use `null` or `undefined` for either entry to apply no formatting to
   * that row type. Use `bgRgb24` from `@std/fmt/colors` for subtle
   * background alternation.
   *
   * @example
   * ```ts
   * import { bgRgb24 } from '@std/fmt/colors';
   * // Background on even rows only:
   * rowStyles: [(s) => bgRgb24(s, 0x1a1a2e), null]
   * // Alternating backgrounds:
   * rowStyles: [(s) => bgRgb24(s, 0x1a1a2e), (s) => bgRgb24(s, 0x16213e)]
   * // No styling:
   * rowStyles: [null, null]
   * ```
   */
  rowStyles?: [StyleFn | null | undefined, StyleFn | null | undefined];
}

export type RowStyles = [StyleFn | null | undefined, StyleFn | null | undefined];
