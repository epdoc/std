# @epdoc/table

A terminal table formatter with ANSI-aware padding, column auto-sizing, zebra striping, and per-cell styling. Designed
for rendering aligned, styled tables in CLI applications.

## Install

```bash
deno add jsr:@epdoc/table
```

## Quick Start

```ts
import { buildColumns, TableRenderer } from '@epdoc/table';
import type { ColumnRegistry } from '@epdoc/table';

// Define your data type
interface User {
  id: number;
  name: string;
  status: string;
}

// Create sample data
const users: User[] = [
  { id: 1, name: 'Alice Johnson', status: 'active' },
  { id: 2, name: 'Bob Smith', status: 'inactive' },
  { id: 3, name: 'Charlie Brown', status: 'active' },
];

// Define column registry
const columnDefs: ColumnRegistry<User> = {
  id: { header: 'ID', align: 'right' },
  name: { header: 'Name', align: 'left' },
  status: { header: 'Status', align: 'left' },
};

// Build and render the table
const table = new TableRenderer({
  columns: buildColumns(['id', 'name', 'status'], columnDefs),
  data: users,
});

table.print();
```

Output:

```
ID  Name            Status
--  --------------- --------
 1  Alice Johnson   active
 2  Bob Smith       inactive
 3  Charlie Brown   active
```

## Features

- **ANSI-aware rendering**: Properly handles colored text with correct width calculations
- **Column auto-sizing**: Automatically calculates optimal column widths from data
- **Per-cell styling**: Dynamic colors and formatting based on cell values
- **Zebra striping**: Alternating row backgrounds for better readability
- **Fluent API**: Chain methods to build tables incrementally
- **Built-in formatters**: Percentages, bytes, and uptime formatting
- **Flexible headers**: Styled headers with custom separators
- **Borders**: Optional top and bottom borders

## Core Components

### TableRenderer

The main class for rendering tables. Supports both constructor-based and fluent API usage.

#### Constructor API

```ts
import { buildColumns, TableRenderer } from '@epdoc/table';
import { bold, rgb24 } from '@std/fmt/colors';

const table = new TableRenderer({
  columns: buildColumns(['id', 'name', 'status'], columnDefs),
  data: users,
  headerStyle: (s) => bold(rgb24(s, 0x58d1eb)),
  rowStyles: [
    (s) => rgb24(s, 0xcccccc), // Even rows
    null, // Odd rows (no styling)
  ],
  padding: 2,
});

table.print();
```

#### Fluent API

```ts
import { TableRenderer } from '@epdoc/table';
import { bold, rgb24 } from '@std/fmt/colors';

TableRenderer.create<User>()
  .column('id', { header: 'ID', align: 'right' })
  .column('name', { header: 'NAME', maxWidth: 24 })
  .column('status', {
    header: 'STATUS',
    align: 'right',
    color: (_v, row) => row.status === 'active' ? 0x51d67c : 0xef5867,
  })
  .data(users)
  .padding(4)
  .headerStyle((s) => bold(rgb24(s, 0x58d1eb)))
  .topBorder(true)
  .bottomBorder(true)
  .print();
```

### Column Definition

Define columns with the `ColumnRegistry` type:

```ts
import type { ColorType, ColumnRegistry } from '@epdoc/table';
import { rgb24 } from '@std/fmt/colors';

const columns: ColumnRegistry<Server> = {
  // Simple column with alignment (left, center, right)
  id: { header: 'ID', align: 'right' },

  // Center-aligned column
  code: { header: 'Code', align: 'center' },

  // Column with max width (truncates with ellipsis)
  name: { header: 'Name', maxWidth: 20 },

  // Column with custom formatter
  cpu: {
    header: 'CPU%',
    align: 'right',
    formatter: (v) => `${(v as number).toFixed(1)}%`,
  },

  // Column with conditional coloring
  status: {
    header: 'Status',
    color: (value) =>
      value === 'ok'
        ? (s) => rgb24(s, 0x51d67c) // Green
        : (s) => rgb24(s, 0xef5867), // Red
  },
};
```

