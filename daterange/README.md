# Date Range

Utilities for creating and managing date ranges, intended for command line use.

## Installation

This is a Deno module. You can import it directly into your project.

## Usage

Import the necessary functions from the module:

```typescript
import { dateRanges } from 'jsr:@epdoc/std/daterange';
```

### Creating Date Ranges

The `dateRanges` function creates a `DateRanges` object from a string. The string can contain one or more date ranges,
separated by commas.

```typescript
const dr = dateRanges('20250101-20250131,20250301-20250331');
```

### Supported Date Formats

The following date formats are supported:

- `YYYY`: Represents the entire year.
- `YYYYMM`: Represents the entire month.
- `YYYYMMDD`: Represents the entire day.
- `YYYYMMDDhh`: Represents a specific hour.
- `YYYYMMDDhhmm`: Represents a specific minute.
- `YYYYMMDDhhmmss`: Represents a specific second.

### Supported Range Formats

The following range formats are supported:

- `start-end`: A closed range. `start` and `end` can be any of the supported date formats.
- `start-`: An open-ended range with no end date.
- `-end`: An open-ended range with no start date.

### Using the `DateRanges` Object

The `dateRanges` function returns a `DateRanges` object, which has the following methods:

- `isDateInRange(date: Date): boolean`: Checks if a given date is within any of the defined date ranges.
- `hasRanges(): boolean`: Returns `true` if there are any date ranges defined.
- `toJSON()`: Returns a JSON representation of the date ranges.
- `toString()`: Returns a string representation of the date ranges.

### Examples

Here are some examples of how to use the `dateRanges` function:

```typescript
import { dateRanges } from 'jsr:@epdoc/std/daterange';

// A single day
const dr1 = dateRanges('20250101');
console.log(dr1.toString());
// from 2025/01/01 00:00:00 to 2025/01/02 00:00:00

// A range of days
const dr2 = dateRanges('20250101-20250105');
console.log(dr2.toString());
// from 2025/01/01 00:00:00 to 2025/01/06 00:00:00

// Multiple ranges
const dr3 = dateRanges('202501,202503-202504');
console.log(dr3.toString());
// from 2025/01/01 00:00:00 to 2025/02/01 00:00:00, from 2025/03/01 00:00:00 to 2025/05/01 00:00:00

// Open-ended range
const dr4 = dateRanges('20250101-');
console.log(dr4.toString());
// from 2025/01/01 00:00:00 to now

// Check if a date is in a range
const dr5 = dateRanges('20250101-20250131');
const date = new Date('2025-01-15');
console.log(dr5.isDateInRange(date));
// true

// Get JSON representation
const dr6 = dateRanges('20250101-20250102');
console.log(JSON.stringify(dr6.toJSON(), null, 2));
// [
//   {
//     "after": "2025-01-01T00:00:00.000-06:00",
//     "before": "2025-01-03T00:00:00.000-06:00"
//   }
// ]
```

## Command-Line Interface (CLI)

This module also includes a command-line interface for parsing date range strings.

### Usage

```bash
deno run --allow-env examples/cli.ts [options] <date-spec...>
```

### Options

- `-h, --hour <hour>`: The default hour to use for dates (default: 0).

### Example

```bash
deno run --allow-env examples/cli.ts -h 8 "20240701-20240710" "20240801"
```

This will output:

```json
[
  {
    "after": "2024-07-01T08:00:00.000-06:00",
    "before": "2024-07-11T08:00:00.000-06:00"
  },
  {
    "after": "2024-08-01T08:00:00.000-06:00",
    "before": "2024-08-02T08:00:00.000-06:00"
  }
]
```
