/**
 * Example 12: Simple API
 *
 * Demonstrates the new intuitive table() factory function introduced in v1.0.
 * This API provides a one-liner approach with auto-formatting and sensible defaults.
 */

import { describe, it } from '@std/testing/bdd';
import { table } from '../src/simple.ts';

describe('Example 12: Simple API', () => {
  interface Server {
    id: string;
    name: string;
    memory: number; // bytes
    cpu: number; // 0-1 ratio
    uptime: number; // seconds
    isOnline: boolean;
    created: Date;
  }

  const servers: Server[] = [
    {
      id: 'srv-001',
      name: 'web-01',
      memory: 8589934592,
      cpu: 0.234,
      uptime: 864000,
      isOnline: true,
      created: new Date('2024-01-15T12:30:45Z'),
    },
    {
      id: 'srv-002',
      name: 'web-02',
      memory: 4294967296,
      cpu: 0.567,
      uptime: 432000,
      isOnline: true,
      created: new Date('2024-01-10T08:15:30Z'),
    },
    {
      id: 'srv-003',
      name: 'db-01',
      memory: 17179869184,
      cpu: 0.891,
      uptime: 1728000,
      isOnline: false,
      created: new Date('2023-12-01T00:00:00Z'),
    },
  ];

  it('should render with default settings', () => {
    console.log('\n=== Example 12.1: Default Settings ===\n');
    console.log('One-liner: table(data).print()');
    console.log('Auto-discovers columns, applies cyan headers, light borders\n');

    table(servers).print();
    console.log('');
  });

  it('should select specific columns', () => {
    console.log('\n=== Example 12.2: Select Columns ===\n');
    console.log('table(data, ["name", "cpu", "memory"]).print()\n');

    table(servers, ['name', 'cpu', 'memory']).print();
    console.log('');
  });

  it('should format data types automatically', () => {
    console.log('\n=== Example 12.3: Auto-Formatting ===\n');
    console.log('Using format option for bytes, percent, uptime, checkmark\n');

    table(servers)
      .columns(['name', 'memory', 'cpu', 'uptime', 'isOnline'])
      .column('memory', { format: 'bytes', decimals: 1 })
      .column('cpu', { format: 'percent', decimals: 1, separator: '' })
      .column('uptime', { format: 'uptime', separator: ' ' })
      .column('isOnline', { format: 'checkmark', align: 'center', header: 'Online' })
      .print();
    console.log('');
  });

  it('should format datetime with patterns', () => {
    console.log('\n=== Example 12.4: Datetime Formatting ===\n');

    table(servers)
      .columns(['name', 'created'])
      .column('created', {
        format: 'datetime',
        datetime: {
          pattern: 'yyyy-MM-dd',
          timezone: 'utc',
        },
      })
      .print();
    console.log('');
  });

  it('should apply custom styling', () => {
    console.log('\n=== Example 12.5: Custom Styling ===\n');
    console.log('Named colors, zebra striping, heavy borders\n');

    table(servers)
      .columns(['name', 'cpu', 'memory', 'isOnline'])
      .column('name', { align: 'left' })
      .column('cpu', {
        format: 'percent',
        decimals: 1,
        color: (v: unknown) => (v as number) > 0.8 ? 'red' : 'green',
      })
      .column('memory', { format: 'bytes', decimals: 1 })
      .column('isOnline', { format: 'checkmark', align: 'center' })
      .header('cyan')
      .zebra()
      .borders('heavy')
      .print();
    console.log('');
  });

  it('should support custom color palettes', async () => {
    console.log('\n=== Example 12.6: Custom Color Palette ===\n');

    const { defineColors } = await import('../src/simple.ts');

    const myColors = defineColors({
      primary: 0x58d1eb,
      success: 0x51d67c,
      warning: 0xffb020,
      danger: 0xef5867,
    });

    table(servers, { colors: myColors })
      .columns(['name', 'cpu', 'isOnline'])
      .column('cpu', {
        format: 'percent',
        decimals: 1,
        color: (v: unknown) => (v as number) > 0.8 ? 'danger' : 'success',
      })
      .column('isOnline', { format: 'checkmark', align: 'center' })
      .header('cyan')
      .print();
    console.log('');
  });

  it('should disable formatting for plain output', () => {
    console.log('\n=== Example 12.7: Plain Output (No Colors) ===\n');

    table(servers)
      .columns(['name', 'memory', 'cpu'])
      .column('memory', { format: 'bytes' })
      .column('cpu', { format: 'percent' })
      .noColor()
      .print();
    console.log('');
  });

  it('should demonstrate column alignment', () => {
    console.log('\n=== Example 12.8: Column Alignment ===\n');

    table(servers)
      .columns(['id', 'name', 'memory', 'cpu'])
      .column('id', 'center')
      .column('name', 'left')
      .column('memory', 'right')
      .column('cpu', 'center')
      .noBorders()
      .print();
    console.log('');
  });
});
