# @epdoc/daterange

A Deno module for parsing flexible date range strings and managing collections of date ranges. It's particularly well-suited for command-line applications where users need to specify time periods for operations like data fetching or report generation.

## Key Features

- **Flexible Parsing**: The `dateList` function parses a wide variety of date and range formats from a single string.
- **Range Management**: The `DateRanges` class provides utilities for working with collections of date ranges, like checking if a date falls within the specified periods.
- **CLI Ready**: Includes a ready-to-use command-line tool (`cli.ts`) for quick parsing and testing.

## Installation

```bash
deno add jsr:@epdoc/daterange
```

## Usage

### Parsing Date Strings with `dateList`

The core of the module is the `dateList` function. It takes a string of comma-separated date specifications and returns an array of `DateRangeDef` objects. This is ideal for processing command-line arguments.

```typescript
import { dateList } from 'jsr:@epdoc/daterange';

// A complex string with multiple range types
const spec = '2025, 202601-202603, 20270101, 20280101-';

const ranges = dateList(spec);

console.log(JSON.stringify(ranges, null, 2));
```

This will produce an array of date range objects, each with an `after` and `before` property.

### Supported Formats

The parser is very flexible, making it easy for users to specify dates on the command line:

| Format | Example | Description |
| --- | --- | --- |
| Year | `2025` | The entire year of 2025. |
| Month | `202502` | The entire month of February 2025. |
| Day | `20250215` | The entire day of Feb 15, 2025. |
| Precise Timestamp | `20250215103000` | A specific point in time. |
| Closed Range | `20250101-20250110` | From the start of Jan 1 to the end of Jan 10. |
| Open-Ended (After) | `20250101-` | From the start of Jan 1 onwards. |
| Open-Ended (Before)| `-20250101` | Any time before the end of Jan 1. |
| Comma-Separated | `2024,202501-202503` | A list of multiple, separate ranges. |

- When only the year, month, day is specified, times are zeroed to the beginning and end of the day (0h to 24h)
- When only the year, month is specified, times are zeroed to the beginning and end of the month, also at 0h and 24h.
- When only the year specified, times are zeroed to the beginning and end of the year.

### Working with `DateRanges`

The `DateRanges` class can be used to work with the output from `dateList`.

```typescript
import { dateList, DateRanges } from 'jsr:@epdoc/daterange';

const ranges = dateList('20250115-20250120');
const dateRanges = new DateRanges(ranges);

// Check if a date is within the specified ranges
const date1 = new Date('2025-01-17T12:00:00');
console.log(dateRanges.isDateInRange(date1)); // true

const date2 = new Date('2025-01-22T12:00:00');
console.log(dateRanges.isDateInRange(date2)); // false
```

### Command-Line Tool

A command-line interface is included to demonstrate the functionality. You can use it to parse date strings directly from your terminal.

```sh
# Run the CLI with a few date specifications
deno run --allow-env jsr:@epdoc/daterange/cli 2025 202601-20260215
```

**Output:**

```json
[
  {
    "after": "2025-01-01T00:00:00.000-06:00",
    "before": "2026-01-01T00:00:00.000-06:00"
  },
  {
    "after": "2026-01-01T00:00:00.000-06:00",
    "before": "2026-02-16T00:00:00.000-06:00"
  }
]
```

You can also specify a default hour for date boundaries with the `-h` or `--hour` flag.

```sh
deno run --allow-env jsr:@epdoc/daterange/cli --hour=9 20250301
```

## API

- [`dateList(spec: string, hour?: number): DateRangeDef[]`](./util.ts#L46)
- `DateRanges`
- `dateStringToDate(s: string, h?: number): Date`

## License

MIT