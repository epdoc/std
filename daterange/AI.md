# @epdoc/daterange AI Documentation

## Overview

`@epdoc/daterange` parses flexible date range strings and manages collections of date ranges. All boundaries are
`DateTime` objects from `@epdoc/datetime`. Built on the Temporal API.

## Architecture

```
src/
├── mod.ts              # Public exports
├── types.ts            # DateRangeDef, DateRangeJSON, DateRangeParseOptions
├── date-range.ts       # DateRange class (single interval)
├── date-ranges.ts      # DateRanges class (collection)
├── relative-time.ts    # parseRelativeTime → DateTime
├── util.ts             # dateList, dateRanges, dateStringToInstant
└── cli.ts              # OptionDef exports for @epdoc/cliapp
```

## Key Design Decisions

- **DateTime everywhere**: `DateRange.after` and `DateRange.before` are `DateTime`, not `Temporal.Instant`. All parsers
  return `DateTime`.
- **Immutable boundaries**: `DateRange` fields are public but treated as immutable; operations return new instances.
- **Local timezone for compact dates**: `YYYYMMDD`, `YYYYMM`, `YYYY` strings are always interpreted in the local
  timezone via `Temporal.Now.timeZoneId()`.
- **ISO strings preserve offset**: `DateTime.from('2024-03-15T10:30:00+05:30')` stores a `ZonedDateTime` with the
  original offset, not UTC.
- **Open boundaries**: `DateTime.min()` / `DateTime.max()` represent open-ended range boundaries. Use `isNearMin()` /
  `isNearMax()` to detect them.

## Core Types

```typescript
type DateRangeDef = { after?: DateTime; before?: DateTime };
type DateRangeJSON = { after?: ISODate; before?: ISODate };
type DateRangeParseOptions = {
  reference?: DateTime; // default: DateTime.now()
  inclusiveEnd?: boolean; // default: true
  defaultHour?: number; // default: 0
};
```

## DateRange Class

```typescript
// Construction
new DateRange()                          // min → max (open)
new DateRange(after, before)             // DateTime boundaries
new DateRange(def)                       // from DateRangeDef
DateRange.fromDef(def)                   // static factory
DateRange.fromRelative('1d', 'now')      // from relative strings

// Properties
range.after   // DateTime (DateTime.min() if open)
range.before  // DateTime (DateTime.max() if open)

// Operations — all use DateTime.compare internally
range.contains(dt)        // DateTime | Date | Temporal.Instant | string
range.overlaps(other)
range.intersect(other)    // DateRange | null
range.union(other)        // DateRange | DateRange[]
range.duration()          // milliseconds

// Iteration
for (const dt of range.iterate('day')) { … }   // Generator<DateTime>
for (const dt of range.iterate('hour')) { … }

// Serialization
range.toJSON()            // DateRangeJSON (omits open boundaries)
range.toCompactString()   // '20250101-20250131' (local time)
range.toISOInterval()     // '2025-01-01T.../2025-01-31T...' or '..'
```

## DateRanges Class

```typescript
new DateRanges(defs?)          // from DateRangeDef[]
DateRanges.parse(str, opts?)   // static factory from string

dr.ranges                      // readonly DateRange[]
dr.contains(dt)                // DateTime | Date | Temporal.Instant | string
dr.merge()                     // merges overlapping ranges in-place
dr.add(range)                  // DateRange | DateRangeDef
dr.hasOneAfterDate()           // DateTime | undefined
dr.fromJSON(json)              // populate from DateRangeJSON[]
dr.toJSON()                    // DateRangeJSON[]
dr.toCompactString()           // comma-joined compact strings
dr.toISOInterval()             // string[]
dr.toString()                  // human-readable local time
```

## Parsing Functions

### `parseRelativeTime(input, reference?)`

Returns `DateTime | undefined`. Reference defaults to `DateTime.now()`.

Keywords: `now`, `today`, `yesterday`, `tomorrow`, `startofday`, `endofday`\
Units: `y`, `d`, `h`, `m`, `s` — combinable: `1d12h30m`\
Bare duration = past (`6h` is 6 hours ago); negative = future (`-1h` is 1 hour from now). A range such as `6h-4h`
therefore needs no sign on either side.

### `dateStringToInstant(s, h?)`

Returns `DateTime` in local timezone. Formats: `YYYY`, `YYYYMM`, `YYYYMMDD`, `YYYYMMDDhh`, `YYYYMMDDhhmm`,
`YYYYMMDDhhmmss`.

### `dateList(val, options?)`

Returns `DateRangeDef[]`. Comma-separated. Each component can be:

- Compact date string → `dateStringToInstant`
- Relative time → `parseRelativeTime`
- ISO string → `DateTime.tryFrom`
- Range `start-end` (either side optional) — both sides in any form above, so `6h-4h` is the window from 6 hours ago to
  4 hours ago

A range starting with a signed duration (`-6h--4h`, `-6h-4h`) throws: the leading `-` is an open start, not "future". A
plain open start such as `-20250115` is still valid.

Year/month/day-only strings expand to cover the full period (inclusive by default).

### `dateRanges(val, options?)`

Convenience wrapper: `new DateRanges(dateList(val, options))`.

## CLI Option Defs

All exports are plain objects compatible with `CliApp.OptionDef` / `CliApp.OptionDefMap`.

```typescript
// Individual defs
dateOptionDef; // -d, --date    → DateRanges
rangeOptionDef; // -r, --range   → DateRange (single only, throws for multiple)
rangesOptionDef; // -R, --ranges  → DateRanges
sinceOptionDef; // -s, --since   → DateTime
untilOptionDef; // -u, --until   → DateTime  (defVal: 'now')
windowOptionDef; // -w, --window  → DateRange (duration ending now)

// All-in-one map
dateRangeOptionDefs; // { date, range, ranges, since, until, window }

// Plain-text help, for an option's `help` field or your own output
dateRangeHelpText(); // ranges (date/range/ranges)
instantHelpText(); // single instants (since/until)
windowHelpText(); // lookback durations (window)
```

Every def carries `help`, so `@epdoc/cliapp` answers `-d help` / `-d h` / `-d ?` with that text and adds
`(enter --date help for help)` to the option description. `windowOptionDef` also rejects a window that starts in the
future (`-7d`).

### `buildDateHelp(msg)`

Appends colorized date format help to any builder implementing `{ h2, label, value, text, code }`. No `@epdoc/logger`
dependency required in this package — the caller provides the builder.

```typescript
import { buildDateHelp } from '@epdoc/daterange';

helpText(): string {
  const msg = new CustomMsgBuilder();
  buildDateHelp(msg);
  return msg.format();
}
```

## Common Patterns

### Build a DateRange from --since / --until options

```typescript
const range = new DateRange(opts.since as DateTime, opts.until as DateTime);
```

### Filter records by date range

```typescript
const range = DateRange.fromRelative('7d', 'now')!;
const recent = records.filter((r) => range.contains(r.timestamp));
```

### Serialize / deserialize

```typescript
const json = dr.toJSON();
// later…
const dr2 = new DateRanges();
dr2.fromJSON(json);
```

## Dependencies

- `@epdoc/datetime` — `DateTime` class, `INSTANT_MIN`/`INSTANT_MAX`
- `@epdoc/type` — type guards (`isString`, `isNonEmptyArray`, etc.)
- Temporal API (built into Deno)
