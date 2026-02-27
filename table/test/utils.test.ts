import { assertEquals } from '@std/assert';
import { bgRgb24, rgb24 } from '@std/fmt/colors';
import { describe, it } from '@std/testing/bdd';
import { buildColumns, calculateColumnWidths, resolveColor, isRowStyle } from '../src/utils.ts';
import type { Column, ColumnRegistry, RowStyles, StyleFn } from '../src/types.ts';

describe('buildColumns', () => {
  type TestRow = {
    id: number;
    name: string;
    status: string;
    value: number;
  };

  it('should build columns from registry', () => {
    const registry: ColumnRegistry<TestRow> = {
      id: { header: 'ID', align: 'right' },
      name: { header: 'Name', align: 'left', maxWidth: 20 },
      status: { header: 'Status' },
    };

    const columns = buildColumns<TestRow>(['id', 'name', 'status'], registry);

    assertEquals(columns.length, 3);
    assertEquals(columns[0].key, 'id');
    assertEquals(columns[0].header, 'ID');
    assertEquals(columns[0].align, 'right');
    assertEquals(columns[1].key, 'name');
    assertEquals(columns[1].header, 'Name');
    assertEquals(columns[1].maxWidth, 20);
    assertEquals(columns[2].key, 'status');
    assertEquals(columns[2].header, 'Status');
  });

  it('should provide defaults for keys not in registry', () => {
    const registry: ColumnRegistry<TestRow> = {
      id: { header: 'ID' },
    };

    const columns = buildColumns<TestRow>(['id', 'name', 'value'], registry);

    assertEquals(columns.length, 3);
    assertEquals(columns[1].key, 'name');
    assertEquals(columns[1].header, 'name');
    assertEquals(columns[1].align, 'left');
    assertEquals(columns[2].key, 'value');
    assertEquals(columns[2].header, 'value');
    assertEquals(columns[2].align, 'left');
  });

  it('should preserve column order from keys array', () => {
    const registry: ColumnRegistry<TestRow> = {
      id: { header: 'ID' },
      name: { header: 'Name' },
      status: { header: 'Status' },
    };

    const columns = buildColumns<TestRow>(['status', 'id', 'name'], registry);

    assertEquals(columns[0].key, 'status');
    assertEquals(columns[1].key, 'id');
    assertEquals(columns[2].key, 'name');
  });

  it('should handle empty keys array', () => {
    const registry: ColumnRegistry<TestRow> = {
      id: { header: 'ID' },
    };

    const columns = buildColumns<TestRow>([], registry);
    assertEquals(columns.length, 0);
  });

  it('should include formatter and color callbacks', () => {
    const testFormatter = (v: unknown) => String(v);
    const testColor = (_v: unknown, _row: TestRow): StyleFn | undefined => (s) => rgb24(s, 0xff0000);

    const registry: ColumnRegistry<TestRow> = {
      id: { header: 'ID', formatter: testFormatter, color: testColor },
    };

    const columns = buildColumns<TestRow>(['id'], registry);

    assertEquals(columns[0].formatter, testFormatter);
    assertEquals(columns[0].color, testColor);
  });
});

