/**
 * Example 03: Table with Formatters
 *
 * Demonstrates how to use the built-in formatters for percentages,
 * bytes, and uptime.
 */

import { bold, rgb24 } from '@std/fmt/colors';
import { formatters } from '../src/formatters.ts';
import { TableRenderer } from '../src/render.ts';
import type { ColumnRegistry } from '../src/types.ts';
import { buildColumns } from '../src/utils.ts';

Deno.test('Example 03: Formatters', async (t) => {
  await t.step('should render a table with formatted values', () => {
    type ProcessInfo = {
      pid: number;
      name: string;
      cpu: number;
      memory: number;
      uptime: number;
      run: boolean;
      mod: boolean;
      app: boolean;
    };

    const processes: ProcessInfo[] = [
      { pid: 1234, name: 'nginx', cpu: 0.023, memory: 52428800, uptime: 2700090, run: true, mod: false, app: true },
      {
        pid: 5678,
        name: 'postgres',
        cpu: 0.156,
        memory: 1073741824,
        uptime: 2700090,
        run: true,
        mod: true,
        app: false,
      },
      { pid: 9012, name: 'redis', cpu: 0.089, memory: 268435456, uptime: 86400, run: false, mod: false, app: false },
      { pid: 3456, name: 'node', cpu: 0.445, memory: 536870912, uptime: 3600, run: true, mod: false, app: true },
      { pid: 7890, name: 'python', cpu: 0.012, memory: 134217728, uptime: 7200, run: false, mod: false, app: false },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<ProcessInfo> = {
      pid: { header: 'PID', align: 'right' },
      name: { header: 'Process', align: 'left' },
      cpu: {
        header: 'CPU %',
        align: 'right',
        formatter: formatters.percent(2),
      },
      memory: {
        header: 'Memory',
        align: 'right',
        formatter: formatters.bytes(1),
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatters.uptime(),
      },
      run: {
        header: 'Run',
        align: 'center',
        formatter: formatters.bool('check'),
      },
      mod: {
        header: 'Mod',
        align: 'center',
        formatter: formatters.bool('circleRed'),
      },
      app: {
        header: 'App',
        align: 'center',
        formatter: formatters.bool('circleDot'),
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['pid', 'name', 'cpu', 'memory', 'uptime', 'run', 'mod', 'app'], columns),
      data: processes,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 03: Process Table with Formatters ===\n');
    table.print();
    console.log('');
    console.log('Formatters used:');
    console.log('  - formatters.percent(2): Formats decimals as percentages');
    console.log('  - formatters.bytes(1): Formats bytes to human-readable units');
    console.log('  - formatters.uptime(): Formats seconds to duration strings');
    console.log("  - formatters.bool('check'): Formats boolean values as checked/unchecked symbols");
    console.log('');
  });
});
