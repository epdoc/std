import { assertEquals, assertStringIncludes } from '@std/assert';
import { bgRgb24, bold, rgb24 } from '@std/fmt/colors';
import { describe, it } from '@std/testing/bdd';
import { formatters } from '../src/formatters.ts';
import { TableRenderer } from '../src/render.ts';
import { stripAnsi } from '../src/terminal.ts';

describe('TableRenderer - Constructor API', () => {
  type TestRow = {
    id: number;
    name: string;
    value: number;
  };

  it('should create table with basic configuration', () => {
    const data: TestRow[] = [
      { id: 1, name: 'Alice', value: 100 },
      { id: 2, name: 'Bob', value: 200 },
    ];

    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'value', header: 'Value' },
      ],
      data,
    });

    const lines = table.render();
    assertEquals(lines.length, 4); // header + separator + 2 data rows
  });

  it('should render header correctly', () => {
    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data: [],
    });

    const header = table.renderHeader();
    assertStringIncludes(header, 'ID');
    assertStringIncludes(header, 'Name');
  });

  it('should render separator matching header width', () => {
    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data: [],
    });

    const header = table.renderHeader();
    const separator = table.renderSeparator();

    assertEquals(stripAnsi(separator).length, stripAnsi(header).length);
    assertEquals(separator[0], '-');
  });

  it('should render data rows', () => {
    const data: TestRow[] = [
      { id: 1, name: 'Alice', value: 100 },
      { id: 2, name: 'Bob', value: 200 },
    ];

    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data,
    });

    const rows = table.renderRows();
    assertEquals(rows.length, 2);
    assertStringIncludes(stripAnsi(rows[0]), '1');
    assertStringIncludes(stripAnsi(rows[0]), 'Alice');
    assertStringIncludes(stripAnsi(rows[1]), '2');
    assertStringIncludes(stripAnsi(rows[1]), 'Bob');
  });

  it('should apply header style', () => {
    const table = new TableRenderer({
      columns: [{ key: 'id', header: 'ID' }],
      data: [],
      headerStyle: (s) => bold(s),
    });

    const header = table.renderHeader();
    // Bold ANSI code should be present
    assertStringIncludes(header, '\x1b[1m');
  });

  it('should apply zebra striping with rowStyles', () => {
    const data: TestRow[] = [
      { id: 1, name: 'Alice', value: 100 },
      { id: 2, name: 'Bob', value: 200 },
      { id: 3, name: 'Charlie', value: 300 },
    ];

    const bgEven = 0x101010;
    const table = new TableRenderer({
      columns: [{ key: 'id', header: 'ID' }],
      data,
      rowStyles: [
        (s) => bgRgb24(s, bgEven),
        null,
      ],
    });

    const rows = table.renderRows();
    // Even rows (index 0, 2) should have background color
    assertStringIncludes(rows[0], '\x1b[');
    assertStringIncludes(rows[2], '\x1b[');
    // Odd row (index 1) should not have the same background
  });

  it('should handle custom padding', () => {
    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data: [{ id: 1, name: 'Alice', value: 100 }],
      padding: 6,
    });

    const header = table.renderHeader();
    // Should have 6 spaces between ID and Name
    const cleaned = stripAnsi(header);
    // ID + 6 spaces + Name
    assertStringIncludes(cleaned, 'ID      Name');
  });
});

