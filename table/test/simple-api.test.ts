/**
 * Tests for the Simple API (@epdoc/table v1.0)
 *
 * These tests verify the new intuitive table() factory function
 * and TableBuilder fluent API.
 */

import { describe, it } from '@std/testing/bdd';
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

describe('Simple API', () => {
  describe('Basic table() function', () => {
    it('should create a table with auto-discovered columns', () => {
      const result = table(users).toString();

      // Should include auto-formatted headers
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
      assertStringIncludes(result, 'Email Address');
      assertStringIncludes(result, 'Is Active');
    });

    it('should select specific columns when provided', () => {
      const result = table(users, ['id', 'userName']).toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
      // Should NOT include these columns
      assertEquals(result.includes('Email Address'), false);
      assertEquals(result.includes('Is Active'), false);
    });

    it('should select specific columns using columns option', () => {
      const result = table(users, { columns: ['id', 'emailAddress'] }).toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Email Address');
      assertEquals(result.includes('User Name'), false);
    });
  });

  describe('Column configuration', () => {
    it('should configure column alignment', () => {
      const result = table(users)
        .column('id', 'right')
        .column('userName', 'left')
        .toString();

      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'User Name');
    });

    it('should configure column with full options', () => {
      const result = table(users)
        .column('id', {
          align: 'right',
          header: 'ID#',
        })
        .toString();

      assertStringIncludes(result, 'ID#');
    });

    it('should override auto-formatted headers', () => {
      const result = table(users)
        .column('userName', { header: 'Name' })
        .toString();

      assertStringIncludes(result, 'Name');
      assertEquals(result.includes('User Name'), false);
    });
  });

  describe('Header configuration', () => {
    it('should show header by default', () => {
      const result = table(users).toString();
      assertStringIncludes(result, 'Id');
    });

    it('should configure header color', () => {
      const result = table(users)
        .header('cyan')
        .toString();
      // Verify it renders with header color
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Alice');
    });

    // Note: noHeader() currently prevents header styling but doesn't hide the row
    // This would require TableRenderer enhancement
    it('should allow noHeader() call for future enhancement', () => {
      const result = table(users)
        .noHeader()
        .toString();
      // Currently noHeader just disables header styling
      // The header row is still displayed
      assertStringIncludes(result, 'Id');
      assertStringIncludes(result, 'Alice');
    });
  });

  describe('Borders', () => {
    it('should enable borders by default', () => {
      const result = table(users).toString();
      // Should contain box-drawing characters
      assertStringIncludes(result, '┌');
      assertStringIncludes(result, '┐');
      assertStringIncludes(result, '└');
      assertStringIncludes(result, '┘');
    });

    it('should disable borders with noBorders()', () => {
      const result = table(users).noBorders().toString();
      // Should NOT contain box-drawing characters
      assertEquals(result.includes('┌'), false);
      assertEquals(result.includes('│'), false);
    });

    it('should support different border styles', () => {
      const light = table(users).borders('light').toString();
      const heavy = table(users).borders('heavy').toString();
      const double = table(users).borders('double').toString();

      // Each style should have different characters
      assertStringIncludes(light, '─');
      assertStringIncludes(heavy, '━');
      assertStringIncludes(double, '═');
    });
  });

  describe('Zebra striping', () => {
    it('should not have zebra striping by default', () => {
      const builder = table(users);
      const result = builder.toString();
      // Just verify it renders without error
      assertStringIncludes(result, 'Alice');
    });

    it('should enable zebra striping', () => {
      const result = table(users).zebra().toString();
      // Just verify it renders without error
      assertStringIncludes(result, 'Alice');
    });

    it('should disable zebra striping with noZebra()', () => {
      const result = table(users).zebra().noZebra().toString();
      assertStringIncludes(result, 'Alice');
    });
  });

  describe('Formatters', () => {
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

    it('should format bytes', () => {
      const result = table(servers)
        .column('memory', { format: 'bytes' })
        .toString();

      assertStringIncludes(result, 'GiB');
    });

    it('should format percentages', () => {
      const result = table(servers)
        .column('cpu', { format: 'percent' })
        .toString();

      assertStringIncludes(result, '%');
    });

    it('should format uptime', () => {
      const result = table(servers)
        .column('uptime', { format: 'uptime' })
        .toString();

      assertStringIncludes(result, 'd'); // days
      assertStringIncludes(result, 'h'); // hours
    });

    it('should format checkmarks', () => {
      const result = table(servers)
        .column('isOnline', { format: 'checkmark' })
        .toString();

      assertStringIncludes(result, '✔');
      assertStringIncludes(result, '✘');
    });
  });

  describe('Datetime formatting', () => {
    interface LogEntry {
      timestamp: Date;
      message: string;
    }

    const logs: LogEntry[] = [
      { timestamp: new Date('2024-01-15T12:30:45Z'), message: 'Server started' },
      { timestamp: new Date('2024-01-16T08:15:30Z'), message: 'Request received' },
    ];

    it('should format datetime with default pattern', () => {
      const result = table(logs)
        .column('timestamp', { format: 'datetime' })
        .toString();

      assertStringIncludes(result, '2024');
      assertStringIncludes(result, 'Timestamp');
    });

    it('should format datetime with custom pattern', () => {
      const result = table(logs)
        .column('timestamp', {
          format: 'datetime',
          datetime: { pattern: 'yyyyMMdd' },
        })
        .toString();

      assertStringIncludes(result, '20240115');
    });

    it('should handle string dates', () => {
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

    it('should handle epoch timestamps', () => {
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

  describe('Colors', () => {
    it('should support hex colors', () => {
      const result = table(users)
        .header(0x58d1eb)
        .toString();

      // Just verify it renders
      assertStringIncludes(result, 'Id');
    });

    it('should support named colors', () => {
      const result = table(users)
        .header('cyan')
        .column('isActive', { color: 'green' })
        .toString();

      assertStringIncludes(result, 'Id');
    });
  });

  describe('No color mode', () => {
    it('should strip colors with noColor()', () => {
      const result = table(users)
        .header('cyan')
        .noColor()
        .toString();

      // Should not contain ANSI escape codes
      assertEquals(result.includes('\x1b['), false);
    });
  });

  describe('Custom color palettes', () => {
    it('should support custom color definitions', async () => {
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

  describe('Header formatting options', () => {
    it('should format camelCase to Title Case by default', () => {
      const result = table(users).toString();
      assertStringIncludes(result, 'User Name');
      assertStringIncludes(result, 'Email Address');
    });

    it('should preserve original keys when formatHeaders is false', () => {
      const result = table(users, { formatHeaders: false }).toString();
      assertStringIncludes(result, 'userName');
      assertStringIncludes(result, 'emailAddress');
    });
  });

  describe('Data override', () => {
    it('should allow overriding data', () => {
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

  describe('Output methods', () => {
    it('should support toString()', () => {
      const result = table(users).toString();
      assertEquals(typeof result, 'string');
      assertStringIncludes(result, 'Alice');
    });

    it('should support render() returning array', () => {
      const lines = table(users).render();
      assertEquals(Array.isArray(lines), true);
      assertEquals(lines.length > 0, true);
      assertEquals(typeof lines[0], 'string');
    });
  });
});
