# @epdoc/daterange

A Deno module for parsing flexible date range strings and managing collections of date ranges using Temporal.Instant.
It's particularly well-suited for command-line applications where users need to specify time periods for operations like
data fetching or report generation.

## Key Features

- **Temporal.Instant Support**: Built on the modern Temporal API for robust date/time handling with timezone awareness
- **Relative Time Parsing**: Parse human-friendly strings like `1d`, `2h30m`, `now`, `today`, `yesterday`
- **Flexible Parsing**: The `dateList` function parses a wide variety of date and range formats from a single string
- **Single & Multiple Ranges**: Use `DateRange` for single intervals and `DateRanges` for collections
- **CLI Integration**: Ready-to-use option definitions for @epdoc/cliapp and similar frameworks
- **Range Operations**: Check containment, find overlaps, calculate intersections, merge ranges

## Installation

To add this module to your project:

```bash
deno add jsr:@epdoc/daterange
```

Then, import the necessary functions and classes into your code:

```typescript
import { dateList, DateRange, DateRanges, parseRelativeTime } from 'jsr:@epdoc/daterange';
```

## Usage

### Parsing Relative Time with `parseRelativeTime`

Parse human-friendly relative time strings into Temporal.Instant:

```typescript
import { parseRelativeTime } from 'jsr:@epdoc/daterange';

// Parse relative times
const oneDayAgo = parseRelativeTime('1d');
const twoHoursAgo = parseRelativeTime('2h');
const combined = parseRelativeTime('1d12h30m'); // 1 day, 12 hours, 30 minutes ago

// Future times (negative values)
const oneHourFuture = parseRelativeTime('-1h');

// Keywords
const now = parseRelativeTime('now');
const startOfToday = parseRelativeTime('today');
const startOfYesterday = parseRelativeTime('yesterday');
const startOfTomorrow = parseRelativeTime('tomorrow');
```

**Supported Relative Time Formats:**

| Format      | Example                                 | Description                     |
| ----------- | --------------------------------------- | ------------------------------- |
| Single unit | `1d`                                    | 1 day ago                       |
| Hours       | `2h`                                    | 2 hours ago                     |
| Minutes     | `30m`                                   | 30 minutes ago                  |
| Seconds     | `10s`                                   | 10 seconds ago                  |
| Combined    | `1d12h30m`                              | 1 day, 12 hours, 30 minutes ago |
| Future      | `-1h`                                   | 1 hour from now                 |
| Keywords    | `now`, `today`, `yesterday`, `tomorrow` | Special instants                |

### Working with Single Date Ranges (`DateRange`)

The `DateRange` class represents a single interval with `after` (start) and `before` (end) boundaries:

```typescript
import { DateRange } from 'jsr:@epdoc/daterange';

// Create from instants
const range = new DateRange(
  Temporal.Instant.from('2025-01-01T00:00:00Z'),
  Temporal.Instant.from('2025-01-31T23:59:59Z'),
);

// Create from relative strings
const last24h = DateRange.fromRelative('1d', 'now');

// Check containment (boundaries are inclusive)
const instant = Temporal.Now.instant();
console.log(range.contains(instant)); // true or false

// Check overlaps
const otherRange = new DateRange('2025-01-15', '2025-02-15');
console.log(range.overlaps(otherRange)); // true

// Get intersection
const intersection = range.intersect(otherRange);

// Calculate duration in milliseconds
const duration = range.duration(); // milliseconds

// Iterate over days or hours
for (const instant of range.iterate('day')) {
  console.log(instant.toString());
}
```

### Parsing Date Strings with `dateList`

The `dateList` function takes a string of comma-separated date specifications and returns an array of `DateRangeDef`
objects:

```typescript
import { dateList } from 'jsr:@epdoc/daterange';

// A complex string with multiple range types including relative time
const spec = '1d-now, 2025, 202601-202603, 20270101';

const ranges = dateList(spec);

console.log(JSON.stringify(ranges, null, 2));
```

**Supported Date Formats:**

| Format            | Example                | Description                       |
| ----------------- | ---------------------- | --------------------------------- |
| Year              | `2025`                 | The entire year of 2025           |
| Month             | `202502`               | The entire month of February 2025 |
| Day               | `20250215`             | The entire day of Feb 15, 2025    |
| Hour              | `2025021510`           | Specific hour (10 AM)             |
| Minute            | `202502151030`         | Specific minute                   |
| Second            | `20250215103000`       | Specific second                   |
| ISO Date          | `2025-01-01T00:00:00Z` | ISO 8601 format                   |
| Relative          | `1d`, `2h`, `now`      | Relative to current time          |
| Closed Range      | `20250101-20250110`    | From Jan 1 to Jan 10              |
| Open-Ended After  | `20250101-`            | From Jan 1 onwards                |
| Open-Ended Before | `-20250101`            | Before Jan 1                      |
| Comma-Separated   | `2024,202501-202503`   | Multiple ranges                   |

**Notes:**

- When only year, month, or day is specified, the end boundary is set to include the entire period (inclusive)
- All dates are parsed in local timezone context
- Times default to 00:00:00 if not specified

### Working with Multiple Date Ranges (`DateRanges`)

