# TODO: Add Full Box-Drawing Borders Feature to @epdoc/table

**Date:** 2026-03-04\
**Context:** Replace manual table rendering in routergen with @epdoc/table\
**Issue:** @epdoc/table currently only supports horizontal dividers (top/bottom). Need full box-drawing borders with
vertical pipes, corners, and junctions.

---

## Requirements Summary

### 1. Border Features to Add

- **Vertical borders** (`│`) between columns and at edges
- **Corner characters** (`┌`, `┐`, `└`, `┘`)
- **Junction characters** (`├`, `┤`, `┬`, `┴`, `┼`)
- **Configurable border style** presets: `'light'`, `'heavy'`, `'double'`, `'custom'`
- **Configurable border color** (per-table, using existing ColorType)
- **Opt-in** (disabled by default)
- **When borders are enabled, ignore column padding/spacing** (borders provide visual separation)

### 2. Current State

**Files to modify:**

- `src/types.ts` - Add border configuration types
- `src/render.ts` - Add border rendering logic to TableRenderer
- `test/example*.test.ts` - Add new example showing borders

**Existing relevant code:**

- `topBorder` and `bottomBorder` options already exist (render horizontal lines only)
- `dividerChar` and `dividerStyle` for customizing horizontal dividers
- `padding` option for spacing between columns (should be ignored when borders enabled)

---

## Implementation Plan

### Phase 1: Define Border Types (src/types.ts)

Add new types after existing `TableOptions` interface:

```typescript
/**
 * Box-drawing character set for table borders.
 */
export interface BorderCharSet {
  topLeft: string; // ┌
  topRight: string; // ┐
  bottomLeft: string; // └
  bottomRight: string; // ┘
  horizontal: string; // ─
  vertical: string; // │
  topJunction: string; // ┬
  bottomJunction: string; // ┴
  leftJunction: string; // ├
  rightJunction: string; // ┤
  crossJunction: string; // ┼
}

/**
 * Border style presets.
 */
export type BorderStyle = 'light' | 'heavy' | 'double' | 'custom';

/**
 * Border configuration for table.
 */
export interface BorderConfig {
  /**
   * Enable full box-drawing borders (corners, junctions, vertical pipes).
   * @default false
   */
  enabled: boolean;

  /**
   * Border style preset. Use 'custom' to provide your own character set.
   * @default 'light'
   */
  style?: BorderStyle;

  /**
   * Color for all border characters.
   * Can be a hex number (0xff0000), ColorSpec object, or StyleFn function.
   */
  color?: ColorType;

  /**
   * Custom border character set. Only used when style is 'custom'.
   */
  chars?: BorderCharSet;
}

/**
 * Predefined border character sets.
 */
export const BORDER_STYLES: Record<Exclude<BorderStyle, 'custom'>, BorderCharSet> = {
  light: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    topJunction: '┬',
    bottomJunction: '┴',
    leftJunction: '├',
    rightJunction: '┤',
    crossJunction: '┼',
  },
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    topJunction: '┳',
    bottomJunction: '┻',
    leftJunction: '┣',
    rightJunction: '┫',
    crossJunction: '╋',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    topJunction: '╦',
    bottomJunction: '╩',
    leftJunction: '╠',
    rightJunction: '╣',
    crossJunction: '╬',
  },
};
```

Update `TableOptions<T>` interface to include:

```typescript
export interface TableOptions<T> {
  // ... existing options ...

  /**
   * Border configuration. When enabled, renders full box-drawing borders
   * around the table with corners, junctions, and vertical pipes.
   * When borders are enabled, the 'padding' option is ignored.
   */
  borders?: BorderConfig;
}
```

---

### Phase 2: Add Border Rendering Logic (src/render.ts)

#### Step 2.1: Add helper method to get border characters

Add this private method to `TableRenderer` class:

```typescript
/**
 * Get the border character set based on configuration.
 */
private getBorderChars(): BorderCharSet | undefined {
  if (!this.borders?.enabled) {
    return undefined;
  }

  const style = this.borders.style ?? 'light';
  
  if (style === 'custom') {
    if (!this.borders.chars) {
      throw new Error('Border style "custom" requires providing chars configuration');
    }
    return this.borders.chars;
  }

  return BORDER_STYLES[style];
}
```

