/**
 * Example 06: Dim Units Pattern
 *
 * Demonstrates using dim() styling to de-emphasize units while keeping
 * the numeric values prominent. This creates a cleaner visual hierarchy.
 */

import { describe, it } from '@std/testing/bdd';
import { bold, dim, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import type { ColumnRegistry } from '../src/types.ts';

describe('Example 06: Dim Units', () => {
  it('should render a table with dimmed units for better readability', () => {
    type SystemMetric = {
      resource: string;
      current: number;
      peak: number;
      average: number;
      uptime: number;
    };

    const metrics: SystemMetric[] = [
      { resource: 'CPU Usage', current: 0.452, peak: 0.891, average: 0.623, uptime: 2700090 },
      { resource: 'Memory Usage', current: 0.678, peak: 0.892, average: 0.734, uptime: 2700090 },
      { resource: 'Disk I/O', current: 0.234, peak: 0.756, average: 0.401, uptime: 2700090 },
      { resource: 'Network Usage', current: 0.123, peak: 0.445, average: 0.256, uptime: 2700090 },
      { resource: 'Swap Usage', current: 0.045, peak: 0.234, average: 0.112, uptime: 2700090 },
    ];

    const cyan = 0x58d1eb;
    const amber = 0xffb020;
    const red = 0xef5867;

    // Custom formatter that dims the percent sign
    const formatPercentWithDimUnits = (v: unknown): string => {
      const num = v as number;
      const percent = num * 100;
      const value = percent.toFixed(1);
      return `${value}${dim('%')}`;
    };

    // Custom formatter that dims the time units
    const formatUptimeWithDimUnits = (v: unknown): string => {
      const seconds = v as number;
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}${dim('d')}`);
      if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}${dim('h')}`);
      if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}${dim('m')}`);

      return parts.join('');
    };

    // Color function for percentage values
    const percentColor = (v: unknown): ((s: string) => string) | undefined => {
      const num = v as number;
      const percent = num * 100;
      if (percent > 80) return (s: string) => rgb24(s, red);
      if (percent > 60) return (s: string) => rgb24(s, amber);
      return undefined;
    };

    const columns: ColumnRegistry<SystemMetric> = {
      resource: {
        header: 'Resource',
        align: 'left',
      },
      current: {
        header: 'Current',
        align: 'right',
        formatter: formatPercentWithDimUnits,
        color: percentColor,
      },
      peak: {
        header: 'Peak',
        align: 'right',
        formatter: formatPercentWithDimUnits,
        color: percentColor,
      },
      average: {
        header: 'Average',
        align: 'right',
        formatter: formatPercentWithDimUnits,
        color: percentColor,
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatUptimeWithDimUnits,
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['resource', 'current', 'peak', 'average', 'uptime'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 06: System Metrics with Dimmed Units ===\n');
    table.print();
    console.log('');
    console.log('Notice how the units (%, d, h, m) are dimmed:');
    console.log('  - Numeric values stand out');
    console.log('  - Units are present but subtle');
    console.log('  - Creates better visual hierarchy');
    console.log('  - Color coding still applies to full cell');
    console.log('');
    console.log('Implementation:');
    console.log('  const formatPercentWithDimUnits = (v: unknown): string => {');
    console.log('    const num = v as number;');
    console.log('    const percent = num * 100;');
    console.log('    const value = percent.toFixed(1);');
    console.log("    return `${value}${dim('%')}`;");
    console.log('  };');
    console.log('');
  });

  it('should show comparison: with and without dimmed units', () => {
    type Comparison = {
      metric: string;
      withDim: string;
      withoutDim: string;
    };

    // Manually construct examples to show the difference
    const examples: Comparison[] = [
      { metric: 'CPU Usage', withDim: `45.2${dim('%')}`, withoutDim: '45.2%' },
      { metric: 'Memory', withDim: `67.8${dim('%')}`, withoutDim: '67.8%' },
      { metric: 'Uptime', withDim: `31${dim('d')}06${dim('h')}01${dim('m')}`, withoutDim: '31d06h01m' },
      { metric: 'Disk I/O', withDim: `23.4${dim('%')}`, withoutDim: '23.4%' },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Comparison> = {
      metric: { header: 'Metric', align: 'left' },
      withDim: { header: 'With dim()', align: 'right' },
      withoutDim: { header: 'Without dim()', align: 'right' },
    };

    const table = new TableRenderer({
      columns: buildColumns(['metric', 'withDim', 'withoutDim'], columns),
      data: examples,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Comparison: Dimmed vs Regular Units ===\n');
    table.print();
    console.log('');
    console.log('The left column uses dim() on units for better focus on values.');
    console.log('');
  });
});
