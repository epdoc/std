/**
 * Compile-time guards for the column typing.
 *
 * These assertions are checked by `deno check`, not at runtime. They exist so
 * that the per-key value typing of `Column` / `ColumnRegistry` cannot regress
 * unnoticed — a regression shows up as a type error here rather than as silent
 * `unknown` values in a consumer's formatter.
 */
import { assertEquals } from '@std/assert';
import { buildColumns } from '../src/utils.ts';
import { TableRenderer } from '../src/render.ts';
import type { Column, ColumnRegistry } from '../src/types.ts';

interface Metrics {
  host: string;
  cpu: number;
  online: boolean;
  tags: string[];
}

Deno.test('column typing', async (t) => {
  await t.step('registry formatters receive the exact value type', () => {
    const registry: ColumnRegistry<Metrics> = {
      // Each of these would fail to compile if the value were `unknown`.
      cpu: { header: 'CPU', formatter: (v) => v.toFixed(1) },
      online: { header: 'Up', formatter: (v) => (v ? 'yes' : 'no') },
      tags: { header: 'Tags', formatter: (v) => v.join(',') },
      host: {
        header: 'Host',
        color: (v) => (v.startsWith('db') ? 0x51d67c : undefined),
      },
    };

    const columns = buildColumns<Metrics>(['host', 'cpu', 'online', 'tags'], registry);
    const rendered = new TableRenderer<Metrics>({
      columns,
      data: [{
        host: 'db1',
        cpu: 42,
        online: true,
        tags: ['a', 'b'],
      }],
    }).toString();

    assertEquals(rendered.includes('42.0'), true);
    assertEquals(rendered.includes('yes'), true);
    assertEquals(rendered.includes('a,b'), true);
  });

  await t.step('a narrowed column is assignable to a Column<T>[]', () => {
    // Bivariance via method syntax: precise columns must stay usable in the
    // generic array that Options<T> expects.
    const cpuColumn: Column<Metrics, 'cpu'> = {
      key: 'cpu',
      header: 'CPU',
      formatter: (v) => v.toFixed(2),
    };
    const columns: Column<Metrics>[] = [cpuColumn, { key: 'host', header: 'Host' }];

    const rendered = new TableRenderer<Metrics>({
      columns,
      data: [{ host: 'h', cpu: 1.5, online: true, tags: [] }],
    }).toString();

    assertEquals(rendered.includes('1.50'), true);
  });

  await t.step('the fluent column() narrows per key', () => {
    const renderer = TableRenderer.create<Metrics>()
      .column('cpu', { header: 'CPU', formatter: (v) => v.toFixed(3) })
      .column('online', { header: 'Up', formatter: (v) => (v ? 'up' : 'down') })
      .data([{ host: 'h', cpu: 2, online: false, tags: [] }]);

    const rendered = renderer.toString();
    assertEquals(rendered.includes('2.000'), true);
    assertEquals(rendered.includes('down'), true);
  });

  await t.step('dynamic string-keyed columns remain unconstrained', () => {
    const columns: Column<Record<string, string>>[] = [
      { key: 'anything', header: 'Anything' },
      { key: 'notDeclaredAnywhere', header: 'Other' },
    ];
    const rendered = new TableRenderer<Record<string, string>>({
      columns,
      data: [{ anything: 'x', notDeclaredAnywhere: 'y' }],
    }).toString();

    assertEquals(rendered.includes('x'), true);
    assertEquals(rendered.includes('y'), true);
  });
});
