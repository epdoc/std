# @epdoc/datetime

A TypeScript library for date and time manipulations in Deno. This module provides a `DateTime` class that wraps the
native `Temporal` API, offering enhanced functionality for timezones, formatting, and compatibility with other systems.

> **Note:** The `DateEx` class name is deprecated. Please use `DateTime` instead. `DateEx` is now an alias for
> `DateTime`.

## Features

- **Timezone Management**: Set and convert between timezones using IANA names or offset strings.
- **Timezone-Aware Output**: Output dates in the original, local, or UTC timezone.
- **ISO 8601 Formatting**: Generate ISO 8601 strings with timezone offsets.
- **Custom Formatting**: Flexible, token-based date and time formatting.
- **Julian Day Conversion**: Calculate the Julian Day for any date.
- **Google Sheets Compatibility**: Convert dates to and from Google Sheets serial numbers.
- **PDF Date Parsing**: Create `DateTime` objects from PDF date strings.

## Installation

To use `@epdoc/datetime` in your Deno project, add it to your `deno.json` file:

```bash
deno add jsr:@epdoc/datetime
```

## Usage

The primary entry point is the `DateTime` class with its `from()` factory method.

```typescript
import { DateTime } from '@epdoc/datetime';

// Create a DateTime object for the current time
const now = DateTime.from();

// Create from a Date object
const d0 = new Date();
const d1 = DateTime.from(d0);

// Create from an ISO string
const d2 = DateTime.from('2024-01-01T12:00:00Z');

// Use tryFrom() for safe construction that returns undefined on invalid input
const d3 = DateTime.tryFrom('invalid'); // undefined
```

### Timezone-Aware Output

Use `withTz()` to output dates in different timezones. The `toISOString()` method respects the timezone set on the
DateTime object.

```typescript
import { DateTime } from '@epdoc/datetime';

const d = DateTime.from('2024-03-15T10:30:00Z').withTz('America/New_York');

// Output in the original timezone (America/New_York)
console.log(d.toISOString());
// Output: 2024-03-15T06:30:00.000-04:00

// Output in local timezone
console.log(d.withTz('local').toISOString());
// Output: e.g., 2024-03-15T03:30:00.000-07:00 (depending on your timezone)

// Output in UTC
console.log(d.withTz('utc').toISOString());
// Output: 2024-03-15T10:30:00.000Z
```

### Direct Temporal Output

Use `toString()` for direct access to the underlying Temporal object's string formatting with full options support. This
method provides access to all Temporal formatting capabilities including fractional second control and timezone name
display.

```typescript
import { DateTime } from '@epdoc/datetime';

const d = DateTime.from('2024-03-15T10:30:00.123Z');

// Control fractional seconds (0-9 digits, or 'auto')
console.log(d.toString()); // "2024-03-15T10:30:00.123Z"
console.log(d.toString({ fractionalSecondDigits: 0 })); // "2024-03-15T10:30:00Z"
console.log(d.toString({ fractionalSecondDigits: 3 })); // "2024-03-15T10:30:00.123Z"

// Include timezone name (ZonedDateTime only)
const d2 = d.withTz('America/New_York');
console.log(d2.toString({ timeZoneName: 'auto' }));
// Output: "2024-03-15T06:30:00.123-04:00[America/New_York]"
```

### Custom Formatting

Use the `format()` method with a format string to get a custom date representation. The formatting respects the timezone
set on the DateTime object, or you can chain `withTz()` to format in a specific timezone.

Available format tokens:

- `yyyy`: Full year (e.g., 2024)
- `MM`: Month (01-12)
- `dd`: Day of the month (01-31)
- `HH`: Hours (00-23)
- `mm`: Minutes (00-59)
- `ss`: Seconds (00-59)
- `SSS`: Milliseconds (000-999)
- `MMMM`: Full month name (e.g., January)
- `MMM`: Abbreviated month name (e.g., Jan)
- `EEEE`: Full weekday name (e.g., Monday)

```typescript
import { DateTime } from '@epdoc/datetime';

const d = DateTime.from('1997-11-25T12:13:14.456Z').withTz('America/Chicago');

// Format in the original timezone
console.log(d.format('yyyy-MM-dd'));
// Output: 1997-11-25

console.log(d.format('yyyyMMdd_HHmmss'));
// Output: 19971125_061314

// Format in UTC
console.log(d.withTz('utc').format('yyyyMMdd_HHmmss'));
// Output: 19971125_121314

// Format in local timezone
console.log(d.withTz('local').format('MMMM d, yyyy'));
// Output: e.g., November 25, 1997
```