The `DateRanges` class manages collections of ranges:

```typescript
import { DateRanges, dateRanges } from 'jsr:@epdoc/daterange';

// Create from string
const dr = dateRanges('20250115-20250120,20250201-20250210');

// Check if an instant is in ANY range
const instant = Temporal.Now.instant();
console.log(dr.contains(instant)); // true or false

// Merge overlapping ranges
dr.merge();

// Add more ranges
dr.add({ after: Temporal.Now.instant().subtract({ days: 1 }) });

// Serialization
const json = dr.toJSON();
const compact = dr.toCompactString();
const iso = dr.toISOInterval();
```

### CLI Integration

Import pre-built option definitions for @epdoc/cliapp:

```typescript
import { dateRangeOptions } from 'jsr:@epdoc/daterange';
import * as CliApp from '@epdoc/cliapp';

class MyCommand extends CliApp.Cmd.AbstractBase {
  defineOptions() {
    // Single date range
    this.option(dateRangeOptions.range()).emit();

    // Multiple date ranges
    this.option(dateRangeOptions.ranges()).emit();

    // Individual boundaries
    this.option(dateRangeOptions.since()).emit();
    this.option(dateRangeOptions.until()).emit();

    // Time window (convenience)
    this.option(dateRangeOptions.window()).emit();
  }

  execute(opts) {
    // opts.range is a DateRange
    // opts.since is a Temporal.Instant
    // opts.window is a DateRange
  }
}
```

**Available Options:**

| Option     | Default Flags              | Parses To          | Example Input                 |
| ---------- | -------------------------- | ------------------ | ----------------------------- |
| `range()`  | `-d, --date <date-range>`  | `DateRange`        | `1d-now`, `20240101-20240131` |
| `ranges()` | `-d, --date <date-ranges>` | `DateRanges`       | `2024,202501-202503`          |
| `since()`  | `-s, --since <since>`      | `Temporal.Instant` | `1d`, `20240101`              |
| `until()`  | `-e, --until <until>`      | `Temporal.Instant` | `now`, `-1h`                  |
| `window()` | `-w, --window <window>`    | `DateRange`        | `24h`, `7d`                   |

**Custom Flags:**

```typescript
this.option(dateRangeOptions.range('-d, --date <date>')).emit();
this.option(dateRangeOptions.since('--from <from>')).emit();
```

### Command-Line Tool

A command-line interface is included to demonstrate the functionality:

```sh
# Parse date strings
 deno run --allow-env jsr:@epdoc/daterange/examples/cli 2025 202601-20260215

# With relative time
 deno run --allow-env jsr:@epdoc/daterange/examples/cli 1d-now
```

**Output:**

```json
[
  {
    "after": "2025-01-01T06:00:00Z",
    "before": "2026-01-01T05:59:59.999Z"
  }
]
```

## API Reference

### Functions

- `parseRelativeTime(input: string, reference?: Temporal.Instant): Temporal.Instant | undefined` - Parse relative time
  strings
- `dateList(spec: string, options?: DateRangeParseOptions): DateRangeDef[]` - Parse date range strings
- `dateRanges(spec: string, options?: DateRangeParseOptions): DateRanges` - Create DateRanges from string
- `dateStringToInstant(s: string, h?: number): Temporal.Instant` - Convert compact date string to instant

### DateRange Class

- `constructor(after?, before?)` - Create from instants, Dates, or strings
- `contains(instant): boolean` - Check if instant is within range (inclusive)
- `overlaps(other): boolean` - Check if ranges overlap
- `intersect(other): DateRange | null` - Get intersection
- `union(other): DateRange | DateRange[]` - Get union (merges if overlapping)
- `duration(): number` - Duration in milliseconds
- `iterate(unit): Generator<Temporal.Instant>` - Iterate over days/hours
- `toCompactString(): string` - Serialize to compact format
- `toISOInterval(): string` - Serialize to ISO 8601 interval

### DateRanges Class

- `constructor(defs?)` - Create from array of definitions
- `parse(input, options?): DateRanges` - Static factory from string
- `contains(instant): boolean` - Check if instant is in any range
- `merge(): this` - Merge overlapping ranges
- `add(range): this` - Add a range
- `toCompactString(): string` - Serialize to compact format
- `toISOInterval(): string[]` - Serialize to ISO 8601 intervals
- `toJSON(): DateRangeJSON[]` - Serialize to JSON

### CLI Options

- `dateRangeOptions.range(flags?)` - Single range option definition
- `dateRangeOptions.ranges(flags?)` - Multiple ranges option definition
- `dateRangeOptions.since(flags?)` - Start time option definition
- `dateRangeOptions.until(flags?)` - End time option definition
- `dateRangeOptions.window(flags?)` - Time window option definition

## Breaking Changes in v1.0.0

- **Temporal.Instant**: All date operations now return `Temporal.Instant` instead of `Date`
- **Inclusive Boundaries**: Range boundaries are now inclusive (before was exclusive)
- **DateList Signature**: Changed from `dateList(val, h)` to `dateList(val, { reference, inclusiveEnd, defaultHour })`
- **New DateRange Class**: Single range operations moved to new `DateRange` class

## License

MIT
