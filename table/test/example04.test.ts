/**
 * Example 04: Fluent API
 *
 * Demonstrates the fluent API for building tables incrementally.
 */

import { bold, rgb24 } from '@std/fmt/colors';
import { describe, it } from '@std/testing/bdd';
import { formatters } from '../src/formatters.ts';
import { TableRenderer } from '../src/render.ts';

describe('Example 04: Fluent API', () => {
  it('should build a table using the fluent API', () => {
    type Metric = {
      name: string;
      value: number;
      change: number;
      status: string;
    };

    const metrics: Metric[] = [
      { name: 'Response Time', value: 0.125, change: -0.023, status: 'good' },
      { name: 'Error Rate', value: 0.002, change: 0.001, status: 'warning' },
      { name: 'Throughput', value: 15234, change: 1250, status: 'good' },
      { name: 'Memory Usage', value: 0.678, change: 0.045, status: 'warning' },
      { name: 'CPU Usage', value: 0.456, change: -0.089, status: 'good' },
    ];

    const green = 0x51d67c;
    const amber = 0xffb020;
    const cyan = 0x58d1eb;
    const bgEven = 0x1a1a2e;

    // Build table using fluent API
    const table = TableRenderer.create<Metric>()
      .column('name', {
        header: 'Metric',
        align: 'left',
      })
      .column('value', {
        header: 'Current',
        align: 'right',
        formatter: (v: unknown) => {
          const num = v as number;
          // Format based on value range
          if (num < 1) return formatters.percent(1)(num);
          return num.toFixed(0);
        },
      })
      .column('change', {
        header: 'Change',
        align: 'right',
        formatter: (v: unknown) => {
          const num = v as number;
          const sign = num >= 0 ? '+' : '';
          if (Math.abs(num) < 1) {
            return `${sign}${(num * 100).toFixed(1)}%`;
          }
          return `${sign}${num.toFixed(0)}`;
        },
        color: (v: unknown) => {
          const num = v as number;
          if (num < 0) return (s: string) => rgb24(s, green);
          if (num > 0) return (s: string) => rgb24(s, amber);
          return undefined;
        },
      })
      .column('status', {
        header: 'Status',
        align: 'left',
        color: (_v: unknown, row: Metric) => {
          if (row.status === 'good') return (s: string) => rgb24(s, green);
          if (row.status === 'warning') return (s: string) => rgb24(s, amber);
          return undefined;
        },
      })
      .data(metrics)
      .headerStyle((s: string) => bold(rgb24(s, cyan)))
      .evenRow({ bg: bgEven })
      .padding(3);

    console.log('\n=== Example 04: Metrics Table (Fluent API) ===\n');
    table.print();
    console.log('');
    console.log('This table was built using the fluent API:');
    console.log('  TableRenderer.create<T>()');
    console.log('    .column(key, options)');
    console.log('    .data(rows)');
    console.log('    .headerStyle(fn)');
    console.log('    .evenRow(color, bg)');
    console.log('    .padding(n)');
    console.log('    .print()');
    console.log('');
  });
});