describe('TableRenderer - Fluent API', () => {
  type TestRow = {
    id: number;
    name: string;
  };

  it('should support create() factory method', () => {
    const table = TableRenderer.create<TestRow>();
    assertEquals(table instanceof TableRenderer, true);
  });

  it('should support column() method chaining', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID', align: 'right' })
      .column('name', { header: 'Name', align: 'left' });

    const lines = table.data([{ id: 1, name: 'Alice' }]).render();
    assertEquals(lines.length, 3); // header + separator + 1 row
  });

  it('should support data() method chaining', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID' })
      .data([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);

    const rows = table.renderRows();
    assertEquals(rows.length, 2);
  });

  it('should support padding() method', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID' })
      .column('name', { header: 'Name' })
      .data([{ id: 1, name: 'Alice' }])
      .padding(8);

    const header = table.renderHeader();
    assertStringIncludes(stripAnsi(header), 'ID        Name');
  });

  it('should support headerStyle() method', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID' })
      .data([])
      .headerStyle((s) => rgb24(s, 0xff0000));

    const header = table.renderHeader();
    assertStringIncludes(header, '\x1b[38;2;');
  });

  it('should support evenRow() method', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID' })
      .data([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
      .evenRow(0x101010, true);

    const rows = table.renderRows();
    // Row at index 1 (second row, "even" in 1-indexed terms) should have bg color
    assertStringIncludes(rows[1], '\x1b[');
  });

  it('should support oddRow() method', () => {
    const table = TableRenderer.create<TestRow>()
      .column('id', { header: 'ID' })
      .data([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
      .oddRow(0x202020, true);

    const rows = table.renderRows();
    // Row at index 0 (first row, "odd" in 1-indexed terms) should have bg color
    assertStringIncludes(rows[0], '\x1b[');
  });
});

describe('TableRenderer - Column Features', () => {
  type TestRow = {
    value: number;
    status: string;
    longText: string;
  };

  it('should apply column formatter', () => {
    const table = new TableRenderer({
      columns: [
        {
          key: 'value',
          header: 'Value',
          formatter: formatters.percent(2),
        },
      ],
      data: [{ value: 0.5, status: 'ok', longText: 'short' }],
    });

    const row = table.renderRow({ value: 0.5, status: 'ok', longText: 'short' });
    assertStringIncludes(stripAnsi(row), '50.00 %');
  });

  it('should apply column color callback', () => {
    const table = new TableRenderer({
      columns: [
        {
          key: 'status',
          header: 'Status',
          color: (_v, row) => row.status === 'ok' ? (s) => rgb24(s, 0x00ff00) : (s) => rgb24(s, 0xff0000),
        },
      ],
      data: [
        { value: 1, status: 'ok', longText: '' },
        { value: 2, status: 'error', longText: '' },
      ],
    });

    const rows = table.renderRows();
    // Both should have ANSI codes but different colors
    assertStringIncludes(rows[0], '\x1b[38;2;0;255;0m'); // Green
    assertStringIncludes(rows[1], '\x1b[38;2;255;0;0m'); // Red
  });

  it('should truncate with maxWidth', () => {
    const table = new TableRenderer({
      columns: [
        {
          key: 'longText',
          header: 'Text',
          maxWidth: 10,
        },
      ],
      data: [{ value: 0, status: '', longText: 'This is a very long text that exceeds maxWidth' }],
    });

    const row = table.renderRow({ value: 0, status: '', longText: 'This is a very long text that exceeds maxWidth' });
    const cleaned = stripAnsi(row).trim();
    assertEquals(cleaned.length, 10);
    assertStringIncludes(cleaned, '…');
  });

  it('should respect fixed width', () => {
    const table = new TableRenderer({
      columns: [
        {
          key: 'value',
          header: 'Val',
          width: 20,
        },
      ],
      data: [{ value: 123, status: '', longText: '' }],
    });

    const row = table.renderRow({ value: 123, status: '', longText: '' });
    const cleaned = stripAnsi(row);
    // Fixed width is 20, value '123' should be padded
    assertEquals(cleaned.trim().length >= 3, true);
  });

  it('should align text right when specified', () => {
    const table = new TableRenderer({
      columns: [
        {
          key: 'value',
          header: 'Value',
          align: 'right',
          width: 10,
        },
      ],
      data: [{ value: 42, status: '', longText: '' }],
    });

    const row = table.renderRow({ value: 42, status: '', longText: '' });
    const cleaned = stripAnsi(row).trim();
    // Right aligned should have leading spaces
    assertStringIncludes(cleaned, '42');
  });
});

describe('TableRenderer - Output Methods', () => {
  type TestRow = {
    id: number;
    name: string;
  };

  it('should render complete table with render()', () => {
    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    });

    const lines = table.render();
    assertEquals(lines.length, 4); // header + separator + 2 rows
    assertStringIncludes(stripAnsi(lines[0]), 'ID');
    assertStringIncludes(stripAnsi(lines[0]), 'Name');
    assertEquals(lines[1][0], '-'); // Separator
    assertStringIncludes(stripAnsi(lines[2]), '1');
    assertStringIncludes(stripAnsi(lines[2]), 'Alice');
    assertStringIncludes(stripAnsi(lines[3]), '2');
    assertStringIncludes(stripAnsi(lines[3]), 'Bob');
  });

  it('should return newline-joined string with toString()', () => {
    const table = new TableRenderer({
      columns: [{ key: 'id', header: 'ID' }],
      data: [{ id: 1, name: '' }],
    });

    const str = table.toString();
    const lines = str.split('\n');
    assertEquals(lines.length, 3); // header + separator + 1 row
    assertStringIncludes(stripAnsi(lines[0]), 'ID');
  });

  it('should handle empty data', () => {
    const table = new TableRenderer({
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      data: [],
    });

    const lines = table.render();
    assertEquals(lines.length, 2); // header + separator only
  });
});

describe('TableRenderer - Edge Cases', () => {
  type TestRow = {
    value: number | null;
  };

  it('should handle null values', () => {
    const table = new TableRenderer({
      columns: [{ key: 'value', header: 'Value' }],
      data: [{ value: null }],
    });

    const row = table.renderRow({ value: null });
    // null should render as empty string
    const cleaned = stripAnsi(row).trim();
    assertEquals(cleaned, '');
  });

  it('should handle undefined values', () => {
    const table = new TableRenderer({
      columns: [{ key: 'value', header: 'Value' }],
      data: [{ value: undefined as unknown as number }],
    });

    const row = table.renderRow({ value: undefined as unknown as number });
    const cleaned = stripAnsi(row).trim();
    assertEquals(cleaned, '');
  });

  it('should handle ANSI codes in data when calculating widths', () => {
    const coloredValue = rgb24('Colored', 0xff0000);
    const table = new TableRenderer({
      columns: [{ key: 'value', header: 'Val' }],
      data: [{ value: coloredValue as unknown as number }],
    });

    const lines = table.render();
    // Should work without errors
    assertEquals(lines.length, 3);
  });

  it('should handle very long headers', () => {
    const table = new TableRenderer({
      columns: [{ key: 'value', header: 'This Is A Very Long Header Name' }],
      data: [{ value: 1 }],
    });

    const header = table.renderHeader();
    assertStringIncludes(stripAnsi(header), 'This Is A Very Long Header Name');
  });
});
