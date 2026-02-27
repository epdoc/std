/**
 * Example 01: Basic Table Rendering
 *
 * Demonstrates the simplest way to create and render a table.
 */

import { describe, it } from '@std/testing/bdd';
import { TableRenderer } from '../src/render.ts';
import { buildColumns } from '../src/utils.ts';
import type { ColumnRegistry } from '../src/types.ts';

describe('Example 01: Basic Table', () => {
  it('should render a simple user table', () => {
    // Define your data type
    type User = {
      id: number;
      name: string;
      email: string;
      status: string;
    };

    // Create sample data
    const users: User[] = [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'inactive' },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', status: 'active' },
    ];

    // Define column registry
    const columns: ColumnRegistry<User> = {
      id: { header: 'ID', align: 'right' },
      name: { header: 'Name', align: 'left' },
      email: { header: 'Email', align: 'left' },
      status: { header: 'Status', align: 'left' },
    };

    // Build and render the table
    const table = new TableRenderer({
      columns: buildColumns(['id', 'name', 'email', 'status'], columns),
      data: users,
    });

    console.log('\n=== Example 01: Basic User Table ===\n');
    table.print();
    console.log('');
  });
});
