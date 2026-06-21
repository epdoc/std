/**
 * Tests for the Simple API (@epdoc/table v1.0)
 *
 * These tests verify the new intuitive table() factory function
 * and TableBuilder fluent API.
 */

import { assertEquals, assertStringIncludes } from '@std/assert';
import { table } from '../src/simple.ts';

interface User {
  id: number;
  userName: string;
  emailAddress: string;
  isActive: boolean;
}

const users: User[] = [
  { id: 1, userName: 'Alice Johnson', emailAddress: 'alice@example.com', isActive: true },
  { id: 2, userName: 'Bob Smith', emailAddress: 'bob@example.com', isActive: false },
  { id: 3, userName: 'Charlie Brown', emailAddress: 'charlie@example.com', isActive: true },
];

Deno.test('Simple API', async (t) => {
  await t.step('Basic table() function', async (t) => {
    await t.step('should create a table with auto-discovered columns', () => {
      const result = table(users).toString();

      // Should include auto-formatted headers
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
      assertStringIncludes(result, 'Email Address');
      assertStringIncludes(result, 'Is Active');
    });

    await t.step('should select specific columns when provided', () => {
      const result = table(users, ['id', 'userName']).toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
      // Should NOT include these columns
      assertEquals(result.includes('Email Address'), false);
      assertEquals(result.includes('Is Active'), false);
    });

    await t.step('should select specific columns using columns option', () => {
      const result = table(users, { columns: ['id', 'emailAddress'] }).toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Email Address');
      assertEquals(result.includes('User Name'), false);
    });
  });

  await t.step('Column configuration', async (t) => {
    await t.step('should configure column alignment', () => {
      const result = table(users)
        .column('id', 'right')
        .column('userName', 'left')
        .toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
    });

    await t.step('should configure column with full options', () => {
      const result = table(users)
        .column('id', {
          align: 'right',
          header: 'ID#',
        })
        .toString();

      assertStringIncludes(result, 'ID#');
    });

    await t.step('should override auto-formatted headers', () => {
      const result = table(users)
        .column('userName', { header: 'Name' })
        .toString();

      assertStringIncludes(result, 'Name');
      assertEquals(result.includes('User Name'), false);
    });
  });

  await t.step('Header configuration', async (t) => {
    await t.step('should show header by default', () => {
      const result = table(users).toString();
      assertStringIncludes(result, 'Id');
    });

    await t.step('should configure header color', () => {
      const result = table(users)
        .header('cyan')
        .toString();
      // Verify it renders with header color
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Alice');
    });

    // Note: noHeader() currently prevents header styling but doesn't hide the row
    // This would require TableRenderer enhancement
    await t.step('should allow noHeader() call for future enhancement', () => {
      const result = table(users)
        .noHeader()
        .toString();
      // Currently noHeader just disables header styling
      // The header row is still displayed
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Alice');
    });
  });

  await t.step('Borders', async (t) => {
    await t.step('should enable borders by default', () => {
      const result = table(users).toString();
      // Should contain box-drawing characters
      assertStringIncludes(result, '┌');
      assertStringIncludes(result, '┐');
      assertStringIncludes(result, '└');
      assertStringIncludes(result, '┘');
    });

    await t.step('should disable borders with noBorders()', () => {
      const result = table(users).noBorders().toString();
      // Should NOT contain box-drawing characters
      assertEquals(result.includes('┌'), false);
      assertEquals(result.includes('│'), false);
    });

    await t.step('should support different border styles', () => {
      const light = table(users).borders('light').toString();
      const heavy = table(users).borders('heavy').toString();
      const double = table(users).borders('double').toString();

      // Each style should have different characters
      assertStringIncludes(light, '─');
      assertStringIncludes(heavy, '━');
      assertStringIncludes(double, '═');
    });
  });

  await t.step('Zebra striping', async (t) => {
    await t.step('should not have zebra striping by default', () => {
      const builder = table(users);
      const result = builder.toString();
      // Just verify it renders without error
      assertStringIncludes(result, 'Alice');
    });

    await t.step('should enable zebra striping', () => {
      const result = table(users).zebra().toString();
      // Just verify it renders without error
      assertStringIncludes(result, 'Alice');
    });

    await t.step('should disable zebra striping with noZebra()', () => {
      const result = table(users).zebra().noZebra().toString();
      assertStringIncludes(result, 'Alice');
    });
  });

  await t.step('Formatters', async (t) => {
    interface Server {
      name: string;
      memory: number;
      cpu: number;
      uptime: number;
      isOnline: boolean;
    }

    const servers: Server[] = [
      { name: 'web-01', memory: 8589934592, cpu: 0.234, uptime: 86400, isOnline: true },
      { name: 'web-02', memory: 4294967296, cpu: 0.567, uptime: 43200, isOnline: false },
    ];

    await t.step('should format bytes', () => {
      const result = table(servers)
        .column('memory', { format: 'bytes' })
        .toString();

      assertStringIncludes(result, 'GiB');
    });

    await t.step('should format percentages', () => {
      const result = table(servers)
        .column('cpu', { format: 'percent' })
        .toString();

      assertStringIncludes(result, '%');
    });

    await t.step('should format uptime', () => {
      const result = table(servers)
        .column('uptime', { format: 'uptime' })
        .toString();

      assertStringIncludes(result, 'd'); // days
      assertStringIncludes(result, 'h'); // hours
    });

    await t.step('should format checkmarks', () => {
      const result = table(servers)
        .column('isOnline', { format: 'checkmark' })
        .toString();

      assertStringIncludes(result, '✔');
      assertStringIncludes(result, '✘');
    });

    await t.step('should format boolean with default preset', () => {
      const result = table(servers)
        .column('isOnline', { format: 'boolean' })
        .toString();

      assertStringIncludes(result, '✓');
      assertStringIncludes(result, '✗');
    });

    await t.step('should format boolean with circleDot preset', () => {
      const result = table(servers)
        .column('isOnline', { format: 'boolean', boolPreset: 'circleDot' })
        .toString();

      assertStringIncludes(result, '●');
      assertStringIncludes(result, '‧');
    });

    await t.step('should format boolean with yesno preset', () => {
      const result = table(servers)
        .column('isOnline', { format: 'boolean', boolPreset: 'yesno' })
        .toString();

      assertStringIncludes(result, 'yes');
      assertStringIncludes(result, 'no');
    });
  });

  await t.step('Datetime formatting', async (t) => {
    interface LogEntry {
      timestamp: Date;
      message: string;
    }

    const logs: LogEntry[] = [
      { timestamp: new Date('2024-01-15T12:30:45Z'), message: 'Server started' },
      { timestamp: new Date('2024-01-16T08:15:30Z'), message: 'Request received' },
    ];

    await t.step('should format datetime with default pattern', () => {
      const result = table(logs)
        .column('timestamp', { format: 'datetime' })
        .toString();

      assertStringIncludes(result, '2024');
      assertStringIncludes(result, 'Timestamp');
    });

    await t.step('should format datetime with custom pattern', () => {
      const result = table(logs)
        .column('timestamp', {
          format: 'datetime',
          datetime: { pattern: 'yyyyMMdd' },
        })
        .toString();

      assertStringIncludes(result, '20240115');
    });

    await t.step('should handle string dates', () => {
      interface Event {
        date: string;
        name: string;
      }

      const events: Event[] = [
        { date: '2024-01-15T12:30:45Z', name: 'Launch' },
      ];

      const result = table(events)
        .column('date', { format: 'datetime' })
        .toString();

      assertStringIncludes(result, '2024');
    });

    await t.step('should handle epoch timestamps', () => {
      interface Metric {
        time: number;
        value: number;
      }

      const metrics: Metric[] = [
        { time: 1705321845000, value: 42 },
      ];

      const result = table(metrics)
        .column('time', { format: 'datetime' })
        .toString();

      assertStringIncludes(result, '2024');
    });
  });

  await t.step('Colors', async (t) => {
    await t.step('should support hex colors', () => {
      const result = table(users)
        .header(0x58d1eb)
        .toString();

      // Just verify it renders
      assertStringIncludes(result, 'Id');
    });

    await t.step('should support named colors', () => {
      const result = table(users)
        .header('cyan')
        .column('isActive', { color: 'green' })
        .toString();

      assertStringIncludes(result, 'Id');
    });
  });

  await t.step('No color mode', async (t) => {
    await t.step('should strip colors with noColor()', () => {
      const result = table(users)
        .header('cyan')
        .noColor()
        .toString();

      // Should not contain ANSI escape codes
      assertEquals(result.includes('\x1b['), false);
    });
  });

  await t.step('Custom color palettes', async (t) => {
    await t.step('should support custom color definitions', async () => {
      const { defineColors } = await import('../src/simple.ts');

      const myColors = defineColors({
        primary: 0x58d1eb,
        success: 0x51d67c,
      });

      const result = table(users, { colors: myColors })
        .header(myColors.primary as unknown as import('../src/simple-types.ts').SimpleColor)
        .column('isActive', { color: myColors.success as unknown as import('../src/simple-types.ts').SimpleColor })
        .toString();

      assertStringIncludes(result, 'Id');
    });
  });

  await t.step('Header formatting options', async (t) => {
    await t.step('should format camelCase to Title Case by default', () => {
      const result = table(users).toString();
      assertStringIncludes(result, 'User Name');
      assertStringIncludes(result, 'Email Address');
    });

    await t.step('should preserve original keys when formatHeaders is false', () => {
      const result = table(users, { formatHeaders: false }).toString();
      assertStringIncludes(result, 'userName');
      assertStringIncludes(result, 'emailAddress');
    });
  });

  await t.step('Data override', async (t) => {
    await t.step('should allow overriding data', () => {
      const newUsers: User[] = [
        { id: 99, userName: 'New User', emailAddress: 'new@example.com', isActive: true },
      ];

      const result = table(users)
        .data(newUsers)
        .toString();

      assertStringIncludes(result, 'New User');
      assertEquals(result.includes('Alice'), false);
    });
  });

  await t.step('Output methods', async (t) => {
    await t.step('should support toString()', () => {
      const result = table(users).toString();
      assertEquals(typeof result, 'string');
      assertStringIncludes(result, 'Alice');
    });

    await t.step('should support render() returning array', () => {
      const lines = table(users).render();
      assertEquals(Array.isArray(lines), true);
      assertEquals(lines.length > 0, true);
      assertEquals(typeof lines[0], 'string');
    });
  });

  await t.step('Map support', async (t) => {
    await t.step('should render Map with object values', () => {
      const map = new Map<string, { score: number; active: boolean }>([
        ['alice', { score: 95, active: true }],
        ['bob', { score: 87, active: false }],
      ]);
      const result = table(map, ['__key', 'score']).toString();
      assertStringIncludes(result, 'Key');
      assertStringIncludes(result, 'Score');
      assertStringIncludes(result, 'alice');
      assertStringIncludes(result, 'bob');
      assertStringIncludes(result, '95');
      assertStringIncludes(result, '87');
    });

    await t.step('should render Map with primitive values', () => {
      const map = new Map<string, number>([
        ['alpha', 1],
        ['beta', 2],
      ]);
      const result = table(map).toString();
      assertStringIncludes(result, 'Key');
      assertStringIncludes(result, 'Value');
      assertStringIncludes(result, 'alpha');
      assertStringIncludes(result, 'beta');
    });

    await t.step('should auto-discover __key column from Map', () => {
      const map = new Map<string, { name: string }>([
        ['u1', { name: 'Alice' }],
        ['u2', { name: 'Bob' }],
      ]);
      const result = table(map).toString();
      assertStringIncludes(result, 'Key');
      assertStringIncludes(result, 'Name');
      assertStringIncludes(result, 'Alice');
    });

    await t.step('should format header for __key', () => {
      const map = new Map([['a', 1]]);
      const result = table(map).toString();
      assertStringIncludes(result, 'Key');
    });
  });

  await t.step('Record support', async (t) => {
    await t.step('should render Record with object values', () => {
      const rec: Record<string, { role: string }> = {
        admin: { role: 'administrator' },
        guest: { role: 'read-only' },
      };
      const result = table(rec, ['__key', 'role']).toString();
      assertStringIncludes(result, 'Key');
      assertStringIncludes(result, 'Role');
      assertStringIncludes(result, 'admin');
      assertStringIncludes(result, 'guest');
    });

    await t.step('should render Record with primitive values', () => {
      const rec: Record<string, number> = { x: 10, y: 20 };
      const result = table(rec).toString();
      assertStringIncludes(result, 'Key');
      assertStringIncludes(result, 'Value');
      assertStringIncludes(result, 'x');
      assertStringIncludes(result, 'y');
    });
  });

  await t.step('Custom formatter', async (t) => {
    interface Item {
      name: string;
      value: number;
    }
    const items: Item[] = [
      { name: 'foo', value: 42 },
      { name: 'bar', value: 100 },
    ];

    await t.step('should support formatter callback in SimpleColumnOptions', () => {
      const result = table(items, ['name', 'value'])
        .column('value', {
          header: 'Score',
          formatter: (v: unknown) => `${v} pts`,
        })
        .toString();
      assertStringIncludes(result, '42 pts');
      assertStringIncludes(result, '100 pts');
      assertEquals(result.includes('Score'), true);
    });

    await t.step('formatter should take precedence over format', () => {
      const result = table(items, ['name', 'value'])
        .column('value', {
          format: 'bytes',
          formatter: (v: unknown) => `custom-${v}`,
        })
        .toString();
      assertStringIncludes(result, 'custom-42');
      assertStringIncludes(result, 'custom-100');
      assertEquals(result.includes('GiB'), false);
    });

    await t.step('formatter should receive value and row', () => {
      const specMap = new Map<string, { multiplier: number }>([
        ['a', { multiplier: 10 }],
        ['b', { multiplier: 20 }],
      ]);
      const result = table(specMap, ['__key', 'multiplier'])
        .column('__key', {
          header: 'ID',
          formatter: (_v: unknown, row: Record<string, unknown>) => `${row.__key}-formatted`,
        })
        .toString();
      assertStringIncludes(result, 'a-formatted');
      assertStringIncludes(result, 'b-formatted');
    });
  });
});
