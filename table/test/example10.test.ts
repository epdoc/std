/**
 * Example 10: noColor Option
 *
 * Demonstrates the noColor option for outputting tables without ANSI color codes.
 * Useful when writing to files, logs, or terminals without color support.
 */

import { describe, it } from '@std/testing/bdd';
import { bold, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import { formatters } from '../src/formatters.ts';
import { stripAnsi } from '../src/terminal.ts';
import type { ColumnRegistry } from '../src/types.ts';

describe('Example 10: noColor Option', () => {
  it('should demonstrate colored vs plain output side-by-side', () => {
    type ServerStatus = {
      name: string;
      status: string;
      cpu: number;
      memory: number;
      uptime: number;
    };

    const servers: ServerStatus[] = [
      { name: 'web-01', status: 'running', cpu: 45.2, memory: 1073741824, uptime: 2700090 },
      { name: 'web-02', status: 'stopped', cpu: 0, memory: 0, uptime: 0 },
      { name: 'db-01', status: 'running', cpu: 89.1, memory: 4294967296, uptime: 7890123 },
    ];

    const green = 0x51d67c;
    const red = 0xef5867;
    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<ServerStatus> = {
      name: { header: 'Name', align: 'left' },
      status: {
        header: 'Status',
        align: 'left',
        color: (_v, row) => row.status === 'running' ? green : red,
      },
      cpu: {
        header: 'CPU',
        align: 'right',
        formatter: formatters.percent({ decimals: 1, unitColor: 0x888888 }),
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
    };

    // Table WITH colors
    const tableColored = new TableRenderer({
      columns: buildColumns(['name', 'status', 'cpu', 'memory', 'uptime'], columns),
      data: servers,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      rowStyles: [{ bg: 0x1a1a2e }, null],
      padding: 3,
      noColor: false, // Colors enabled
    });

    // Table WITHOUT colors
    const tablePlain = new TableRenderer({
      columns: buildColumns(['name', 'status', 'cpu', 'memory', 'uptime'], columns),
      data: servers,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      rowStyles: [{ bg: 0x1a1a2e }, null],
      padding: 3,
      noColor: true, // Colors disabled
    });

    console.log('\n=== Example 10a: Colored Output (noColor: false) ===\n');
    tableColored.print();

    console.log('\n=== Example 10b: Plain Output (noColor: true) ===\n');
    tablePlain.print();

    console.log('\nNote: The plain output has no ANSI codes and is safe for:');
    console.log('  - Writing to text files');
    console.log("  - Logging systems that don't support ANSI");
    console.log('  - Terminals without color support');
    console.log('  - Copy/paste into documentation');
    console.log('');
  });

  it('should demonstrate fluent API with noColor', () => {
    type LogEntry = {
      timestamp: string;
      level: string;
      message: string;
    };

    const logs: LogEntry[] = [
      { timestamp: '2024-01-15 10:23:45', level: 'INFO', message: 'Application started' },
      { timestamp: '2024-01-15 10:24:12', level: 'WARN', message: 'High memory usage detected' },
      { timestamp: '2024-01-15 10:25:33', level: 'ERROR', message: 'Database connection failed' },
    ];

    const cyan = 0x58d1eb;
    const amber = 0xffb020;
    const red = 0xef5867;

    const table = TableRenderer.create<LogEntry>()
      .column('timestamp', { header: 'Timestamp', align: 'left' })
      .column('level', {
        header: 'Level',
        align: 'left',
        color: (_v, row) => {
          if (row.level === 'ERROR') return red;
          if (row.level === 'WARN') return amber;
          return cyan;
        },
      })
      .column('message', { header: 'Message', align: 'left', maxWidth: 40 })
      .data(logs)
      .headerStyle((s: string) => bold(rgb24(s, cyan)))
      .evenRow({ bg: 0x1a1a2e })
      .padding(3)
      .noColor(true); // Fluent method

    console.log('\n=== Example 10c: Fluent API with noColor() ===\n');
    console.log('Table built using fluent API with .noColor(true):\n');
    table.print();
    console.log('');
  });

  it('should demonstrate Deno.noColor auto-detection pattern', () => {
    type SystemMetric = {
      metric: string;
      value: number;
    };

    const metrics: SystemMetric[] = [
      { metric: 'CPU Usage', value: 0.678 },
      { metric: 'Memory Usage', value: 0.892 },
      { metric: 'Disk Usage', value: 0.456 },
    ];

    const cyan = 0x58d1eb;
    const columns: ColumnRegistry<SystemMetric> = {
      metric: { header: 'Metric', align: 'left' },
      value: {
        header: 'Value',
        align: 'right',
        formatter: formatters.percent(1),
      },
    };

    // Auto-detect based on Deno.noColor (respects NO_COLOR env var and TTY status)
    const table = new TableRenderer({
      columns: buildColumns(['metric', 'value'], columns),
      data: metrics,
      headerStyle: cyan,
      noColor: Deno.noColor, // Auto-detect from environment
      padding: 3,
    });

    console.log('\n=== Example 10d: Auto-detect with Deno.noColor ===\n');
    console.log(`Deno.noColor = ${Deno.noColor}`);
    console.log('Using: noColor: Deno.noColor\n');
    table.print();
    console.log('');
    console.log('This respects:');
    console.log('  - NO_COLOR environment variable');
    console.log('  - Whether stdout is a TTY');
    console.log('  - User preferences for color output');
    console.log('');
  });

  it('should verify stripAnsi safety net catches formatter colors', () => {
    type Product = {
      name: string;
      price: number;
    };

    const products: Product[] = [
      { name: 'Widget', price: 19.99 },
      { name: 'Gadget', price: 49.99 },
    ];

    // Formatter that embeds color codes
    const priceFormatterWithColor = (v: unknown): string => {
      const price = Number(v);
      // This formatter directly embeds ANSI color codes
      return rgb24(`$${price.toFixed(2)}`, 0x00ff00);
    };

    const columns: ColumnRegistry<Product> = {
      name: { header: 'Product', align: 'left' },
      price: {
        header: 'Price',
        align: 'right',
        formatter: priceFormatterWithColor, // Formatter with embedded color
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'price'], columns),
      data: products,
      headerStyle: 0x58d1eb,
      noColor: true, // Should strip formatter colors too
      padding: 3,
    });

    console.log('\n=== Example 10e: Safety Net for Formatter Colors ===\n');
    console.log('Formatter embeds ANSI codes, but noColor strips them:\n');
    table.print();

    // Verify all lines are actually clean
    const lines = table.render();
    const allClean = lines.every((line) => line === stripAnsi(line));
    console.log(`\nAll lines free of ANSI codes: ${allClean}`);
    console.log('');
  });
});
