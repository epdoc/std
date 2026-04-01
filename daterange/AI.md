# @epdoc/daterange AI Documentation

## Overview

@epdoc/daterange is a Deno module for parsing flexible date range strings and managing collections of date ranges using
Temporal.Instant. It provides both low-level parsing utilities and high-level CLI integration for command-line
applications.

## Key Capabilities

### 1. Relative Time Parsing

Parse human-friendly relative time expressions:

- Single units: `1d`, `2h`, `30m`, `10s`, `1y`
- Combined units: `1d12h30m` (1 day, 12 hours, 30 minutes)
- Negative (future): `-1h` (1 hour from now)
- Keywords: `now`, `today`, `yesterday`, `tomorrow`, `startOfDay`, `endOfDay`

### 2. Date Range Classes

- **DateRange**: Single interval with after/before boundaries
  - Supports Date, Temporal.Instant, ISO strings, relative strings
  - Operations: contains, overlaps, intersect, union, duration
  - Iteration: iterate over days or hours within range

- **DateRanges**: Collection of multiple ranges
  - Check containment across any range
  - Merge overlapping ranges
  - Serialization to compact, JSON, or ISO 8601 interval formats

### 3. Flexible Date Parsing

Accepts multiple date formats:

- Compact: `2025`, `202502`, `20250215`, `202502151030`
- ISO 8601: `2025-01-01T00:00:00Z`
- Relative: `1d`, `now`, `today`
- Ranges: `20250101-20250131`, `1d-now`, `20250101-`

### 4. CLI Integration

Pre-built option definitions for @epdoc/cliapp:

- `dateRangeOptions.range()` → `-d, --date [dates]` (single range)
- `dateRangeOptions.ranges()` → `-R, --ranges <ranges>` (multiple ranges)
- `dateRangeOptions.since()` → `-s, --since <since>` (start time)
- `dateRangeOptions.until()` → `-e, --until <until>` (end time)
- `dateRangeOptions.window()` → `-w, --window <window>` (time window)

All options support custom flags via parameter.

## Common Patterns

### Parse Command-Line Date Range

```typescript
const range = DateRanges.parse('1d-now').ranges[0];
// or
const range = dateRangeOptions.range().argParser('1d-now') as DateRange;
```

### Check if Date Falls in Range

```typescript
const dr = dateRanges('20250101-20250131');
const isContained = dr.contains(Temporal.Now.instant());
// or with Date
const isContained = dr.contains(new Date());
```

### Filter Data by Date Range

```typescript
const range = DateRange.fromRelative('7d', 'now');
const recentData = allData.filter((item) => range.contains(item.timestamp));
```

### CLI Command with Date Options

```typescript
class HistoryCommand extends CliApp.Cmd.AbstractBase {
  defineOptions() {
    this.option(dateRangeOptions.range()).emit();
    this.option(dateRangeOptions.since()).emit();
    this.option(dateRangeOptions.until()).emit();
  }

  execute(opts) {
    // opts.date is DateRange (if provided)
    // opts.since is Temporal.Instant
    // opts.until is Temporal.Instant

    // Build range from since/until if date not provided
    const range = opts.date || new DateRange(opts.since, opts.until);

    // Fetch data within range
    const data = await fetchHistory(range);
  }
}
```

## Important Notes

### Temporal.Instant vs Date

- All operations return Temporal.Instant (not Date)
- Date inputs are automatically converted to Temporal.Instant
- Boundaries are inclusive (both after and before are included)

### Timezone Handling

- Compact date strings (YYYYMMDD) are interpreted in local timezone
- ISO strings with timezone info are parsed accordingly
- Relative times are calculated from reference time in local context

### Inclusive vs Exclusive

- Range boundaries are inclusive (unlike old v0.x behavior)
- `range.contains(range.after)` returns true
- `range.contains(range.before)` returns true

### Version 1.0.0 Breaking Changes

- Returns Temporal.Instant instead of Date
- Boundaries are now inclusive
- dateList() signature changed to accept options object
- New DateRange class for single intervals

## File Structure

```
src/
├── mod.ts              # Main exports
├── types.ts            # Type definitions, INSTANT_MIN/MAX
├── date-range.ts       # DateRange class (single interval)
├── date-ranges.ts      # DateRanges class (collection)
├── relative-time.ts    # parseRelativeTime function
├── util.ts             # dateList, dateRanges, dateStringToInstant
└── cli.ts              # dateRangeOptions for CLI integration
```

## Dependencies

- `@epdoc/type` - Type guards and utilities
- Temporal API (built into Deno)

## Testing

Run tests:

```bash
cd daterange && deno task test
```

Tests cover:

- Relative time parsing (single/combined units, keywords)
- Date string parsing (all compact formats)
- DateRange operations (contains, overlaps, intersect, union)
- DateRanges collections (merge, contains)
- CLI options (all option types, custom flags)
- Integration scenarios
