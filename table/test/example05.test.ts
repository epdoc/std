/**
 * Example 05: Advanced Features
 *
 * Demonstrates maxWidth truncation, custom formatters, and complex styling.
 */

import { bgRgb24, bold, dim, rgb24 } from '@std/fmt/colors';
import { describe, it } from '@std/testing/bdd';
import { TableRenderer } from '../src/render.ts';
import type { ColumnRegistry } from '../src/types.ts';
import { buildColumns } from '../src/utils.ts';

describe('Example 05: Advanced Features', () => {
  it('should render a table with advanced features', () => {
    type Task = {
      id: string;
      title: string;
      assignee: string;
      priority: string;
      progress: number;
      dueDate: string;
      tags: string[];
    };

    const tasks: Task[] = [
      {
        id: 'TASK-001',
        title: 'Implement user authentication with OAuth 2.0 and JWT tokens',
        assignee: 'Alice',
        priority: 'high',
        progress: 0.75,
        dueDate: '2026-03-01',
        tags: ['backend', 'security', 'api'],
      },
      {
        id: 'TASK-002',
        title: 'Design responsive dashboard UI',
        assignee: 'Bob',
        priority: 'medium',
        progress: 0.30,
        dueDate: '2026-03-05',
        tags: ['frontend', 'ui'],
      },
      {
        id: 'TASK-003',
        title: 'Optimize database queries for better performance',
        assignee: 'Charlie',
        priority: 'high',
        progress: 0.90,
        dueDate: '2026-02-28',
        tags: ['database', 'performance'],
      },
      {
        id: 'TASK-004',
        title: 'Write comprehensive unit tests for payment module',
        assignee: 'Diana',
        priority: 'low',
        progress: 0.15,
        dueDate: '2026-03-10',
        tags: ['testing', 'backend'],
      },
      {
        id: 'TASK-005',
        title: 'Update API documentation with new endpoints and examples',
        assignee: 'Eve',
        priority: 'medium',
        progress: 0.60,
        dueDate: '2026-03-03',
        tags: ['documentation', 'api'],
      },
    ];

    const green = 0x51d67c;
    const red = 0xef5867;
    const amber = 0xffb020;
    const cyan = 0x58d1eb;
    const bgEven = 0x1a1a2e;

    const columns: ColumnRegistry<Task> = {
      id: {
        header: 'ID',
        align: 'left',
        color: () => (s: string) => dim(s),
      },
      title: {
        header: 'Title',
        align: 'left',
        maxWidth: 35, // Truncate long titles with ellipsis
      },
      assignee: {
        header: 'Assignee',
        align: 'left',
      },
      priority: {
        header: 'Priority',
        align: 'left',
        formatter: (v: unknown) => String(v).toUpperCase(),
        color: (v: unknown) => {
          const priority = String(v);
          if (priority === 'high') return (s: string) => rgb24(s, red);
          if (priority === 'medium') return (s: string) => rgb24(s, amber);
          return (s: string) => rgb24(s, green);
        },
      },
      progress: {
        header: 'Progress',
        align: 'right',
        formatter: (v: unknown) => {
          const pct = (v as number) * 100;
          const bars = Math.floor(pct / 10);
          const filled = '█'.repeat(bars);
          const empty = '░'.repeat(10 - bars);
          return `${filled}${empty} ${pct.toFixed(0)}%`;
        },
        color: (v: unknown) => {
          const pct = (v as number) * 100;
          if (pct >= 80) return (s: string) => rgb24(s, green);
          if (pct >= 50) return (s: string) => rgb24(s, amber);
          return undefined;
        },
      },
      dueDate: {
        header: 'Due Date',
        align: 'left',
      },
      tags: {
        header: 'Tags',
        align: 'left',
        formatter: (v: unknown) => (v as string[]).join(', '),
        maxWidth: 25,
        color: () => (s: string) => dim(s),
      },
    };

    const table = new TableRenderer({
      columns: buildColumns(['id', 'title', 'assignee', 'priority', 'progress', 'dueDate', 'tags'], columns),
      data: tasks,
      headerStyle: (s: string) => bold(rgb24(s, cyan)),
      rowStyles: [
        (s: string) => bgRgb24(s, bgEven),
        null,
      ],
      padding: 2,
    });

    console.log('\n=== Example 05: Task Management Table (Advanced) ===\n');
    table.print();
    console.log('');
    console.log('Features demonstrated:');
    console.log('  - maxWidth: Truncates long text with ellipsis (Title, Tags)');
    console.log('  - Custom formatters: Progress bars, uppercase priority, tag joining');
    console.log('  - Conditional colors: Priority-based and progress-based coloring');
    console.log('  - Zebra striping: Alternating row backgrounds');
    console.log('  - dim() styling: Subdued appearance for metadata columns');
    console.log('');
  });
});
