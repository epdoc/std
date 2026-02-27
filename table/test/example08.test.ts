/**
 * Example 08: Formatter Options API
 *
 * Demonstrates the new options API for built-in formatters, showing how to:
 * - Use default space-separated formatting
 * - Customize separators between values and units
 * - Apply custom colors to units
 * - Control number of decimal places and time units
 */

import { describe, it } from '@std/testing/bdd';
import { bold, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import { formatters } from '../src/formatters.ts';
import type { ColumnRegistry } from '../src/types.ts';

describe('Example 08: Formatter Options API', () => {
  it('should show default space-separated formatting', () => {
    type Resource = {
      name: string;
      cpu: number;
      memory: number;
      disk: number;
      uptime: number;
    };

    const resources: Resource[] = [
      { name: 'web-server', cpu: 0.452, memory: 1073741824, disk: 5368709120, uptime: 2700090 },
      { name: 'db-primary', cpu: 0.678, memory: 4294967296, disk: 107374182400, uptime: 7890123 },
      { name: 'cache-node', cpu: 0.234, memory: 536870912, disk: 2147483648, uptime: 345678 },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Resource> = {
      name: { header: 'Name', align: 'left' },
      cpu: {
        header: 'CPU',
        align: 'right',
        formatter: formatters.percent(1), // Default: space separator
      },
      memory: {
        header: 'Memory',
        align: 'right',
        formatter: formatters.bytes(1), // Default: space separator
      },
      disk: {
        header: 'Disk',
        align: 'right',
        formatter: formatters.bytes(2), // Default: space separator, 2 decimals
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatters.uptime(), // Default: no separator (Duration.Formatter style)
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'cpu', 'memory', 'disk', 'uptime'], columns),
      data: resources,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 08a: Default Space-Separated Formatting ===\n');
    console.log('Using formatters with default options:');
    console.log('  - percent(1)  → "45.2 %"');
    console.log('  - bytes(1)    → "1.0 GiB"');
    console.log('  - bytes(2)    → "5.00 GiB"');
    console.log('  - uptime()    → "31d06h01m" (no spaces by default)\n');
    table.print();
    console.log('');
  });

  it('should show compact formatting with no separators', () => {
    type Resource = {
      name: string;
      cpu: number;
      memory: number;
      uptime: number;
    };

    const resources: Resource[] = [
      { name: 'api-gateway', cpu: 0.345, memory: 2147483648, uptime: 1234567 },
      { name: 'worker-01', cpu: 0.567, memory: 1073741824, uptime: 567890 },
      { name: 'worker-02', cpu: 0.432, memory: 1073741824, uptime: 456789 },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Resource> = {
      name: { header: 'Name', align: 'left' },
      cpu: {
        header: 'CPU',
        align: 'right',
        formatter: formatters.percent({ decimals: 1, separator: '' }),
      },
      memory: {
        header: 'Memory',
        align: 'right',
        formatter: formatters.bytes({ decimals: 1, separator: '' }),
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatters.uptime({ separator: '' }),
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'cpu', 'memory', 'uptime'], columns),
      data: resources,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 08b: Compact Formatting (No Separators) ===\n');
    console.log('Using formatters with separator: "":');
    console.log('  - percent({ decimals: 1, separator: "" })  → "34.5%"');
    console.log('  - bytes({ decimals: 1, separator: "" })    → "2.0GiB"');
    console.log('  - uptime({ separator: "" })                → "14d06h56m"\n');
    table.print();
    console.log('');
  });

  it('should show colored units for visual hierarchy', () => {
    type SystemMetric = {
      resource: string;
      current: number;
      peak: number;
      capacity: number;
      uptime: number;
    };

    const metrics: SystemMetric[] = [
      { resource: 'CPU Usage', current: 0.452, peak: 0.891, capacity: 8589934592, uptime: 2700090 },
      { resource: 'Memory Usage', current: 0.678, peak: 0.892, capacity: 17179869184, uptime: 2700090 },
      { resource: 'Disk I/O', current: 0.234, peak: 0.756, capacity: 1099511627776, uptime: 2700090 },
    ];

    const cyan = 0x58d1eb;
    const gray = 0x888888; // Muted gray for units
    const amber = 0xffb020;
    const red = 0xef5867;

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
        formatter: formatters.percent({ decimals: 1, unitColor: gray }),
        color: percentColor,
      },
      peak: {
        header: 'Peak',
        align: 'right',
        formatter: formatters.percent({ decimals: 1, unitColor: gray }),
        color: percentColor,
      },
      capacity: {
        header: 'Capacity',
        align: 'right',
        formatter: formatters.bytes({ decimals: 1, unitColor: gray }),
      },
      uptime: {
        header: 'Uptime',
        align: 'right',
        formatter: formatters.uptime({ unitColor: gray }),
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['resource', 'current', 'peak', 'capacity', 'uptime'], columns),
      data: metrics,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 08c: Colored Units for Visual Hierarchy ===\n');
    console.log('Using formatters with unitColor option:');
    console.log('  - percent({ decimals: 1, unitColor: 0x888888 })');
    console.log('  - bytes({ decimals: 1, unitColor: 0x888888 })');
    console.log('  - uptime({ unitColor: 0x888888 })');
    console.log('');
    console.log('Units are muted gray, values can be colored based on thresholds:\n');
    table.print();
    console.log('');
  });

  it('should show custom separators and unit counts', () => {
    type Service = {
      name: string;
      load: number;
      memory: number;
      runtime: number;
    };

    const services: Service[] = [
      { name: 'payment-svc', load: 0.756, memory: 3221225472, runtime: 5432100 },
      { name: 'auth-svc', load: 0.423, memory: 1073741824, runtime: 7890123 },
      { name: 'search-svc', load: 0.891, memory: 2147483648, runtime: 2345678 },
    ];

    const cyan = 0x58d1eb;
    const gray = 0x888888;

    const columns: ColumnRegistry<Service> = {
      name: { header: 'Service', align: 'left' },
      load: {
        header: 'Load',
        align: 'right',
        // Custom separator with colored units
        formatter: formatters.percent({ decimals: 1, separator: ' ', unitColor: gray }),
      },
      memory: {
        header: 'Memory',
        align: 'right',
        // Custom separator (underscore for demonstration)
        formatter: formatters.bytes({ decimals: 2, separator: '_' }),
      },
      runtime: {
        header: 'Runtime',
        align: 'right',
        // Space-separated with only 2 time units and colored units
        formatter: formatters.uptime({ separator: ' ', units: 2, unitColor: gray }),
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['name', 'load', 'memory', 'runtime'], columns),
      data: services,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 08d: Custom Separators and Unit Counts ===\n');
    console.log('Demonstrating various separator and unit options:');
    console.log('  - Load:    separator: " " + unitColor: gray → "75.6 %"');
    console.log('  - Memory:  separator: "_" → "3.00_GiB"');
    console.log('  - Runtime: separator: " " + units: 2 + unitColor: gray → "62 d 22 h"\n');
    table.print();
    console.log('');
  });

  it('should compare all separator styles side-by-side', () => {
    type Comparison = {
      style: string;
      percent: string;
      bytes: string;
      uptime: string;
    };

    const value = { percent: 0.452, bytes: 1234567890, uptime: 2700090 };
    const gray = 0x888888;

    // Create formatters for each style
    const fmtDefault = {
      percent: formatters.percent(1),
      bytes: formatters.bytes(1),
      uptime: formatters.uptime(),
    };

    const fmtNoSep = {
      percent: formatters.percent({ decimals: 1, separator: '' }),
      bytes: formatters.bytes({ decimals: 1, separator: '' }),
      uptime: formatters.uptime({ separator: '' }),
    };

    const fmtColoredUnits = {
      percent: formatters.percent({ decimals: 1, unitColor: gray }),
      bytes: formatters.bytes({ decimals: 1, unitColor: gray }),
      uptime: formatters.uptime({ unitColor: gray }),
    };

    const fmtSpacedUptime = {
      percent: formatters.percent({ decimals: 1, unitColor: gray }),
      bytes: formatters.bytes({ decimals: 1, unitColor: gray }),
      uptime: formatters.uptime({ separator: ' ', unitColor: gray }),
    };

    const comparisons: Comparison[] = [
      {
        style: 'Default (space)',
        percent: fmtDefault.percent(value.percent),
        bytes: fmtDefault.bytes(value.bytes),
        uptime: fmtDefault.uptime(value.uptime),
      },
      {
        style: 'No separator',
        percent: fmtNoSep.percent(value.percent),
        bytes: fmtNoSep.bytes(value.bytes),
        uptime: fmtNoSep.uptime(value.uptime),
      },
      {
        style: 'Colored units',
        percent: fmtColoredUnits.percent(value.percent),
        bytes: fmtColoredUnits.bytes(value.bytes),
        uptime: fmtColoredUnits.uptime(value.uptime),
      },
      {
        style: 'Spaced + colored',
        percent: fmtSpacedUptime.percent(value.percent),
        bytes: fmtSpacedUptime.bytes(value.bytes),
        uptime: fmtSpacedUptime.uptime(value.uptime),
      },
    ];

    const cyan = 0x58d1eb;

    const columns: ColumnRegistry<Comparison> = {
      style: { header: 'Style', align: 'left' },
      percent: { header: 'Percent', align: 'right' },
      bytes: { header: 'Bytes', align: 'right' },
      uptime: { header: 'Uptime', align: 'right' },
    };

    const table = new TableRenderer({
      columns: buildColumns(['style', 'percent', 'bytes', 'uptime'], columns),
      data: comparisons,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      padding: 3,
    });

    console.log('\n=== Example 08e: Style Comparison ===\n');
    console.log('Comparing different formatter option combinations:\n');
    table.print();
    console.log('');
    console.log('Key takeaways:');
    console.log('  ✓ Default space separation is clean and readable');
    console.log('  ✓ No separator is more compact but slightly harder to scan');
    console.log('  ✓ Colored units create visual hierarchy without extra space');
    console.log('  ✓ Combine separator and color for maximum clarity');
    console.log('');
  });
});