#### Step 2.2: Add helper method to apply border color

Add this private method:

```typescript
/**
 * Apply border color to a string if configured.
 */
private applyBorderColor(str: string): string {
  if (!this.borders?.color) {
    return str;
  }

  // Handle ColorType (can be number, ColorSpec, or StyleFn)
  if (typeof this.borders.color === 'function') {
    // StyleFn - call it with the border string
    return this.borders.color(str);
  } else if (typeof this.borders.color === 'number') {
    // Hex color number
    return rgb24(str, this.borders.color);
  } else {
    // ColorSpec object { fg?, bg? }
    let result = str;
    if (this.borders.color.fg !== undefined) {
      result = rgb24(result, this.borders.color.fg);
    }
    if (this.borders.color.bg !== undefined) {
      result = bgRgb24(result, this.borders.color.bg);
    }
    return result;
  }
}
```

#### Step 2.3: Add method to render top border

Add this private method:

```typescript
/**
 * Render top border line.
 * Example: ┌─────┬─────┬─────┐
 */
private renderTopBorder(widths: number[]): string {
  const chars = this.getBorderChars();
  if (!chars) return '';

  const segments = widths.map(width => chars.horizontal.repeat(width));
  const line = chars.topLeft + segments.join(chars.topJunction) + chars.topRight;
  
  return this.applyBorderColor(line);
}
```

#### Step 2.4: Add method to render header separator

Add this private method:

```typescript
/**
 * Render header separator line.
 * Example: ├─────┼─────┼─────┤
 */
private renderHeaderSeparator(widths: number[]): string {
  const chars = this.getBorderChars();
  if (!chars) return '';

  const segments = widths.map(width => chars.horizontal.repeat(width));
  const line = chars.leftJunction + segments.join(chars.crossJunction) + chars.rightJunction;
  
  return this.applyBorderColor(line);
}
```

#### Step 2.5: Add method to render bottom border

Add this private method:

```typescript
/**
 * Render bottom border line.
 * Example: └─────┴─────┴─────┘
 */
private renderBottomBorder(widths: number[]): string {
  const chars = this.getBorderChars();
  if (!chars) return '';

  const segments = widths.map(width => chars.horizontal.repeat(width));
  const line = chars.bottomLeft + segments.join(chars.bottomJunction) + chars.bottomRight;
  
  return this.applyBorderColor(line);
}
```

#### Step 2.6: Modify renderRow method to add vertical borders

Find the `renderRow` method and update it:

```typescript
private renderRow(
  row: Record<string, string>,
  columns: ColumnDefinition<T>[],
  widths: number[],
  rowData?: T,
  noColor = false,
): string {
  const chars = this.getBorderChars();
  const verticalBorder = chars ? this.applyBorderColor(chars.vertical) : '';
  
  // Determine spacing between columns
  const spacing = chars ? '' : ' '.repeat(this.padding);

  const cells = columns.map((col, i) => {
    let value = row[col.key] ?? '';
    
    // Apply color if not noColor mode
    if (!noColor && col.color) {
      const colorValue = typeof col.color === 'function' 
        ? col.color(value, rowData) 
        : col.color;
      value = this.applyColor(value, colorValue);
    }

    // Pad to column width
    const width = widths[i];
    const displayWidth = stripAnsiCode(value).length;
    const paddingNeeded = width - displayWidth;

    if (col.align === 'right') {
      return ' '.repeat(paddingNeeded) + value;
    } else if (col.align === 'center') {
      const leftPad = Math.floor(paddingNeeded / 2);
      const rightPad = paddingNeeded - leftPad;
      return ' '.repeat(leftPad) + value + ' '.repeat(rightPad);
    } else {
      return value + ' '.repeat(paddingNeeded);
    }
  });

  if (chars) {
    // With borders: │ cell1 │ cell2 │ cell3 │
    return verticalBorder + ' ' + cells.join(' ' + verticalBorder + ' ') + ' ' + verticalBorder;
  } else {
    // Without borders: cell1   cell2   cell3 (with padding)
    return cells.join(spacing);
  }
}
```