### Styling

#### Color Types

The table supports three ways to specify colors:

1. **Number (hex color)** - Simple foreground color:
   ```ts
   headerStyle: 0x58d1eb;
   ```

2. **ColorSpec object** - Foreground and/or background:
   ```ts
   rowStyles: [{ fg: 0xffffff, bg: 0x1a1a2e }, null];
   ```

3. **StyleFn** - Full ANSI control:
   ```ts
   headerStyle: ((s) => bold(rgb24(s, 0x58d1eb)));
   ```

#### Per-Cell Colors

Dynamic coloring based on cell values and row data:

```ts
{
  key: 'memory',
  header: 'Memory',
  color: (_value, row) => {
    const pct = row.memoryUsed / row.memoryTotal;
    if (pct > 0.9) return 0xff0000;  // Red for high usage
    if (pct > 0.7) return 0xffaa00;  // Orange for medium
    return 0x00ff00;                  // Green for low
  }
}
```

## Built-in Formatters

The `formatters` namespace provides factory functions for common data types:

### Percent

```ts
import { formatters } from '@epdoc/table';

// Default: "45.23 %"
formatter: formatters.percent();

// Custom decimals: "45.2%"
formatter: formatters.percent({ decimals: 1, separator: '' });

// With colored unit
formatter: formatters.percent({ decimals: 2, unitColor: 0x888888 });
```

### Bytes

Formats bytes into human-readable binary units (GiB, MiB, KiB):

```ts
import { formatters } from '@epdoc/table';

// Default: "45.2 MiB"
formatter: formatters.bytes();

// Custom: "45.2MiB"
formatter: formatters.bytes({ decimals: 1, separator: '' });
```

### Uptime

Formats seconds into human-readable duration:

```ts
import { formatters } from '@epdoc/table';

// Default: "31d06h21m"
formatter: formatters.uptime();

// With spaces: "31d 06h 21m"
formatter: formatters.uptime({ separator: ' ' });

// Limited units: "31d06h"
formatter: formatters.uptime({ units: 2 });
```

## Advanced Examples

### Table with Borders

```ts
import { buildColumns, TableRenderer } from '@epdoc/table';
import { rgb24 } from '@std/fmt/colors';

const table = new TableRenderer({
  columns: buildColumns(['name', 'cpu', 'memory'], columns),
  data: servers,
  headerStyle: (s) => rgb24(s, 0x58d1eb),
  dividerChar: '─',
  dividerStyle: 0x888888,
  topBorder: true,
  bottomBorder: true,
});

table.print();
```

### Zebra-Striped Table

```ts
import { TableRenderer } from '@epdoc/table';
import { bgRgb24 } from '@std/fmt/colors';

const table = new TableRenderer({
  columns,
  data,
  rowStyles: [
    (s) => bgRgb24(s, 0x1a1a2e), // Even rows
    (s) => bgRgb24(s, 0x16213e), // Odd rows
  ],
});
```

### No-Color Mode

For output to files or non-TTY environments:

```ts
const table = new TableRenderer({
  columns,
  data,
  noColor: true, // Strip all ANSI codes
});

// Or auto-detect in Deno
const table = new TableRenderer({
  columns,
  data,
  noColor: Deno.noColor,
});
```

## API Reference

### Types

- `Column<T>` - Column definition with key, header, width, alignment, formatter, and color
- `ColumnRegistry<T>` - Declarative map of keys to column properties
- `Options<T>` - Table rendering options
- `ColorType` - Flexible color specification (StyleFn | number | ColorSpec)
- `StyleFn` - ANSI styling function
- `ColorSpec` - Foreground and background color specification

### Classes

- `TableRenderer<T>` - Main table rendering class

### Functions

- `buildColumns<T>(keys, registry)` - Build column definitions from a registry

### Namespaces

- `formatters` - Built-in formatter factories (percent, bytes, uptime)

## License

[MIT](./LICENSE)