### Julian Day

Calculate the Julian Day, a continuous count of days since the beginning of the Julian Period.

```typescript
import { DateTime } from '@epdoc/datetime';

const d = DateTime.from('1997-11-25T12:13:14.456Z');
console.log(d.julianDate());
// Output: 2450778
```

### Min/Max Instants

The `DateTime` class provides methods for working with the minimum and maximum representable instants. These are useful
for representing unbounded date ranges or sentinel values.

```typescript
import { DateTime, INSTANT_MAX, INSTANT_MIN } from '@epdoc/datetime';

// Create min/max DateTime instances
const min = DateTime.min();
const max = DateTime.max();

// Check if a DateTime is at the min or max
console.log(min.isMin()); // true
console.log(max.isMax()); // true

// Set an existing DateTime to min or max
const d = DateTime.now();
d.setMin();
console.log(d.isMin()); // true

// Create new instances without modifying the original
const now = DateTime.now();
const minCopy = now.withMin();
console.log(minCopy.isMin()); // true
console.log(now.isMin()); // false (original unchanged)
```

### Is Now with Tolerance

Check if a DateTime represents "now" with an asymmetric tolerance window. This is useful for checking if something
happened recently or is about to happen soon.

```typescript
import { DateTime } from '@epdoc/datetime';

const recent = DateTime.from(Date.now() - 30000); // 30 seconds ago
const future = DateTime.from(Date.now() + 30000); // 30 seconds from now

// Check if within the last 60 seconds (is it recent?)
console.log(recent.isNow(60)); // true

// Check if within the next 60 seconds (is it soon?)
console.log(future.isNow(-60)); // true

// Exact match only (within 0 seconds)
const now = DateTime.now();
console.log(now.isNow()); // true (or very close)
```

**Tolerance behavior:**

- **Positive tolerance**: Returns `true` if the DateTime is within `toleranceSeconds` BEFORE now (is it recent?)
- **Negative tolerance**: Returns `true` if the DateTime is within `abs(toleranceSeconds)` AFTER now (is it soon?)
- **Zero tolerance** (default): Returns `true` only if exactly equal to now

### Google Sheets Date

Convert a date to a Google Sheets serial number.

```typescript
import { DateTime } from '@epdoc/datetime';

const d = DateTime.from('2024-01-01T12:00:00Z');
console.log(d.toGoogleSheetsDate());
// Output: 45292.25
```

## Utilities and Types

In addition to `DateTime`, the module provides these utility functions and type definitions.

### `stringToDate(s: string, opts?: DateParseOptions): Date | undefined`

Converts a string representation of a date into a `Date` object. This function is highly flexible and can parse a
variety of formats.

```typescript
import { stringToDate } from '@epdoc/datetime';

const d1 = stringToDate('20240102');
// Result: 2024-01-02T06:00:00.000Z (depending on local timezone)

const d2 = stringToDate('2024-01-02 10:20:30', { tz: 0 });
// Result: 2024-01-02T10:20:30.000Z
```

### `isISODate(s: string): boolean`

Checks if a string is a valid ISO 8601 date string.

```typescript
import { isISODate } from '@epdoc/datetime';

console.log(isISODate('2025-10-05T10:20:30Z')); // true
console.log(isISODate('2025-10-05')); // false
```

### Types

The module exports several types for clarity and type safety:

- `Minutes`: Represents a timezone offset in minutes from UTC.
- `ISOTZ`: A string for an ISO 8601 timezone offset (e.g., `"-06:00"`, `"Z"`).
- `GMTTZ`: A string for a GMT timezone offset (e.g., `"GMT-05:00"`).
- `PDFTZ`: A string for a PDF-style timezone offset (e.g., `"-0600"`).
- `IANATZ`: A string for an IANA timezone name (e.g., `"America/New_York"`).
- `JulianDay`: An integer representing the Julian Day.
- `GoogleSheetsDate`: A number representing a Google Sheets serial date.
- `DateParseOptions`: An interface for options used in `stringToDate`.

### Constants

The module exports these constants for working with extreme date values:

- `INSTANT_MIN`: A `Temporal.Instant` representing the minimum representable instant (approximately
  -271821-04-20T00:00:00Z).
- `INSTANT_MAX`: A `Temporal.Instant` representing the maximum representable instant (approximately
  +275760-09-13T00:00:00Z).

## API

For a detailed API reference, please visit the [JSR page](https://jsr.io/@epdoc/datetime).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the
[GitHub repository](https://github.com/epdoc/std).

## License

[MIT](./LICENSE)