#### Step 2.7: Modify render method to include all borders

Update the main `render()` method to use border methods:

```typescript
render(): string {
  const lines: string[] = [];
  const widths = this.calculateColumnWidths();
  const chars = this.getBorderChars();

  // Render top border
  if (chars) {
    lines.push(this.renderTopBorder(widths));
  } else if (this.topBorder) {
    // Legacy top border (horizontal line only)
    lines.push(this.renderDivider(widths));
  }

  // Render header
  const headerRow = this.renderRow(
    this.buildHeaderRow(),
    this.columns,
    widths,
    undefined,
    this.noColor,
  );
  lines.push(headerRow);

  // Render header separator
  if (chars) {
    lines.push(this.renderHeaderSeparator(widths));
  }

  // Render data rows
  for (let i = 0; i < this.data.length; i++) {
    const row = this.data[i];
    const rowStyle = this.getRowStyle(i);
    const formattedRow = this.buildDataRow(row);
    const renderedRow = this.renderRow(
      formattedRow,
      this.columns,
      widths,
      row,
      this.noColor,
    );
    
    // Apply row style if no color mode is off
    if (!this.noColor && rowStyle) {
      const styledRow = this.applyColor(renderedRow, rowStyle);
      lines.push(styledRow);
    } else {
      lines.push(renderedRow);
    }
  }

  // Render bottom border
  if (chars) {
    lines.push(this.renderBottomBorder(widths));
  } else if (this.bottomBorder) {
    // Legacy bottom border (horizontal line only)
    lines.push(this.renderDivider(widths));
  }

  return lines.join('\n');
}
```

---

### Phase 3: Add Fluent API Methods (src/render.ts)

Add these methods to the fluent API section of `TableRenderer`:

```typescript
/**
 * Enable full box-drawing borders with optional style and color.
 */
borders(enabled: boolean = true, style: BorderStyle = 'light', color?: ColorType): this {
  this.options.borders = {
    enabled,
    style,
    color,
  };
  return this;
}

/**
 * Set border style. Only effective if borders are enabled.
 */
borderStyle(style: BorderStyle): this {
  if (!this.options.borders) {
    this.options.borders = { enabled: false };
  }
  this.options.borders.style = style;
  return this;
}

/**
 * Set border color. Only effective if borders are enabled.
 */
borderColor(color: ColorType): this {
  if (!this.options.borders) {
    this.options.borders = { enabled: false };
  }
  this.options.borders.color = color;
  return this;
}

/**
 * Set custom border characters. Automatically sets style to 'custom'.
 */
borderChars(chars: BorderCharSet): this {
  if (!this.options.borders) {
    this.options.borders = { enabled: false };
  }
  this.options.borders.style = 'custom';
  this.options.borders.chars = chars;
  return this;
}
```

---

### Phase 4: Add Tests and Examples

Create `test/example11_borders.test.ts`:

```typescript
import { describe, it } from '@std/testing/bdd';
import { buildColumns, TableRenderer } from '../src/mod.ts';
import type { ColumnRegistry } from '../src/types.ts';
import { rgb24 } from '@std/fmt/colors';

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

    console.log('\n--- Light Borders (Default) ---\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'light',
      },
    });
    console.log(table.render());
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

    console.log('\n--- Heavy Borders (Gray) ---\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'heavy',
        color: 0x888888,
      },
    });
    console.log(table.render());
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

    console.log('\n--- Double Borders (Cyan) ---\n');
    const table = new TableRenderer({
      columns: buildColumns(['hostname', 'ip', 'board', 'platform', 'version', 'isRouter'], columns),
      data,
      borders: {
        enabled: true,
        style: 'double',
        color: 0x58d1eb,
      },
      headerStyle: 0x58d1eb,
    });
    console.log(table.render());
  });

  it('should render using fluent API', () => {
    console.log('\n--- Fluent API with Borders ---\n');
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
      .borderColor(0xffffff)
      .headerStyle(0xffffff)
      .print();
  });

  it('should render with custom border characters', () => {
    const columns: ColumnRegistry<Device> = {
      hostname: { header: 'Hostname', width: 15 },
      ip: { header: 'IP Address', width: 16 },
      version: { header: 'Version', width: 8 },
    };

    console.log('\n--- Custom Border Characters ---\n');
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
    console.log(table.render());
  });
});
```

