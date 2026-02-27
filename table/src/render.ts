import type { Integer } from '@epdoc/type';
import { padVisual, stripAnsi, visibleTruncate } from './terminal.ts';
import type * as Table from './types.ts';
import * as Util from './utils.ts';

// ── TableFormatter class ───────────────────────────────────────────────────

/**
 * Configurable table formatter that renders aligned, styled, ANSI-aware
 * tables for terminal output.
 *
 * Supports per-column coloring via {@link StyleFn}, header styling,
 * zebra-striped rows, max-width truncation with ellipsis, and ANSI-aware
 * padding.
 *
 * @template T - The row data type
 *
 * @example Using constructor with options object:
 * ```ts
 * import { bgRgb24, bold, rgb24 } from '@std/fmt/colors';
 *
 * const table = new TableFormatter({
 *   columns: buildColumns(['id', 'name', 'status'], COLUMN_DEFS),
 *   data: rows,
 *   headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
 *   rowStyles: [
 *     (s) => bgRgb24(s, 0x1a1a2e),
 *     (s) => bgRgb24(s, 0x16213e),
 *   ],
 * });
 * for (const line of table.render()) {
 *   console.log(line);
 * }
 * ```
 *
 * @example Using fluent API:
 * ```ts
 * TableFormatter.create<MyRow>()
 *   .column('id', { header: 'ID', color: statusStyle })
 *   .column('name', { header: 'NAME', maxWidth: 24 })
 *   .column('status', { header: 'STATUS', align: 'right' })
 *   .data(rows)
 *   .padding(4)
 *   .headerStyle(headerStyle)
 *   .evenRow(bgEven, true)
 *   .print();
 * ```
 */
export class TableRenderer<T> {
  #columns: Table.Column<T>[];
  #data: T[];
  #padding: Integer;
  #widths: Record<keyof T, number> | null = null;
  #headerStyle: Table.StyleFn | undefined;
  #rowStyles: [Table.StyleFn | null | undefined, Table.StyleFn | null | undefined] = [null, null];
  static #identity: Table.StyleFn = (s) => s;

  /**
   * Creates a new TableFormatter with fluent API.
   * Use this factory method to build tables incrementally with method chaining.
   *
   * @template T - The row data type
   * @returns A new TableFormatter instance
   */
  static create<T>(): TableRenderer<T> {
    return new TableRenderer<T>({
      columns: [],
      data: [],
    });
  }

  constructor(options: Table.Options<T>) {
    this.#columns = options.columns;
    this.#data = options.data;
    this.#padding = options.padding ?? 2;
    this.#headerStyle = options.headerStyle;
    if (Util.isRowStyle(options.rowStyles)) {
      this.#rowStyles = options.rowStyles;
    }
    // Defer width calculation for fluent API usage
    if (this.#columns.length > 0 && this.#data.length > 0) {
      this.#widths = Util.calculateColumnWidths<T>(this.#data, this.#columns);
    }
  }

  /**
   * Adds a column definition to the table (fluent API).
   *
   * @param key - The property key from the data object
   * @param opts - Column display properties (header, align, formatter, etc.)
   * @returns This instance for method chaining
   */
  column(key: keyof T, opts: Omit<Table.Column<T>, 'key'>): this {
    this.#columns.push({ key, ...opts } as Table.Column<T>);
    this.#widths = null; // Invalidate cached widths
    return this;
  }

  /**
   * Sets the data rows for the table (fluent API).
   *
   * @param rows - Array of data objects
   * @returns This instance for method chaining
   */
  data(rows: T[]): this {
    this.#data = rows;
    this.#widths = null; // Invalidate cached widths
    return this;
  }

  padding(val: Integer): this {
    this.#padding = val;
    return this;
  }

  headerStyle(val: Table.StyleFn | Integer, bg = false): this {
    this.#headerStyle = Util.getStyle(val, bg);
    return this;
  }

  oddRow(val: Table.StyleFn | Integer, bg = false): this {
    this.#rowStyles[0] = Util.getStyle(val, bg);
    return this;
  }

  evenRow(val: Table.StyleFn | Integer, bg = false): this {
    this.#rowStyles[1] = Util.getStyle(val, bg);
    return this;
  }

  /**
   * Ensures column widths are calculated before rendering.
   */
  #ensureWidths(): void {
    if (this.#widths === null) {
      this.#widths = Util.calculateColumnWidths<T>(this.#data, this.#columns);
    }
  }

  /**
   * Renders the table header row.
   * If `headerStyle` was provided, the entire header line is styled.
   */
  renderHeader(): string {
    this.#ensureWidths();
    const gap = ' '.repeat(this.#padding);
    const parts = this.#columns.map((col) => {
      const width = this.#widths![col.key as keyof T];
      const align = col.align ?? 'left';
      return padVisual(col.header, width, align);
    });
    const line = parts.join(gap);
    if (this.#headerStyle) {
      return this.#headerStyle(line);
    }
    return line;
  }

  /**
   * Renders the separator line (dashes matching header visual width).
   */
  renderSeparator(char = '-'): string {
    const headerVisualLen = stripAnsi(this.renderHeader()).length;
    return char.repeat(headerVisualLen);
  }

  /**
   * Renders a single data row.
   *
   * @param item - The row data object
   * @param rowIndex - Zero-based row index, used for zebra striping
   */
  renderRow(item: T, rowIndex = 0): string {
    this.#ensureWidths();
    const gap = ' '.repeat(this.#padding);
    const rowStyleFn = this.#rowStyles?.[rowIndex % 2];

    const parts = this.#columns.map((col, colIndex) => {
      const value = item[col.key];
      const width = this.#widths![col.key as keyof T];
      const align = col.align ?? 'left';

      // 1. Format
      let text = col.formatter ? col.formatter(value, item) : String(value ?? '');

      // 2. Color — apply the StyleFn returned by the color callback
      if (col.color) {
        const styleFn = col.color(value, item);
        if (styleFn) {
          text = styleFn(text);
        }
      }

      // 3. MaxWidth truncation
      if (col.maxWidth !== undefined && stripAnsi(text).length > col.maxWidth) {
        text = visibleTruncate(text, col.maxWidth);
      }

      // 4. ANSI-aware pad
      text = padVisual(text, width, align);

      // 5. Add gap after this column (except for last column)
      const isLastColumn = colIndex === this.#columns.length - 1;
      if (!isLastColumn) {
        text += gap;
      }

      // 6. Row style — apply per-cell so resets within one cell
      //    don't affect the row style of subsequent cells
      if (rowStyleFn) {
        text = rowStyleFn(text);
      }

      return text;
    });

    return parts.join('');
  }

  /**
   * Renders all data rows with correct indices for zebra striping.
   */
  renderRows(): string[] {
    return this.#data.map((item, index) => this.renderRow(item, index));
  }

  /**
   * Renders the complete table as an array of lines: header, separator,
   * then all data rows.
   */
  render(): string[] {
    return [this.renderHeader(), this.renderSeparator(), ...this.renderRows()];
  }

  /**
   * Renders the complete table as a single string with newline separators.
   *
   * @returns The formatted table as a single string
   */
  toString(): string {
    return this.render().join('\n');
  }

  /**
   * Renders and prints the table to the console.
   * Convenience method that calls `console.log` for each line.
   */
  print(): void {
    for (const line of this.render()) {
      console.log(line);
    }
  }
}
