# @epdoc/datetime AI Documentation

## Overview

@epdoc/datetime is a Deno module providing an enhanced `DateTime` class that wraps the JavaScript Temporal API. It
offers robust timezone handling, flexible formatting, and compatibility features for working with dates and times across
various systems.

## Key Capabilities

### 1. DateTime Creation

Multiple ways to create DateTime instances:

- **Current time**: `DateTime.from()` or `DateTime.now()`
- **From strings**: ISO 8601, relative time expressions
- **From timestamps**: Epoch milliseconds or seconds
- **From components**: Year, month, day, hour, minute, second, millisecond
- **From Temporal objects**: Instant, ZonedDateTime, PlainDateTime
- **From legacy Date**: Automatic conversion

### 2. Min/Max Boundaries

Work with absolute temporal boundaries:

- **INSTANT_MIN**: Minimum representable instant (~-271821-04-20)
- **INSTANT_MAX**: Maximum representable instant (~+275760-09-13)
- Use for unbounded date ranges or sentinel values

### 3. Timezone Management

Flexible timezone operations:

- Set timezone: `setTz()` (mutates) or `withTz()` (immutable)
- IANA names: `'America/New_York'`, `'Europe/London'`
- Offset strings: `'-06:00'`, `'+05:30'`
- Special values: `'local'`, `'utc'`
- Get offset: `getOffset()` returns minutes from UTC

### 4. Formatting Options

Multiple output formats:

- **ISO 8601**: `toISOString()` with timezone awareness
- **Custom patterns**: `format('yyyy-MM-dd HH:mm:ss')`
- **Direct Temporal**: `toString()` with full Temporal options
- **Julian Day**: `julianDate()` for astronomical calculations

### 5. Comparison and Validation

Rich comparison methods:

- `equals()`, `compareTo()`, `isBefore()`, `isAfter()`
- `isSameOrBefore()`, `isSameOrAfter()`
- `isMin()`, `isMax()` for boundary checking
- `isNow(tolerance)` for recency checks
- `isValid()` static method for input validation

## Common Patterns

### Create and Format Date

```typescript
const d = DateTime.from('2024-03-15T10:30:00Z').withTz('America/New_York');
console.log(d.format('MMMM dd, yyyy')); // "March 15, 2024"
console.log(d.toISOString()); // "2024-03-15T06:30:00.000-04:00"
```

### Check Time Boundaries

```typescript
const min = DateTime.min();
const max = DateTime.max();

// Check if at boundaries
if (d.isMin()) console.log('Beginning of time');
if (d.isMax()) console.log('End of time');

// Set boundaries (mutable)
d.setMin();
d.setMax();

// Set boundaries (immutable)
const bounded = d.withMin();
```

### Check Recency

```typescript
const event = DateTime.from(eventTimestamp);

// Within last hour
if (event.isNow(3600)) {
  console.log('Recent event');
}

// Within next hour
if (event.isNow(-3600)) {
  console.log('Upcoming event');
}
```

### Timezone Conversions

```typescript
const utc = DateTime.from('2024-03-15T10:30:00Z');

// Convert to different timezones
const ny = utc.withTz('America/New_York');
const tokyo = utc.withTz('Asia/Tokyo');
const local = utc.withTz('local');

// Get offset in minutes
const offset = ny.getOffset(); // 240 (EDT) or 300 (EST)
```

### Parse User Input

```typescript
// Safe parsing
try {
  const d = DateTime.from(userInput);
} catch (e) {
  console.error('Invalid date');
}

// Non-throwing variant
const d = DateTime.tryFrom(userInput);
if (d) {
  // Valid date
}

// Check validity without construction
if (DateTime.isValid(userInput)) {
  const d = DateTime.from(userInput);
}
```

### Julian Day Calculations

```typescript
const d = DateTime.from('2024-03-15T12:00:00Z');
const jd = d.julianDate();
console.log(jd); // Continuous day count for astronomy
```

## Important Notes

### Temporal.Instant vs PlainDateTime vs ZonedDateTime

DateTime stores one of three Temporal types internally:

- **Instant**: Point in UTC time, no timezone context
- **PlainDateTime**: Wall-clock time, no timezone
- **ZonedDateTime**: Time with timezone information

Methods requiring absolute time (like `toInstant()`, `epochMilliseconds`, `isMin()`, `isMax()`, `isNow()`) throw for
PlainDateTime.

### Immutability

- Most methods return new DateTime instances
- `setTz()`, `setMin()`, `setMax()` mutate the current instance
- Use `clone()` for explicit copying

### Month Indexing

When using constructor with multiple arguments (year, month, day...), month is 0-indexed:

```typescript
new DateTime(2024, 0, 15); // January 15, 2024 (month 0 = January)
new DateTime(2024, 2, 15); // March 15, 2024 (month 2 = March)
```

### Timezone Offset Convention

Follows JavaScript convention:

- **Positive**: Timezone is BEHIND UTC (Americas)
- **Negative**: Timezone is AHEAD of UTC (Asia)
- Example: `360` = -06:00 (America/Chicago)

### Format Tokens

Available in `format()` method:

- `yyyy`: Full year (2024)
- `MM`: Month 01-12
- `dd`: Day 01-31
- `HH`: Hours 00-23
- `mm`: Minutes 00-59
- `ss`: Seconds 00-59
- `SSS`: Milliseconds 000-999
- `MMMM`: Full month name (January)
- `MMM`: Abbreviated (Jan)
- `EEEE`: Full weekday (Monday)
- `EEE`: Abbreviated (Mon)

## File Structure

```
src/
├── mod.ts           # Main exports (DateTime, INSTANT_MIN, INSTANT_MAX)
├── date.ts          # DateTime class implementation
├── types.ts         # Type definitions and constants
├── utils.ts         # Utility functions (stringToDate, isISODate, etc.)
└── test/
    ├── date.test.ts # DateTime class tests
    └── util.test.ts # Utility function tests
```

## Dependencies

- `@epdoc/type` - Type guards and utilities
- Temporal API (built into Deno)

## Testing

Run tests from the datetime directory:

```bash
cd datetime && deno task test
```

Tests cover:

- Construction from all input types
- Timezone operations and conversions
- Formatting with various patterns
- Julian Day calculations
- Min/Max boundary methods
- Recency checking (isNow)
- Comparison operations
- Google Sheets and PDF date compatibility

## Migration Notes

- `DateEx` class name is deprecated, use `DateTime`
- PlainDateTime requires timezone before some operations
- Use `withTz()` for immutable timezone changes
- `setTz()` mutates the instance (unlike most methods)
