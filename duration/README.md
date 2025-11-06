# @epdoc/duration

A comprehensive TypeScript duration formatting library that extends beyond what's available in [moment.js](https://github.com/moment/moment) or requires complex wrapper logic with [Intl.DurationFormat](https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructor).

## Features

- **Multiple Format Styles**: Digital, narrow, long, and short formats
- **Adaptive Formatting**: Automatically show only the most significant time units
- **Years Support**: Handle durations spanning years with proper calculations
- **Flexible Configuration**: Constructor-based or fluent method chaining
- **Precision Control**: Configurable fractional digits for sub-second precision
- **Trailing Zero Control**: Show or hide trailing zeros in adaptive mode

## Quick Start

```typescript
import { Duration } from '@epdoc/duration';

// Basic usage
console.log(new Duration.Formatter().narrow.format(3661000)); // "1h01m01s"
console.log(new Duration.Formatter().digital.format(3661000)); // "1:01:01.000"

// Adaptive formatting - show only 2 most significant units
console.log(new Duration.Formatter().narrow.adaptive(2).format(7323000)); // "2h02m"
```

## API Usage Patterns

The Duration Formatter supports two distinct usage patterns:

### 1. Constructor Configuration
Set all options upfront and use directly:

```typescript
const formatter = new Duration.Formatter({
  style: 'short',
  separator: '; ',
  fractionalDigits: 0
});
console.log(formatter.format(3661000)); // "1 hr; 1 min; 1 sec"
```

### 2. Fluent Method Chaining
Build configuration step-by-step:

```typescript
const result = new Duration.Formatter()
  .short
  .separator('; ')
  .digits(0)
  .format(3661000); // "1 hr; 1 min; 1 sec"
```

**⚠️ Important**: Don't mix both patterns. When you call a style method (`.short`, `.narrow`, etc.), it resets to that style's defaults, overriding any constructor options.

## Format Styles

### Digital Format
Time-like display with colons:

```typescript
new Duration.Formatter().digital.format(3661000);        // "1:01:01.000"
new Duration.Formatter().digital.digits(0).format(3661000); // "1:01:01"
```

### Narrow Format
Compact with unit suffixes:

```typescript
new Duration.Formatter().narrow.format(3661000);         // "1h01m01s"
new Duration.Formatter().narrow.format(7323000);         // "2h02m03s"
```

### Long Format
Full unit names:

```typescript
new Duration.Formatter().long.format(3661000);           // "1 hour, 1 minute, 1 second"
new Duration.Formatter().long.separator(' | ').format(3661000); // "1 hour | 1 minute | 1 second"
```

### Short Format
Abbreviated unit names:

```typescript
new Duration.Formatter().short.format(3661000);          // "1 hr 1 min 1 sec"
new Duration.Formatter().short.separator('; ').format(3661000); // "1 hr; 1 min; 1 sec"
```

## Adaptive Formatting

Adaptive formatting shows only the N most significant time units, making durations more readable:

```typescript
const duration = 7323000; // 2 hours, 2 minutes, 3 seconds

// Show 2 most significant units
new Duration.Formatter().narrow.adaptive(2).format(duration);  // "2h02m"

// Show 3 most significant units  
new Duration.Formatter().narrow.adaptive(3).format(duration);  // "2h02m03s"

// Works with all formats
new Duration.Formatter().digital.adaptive(2).format(duration); // "2:02:"
new Duration.Formatter().long.adaptive(2).format(duration);    // "2 hours, 2 minutes"
```

### Adaptive Display Control

Control how trailing zeros are displayed in adaptive mode:

```typescript
const oneHour = 3600000; // 1 hour exactly

// 'auto' (default) - suppress trailing zeros
new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(oneHour);   // "1h"

// 'always' - show trailing zeros within adaptive window
new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(oneHour); // "1h00m"
```

## Years Support

Handle long durations spanning years:

```typescript
const oneYear = 365.25 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds

new Duration.Formatter().narrow.format(oneYear);           // "1y0d"
new Duration.Formatter().long.format(oneYear);             // "1 year"
new Duration.Formatter().narrow.format(oneYear + 86400000); // "1y1d"
```

## Configuration Options

### Fractional Digits
Control sub-second precision:

```typescript
new Duration.Formatter().narrow.digits(0).format(1500);    // "1s"
new Duration.Formatter().narrow.digits(3).format(1500);    // "1.500s"
new Duration.Formatter().digital.digits(6).format(1500);   // "00:01.500000"
```

### Separators
Customize separators between units:

```typescript
new Duration.Formatter().long.separator(' | ').format(3661000);  // "1 hour | 1 minute | 1 second"
new Duration.Formatter().short.separator('; ').format(3661000);  // "1 hr; 1 min; 1 sec"
```

### Min/Max Display
Limit which units are shown:

```typescript
new Duration.Formatter().narrow.min('seconds').format(3661000);  // "1h01m01s"
new Duration.Formatter().narrow.max('minutes').format(3661000);  // "61m01s"
```

## Complete Example

```typescript
import { Duration } from '@epdoc/duration';

const durations = [1500, 3661000, 7323000, 86400000];

console.log('=== Basic Formats ===');
durations.forEach(ms => {
  console.log(`${ms}ms:`);
  console.log(`  Digital: ${new Duration.Formatter().digital.format(ms)}`);
  console.log(`  Narrow:  ${new Duration.Formatter().narrow.format(ms)}`);
  console.log(`  Long:    ${new Duration.Formatter().long.format(ms)}`);
  console.log(`  Short:   ${new Duration.Formatter().short.format(ms)}`);
});

console.log('\n=== Adaptive Formatting ===');
const longDuration = 7323000; // 2h 2m 3s
console.log(`${longDuration}ms with adaptive:`);
console.log(`  adaptive(1): ${new Duration.Formatter().narrow.adaptive(1).format(longDuration)}`);
console.log(`  adaptive(2): ${new Duration.Formatter().narrow.adaptive(2).format(longDuration)}`);
console.log(`  adaptive(3): ${new Duration.Formatter().narrow.adaptive(3).format(longDuration)}`);

console.log('\n=== Adaptive Display Control ===');
const oneHour = 3600000;
console.log(`${oneHour}ms (1 hour):`);
console.log(`  auto:   ${new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(oneHour)}`);
console.log(`  always: ${new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(oneHour)}`);
```

Output:
```
=== Basic Formats ===
1500ms:
  Digital: 00:01.500
  Narrow:  1.500s
  Long:    1 second, 500 milliseconds
  Short:   1 sec 500 ms

3661000ms:
  Digital: 1:01:01.000
  Narrow:  1h01m01s
  Long:    1 hour, 1 minute, 1 second
  Short:   1 hr 1 min 1 sec

=== Adaptive Formatting ===
7323000ms with adaptive:
  adaptive(1): 2h
  adaptive(2): 2h02m
  adaptive(3): 2h02m03s

=== Adaptive Display Control ===
3600000ms (1 hour):
  auto:   1h
  always: 1h00m
```

## Type Definitions

```typescript
import type { 
  EpochMilliseconds, 
  EpochSeconds, 
  HrMilliseconds, 
  Milliseconds, 
  Minutes,
  Seconds 
} from '@epdoc/duration';
```

- `Milliseconds`: Integer
- `HrMilliseconds`: number (high-resolution milliseconds)
- `EpochMilliseconds`: Integer
- `EpochSeconds`: Integer
- `Minutes`: number
- `Seconds`: number

## License

[MIT](./LICENSE)
