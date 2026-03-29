# Migrating from @epdoc/datetime to Temporal + Intl

This guide helps you migrate from `@epdoc/datetime` to the native [`Temporal`](https://tc39.es/proposal-temporal/docs/)
API and
[`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
where appropriate.

**Important:** Only migrate functionality that is **not unique** to `@epdoc/datetime`. Keep using this library for:

- Julian Day calculations
- Google Sheets date conversions
- PDF date parsing
- Custom format strings (if you need exact token compatibility)

---

## Quick Reference: What to Use When

| Task                      | Use Temporal/Intl                  | Keep @epdoc/datetime           |
| ------------------------- | ---------------------------------- | ------------------------------ |
| Parse ISO dates           | ✅ `Temporal.Instant.from()`       | ❌                             |
| Parse with timezones      | ✅ `Temporal.ZonedDateTime.from()` | ❌                             |
| IANA timezone handling    | ✅ Built into Temporal             | ❌                             |
| Format dates (localized)  | ✅ `Intl.DateTimeFormat`           | ❌                             |
| Convert between timezones | ✅ `zonedDateTime.withTimeZone()`  | ❌                             |
| Add/subtract time         | ✅ `Temporal.Duration`             | ❌                             |
| Julian Day calculations   | ❌                                 | ✅ `DateEx.julianDate()`       |
| Google Sheets dates       | ❌                                 | ✅ `DateEx.googleSheetsDate()` |
| PDF date parsing          | ❌                                 | ✅ `DateEx.fromPdfDate()`      |
| Custom format tokens      | ❌                                 | ✅ `DateEx.format()`           |

---

## Important: Understanding Temporal String Formats

### The Two Types of Temporal Objects

Temporal has two distinct types for handling dates with timezones:

**1. Instant** - A point in time, always in UTC

```typescript
Temporal.Instant.from('2024-01-15T10:30:00Z'); // 10:30 AM UTC
```

**2. ZonedDateTime** - Wall-clock time in a specific timezone

```typescript
Temporal.ZonedDateTime.from('2024-01-15T10:30:00[America/New_York]'); // 10:30 AM in New York
```

### Use Temporal.Instant when parsing ISO 8601 strings

Do this even if the string has a timezone in it. Temporal will handle it correctly.

```ts
const instant = Temporal.Instant.from('2024-01-15T10:30:00Z');
const instant2 = Temporal.Instant.from('2024-01-15T10:30:00-05:00');
```

### Use Temporal.ZonedDateTime when outputting to a local timezone

```ts
const instant = Temporal.Instant.from('2024-01-15T10:30:00Z');
const tz = Temporal.Now.timeZoneId();
const zoned = instant.toZonedDateTimeISO(tz);

console.log(zoned.toString());
// Output: 2024-01-15T04:30:00-06:00[America/Costa_Rica]

zoned.timeZoneId;
// "America/Costa_Rica"
zoned.offset;
// "-06:00"
```

### You can also use Square Brackets `[...]`

The `[America/New_York]` part is the **IANA timezone identifier**. It tells Temporal:

- Which timezone rules to use (including DST)
- How to convert this to other timezones
- How to handle ambiguous times

**Simple rule:** Just provide the timezone in brackets. Temporal calculates the offset automatically.

```typescript
// Good: Just the timezone, Temporal figures out the offset
Temporal.ZonedDateTime.from('2024-01-15T10:30:00[America/Chicago]');

// Unnecessary: Explicit offset + timezone (offset must match timezone or it
// throws RangeError: Temporal error: Offsets could not be determined without disambiguation
Temporal.ZonedDateTime.from('2024-01-15T10:30:00-06:00[America/Chicago]');
```

### PlainDateTime

When creating a date from parts.

```typescript
// PlainDateTime has no timezone attached
const dt = new Temporal.PlainDateTime(2024, 1, 15, 10, 30, 0); // Month is 1-indexed

// Convert to ZonedDateTime
const zoned = dt.toZonedDateTime('America/New_York');

// Or create directly
const zoned2 = new Temporal.ZonedDateTime(
  1705321800000000000n, // epoch nanoseconds
  'America/New_York',
);
```

## Formatting

### No Manipulation

```ts
const epochMs = 1715682612345;
const instant = Temporal.Instant.fromEpochMilliseconds(epochMs);
console.log(instant.toString());
// 2024-05-14T10:30:12.345Z

const tz = Temporal.Now.timeZoneId();
const zonedDateTime = instant.toZonedDateTimeISO(tz);
console.log(zonedDateTime.toString());
// 2024-05-14T04:30:12.345-06:00[America/Costa_Rica]

const tz = Temporal.Now.timeZoneId();
const zonedDateTime = instant.toZonedDateTimeISO(tz);
console.log(zonedDateTime.toString({ timeZoneName: 'never' }));
// 2024-05-14T04:30:12.345-06:00

const tz = Temporal.Now.timeZoneId();
const zonedDateTime = instant.toZonedDateTimeISO(tz);
console.log(zonedDateTime.toString({ timeZoneName: 'never', fractionalSecondDigits: 0 }));
// 2024-05-14T04:30:12-06:00

const tz = Temporal.Now.timeZoneId();
const zonedDateTime = instant.toZonedDateTimeISO(tz);
console.log(zonedDateTime.toString({ timeZoneName: 'never', fractionalSecondDigits: 0, offset: 'never' }));
// 2024-05-14T04:30:12
```

## Easy Manipulation

Using padding.

```ts
const now = Temporal.Now.zonedDateTimeISO();

// Padding helper to ensure 2 digits (e.g., "05" instead of "5")
const pad = (n) => n.toString().padStart(2, '0');

const customFormat = `${now.year}${pad(now.month)}${pad(now.day)}_${pad(now.hour)}${pad(now.minute)}${pad(now.second)}`;

console.log(customFormat);
// Output: 20260329_145822
```

Using Regexp.

```ts
const now = Temporal.Now.zonedDateTimeISO();

const clean = now.toString({
  timeZoneName: 'never',
  offset: 'never',
  fractionalSecondDigits: 0,
})
  .replace(/[-:]/g, '') // Removes - and :
  .replace('T', '_'); // Replaces the T with an underscore

console.log(clean);
// Output: 20260329_145822
```

A helper function.

```ts
function formatFileDate(zoned: Temporal.ZonedDateTime) {
  const { year, month, day, hour, minute, second } = zdt;
  const p = (n) => n.toString().padStart(2, '0');
  return `${year}${p(month)}${p(day)}_${p(hour)}${p(minute)}${p(second)}`;
}

console.log(formatFileDate(Temporal.Now.zonedDateTimeISO()));
```

---

## Further Reading

- [Temporal Documentation](https://tc39.es/proposal-temporal/docs/)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Intl.DurationFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)
- [Deno Temporal Support](https://deno.land/manual@v1.x/runtime/web_platform_apis#temporal)