Run the test to verify output:

```bash
cd /Users/jpravetz/dev/@epdoc/std/table
deno test test/example11_borders.test.ts
```

---

### Phase 5: Update Documentation

Update `README.md` to document the new border feature. Add a section after "Borders" (current top/bottom only):

````markdown
### Full Box-Drawing Borders

Enable complete table borders with corners, junctions, and vertical separators:

```typescript
const table = new TableRenderer({
  columns: buildColumns(['name', 'age', 'city'], columns),
  data,
  borders: {
    enabled: true, // Enable full borders
    style: 'light', // 'light', 'heavy', 'double', or 'custom'
    color: 0x888888, // Optional: Color for border characters
  },
});
```
````

**Border Styles:**

- `'light'`: `┌─┬─┐` / `├─┼─┤` / `└─┴─┘` (default)
- `'heavy'`: `┏━┳━┓` / `┣━╋━┫` / `┗━┻━┛`
- `'double'`: `╔═╦═╗` / `╠═╬═╣` / `╚═╩═╝`
- `'custom'`: Provide your own `BorderCharSet`

**Fluent API:**

```typescript
TableRenderer.create<T>()
  .borders(true, 'heavy') // Enable heavy borders
  .borderColor(0x58d1eb) // Cyan borders
  .print();
```

**Note:** When borders are enabled, the `padding` option is ignored as borders provide visual column separation.

```
---

## Testing Checklist

After implementing, verify:

- [ ] Light borders render correctly
- [ ] Heavy borders render correctly
- [ ] Double borders render correctly
- [ ] Custom borders with custom characters work
- [ ] Border color applies correctly to all border characters
- [ ] Border color works with hex numbers (e.g., `0x888888`)
- [ ] Border color works with ColorSpec objects (e.g., `{ fg: 0xffffff }`)
- [ ] Border color works with StyleFn functions
- [ ] Borders are opt-in (disabled by default)
- [ ] When borders enabled, padding is ignored
- [ ] Cell alignment works correctly with borders (left, right, center)
- [ ] ANSI color codes in cell content don't break border alignment
- [ ] Fluent API methods work correctly
- [ ] noColor mode strips border colors
- [ ] All existing tests still pass

---

## Integration with routergen (Separate Task)

After the border feature is complete and tested in @epdoc/table, update `packages/device/src/cmd/list.ts`:

1. Import @epdoc/table dependencies
2. Define ColumnRegistry for Device.RosDevice
3. Replace manual table rendering (lines 91-139) with TableRenderer
4. Add MAC address as a column (always visible if data available)
5. Test with `deno task run list --insecure`

This is documented separately and should be done AFTER the table package is updated.

---

## Notes

- **Performance:** Border rendering adds minimal overhead (just string concatenation)
- **Backwards compatibility:** Existing tables without `borders` config are unaffected
- **Screen width handling:** The current request about responsive column hiding based on terminal width is a SEPARATE feature that should be addressed in a future enhancement
- **Column ranking feature:** User wants ability to rank columns by priority for removal on narrow screens - this is tracked separately and NOT part of this border implementation

---

## Future Enhancements (Not in Scope)

These were mentioned but are separate tasks:

1. **Responsive column hiding:** Detect terminal width and hide lower-priority columns
2. **Column priority ranking:** Allow marking columns as "required" vs "optional" for narrow displays
3. **Detail/sub-rows:** Support for expandable row details (like the verbose MAC address line)

---

## References

- Current implementation: `packages/device/src/cmd/list.ts` lines 91-139
- Existing border code: `src/render.ts` (topBorder, bottomBorder, dividerChar)
- Color handling: `src/utils.ts` (applyColor, ColorType)
- Test examples: `test/example*.test.ts`

---

**Estimated Effort:** 2-3 hours
**Priority:** High (blocking routergen table replacement)
**Complexity:** Medium (well-defined requirements, existing similar code to reference)
```
