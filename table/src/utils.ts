import { bgRgb24, rgb24 } from '@std/fmt/colors';
import * as Terminal from './terminal.ts';
import type * as Table from './types.ts';

/**
 * Builds an array of {@link TableColumn} definitions from a list of keys and
 * a declarative {@link ColumnRegistry}.
 *
 * Keys that are not found in the registry produce a default left-aligned
 * column whose header is the stringified key.
 *
 * @param keys - Ordered list of column keys to include
 * @param registry - Declarative column property map
 * @returns Fully-formed column definitions ready for {@link TableFormatter}
 */
export function buildColumns<T>(
  keys: (keyof T)[],
  registry: Table.ColumnRegistry<T>,
): Table.Column<T>[] {
  return keys.map((key) => {
    const def = registry[key];
    if (def) {
      return { key, ...def } as Table.Column<T>;
    }
    return { key, header: String(key), align: 'left' as const };
  });
}

// ── Column width calculation ───────────────────────────────────────────────

/**
 * Calculates the maximum visual width needed for each column by examining
 * both headers and formatted data values. ANSI escape codes are stripped
 * before measuring so that colored content does not inflate widths.
 *
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @returns Record mapping column key to calculated width
 */
export function calculateColumnWidths<T>(
  data: T[],
  columns: Table.Column<T>[],
): Record<keyof T, number> {
  const widths = {} as Record<keyof T, number>;

  for (const col of columns) {
    if (col.width !== undefined) {
      widths[col.key as keyof T] = col.width;
      continue;
    }

    let maxLen = col.header.length;

    for (const item of data) {
      const value = item[col.key];
      const formatted = col.formatter ? col.formatter(value, item) : String(value ?? '');
      const visualLen = Terminal.stripAnsi(formatted).length;
      if (visualLen > maxLen) {
        maxLen = visualLen;
      }
    }

    // Respect maxWidth cap if set
    if (col.maxWidth !== undefined && maxLen > col.maxWidth) {
      maxLen = col.maxWidth;
    }

    widths[col.key as keyof T] = maxLen;
  }

  return widths;
}

export function getStyle(val: Table.StyleFn | number, bg = false): Table.StyleFn {
  if (typeof val === 'function') return val;
  if (typeof val === 'number' && !isNaN(val)) {
    if (bg === true) return (s) => bgRgb24(s, val);
    return (s) => rgb24(s, val);
  }
  return (s) => {
    return s;
  };
}

export function isRowStyle(val: unknown): val is Table.RowStyles {
  return (Array.isArray(val) && val.length === 2) ? true : false;
}
