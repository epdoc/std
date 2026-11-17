import { assertEquals } from '@std/assert';
import { TableRenderer } from '../src/render.ts';
import { table } from '../src/simple.ts';
import { stripAnsi } from '../src/terminal.ts';
import type { Column } from '../src/types.ts';
import { getAvailableWidth } from '../src/utils.ts';

/** 40-character values in three columns: a natural width of 40 each. */
const longRow: Record<string, string> = { a: 'x'.repeat(40), b: 'y'.repeat(40), c: 'z'.repeat(40) };

const longColumns: Column<Record<string, string>>[] = [
  { key: 'a', header: 'A' },
  { key: 'b', header: 'B' },
  { key: 'c', header: 'C' },
];

Deno.test('fit - constructor API', async (t) => {
  await t.step('should fit to availableWidth from the constructor', () => {
    // Regression: the constructor used to pre-compute widths without fitting,
    // so #ensureWidths() saw a cached value and `fit` was silently ignored.
    const lines = new TableRenderer({
      columns: longColumns,
      data: [longRow],
      fit: true,
      availableWidth: 80,
    }).render();

    for (const line of lines) {
      assertEquals(stripAnsi(line).length <= 80, true, `line exceeds 80: ${line.length}`);
    }
    assertEquals(stripAnsi(lines[0]).length, 80);
  });

  await t.step('should not fit when fit is false', () => {
    const lines = new TableRenderer({
      columns: longColumns,
      data: [longRow],
      availableWidth: 80,
    }).render();
    // 3 * 40 columns + 2 gaps of 2
    assertEquals(stripAnsi(lines[0]).length, 124);
  });

  await t.step('should shrink right-to-left down to the global minWidth', () => {
    const lines = new TableRenderer({
      columns: longColumns,
      data: [longRow],
      fit: true,
      availableWidth: 40,
      minWidth: 10,
    }).render();
    // 40 + 10 + 10 content + 2 gaps of 2
    assertEquals(stripAnsi(lines[0]).length, 40);
  });

  await t.step('should not shrink a column with an explicit width', () => {
    const lines = new TableRenderer({
      columns: [
        { key: 'a', header: 'A', width: 30 },
        { key: 'b', header: 'B' },
        { key: 'c', header: 'C' },
      ],
      data: [longRow],
      fit: true,
      availableWidth: 50,
    }).render();
    // 'a' is fixed at 30, so b and c stop at the global minWidth of 10 and the
    // table still exceeds the requested width: 30 + 10 + 10 + 4 = 54.
    assertEquals(stripAnsi(lines[0]).length, 54);
  });

  await t.step('should truncate with an ellipsis when shrunk', () => {
    const lines = new TableRenderer({
      columns: longColumns,
      data: [longRow],
      fit: true,
      availableWidth: 40,
    }).render();
    // lines[0] is the header; data rows follow the separator
    assertEquals(lines[2].includes('…'), true);
  });
});

Deno.test('fit - fluent API', async (t) => {
  await t.step('should fit when enabled before rendering', () => {
    const lines = TableRenderer.create<Record<string, string>>()
      .column('a', { header: 'A' }).column('b', { header: 'B' }).column('c', { header: 'C' })
      .data([longRow])
      .fit()
      .availableWidth(80)
      .render();
    assertEquals(stripAnsi(lines[0]).length, 80);
  });

  await t.step('should re-fit when fit is enabled after a render', () => {
    const renderer = new TableRenderer({ columns: longColumns, data: [longRow], availableWidth: 80 });
    assertEquals(stripAnsi(renderer.render()[0]).length, 124);
    renderer.fit();
    assertEquals(stripAnsi(renderer.render()[0]).length, 80);
  });

  await t.step('should re-fit when availableWidth changes', () => {
    const renderer = new TableRenderer({ columns: longColumns, data: [longRow], fit: true, availableWidth: 80 });
    assertEquals(stripAnsi(renderer.render()[0]).length, 80);
    renderer.availableWidth(50);
    assertEquals(stripAnsi(renderer.render()[0]).length, 50);
  });
});

Deno.test('fit - simple API', async (t) => {
  await t.step('should fit when .fit() is used', () => {
    // Regression: the simple API passes columns + data to the TableRenderer
    // constructor, so it hit the same silently-ignored `fit` path.
    const lines = table([longRow], ['a', 'b', 'c']).noBorders().fit().availableWidth(80).render();
    assertEquals(stripAnsi(lines[0]).length, 80);
  });

  await t.step('should fit via options', () => {
    const lines = table([longRow], { columns: ['a', 'b', 'c'], fit: true, availableWidth: 80 })
      .noBorders()
      .render();
    assertEquals(stripAnsi(lines[0]).length, 80);
  });
});

Deno.test('getAvailableWidth', async (t) => {
  await t.step('should prefer an explicit override', () => {
    assertEquals(getAvailableWidth(123), 123);
  });

  await t.step('should fall back to a number when no terminal is attached', () => {
    const width = getAvailableWidth();
    assertEquals(typeof width, 'number');
    assertEquals(width > 0, true);
  });
});