describe('calculateColumnWidths', () => {
  type TestRow = {
    id: number;
    name: string;
    value: number;
  };

  it('should respect fixed width when specified', () => {
    const columns: Column<TestRow>[] = [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'name', header: 'Name' },
    ];

    const data: TestRow[] = [
      { id: 1, name: 'Short', value: 100 },
      { id: 2, name: 'Very Long Name', value: 200 },
    ];

    const widths = calculateColumnWidths(data, columns);

    assertEquals(widths.id, 10); // Fixed width takes precedence
  });

  it('should auto-calculate width from header and data', () => {
    const columns: Column<TestRow>[] = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
    ];

    const data: TestRow[] = [
      { id: 1, name: 'Short', value: 100 },
      { id: 2, name: 'Very Long Name', value: 200 },
    ];

    const widths = calculateColumnWidths(data, columns);

    // 'Very Long Name' is 14 chars, longer than 'Name' (4 chars)
    assertEquals(widths.name, 14);
    // ID values are 1 char, header 'ID' is 2 chars
    assertEquals(widths.id, 2);
  });

  it('should respect maxWidth cap', () => {
    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name', maxWidth: 8 },
    ];

    const data: TestRow[] = [
      { id: 1, name: 'Very Long Name That Exceeds MaxWidth', value: 100 },
    ];

    const widths = calculateColumnWidths(data, columns);

    assertEquals(widths.name, 8); // Capped at maxWidth
  });

  it('should handle ANSI codes in data when measuring', () => {
    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
    ];

    const coloredName = rgb24('Colored', 0xff0000);
    const data: TestRow[] = [
      { id: 1, name: coloredName as unknown as string, value: 100 },
    ];

    const widths = calculateColumnWidths(data, columns);

    // Visual length is 7 ('Colored'), not including ANSI codes
    assertEquals(widths.name, 7);
  });

  it('should use formatter when calculating widths', () => {
    const columns: Column<TestRow>[] = [
      {
        key: 'value',
        header: 'Val',
        formatter: (v) => `$${(v as number).toFixed(2)}`,
      },
    ];

    const data: TestRow[] = [
      { id: 1, name: 'Test', value: 123.456 },
    ];

    const widths = calculateColumnWidths(data, columns);

    // Formatted value is '$123.46' (7 chars), longer than header 'Val' (3 chars)
    assertEquals(widths.value, 7);
  });

  it('should handle empty data array', () => {
    const columns: Column<TestRow>[] = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
    ];

    const widths = calculateColumnWidths([], columns);

    // Should use header widths only
    assertEquals(widths.id, 2);
    assertEquals(widths.name, 4);
  });

  it('should handle null and undefined values', () => {
    const columns: Column<TestRow>[] = [
      { key: 'name', header: 'Name' },
    ];

    const data = [
      { id: 1, name: null as unknown as string, value: 100 },
      { id: 2, name: undefined as unknown as string, value: 200 },
    ];

    const widths = calculateColumnWidths(data, columns);

    // Empty strings from null/undefined
    assertEquals(widths.name, 4); // Header width wins
  });
});

describe('resolveColor', () => {
  it('should return function as-is when passed StyleFn', () => {
    const testFn: StyleFn = (s) => s.toUpperCase();
    const result = resolveColor(testFn);
    assertEquals(result, testFn);
    assertEquals(result('hello'), 'HELLO');
  });

  it('should convert integer to rgb24 StyleFn (foreground)', () => {
    const styleFn = resolveColor(0xff0000);
    const result = styleFn('test');
    const expected = rgb24('test', 0xff0000);
    assertEquals(result, expected);
  });

  it('should handle ColorSpec with fg only', () => {
    const styleFn = resolveColor({ fg: 0xff0000 });
    const result = styleFn('test');
    const expected = rgb24('test', 0xff0000);
    assertEquals(result, expected);
  });

  it('should handle ColorSpec with bg only', () => {
    const styleFn = resolveColor({ bg: 0x00ff00 });
    const result = styleFn('test');
    const expected = bgRgb24('test', 0x00ff00);
    assertEquals(result, expected);
  });

  it('should handle ColorSpec with both fg and bg', () => {
    const styleFn = resolveColor({ fg: 0xff0000, bg: 0x00ff00 });
    const result = styleFn('test');
    // Apply bg first, then fg
    const expected = rgb24(bgRgb24('test', 0x00ff00), 0xff0000);
    assertEquals(result, expected);
  });

  it('should handle zero as valid RGB value', () => {
    const styleFn = resolveColor(0x000000);
    const result = styleFn('test');
    const expected = rgb24('test', 0x000000);
    assertEquals(result, expected);
  });

  it('should handle max RGB value', () => {
    const styleFn = resolveColor(0xffffff);
    const result = styleFn('test');
    const expected = rgb24('test', 0xffffff);
    assertEquals(result, expected);
  });

  it('should handle empty ColorSpec', () => {
    const styleFn = resolveColor({});
    const result = styleFn('test');
    assertEquals(result, 'test'); // No styling applied
  });
});

describe('isRowStyle', () => {
  it('should return true for valid RowStyles tuple', () => {
    const rowStyle: RowStyles = [(s) => s, (s) => s];
    assertEquals(isRowStyle(rowStyle), true);
  });

  it('should return true for tuple with null/undefined entries', () => {
    assertEquals(isRowStyle([null, null]), true);
    assertEquals(isRowStyle([undefined, undefined]), true);
    assertEquals(isRowStyle([(s: string) => s, null]), true);
    assertEquals(isRowStyle([null, (s: string) => s]), true);
  });

  it('should return false for non-array values', () => {
    assertEquals(isRowStyle(null), false);
    assertEquals(isRowStyle(undefined), false);
    assertEquals(isRowStyle('string'), false);
    assertEquals(isRowStyle(42), false);
    assertEquals(isRowStyle({}), false);
  });

  it('should return false for arrays with wrong length', () => {
    assertEquals(isRowStyle([]), false);
    assertEquals(isRowStyle([(s: string) => s]), false);
    assertEquals(isRowStyle([(s: string) => s, (s: string) => s, (s: string) => s]), false);
  });
});
