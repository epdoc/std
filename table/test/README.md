# @epdoc/table Test Examples

This directory contains both unit tests and functional examples for the `@epdoc/table` module.

## Running Tests

### Run All Tests

```bash
deno test -SERW
```

### Run Only Example Tests

```bash
deno test -SERW test/example*.test.ts
```

### Run Individual Example

```bash
deno test -SERW test/example01.test.ts
```

## Example Files

### `example01.test.ts` - Basic Table

The simplest way to create and render a table.

- Basic column definitions
- Simple data rows
- Default styling

**Key concepts:**

- Using `ColumnRegistry` for column definitions
- Using `buildColumns()` to create column array
- Basic `TableRenderer` constructor

---

### `example02.test.ts` - Styled Table with Colors

Demonstrates styling with colors, header styling, and zebra striping.

- Per-column color functions
- Conditional coloring based on row data
- Header styling with bold and colors
- Zebra striping with alternating row backgrounds
- Custom padding

**Key concepts:**

- Using `StyleFn` for colors
- Conditional coloring with `color` callback
- `headerStyle` and `rowStyles` options
- Using `rgb24()` and `bgRgb24()` from `@std/fmt/colors`

---

### `example03.test.ts` - Table with Formatters

Shows how to use the built-in formatters.

- `formatters.percent()` - Formats decimals as percentages
- `formatters.bytes()` - Formats bytes to human-readable units (GiB, MiB, etc.)
- `formatters.uptime()` - Formats seconds to duration strings

**Key concepts:**

- Using factory formatters in column definitions
- Formatter functions accept `unknown` and handle type conversion
- Formatters work seamlessly with column `formatter` option

---

### `example04.test.ts` - Fluent API

Demonstrates building tables incrementally with the fluent API.

- `TableRenderer.create<T>()` factory method
- Chaining `.column()` calls
- Setting data with `.data()`
- Styling with `.headerStyle()`, `.evenRow()`, `.padding()`
- Rendering with `.print()`

**Key concepts:**

- Fluent API pattern for incremental table building
- Method chaining
- Custom formatter functions inline
- Conditional coloring logic

---

### `example05.test.ts` - Advanced Features

Showcases advanced table features.

- `maxWidth` with ellipsis truncation
- Complex custom formatters (progress bars)
- Multiple color functions
- Array formatting (tags joining)
- Combining `dim()` styling with colors
- Zebra striping

**Key concepts:**

- `maxWidth` for truncating long text
- Custom formatters can return any string (including unicode bars)
- Combining multiple styling functions
- Using `dim()` for subdued appearance

---

### `example06.test.ts` - Dim Units Pattern

Demonstrates using `dim()` to de-emphasize units while keeping values prominent.

- Dimmed percent signs (%)
- Dimmed time units (d, h, m)
- Creates better visual hierarchy
- Values stand out, units remain subtle
- Color coding still applies to full cell
- Side-by-side comparison with/without dim

**Key concepts:**

- Using `dim()` selectively on units within formatted strings
- Custom formatters that combine values with styled units
- Visual hierarchy through subtle styling
- Pattern: `${value}${dim('unit')}`

**Note:** `dim()` may be too subtle in some terminals. See example07 for alternatives.

---

### `example07.test.ts` - Unit Styling Alternatives

Compares different approaches to styling units for better readability.

- Side-by-side comparison of 6 different styling approaches
- **Recommended: Muted gray color** (`rgb24(unit, 0x888888)`)
- Alternative: Space-separated units
- Shows dim(), italic(), colored units, and plain text

**Key concepts:**

- Muted gray (#888888) works in all terminal themes
- More reliable than `dim()` for readability
- Space separation is simplest alternative
- Visual examples help choose the right approach
- Pattern: `${value}${rgb24('%', 0x888888)}`

**Why muted gray works best:**

- ✓ Readable in both light and dark terminals
- ✓ Creates clear visual hierarchy
- ✓ Units are distinct but not distracting
- ✓ Works with conditional coloring on values
- ✓ More reliable than `dim()` styling

## Unit Test Files

- `terminal.test.ts` - Tests for ANSI code handling (`stripAnsi`, `visibleTruncate`, `padVisual`)
- `utils.test.ts` - Tests for utility functions (`buildColumns`, `calculateColumnWidths`, `getStyle`, `isRowStyle`)
- `formatters.test.ts` - Tests for formatter factories (`formatters.percent`, `formatters.bytes`, `formatters.uptime`)
- `render.test.ts` - Integration tests for `TableRenderer` class

## Tips

1. **View colored output**: Run example tests to see actual colored terminal output
2. **Use as templates**: Copy example code to get started quickly
3. **Experiment**: Modify the examples to explore different styling options
4. **Combine features**: Mix and match concepts from different examples

## Common Patterns

### Define Column Registry

```typescript
const columns: ColumnRegistry<MyRow> = {
  id: { header: 'ID', align: 'right' },
  name: { header: 'Name', maxWidth: 20 },
  status: { header: 'Status', color: statusColorFn },
  value: { header: 'Value', formatter: formatters.bytes(1) },
};
```

### Conditional Coloring

```typescript
const statusColor = (_v: unknown, row: MyRow): StyleFn | undefined => {
  if (row.status === 'active') return (s: string) => rgb24(s, green);
  if (row.status === 'error') return (s: string) => rgb24(s, red);
  return undefined;
};
```

### Using Formatters

```typescript
// As factory in column definition
formatter: formatters.percent(2);

// Or create once and reuse
const fmtBytes = formatters.bytes(1);
// ... later in code
console.log(fmtBytes(1073741824)); // "1.0 GiB"
```

### `example09.test.ts` - ColorType API

Demonstrates the flexible `ColorType` API that accepts numbers, `ColorSpec`, or `StyleFn`.

- Simple number (hex) for foreground colors - the most common case
- `ColorSpec` with `{ fg?, bg? }` for background or combined colors
- `StyleFn` for full control (bold, italic, composed styles)
- All three variants work in `color` callbacks, `headerStyle`, and `rowStyles`

**Key concepts:**

- Using hex numbers directly: `color: () => 0xff0000`
- Using ColorSpec for backgrounds: `{ bg: 0x1a1a2e }`
- Using ColorSpec for both: `{ fg: 0xffffff, bg: 0xff0000 }`
- Using StyleFn for advanced styling: `(s) => bold(rgb24(s, color))`

---

## Common Patterns

### Using Formatters

```typescript
// As factory in column definition
formatter: formatters.percent(2);

// Or create once and reuse
const fmtBytes = formatters.bytes(1);
// ... later in code
console.log(fmtBytes(1073741824)); // "1.0 GiB"
```

### Fluent API Pattern

```typescript
TableRenderer.create<T>()
  .column('key1', { header: 'Header 1', align: 'left' })
  .column('key2', { header: 'Header 2', formatter: myFormatter })
  .data(rows)
  .headerStyle((s) => bold(cyan(s)))
  .evenRow({ bg: 0x1a1a2e })
  .print();
```

### ColorType Usage

```typescript
// Simple number (foreground color) - most common
color: (_v, row) => row.active ? 0x51d67c : 0xef5867

// ColorSpec for background
color: () => ({ bg: 0x1a1a2e })

// ColorSpec for both foreground and background
color: () => ({ fg: 0xffffff, bg: 0xff0000 })

// StyleFn for full control
color: () => (s: string) => bold(rgb24(s, 0x51d67c))
```
