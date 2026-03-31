# Using @epdoc/datetime with Temporal

`@epdoc/datetime` provides a convenient, unified API for working with JavaScript's
[`Temporal`](https://tc39.es/proposal-temporal/docs/) API. While you can use Temporal directly, `DateTime` simplifies
common operations and provides valuable extensions.

---

## Why Use DateTime?

**DateTime is the recommended way to work with dates in Deno** for most use cases. It provides:

- **Unified API**: One class handles Instant, ZonedDateTime, and PlainDateTime seamlessly
- **Flexible Input**: `DateTime.from(anything)` accepts strings, numbers, Date objects, Temporal objects, or nothing for
  "now"
- **Custom Format Strings**: Simple token-based formatting (`'yyyy-MM-dd'`) vs. Temporal's verbose options
- **Comparison Operators**: `isBefore()`, `isAfter()`, `equals()` with proper semantics
- **Legacy Interop**: Built-in support for Google Sheets, PDF dates, and Julian Day calculations
- **Safe Construction**: `tryFrom()` returns `undefined` instead of throwing

---

## Quick Reference

| Task                        | Use DateTime                 | Use Raw Temporal                   |
| --------------------------- | ---------------------------- | ---------------------------------- |
| Parse arbitrary input       | ✅ `DateTime.from(input)`    | `Temporal.Instant.from()` (strict) |
| Current time                | ✅ `DateTime.now()`          | `Temporal.Now.instant()`           |
| Custom formatting           | ✅ `d.format('yyyy-MM-dd')`  | `Intl.DateTimeFormat`              |
| Compare dates               | ✅ `d1.isBefore(d2)`         | Manual epoch comparison            |
| Safe parsing                | ✅ `DateTime.tryFrom(input)` | Try/catch required                 |
| Google Sheets/PDF           | ✅ Built-in methods          | Not available                      |
| Specific Temporal types     | ✅ Unified API               | When you need exact control        |
| Add/subtract duration       | Delegate to Temporal         | ✅ `Temporal.Duration`             |
| Complex calendar operations | Delegate to Temporal         | ✅ `Temporal` directly             |

---

## Getting Started

```typescript
import { DateTime } from '@epdoc/datetime';

// Current time
const now = DateTime.now();

// From various inputs
const d1 = DateTime.from('2024-03-15T10:30:00Z');
const d2 = DateTime.from(1709913600000); // epoch ms
const d3 = DateTime.from(new Date());
const d4 = DateTime.from(Temporal.Now.instant());

// With timezone
const ny = DateTime.now().withTz('America/New_York');

// Formatting
console.log(d1.format('yyyy-MM-dd HH:mm:ss')); // "2024-03-15 10:30:00"
console.log(d1.toISOString()); // "2024-03-15T10:30:00.000Z"

// Comparison
if (d1.isBefore(d2)) {
  console.log('d1 is earlier');
}

// Epoch timestamp
console.log(d1.epochMilliseconds); // 1710499800000
console.log(d1.toEpochSeconds()); // 1710499800

// Safe parsing
const maybe = DateTime.tryFrom('invalid'); // undefined (no throw)
```

---

## When to Use Raw Temporal

Use raw Temporal API when you need:

1. **Specific Temporal Types**: Direct access to `Instant`, `ZonedDateTime`, or `PlainDateTime` behavior
2. **Calendar Operations**: Working with non-ISO calendars
3. **Duration Arithmetic**: Adding/subtracting complex durations
4. **Exact Control**: Fine-grained control over timezone conversions

```typescript
// Accessing the underlying Temporal object
const dt = DateTime.from('2024-03-15T10:30:00Z');
const instant = dt.temporal as Temporal.Instant;

// Using Temporal directly for durations
const later = Temporal.Now.instant().add({ hours: 2 });
```

---

## Understanding Temporal Types

DateTime wraps three Temporal types:

### 1. Instant - A Point in Time (UTC)

Created when parsing ISO strings, timestamps, or calling `DateTime.now()`.

```typescript
const instant = DateTime.from('2024-01-15T10:30:00Z');
// Internal: Temporal.Instant
// Can: compare, get epoch, format (defaults to local timezone)
// Cannot: access year/month/day without timezone
```

### 2. ZonedDateTime - Wall-Clock Time in a Timezone

Created when you call `withTz()` or parse strings with timezone info.

```typescript
const zoned = DateTime.from('2024-01-15T10:30:00Z').withTz('America/New_York');
// Internal: Temporal.ZonedDateTime
// Can: everything Instant can, plus timezone-aware formatting
```

### 3. PlainDateTime - Date/Time Without Timezone

Created when using multiple constructor arguments (year, month, day, etc).

```typescript
const plain = new DateTime(2024, 0, 15, 10, 30); // Jan 15, 2024 10:30
// Internal: Temporal.PlainDateTime
// Can: format, access components
// Cannot: compare with other dates, get epoch (until you add timezone)
```

---

## Type Conversion Guide

```typescript
// Instant → ZonedDateTime
const zoned = instant.withTz('America/New_York');

// PlainDateTime → ZonedDateTime (to enable comparisons)
const zoned2 = plain.withTz('America/New_York');

// Access underlying Temporal object
const temporal = dt.temporal;
if (temporal instanceof Temporal.ZonedDateTime) {
  console.log(temporal.timeZoneId);
}

// Get raw epoch timestamp
const ms = dt.epochMilliseconds;
const s = dt.toEpochSeconds();
```

---

## Formatting

### Simple Formatting

```typescript
const d = DateTime.now();

// ISO 8601
console.log(d.toISOString()); // "2024-05-14T10:30:12.345Z" (Instant)
console.log(d.toISOString()); // "2024-05-14T04:30:12.345-06:00" (ZonedDateTime)

// Local timezone string (like native Date.toString but ISO format)
console.log(d.toISOLocalString()); // Always shows offset
```

### Custom Format Tokens

```typescript
const d = DateTime.from('2024-03-15T14:30:00Z').withTz('America/New_York');

d.format('yyyy-MM-dd'); // "2024-03-15"
d.format('MMMM dd, yyyy'); // "March 15, 2024"
d.format('yyyyMMdd_HHmmss'); // "20240315_103000"
d.format('EEEE, MMM d'); // "Friday, Mar 15"
```

**Available Tokens:**

- `yyyy` - Full year (2024)
- `MM` - Month zero-padded (01-12), `M` - without padding (1-12)
- `dd` - Day zero-padded (01-31), `d` - without padding (1-31)
- `HH` - Hours zero-padded (00-23), `H` - without padding (0-23)
- `mm` - Minutes (00-59)
- `ss` - Seconds (00-59)
- `SSS` - Milliseconds (000-999)
- `MMMM` - Full month (January), `MMM` - abbreviated (Jan)
- `EEEE` - Full weekday (Monday), `EEE` - abbreviated (Mon), `EE` - short (Mo)

---

## Working with Timezones

```typescript
const d = DateTime.from('2024-01-15T10:30:00Z');

// Convert to specific timezone
const ny = d.withTz('America/New_York'); // 05:30 EST
const tokyo = d.withTz('Asia/Tokyo'); // 19:30 JST

// Get timezone offset
console.log(ny.getOffset()); // 300 (minutes behind UTC)

// Format with offset
console.log(ny.toISOLocalString()); // "2024-01-15T05:30:00-05:00"
```

---

## Comparison Operations

```typescript
const d1 = DateTime.from('2024-03-15T10:00:00Z');
const d2 = DateTime.from('2024-03-15T12:00:00Z');

// Basic comparisons
d1.isBefore(d2); // true
d1.isAfter(d2); // false
d1.equals(d2); // false
d1.isSameOrBefore(d2); // true
d1.isSameOrAfter(d2); // false

// Static compare (for sorting)
const dates = [d2, d1];
dates.sort(DateTime.compare); // [d1, d2]

// Instance compare
d1.compareTo(d2); // -1
```

**Note:** All comparison methods throw for PlainDateTime. Convert with `withTz()` first.

---

## Legacy System Interop

### Google Sheets

```typescript
// To Google Sheets serial number
const d = DateTime.from('2024-01-01T12:00:00Z');
d.withTz('America/New_York'); // Match sheet timezone
const serial = d.toGoogleSheetsDate(); // 45292.25

// From Google Sheets serial number
const restored = DateTime.fromGoogleSheetsDate(45292.25, 'America/New_York');
```

### PDF Dates

```typescript
const d = DateTime.fromPdfDate("D:20240101120000-06'00'");
if (d) {
  console.log(d.toISOString());
}
```

### Julian Day

```typescript
const d = DateTime.from('2024-01-15T12:00:00Z');
const jd = d.julianDate(); // 2450326.0
```

---

## Error Handling

```typescript
// Strict parsing (throws on invalid)
try {
  const d = DateTime.from('invalid');
} catch (e) {
  console.log('Invalid date');
}

// Safe parsing (returns undefined)
const d = DateTime.tryFrom('invalid');
if (!d) {
  console.log('Invalid date');
}

// Validation check
if (DateTime.isValid('2024-03-15')) {
  const d = DateTime.from('2024-03-15');
}
```

---

## Further Reading

- [Temporal Documentation](https://tc39.es/proposal-temporal/docs/)
- [DateTime API Reference](https://jsr.io/@epdoc/datetime)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
