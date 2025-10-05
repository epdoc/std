# @epdoc/datetime

A TypeScript library for date and time manipulations in Deno. This module provides a `DateEx` class that wraps the
native `Date` object, offering enhanced functionality for timezones, formatting, and compatibility with other systems.

## Features

- **Timezone Management**: Set and convert between timezones.
- **ISO 8601 Formatting**: Generate ISO 8601 strings with local timezone offsets.
- **Custom Formatting**: Flexible, token-based date and time formatting.
- **Julian Day Conversion**: Calculate the Julian Day for any date.
- **Google Sheets Compatibility**: Convert dates to and from Google Sheets serial numbers.
- **PDF Date Parsing**: Create `DateEx` objects from PDF date strings.

## Installation

To use `@epdoc/datetime` in your Deno project, add it to your `deno.json` file:

```bash
deno add jsr:@epdoc/datetime
```

## Usage

The primary entry point is the `dateEx` function, which creates a `DateEx` instance.

```typescript
import { dateEx } from '@epdoc/datetime';

// Create a DateEx object for the current time
const now = dateEx();

// Create from a Date object
const d0 = new Date();
const d1 = dateEx(d0);

// Create from an ISO string
const d2 = dateEx('2024-01-01T12:00:00Z');
```

### ISO Local String

The `toISOLocalString()` method generates an ISO 8601 string using the local timezone, unlike the native
`.toISOString()` which always uses UTC.

```typescript
import { dateEx } from '@epdoc/datetime';

const d = dateEx('1997-11-25T12:13:14.456Z');

// Assuming the local timezone is CST (-06:00)
console.log(d.toISOLocalString());
// Output: 1997-11-25T06:13:14.456-06:00

console.log(d.toISOLocalString(false));
// Output: 1997-11-25T06:13:14-06:00
```

### Custom Formatting

Use the `format()` and `formatUTC()` methods with a format string to get a custom date representation.

- `yyyy`: Full year (e.g., 2024)
- `MM`: Month (01-12)
- `dd`: Day of the month (01-31)
- `HH`: Hours (00-23)
- `mm`: Minutes (00-59)
- `ss`: Seconds (00-59)
- `SSS`: Milliseconds (000-999)

```typescript
import { dateEx } from '@epdoc/datetime';

const d = dateEx('1997-11-25T12:13:14.456Z');

console.log(d.format('yyyy-MM-dd'));
// Output: 1997-11-25

console.log(d.format('yyyyMMdd_HHmmss'));
// Output: 19971125_061314

console.log(d.formatUTC('yyyyMMdd_HHmmss'));
// Output: 19971125_121314
```

### Julian Day

Calculate the Julian Day, a continuous count of days since the beginning of the Julian Period.

```typescript
import { dateEx } from '@epdoc/datetime';

const d = dateEx('1997-11-25T12:13:14.456Z');
console.log(d.julianDate());
// Output: 2450778
```

### Google Sheets Date

Convert a date to a Google Sheets serial number.

```typescript
import { dateEx } from '@epdoc/datetime';

const d = dateEx('2024-01-01T12:00:00Z');
console.log(d.googleSheetsDate());
// Output: 45292.25
```

## Utilities and Types

In addition to `DateEx`, the module provides these utility functions and type definitions.

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

## API

For a detailed API reference, please visit the [JSR page](https://jsr.io/@epdoc/datetime).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the
[GitHub repository](https://github.com/epdoc/std).

## License

[MIT](./LICENSE)
