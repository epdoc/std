# @epdoc/daterange

A Deno module for parsing flexible date range strings and managing collections of date ranges, built on
`@epdoc/datetime` and the Temporal API.

## Installation

```bash
deno add jsr:@epdoc/daterange
```

## Key Features

- **DateTime-first**: All boundaries are `DateTime` objects from `@epdoc/datetime`
- **Relative time parsing**: `1d`, `2h30m`, `now`, `today`, `yesterday`, `tomorrow`
- **Compact date formats**: `20250115`, `202501`, `2025` — all interpreted in local timezone
- **Single & multiple ranges**: `DateRange` for one interval, `DateRanges` for collections
- **Range operations**: containment, overlap, intersection, union, iteration
- **CLI integration**: Ready-to-use `CliApp.OptionDefMap` entries for `@epdoc/cliapp`

## Usage

### Relative time

```typescript
import { parseRelativeTime } from '@epdoc/daterange';

const oneDayAgo = parseRelativeTime('1d'); // DateTime
const combined = parseRelativeTime('1d12h30m'); // DateTime
const future = parseRelativeTime('-1h'); // DateTime (1 hour from now)
const startToday = parseRelativeTime('today'); // DateTime (00:00:00 local)
```

### Parsing date strings

```typescript
import { dateList, dateRanges } from '@epdoc/daterange';

// Returns DateRangeDef[] — each entry has after/before as DateTime
const defs = dateList('20250101-20250131,2026');

// Returns a DateRanges instance
const dr = dateRanges('7d-now,20250101-20250131');
```

**Supported formats** (all in local timezone):

| Format     | Example                       | Resolves to                    |
| ---------- | ----------------------------- | ------------------------------ |
| Year       | `2025`                        | Jan 1 00:00 → Dec 31 23:59:59  |
| Month      | `202502`                      | Feb 1 00:00 → Feb 28 23:59:59  |
| Day        | `20250215`                    | Feb 15 00:00 → Feb 15 23:59:59 |
| Precise    | `202502151030`                | Feb 15 10:30 (exact)           |
| ISO        | `2025-01-01T00:00:00Z`        | Parsed with offset             |
| Relative   | `1d`, `2h30m`, `now`, `today` | From current time              |
| Range      | `20250101-20250131`           | Start → end                    |
| Open-ended | `20250101-` or `-20250131`    | One boundary open              |
| Multiple   | `2024,202501-202503`          | Comma-separated                |

### DateRange

```typescript
import { DateRange } from '@epdoc/daterange';
import { DateTime } from '@epdoc/datetime';

const range = new DateRange(
  DateTime.from('2025-01-01T00:00:00Z'),
  DateTime.from('2025-01-31T23:59:59Z'),
);

range.contains(DateTime.now()); // boolean (inclusive boundaries)
range.overlaps(other); // boolean
range.intersect(other); // DateRange | null
range.union(other); // DateRange | DateRange[]
range.duration(); // milliseconds
range.startOfDay / range.endOfDay; // via DateTime methods on after/before

for (const dt of range.iterate('day')) { // Generator<DateTime>
  console.log(dt.toISOString());
}
```

### DateRanges

```typescript
import { DateRanges } from '@epdoc/daterange';

const dr = DateRanges.parse('20250101-20250131,2026');

dr.contains(DateTime.now()); // checks all ranges
dr.merge(); // merges overlapping ranges
dr.toCompactString(); // '20250101-20250131,20260101-20261231'
dr.toISOInterval(); // string[]
dr.toJSON(); // DateRangeJSON[]
```

### CLI integration

Spread pre-built option defs into your `CliApp.OptionDefMap`:

```typescript
import type * as CliApp from '@epdoc/cliapp';
import { dateRangeOptionDefs } from '@epdoc/daterange';

export const optionDefs: CliApp.OptionDefMap = {
  ...dateRangeOptionDefs,
  // your other options…
};
```

Or pick individual entries:

```typescript
import { dateOptionDef, sinceOptionDef, untilOptionDef } from '@epdoc/daterange';
```

**Available option defs:**

| Export            | Flag           | Returns      | Use case                                |
| ----------------- | -------------- | ------------ | --------------------------------------- |
| `dateOptionDef`   | `-d, --date`   | `DateRanges` | Most common — full range(s)             |
| `rangeOptionDef`  | `-r, --range`  | `DateRange`  | Exactly one range required              |
| `rangesOptionDef` | `-R, --ranges` | `DateRanges` | Explicit multi-range flag               |
| `sinceOptionDef`  | `-s, --since`  | `DateTime`   | Start boundary only                     |
| `untilOptionDef`  | `-u, --until`  | `DateTime`   | End boundary only (default: `now`)      |
| `windowOptionDef` | `-w, --window` | `DateRange`  | Duration shorthand (`7d` → last 7 days) |

For colorized help text in a `helpText()` method:

```typescript
import { buildDateHelp } from '@epdoc/daterange';

helpText(): string {
  const msg = new CustomMsgBuilder();
  msg.h1('\nDate Range Formats\n');
  buildDateHelp(msg);   // appends colorized sections using h2/label/value/code/text
  return msg.format();
}
```

## API Reference

### Functions

| Function                               | Returns                 | Description                                     |
| -------------------------------------- | ----------------------- | ----------------------------------------------- |
| `parseRelativeTime(input, reference?)` | `DateTime \| undefined` | Parse relative time string                      |
| `dateList(spec, options?)`             | `DateRangeDef[]`        | Parse date range string to definitions          |
| `dateRanges(spec, options?)`           | `DateRanges`            | Parse date range string to `DateRanges`         |
| `dateStringToInstant(s, h?)`           | `DateTime`              | Convert compact date string to `DateTime`       |
| `buildDateHelp(msg)`                   | `T`                     | Append colorized help to any compatible builder |

### Types

```typescript
type DateRangeDef = { after?: DateTime; before?: DateTime };
type DateRangeJSON = { after?: ISODate; before?: ISODate };
type DateRangeParseOptions = { reference?: DateTime; inclusiveEnd?: boolean; defaultHour?: number };
```

## License

MIT
