/**
 * Example 02: Styled Table with Colors
 *
 * Demonstrates how to add colors, header styling, and zebra striping.
 */

import { describe, it } from '@std/testing/bdd';
import { bgRgb24, bold, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import type { ColumnRegistry, StyleFn } from '../src/types.ts';

describe('Example 02: Styled Table', () => {
  it('should render a table with colors and styling', () => {
    type ServerStatus = {
      id: string;
      name: string;
      status: string;
      uptime: string;
      cpu: number;
    };

    const servers: ServerStatus[] = [
      { id: 'srv-001', name: 'web-01', status: 'running', uptime: '15d 3h', cpu: 45.2 },
      { id: 'srv-002', name: 'web-02', status: 'running', uptime: '15d 3h', cpu: 38.7 },
      { id: 'srv-003', name: 'db-01', status: 'stopped', uptime: '-', cpu: 0 },
      { id: 'srv-004', name: 'cache-01', status: 'running', uptime: '2d 5h', cpu: 12.1 },
      { id: 'srv-005', name: 'api-01', status: 'warning', uptime: '1d 2h', cpu: 89.3 },
    ];

    // Define colors
    const green = 0x51d67c;
    const red = 0xef5867;
    const amber = 0xffb020;
    const cyan = 0x58d1eb;
    const bgEven = 0x1a1a2e;

    // Color function for status column
    const statusColor = (_v: unknown, row: ServerStatus): StyleFn | undefined => {
      if (row.status === 'running') return (s: string) => rgb24(s, green);
      if (row.status === 'stopped') return (s: string) => rgb24(s, red);
      if (row.status === 'warning') return (s: string) => rgb24(s, amber);
      return undefined;
    };

    // Color function for CPU column (warn if > 80%)
    const cpuColor = (v: unknown, _row: ServerStatus): StyleFn | undefined => {
      const cpu = v as number;
      if (cpu > 80) return (s: string) => rgb24(s, red);
      if (cpu > 60) return (s: string) => rgb24(s, amber);
      return undefined;
    };

    const columns: ColumnRegistry<ServerStatus> = {
      id: { header: 'Server ID', align: 'left' },
      name: { header: 'Name', align: 'left' },
      status: { header: 'Status', align: 'left', color: statusColor },
      uptime: { header: 'Uptime', align: 'right' },
      cpu: { header: 'CPU %', align: 'right', color: cpuColor },
    };

    const table = new TableRenderer({
      columns: buildColumns(['id', 'name', 'status', 'uptime', 'cpu'], columns),
      data: servers,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      rowStyles: [
        (s: string) => bgRgb24(s, bgEven),
        null,
      ],
      padding: 3,
    });

    console.log('\n=== Example 02: Styled Server Status Table ===\n');
    table.print();
    console.log('');
  });
});
