# Unit Styling Guide for @epdoc/table

When displaying values with units (%, MB, seconds, etc.), you want the numeric values to stand out while keeping units
readable but subtle. This guide shows the best approaches.

## Quick Recommendation

**Use muted gray color for units:**

```typescript
const gray = 0x888888;

const formatPercent = (v: unknown): string => {
  const percent = (v as number) * 100;
  return `${percent.toFixed(1)}${rgb24('%', gray)}`;
};
```

**Why this works:**

- ✓ Readable in both light and dark terminal themes
- ✓ Creates clear visual hierarchy
- ✓ More reliable than `dim()` styling
- ✓ Works with conditional coloring on values
- ✓ Units are distinct but not distracting

## Comparison of Approaches

### 1. Muted Gray Color (Recommended)

```typescript
const gray = 0x888888;
return `${value}${rgb24('%', gray)}`;
```

- **Output:** `45.2%` (where % is gray)
- **Pros:** Reliable, works in all themes, clear hierarchy
- **Cons:** Requires color code

### 2. Space Separation (Simplest)

```typescript
return `${value} %`;
```

- **Output:** `45.2 %`
- **Pros:** No special styling, always readable, simple code
- **Cons:** Takes slightly more horizontal space

### 3. Muted Blue/Accent Color

```typescript
const lightBlue = 0x5b9bd5;
return `${value}${rgb24('%', lightBlue)}`;
```

- **Output:** `45.2%` (where % is light blue)
- **Pros:** Subtle accent, visually interesting
- **Cons:** May clash with value colors

### 4. dim() Styling

```typescript
return `${value}${dim('%')}`;
```

- **Output:** `45.2%` (where % is dimmed)
- **Pros:** Built-in ANSI code
- **Cons:** Often too subtle, varies by terminal

### 5. Italic

```typescript
return `${value}${italic('%')}`;
```

- **Output:** `45.2%` (where % is italic)
- **Pros:** Style-based differentiation
- **Cons:** Not supported in all terminals

### 6. Plain Text

```typescript
return `${value}%`;
```

- **Output:** `45.2%`
- **Pros:** Universal, simple
- **Cons:** No visual hierarchy

## Code Examples

### Percentage with Muted Units

```typescript
import { rgb24 } from '@std/fmt/colors';

const gray = 0x888888;

const formatPercentWithUnits = (v: unknown): string => {
  const num = v as number;
  const percent = num * 100;
  const value = percent.toFixed(1);
  return `${value}${rgb24('%', gray)}`;
};

// Use in column definition
const columns: ColumnRegistry<Row> = {
  cpu: {
    header: 'CPU',
    formatter: formatPercentWithUnits,
  },
};
```

### Duration with Muted Units

```typescript
const gray = 0x888888;

const formatUptimeWithUnits = (v: unknown): string => {
  const seconds = v as number;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${rgb24('d', gray)}`);
  if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}${rgb24('h', gray)}`);
  if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}${rgb24('m', gray)}`);

  return parts.join('');
};

// Output: "31d06h01m" (where d, h, m are gray)
```

### Space-Separated (Simple)

```typescript
const formatPercentSimple = (v: unknown): string => {
  const percent = (v as number) * 100;
  return `${percent.toFixed(1)} %`;
};

const formatUptimeSimple = (v: unknown): string => {
  const seconds = v as number;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
  if (minutes > 0) parts.push(`${String(minutes).padStart(2, '0')}m`);

  return parts.join(' ');
};

// Output: "45.2 %" and "31d 06h 01m"
```

## Combining with Conditional Colors

When you apply conditional colors to values, the unit styling works with it:

```typescript
const gray = 0x888888;
const amber = 0xffb020;
const red = 0xef5867;

const formatPercent = (v: unknown): string => {
  const percent = (v as number) * 100;
  return `${percent.toFixed(1)}${rgb24('%', gray)}`;
};

const percentColor = (v: unknown): StyleFn | undefined => {
  const percent = (v as number) * 100;
  if (percent > 80) return (s: string) => rgb24(s, red);
  if (percent > 60) return (s: string) => rgb24(s, amber);
  return undefined;
};

// In column definition:
{
  key: 'cpu',
  header: 'CPU',
  formatter: formatPercent,
  color: percentColor,
}

// Result: High values show in red with gray %, normal values show in default color with gray %
```

## Color Palette for Units

Recommended muted colors for units:

```typescript
// Neutral grays (work with most themes)
const gray = 0x888888; // Medium gray - most reliable
const lightGray = 0xaaaaaa; // Lighter gray - good for dark themes
const darkGray = 0x666666; // Darker gray - good for light themes

// Muted accent colors (add subtle interest)
const mutedBlue = 0x5b9bd5; // Soft blue
const mutedGreen = 0x87a96b; // Sage green
const mutedPurple = 0x9b87d5; // Soft purple
```

## Testing Your Styling

Run the example to see all approaches side-by-side:

```bash
deno test -SERW test/example07.test.ts
```

This shows:

1. Comparison table of all 6 approaches
2. Full example with recommended muted gray
3. Full example with space-separated alternative

## Summary

**For most use cases:** Use **muted gray** (`0x888888`) on units

- Best balance of readability and visual hierarchy
- Works in all terminal themes
- Professional appearance

**For simplicity:** Use **space separation**

- No special styling code needed
- Always readable
- Slightly more space but very clean

**Avoid:** `dim()` as primary approach

- Too subtle in many terminals
- Better as a fallback or special case
