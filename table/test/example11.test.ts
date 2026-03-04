/**
 * Example 11: Full Box-Drawing Borders
 *
 * Demonstrates the complete border feature with corners, junctions,
 * and vertical separators.
 */

import { describe, it } from '@std/testing/bdd';
import { bold, rgb24 } from '@std/fmt/colors';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import type { ColumnRegistry } from '../src/types.ts';

interface Device {
  hostname: string;
  ip: string;
  board: string;
  platform: string;
  version: string;
  isRouter: boolean;
}

describe('Example 11: Full Box-Drawing Borders', () => {
  const data: Device[] = [
    { hostname: 'hex-router', ip: '10.0.0.1', board: 'RB750Gr3', platform: 'arm', version: '7.18.2', isRouter: true },
    {
      hostname: 'hap-taller',
      ip: '10.0.0.26',
      board: 'RB952Ui-5ac2',
      platform: 'MikroTik',
      version: '7.18.2',
      isRouter: false,
    },
    {
      hostname: 'hap-brain',
      ip: '10.0.0.31',
      board: 'RB952Ui-5ac2',
      platform: 'MikroTik',
      version: '7.17.2',
      isRouter: false,
    },
  ];

  it('should render table with light borders (no color)', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      board: { header: 'Board', width: 14 },
      platform: { header: 'Platform', width: 10 },
      version: { header: 'Version', width: 8 },
      isRouter: {
        header: 'Router',
        width: 8,
        align: 'center',
        formatter: (v) => v ? '✓' : '',
      },
    };

    console.log('\n=== Example 11.1: Light Borders (Default) ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'light',
      },
    });
    table.print();
    console.log('');
  });

  it('should render table with heavy borders and color', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      board: { header: 'Board', width: 14 },
      platform: { header: 'Platform', width: 10 },
      version: { header: 'Version', width: 8 },
      isRouter: {
        header: 'Router',
        width: 8,
        align: 'center',
        formatter: (v) => v ? '✓' : '',
      },
    };

    console.log('\n=== Example 11.2: Heavy Borders (Gray) ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'heavy',
        color: 0x888888,
      },
    });
    table.print();
    console.log('');
  });

  it('should render table with double borders and cyan color', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      board: { header: 'Board', width: 14 },
      platform: { header: 'Platform', width: 10 },
      version: { header: 'Version', width: 8 },
      isRouter: {
        header: 'Router',
        width: 8,
        align: 'center',
        formatter: (v) => v ? '✓' : '',
      },
    };

    console.log('\n=== Example 11.3: Double Borders (Cyan) ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'double',
        color: 0x58d1eb,
      },
      headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
    });
    table.print();
    console.log('');
  });

  it('should render using fluent API', () => {
    console.log('\n=== Example 11.4: Fluent API with Borders ===\n');
    TableRenderer.create<Device>()
      .column('hostname', { header: 'Hostname', width: 15 })
      .column('ip', { header: 'IP Address', width: 16 })
      .column('board', { header: 'Board', width: 14 })
      .column('platform', { header: 'Platform', width: 10 })
      .column('version', { header: 'Version', width: 8 })
      .column('isRouter', {
        header: 'Router',
        width: 8,
        align: 'center',
        formatter: (v) => v ? '✓' : '',
      })
      .data(data)
      .borders(true, 'light')
      .borderColor(0xaaaaaa)
      .headerStyle((s) => bold(rgb24(s, 0x58d1eb)))
      .print();
    console.log('');
  });

  it('should render with custom border characters', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      version: { header: 'Version', width: 8 },
    };

    console.log('\n=== Example 11.5: Custom Border Characters ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'version'], columns),
      data: data.slice(0, 2),
      borders: {
        enabled: true,
        style: 'custom',
        chars: {
          topLeft: '+',
          topRight: '+',
          bottomLeft: '+',
          bottomRight: '+',
          horizontal: '-',
          vertical: '|',
          topJunction: '+',
          bottomJunction: '+',
          leftJunction: '+',
          rightJunction: '+',
          crossJunction: '+',
        },
        color: 0x888888,
      },
    });
    table.print();
    console.log('');
  });

  it('should render with colored cells and borders', () => {
    const green = 0x51d67c;
    const red = 0xef5867;

    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', align: 'left' },
      ip: { header: 'IP Address', align: 'left' },
      version: { header: 'Version', align: 'right' },
      isRouter: {
        header: 'Router',
        align: 'center',
        formatter: (v) => v ? '✓' : '✗',
        color: (v) => v ? green : red,
      },
    };

    console.log('\n=== Example 11.6: Colored Cells with Borders ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'light',
        color: 0x888888,
      },
      headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
    });
    table.print();
    console.log('');
  });

  it('should render with borders disabled (default behavior)', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', align: 'left' },
      ip: { header: 'IP Address', align: 'left' },
      version: { header: 'Version', align: 'right' },
    };

    console.log('\n=== Example 11.7: No Borders (Default) ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'version'], columns),
      data: data.slice(0, 2),
      headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
    });
    table.print();
    console.log('');
  });

  it('should render with noColor mode (strips border colors)', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      version: { header: 'Version', width: 8 },
    };

    console.log('\n=== Example 11.8: No Color Mode (Plain Text) ===\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'version'], columns),
      data: data.slice(0, 2),
      borders: {
        enabled: true,
        style: 'light',
        color: 0x888888,
      },
      headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
      noColor: true,
    });
    table.print();
    console.log('');
  });
});
