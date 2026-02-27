/**
 * Example 07: Unit Styling Alternatives
 *
 * Demonstrates different approaches to styling units for better readability
 * while maintaining visual hierarchy. Compares several alternatives to dim().
 */

import { bold, dim, italic, rgb24 } from '@std/fmt/colors';
import { describe, it } from '@std/testing/bdd';
import { TableRenderer } from '../src/render.ts';
import type { ColumnRegistry } from '../src/types.ts';
import { buildColumns } from '../src/utils.ts';

describe('Example 07: Unit Styling Alternatives', () => {
  it('should compare different unit styling approaches', () => {
    type Metric = {
      approach: string;
      cpu: string;
      memory: string;
      uptime: string;
      notes: string;
    };

    // Define colors for units (softer/muted colors)
    const gray = 0x888888;
    const lightBlue = 0x5b9bd5;
    const _sage = 0x87a96b;

    // Sample data showing different styling approaches
    const metrics: Metric[] = [
      {
        approach: 'Plain',
        cpu: '45.2%',
        memory: '67.8%',
        uptime: '31d06h01m',
        notes: 'No styling - units blend with values',
      },
      {
        approach: 'dim()',
        cpu: `45.2${dim('%')}`,
        memory: `67.8${dim('%')}`,
        uptime: `31${dim('d')}06${dim('h')}01${dim('m')}`,
        notes: 'Too subtle in many terminals',
      },
      {
        approach: 'Gray color',
        cpu: `45.2${rgb24('%', gray)}`,
        memory: `67.8${rgb24('%', gray)}`,
        uptime: `31${rgb24('d', gray)}06${rgb24('h', gray)}01${rgb24('m', gray)}`,
        notes: 'Clear hierarchy, readable',
      },
      {
        approach: 'Muted blue',
        cpu: `45.2${rgb24('%', lightBlue)}`,
        memory: `67.8${rgb24('%', lightBlue)}`,
        uptime: `31${rgb24('d', lightBlue)}06${rgb24('h', lightBlue)}01${rgb24('m', lightBlue)}`,
        notes: 'Subtle but distinct',
      },
      {
        approach: 'Italic',
        cpu: `45.2${italic('%')}`,
        memory: `67.8${italic('%')}`,
        uptime: `31${italic('d')}06${italic('h')}01${italic('m')}`,
        notes: 'Style-based (not all terminals)',
      },
      {
        approach: 'Smaller size',
        cpu: '45.2 %',
        memory: '67.8 %',
        uptime: '31d 06h 01m',
        notes: 'Space separation - simple & clean',
      },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Metric> = {
      approach: { header: 'Approach', align: 'left' },
      cpu: { header: 'CPU', align: 'right' },
      memory: { header: 'Memory', align: 'right' },
      uptime: { header: 'Uptime', align: 'right' },
      notes: { header: 'Notes', align: 'left', maxWidth: 35 },
    };

    const table = new TableRenderer({
      columns: buildColumns(['approach', 'cpu', 'memory', 'uptime', 'notes'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 07: Unit Styling Approaches Comparison ===\n');
    table.print();
    console.log('');
  });

  it('should show recommended approach: muted color units', () => {
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
    ];

    const cyan = 0x58d1eb;
    const amber = 0xffb020;
    const red = 0xef5867;
    const gray = 0x888888; // Muted gray for units - readable in all themes

    // Formatter with muted color units (recommended)
    const formatPercentWithUnits = (v: unknown): string => {
      const num = v as number;
      const percent = num * 100;
      const value = percent.toFixed(1);
      return `${value}${rgb24('%', gray)}`;
    };

    // Formatter with muted color units for uptime
    const formatUptimeWithUnits = (v: unknown): string => {
      const seconds = v as number;
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}${rgb24('d', gray)}`);
      if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}${rgb24('h', gray)}`);
      if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}${rgb24('m', gray)}`);

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
      resource: { header: 'Resource', align: 'left' },
      current: {
        header: 'Current',
        align: 'right',
        formatter: formatPercentWithUnits,
        color: percentColor,
      },
      peak: {
        header: 'Peak',
        align: 'right',
        formatter: formatPercentWithUnits,
        color: percentColor,
      },
      average: {
        header: 'Average',
        align: 'right',
        formatter: formatPercentWithUnits,
        color: percentColor,
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatUptimeWithUnits,
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['resource', 'current', 'peak', 'average', 'uptime'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Recommended: Muted Gray Color for Units ===\n');
    table.print();
    console.log('');
    console.log('Why muted gray (#888888) works best:');
    console.log('  ✓ Readable in both light and dark terminals');
    console.log('  ✓ Creates clear visual hierarchy');
    console.log('  ✓ Units are distinct but not distracting');
    console.log('  ✓ Works with conditional coloring on values');
    console.log('  ✓ More reliable than dim() styling');
    console.log('');
    console.log('Implementation:');
    console.log('  const gray = 0x888888;');
    console.log("  return `${value}${rgb24('%', gray)}`;");
    console.log('');
  });

  it('should show alternative: space-separated units', () => {
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
    ];

    const cyan = 0x58d1eb;
    const amber = 0xffb020;
    const red = 0xef5867;

    // Simple space-separated approach - no special styling needed
    const formatPercentSimple = (v: unknown): string => {
      const percent = (v as number) * 100;
      return `${percent.toFixed(1)} %`;
    };

    const formatUptimeSimple = (v: unknown): string => {
      const seconds = v as number;
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
      if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}m`);

      return parts.join(' ');
    };

    const percentColor = (v: unknown): ((s: string) => string) | undefined => {
      const num = v as number;
      const percent = num * 100;
      if (percent > 80) return (s: string) => rgb24(s, red);
      if (percent > 60) return (s: string) => rgb24(s, amber);
      return undefined;
    };

    const columns: ColumnRegistry<SystemMetric> = {
      resource: { header: 'Resource', align: 'left' },
      current: {
        header: 'Current',
        align: 'right',
        formatter: formatPercentSimple,
        color: percentColor,
      },
      peak: {
        header: 'Peak',
        align: 'right',
        formatter: formatPercentSimple,
        color: percentColor,
      },
      average: {
        header: 'Average',
        align: 'right',
        formatter: formatPercentSimple,
        color: percentColor,
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatUptimeSimple,
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['resource', 'current', 'peak', 'average', 'uptime'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Alternative: Space-Separated Units ===\n');
    table.print();
    console.log('');
    console.log('Space-separated approach benefits:');
    console.log('  ✓ Simple - no special styling code');
    console.log('  ✓ Clean and readable');
    console.log('  ✓ Natural separation');
    console.log('  ✓ Works in all terminals');
    console.log('  ✓ Color applies to entire cell equally');
    console.log('');
    console.log('Trade-off: Takes slightly more space');
    console.log('');
  });
});
