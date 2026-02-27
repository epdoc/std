/**
 * Example 09: ColorType API
 *
 * Demonstrates the flexible ColorType API that accepts:
 * - Number (hex color for foreground) - most common
 * - ColorSpec ({ fg?, bg? }) - explicit foreground/background
 * - StyleFn - full control with custom ANSI styling
 */

import { describe, it } from '@std/testing/bdd';
import { bold, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import type { ColumnRegistry } from '../src/types.ts';

describe('Example 09: ColorType API', () => {
  it('should demonstrate simple number colors (foreground)', () => {
    type ServerStatus = {
      name: string;
      status: string;
      cpu: number;
      memory: number;
    };

    const servers: ServerStatus[] = [
      { name: 'web-01', status: 'running', cpu: 45.2, memory: 67.8 },
      { name: 'web-02', status: 'stopped', cpu: 0, memory: 0 },
      { name: 'db-01', status: 'running', cpu: 89.1, memory: 92.3 },
    ];

    const green = 0x51d67c;
    const red = 0xef5867;
    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<ServerStatus> = {
      name: { header: 'Name', align: 'left' },
      status: {
        header: 'Status',
        align: 'left',
        // Simple number for foreground color (most common)
        color: (_v, row) => row.status === 'running' ? green : red,
      },
      cpu: { header: 'CPU %', align: 'right' },
      memory: { header: 'Memory %', align: 'right' },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'status', 'cpu', 'memory'], columns),
      data: servers,
      headerStyle: cyan, // Simple number works here too
      padding: 3,
    });

    console.log('\n=== Example 09a: Simple Number Colors (Foreground) ===\n');
    console.log('Using hex numbers directly - the most common case:');
    console.log('  color: (_v, row) => row.status === \'running\' ? 0x51d67c : 0xef5867');
    console.log('  headerStyle: 0x58d1eb\n');
    table.print();
    console.log('');
  });

  it('should demonstrate ColorSpec for background colors', () => {
    type AlertLevel = {
      level: string;
      message: string;
      count: number;
    };

    const alerts: AlertLevel[] = [
      { level: 'info', message: 'System updated successfully', count: 1 },
      { level: 'warning', message: 'High memory usage detected', count: 5 },
      { level: 'error', message: 'Database connection failed', count: 12 },
      { level: 'critical', message: 'Security breach attempt', count: 3 },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<AlertLevel> = {
      level: {
        header: 'Level',
        align: 'left',
        // ColorSpec for background color
        color: (_v, row) => {
          if (row.level === 'critical') return { fg: 0xffffff, bg: 0xff0000 };
          if (row.level === 'error') return { bg: 0xef5867 };
          if (row.level === 'warning') return { bg: 0xffb020 };
          return { bg: 0x5b9bd5 };
        },
      },
      message: { header: 'Message', align: 'left', maxWidth: 40 },
      count: { header: 'Count', align: 'right' },
    };

    const table = new TableRenderer({
      columns: buildColumns(['level', 'message', 'count'], columns),
      data: alerts,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 09b: ColorSpec for Background Colors ===\n');
    console.log('Using ColorSpec { fg?, bg? } for background or combined colors:');
    console.log('  color: (_v, row) => {');
    console.log('    if (row.level === \'critical\') return { fg: 0xffffff, bg: 0xff0000 };');
    console.log('    if (row.level === \'error\') return { bg: 0xef5867 };');
    console.log('    ...');
    console.log('  }\n');
    table.print();
    console.log('');
  });

  it('should demonstrate mixed ColorType usage', () => {
    type Metric = {
      name: string;
      value: number;
      trend: string;
      priority: string;
    };

    const metrics: Metric[] = [
      { name: 'Response Time', value: 125, trend: 'down', priority: 'high' },
      { name: 'Error Rate', value: 0.5, trend: 'up', priority: 'critical' },
      { name: 'Throughput', value: 15234, trend: 'stable', priority: 'medium' },
      { name: 'CPU Usage', value: 67.8, trend: 'up', priority: 'high' },
    ];

    const green = 0x51d67c;
    const red = 0xef5867;
    const amber = 0xffb020;
    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Metric> = {
      name: { header: 'Metric', align: 'left' },
      value: {
        header: 'Value',
        align: 'right',
        // StyleFn for full control (bold + color)
        color: (_v, row) => {
          if (row.priority === 'critical') return (s: string) => bold(rgb24(s, red));
          if (row.priority === 'high') return (s: string) => bold(rgb24(s, amber));
          return undefined;
        },
      },
      trend: {
        header: 'Trend',
        align: 'left',
        // Simple number color
        color: (v) => {
          if (v === 'up') return red;
          if (v === 'down') return green;
          return 0x888888; // gray for stable
        },
      },
      priority: {
        header: 'Priority',
        align: 'left',
        // ColorSpec with both fg and bg
        color: (_v, row) => {
          if (row.priority === 'critical') return { fg: 0xffffff, bg: red };
          if (row.priority === 'high') return { fg: 0x000000, bg: amber };
          return undefined;
        },
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'value', 'trend', 'priority'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      rowStyles: [{ bg: 0x1a1a2e }, null], // Zebra striping with ColorSpec
      padding: 3,
    });

    console.log('\n=== Example 09c: Mixed ColorType Usage ===\n');
    console.log('Demonstrating all three ColorType variants in one table:');
    console.log('  - value column: StyleFn for bold + color');
    console.log('  - trend column: number for simple foreground color');
    console.log('  - priority column: ColorSpec for fg + bg');
    console.log('  - rowStyles: ColorSpec for zebra striping\n');
    table.print();
    console.log('');
  });

  it('should show comparison of all ColorType variants', () => {
    type Comparison = {
      variant: string;
      syntax: string;
      useCase: string;
    };

    const variants: Comparison[] = [
      {
        variant: 'Number',
        syntax: '0xff0000',
        useCase: 'Simple foreground color (90% of cases)',
      },
      {
        variant: 'ColorSpec fg',
        syntax: '{ fg: 0xff0000 }',
        useCase: 'Explicit foreground (same as number)',
      },
      {
        variant: 'ColorSpec bg',
        syntax: '{ bg: 0x1a1a2e }',
        useCase: 'Background color only',
      },
      {
        variant: 'ColorSpec both',
        syntax: '{ fg: 0xfff, bg: 0x000 }',
        useCase: 'Combined foreground + background',
      },
      {
        variant: 'StyleFn',
        syntax: '(s) => bold(rgb24(s, c))',
        useCase: 'Full control: bold, italic, composed',
      },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Comparison> = {
      variant: { header: 'Variant', align: 'left' },
      syntax: { header: 'Syntax', align: 'left' },
      useCase: { header: 'Use Case', align: 'left', maxWidth: 35 },
    };

    const table = new TableRenderer({
      columns: buildColumns(['variant', 'syntax', 'useCase'], columns),
      data: variants,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 09d: ColorType Variants Reference ===\n');
    table.print();
    console.log('');
    console.log('Key points:');
    console.log('  ✓ Use number (hex color) for most cases - simple and clean');
    console.log('  ✓ Use ColorSpec { fg?, bg? } when you need background or both');
    console.log('  ✓ Use StyleFn for advanced styling (bold, italic, composed)');
    console.log('  ✓ All three work in color callbacks, headerStyle, and rowStyles');
    console.log('');
  });
});
