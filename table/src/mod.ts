/**
 * @epdoc/table - Terminal table formatter with ANSI-aware styling
 *
 * Renders aligned, styled tables for CLI applications with support for:
 * - ANSI-aware padding and width calculations
 * - Column auto-sizing and max-width truncation
 * - Per-cell and per-row styling with dynamic colors
 * - Zebra striping for alternating rows
 * - Full box-drawing borders with multiple styles
 * - Built-in formatters for common data types
 * - **NEW in v1.0**: Simple one-liner API with auto-formatting
 *
 * @module @epdoc/table
 *
 * @example NEW Simple API - One-liner
 * ```typescript
 * import { table } from '@epdoc/table';
 *
 * // Auto-discovers columns, applies smart defaults
 * table(users).print();
 *
 * // Select columns
 * table(users, ['id', 'name', 'status']).print();
 *
 * // Quick customization with chainable methods
 * table(users)
 *   .column('id', 'right')
 *   .column('status', { color: 'green' })
 *   .header('cyan')
 *   .borders()
 *   .print();
 * ```
 *
 * @example Simple API with Formatters
 * ```typescript
 * import { table } from '@epdoc/table';
 *
 * table(servers)
 *   .column('memory', { format: 'bytes' })
 *   .column('cpu', { format: 'percent', decimals: 1 })
 *   .column('uptime', { format: 'uptime' })
 *   .column('isOnline', { format: 'checkmark', align: 'center' })
 *   .column('created', {
 *     format: 'datetime',
 *     datetime: { pattern: 'yyyy-MM-dd', timezone: 'utc' }
 *   })
 *   .print();
 * ```
 *
 * @example Basic Usage with Column Registry (Original API)
 * ```typescript
 * import { TableRenderer, buildColumns } from '@epdoc/table';
 * import type { ColumnRegistry } from '@epdoc/table';
 *
 * interface User {
 *   id: number;
 *   name: string;
 *   status: string;
 * }
 *
 * const users: User[] = [
 *   { id: 1, name: 'Alice', status: 'active' },
 *   { id: 2, name: 'Bob', status: 'inactive' }
 * ];
 *
 * const columns: ColumnRegistry<User> = {
 *   id: { header: 'ID', align: 'right' },
 *   name: { header: 'Name', align: 'left' },
 *   status: { header: 'Status', align: 'left' }
 * };
 *
 * const table = new TableRenderer({
 *   columns: buildColumns(['id', 'name', 'status'], columns),
 *   data: users
 * });
 *
 * table.print();
 * ```
 *
 * @example Fluent API (Original API)
 * ```typescript
 * import { TableRenderer } from '@epdoc/table';
 * import { bold, rgb24 } from '@std/fmt/colors';
 *
 * TableRenderer.create<User>()
 *   .column('id', { header: 'ID', align: 'right' })
 *   .column('name', { header: 'NAME', maxWidth: 24 })
 *   .column('status', {
 *     header: 'STATUS',
 *     color: (_v, row) => row.status === 'active' ? 0x51d67c : 0xef5867
 *   })
 *   .data(users)
 *   .padding(4)
 *   .headerStyle((s) => bold(rgb24(s, 0x58d1eb)))
 *   .topBorder(true)
 *   .bottomBorder(true)
 *   .print();
 * ```
 *
 * @example With Built-in Formatters (Original API)
 * ```typescript
 * import { TableRenderer, buildColumns, formatters } from '@epdoc/table';
 *
 * const columns = {
 *   name: { header: 'Server' },
 *   cpu: { header: 'CPU%', formatter: formatters.percent({ decimals: 1 }) },
 *   memory: { header: 'Memory', formatter: formatters.bytes() },
 *   uptime: { header: 'Uptime', formatter: formatters.uptime() }
 * };
 * ```
 *
 * @example Zebra Striping (Original API)
 * ```typescript
 * import { TableRenderer } from '@epdoc/table';
 * import { bgRgb24 } from '@std/fmt/colors';
 *
 * const table = new TableRenderer({
 *   columns,
 *   data,
 *   rowStyles: [
 *     (s) => bgRgb24(s, 0x1a1a2e), // Even rows
 *     (s) => bgRgb24(s, 0x16213e)  // Odd rows
 *   ]
 * });
 * ```
 *
 * @example Full Borders (Original API)
 * ```typescript
 * const table = new TableRenderer({
 *   columns,
 *   data,
 *   borders: {
 *     enabled: true,
 *     style: 'light',  // 'light', 'heavy', 'double', or 'custom'
 *     color: 0x888888
 *   }
 * });
 * ```
 */

// Simple API (NEW in v1.0)
export { defineColors, table } from './simple.ts';
export type * from './simple-types.ts';

// Original API (backward compatible)
export { formatters } from './formatters.ts';
export { TableRenderer, TableRenderer as Renderer } from './render.ts';
export * from './terminal.ts';
export type * from './types.ts';
export * from './utils.ts';
