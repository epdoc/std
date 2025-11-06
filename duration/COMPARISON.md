# Duration Formatting Library Comparison

This document compares @epdoc/duration with other popular duration formatting solutions to help you choose the right
tool for your needs.

## Quick Decision Matrix

| Need                          | @epdoc/duration | @std/duration | Moment.js | Intl.DurationFormat |
| ----------------------------- | --------------- | ------------- | --------- | ------------------- |
| **Simple formatting**         | ✅              | ✅            | ✅        | ✅                  |
| **Humanize function**         | ✅              | ❌            | ✅        | ❌                  |
| **Years support**             | ✅              | ❌            | ✅        | ✅                  |
| **Adaptive formatting**       | ✅              | ❌            | ❌        | ❌                  |
| **Internationalized strings** | ✅ (4 locales)  | ❌            | ✅        | ✅                  |
| **Bundle size**               | Medium          | Small         | Large     | Native              |
| **Browser support**           | Modern          | Modern        | All       | Modern              |
| **Customization**             | High            | Low           | Medium    | Low                 |
| **Learning curve**            | Medium          | Low           | High      | Medium              |

## Detailed Comparison

### @epdoc/duration (This Library)

**Best for:** Complex formatting needs, adaptive display, years support, enterprise applications

```typescript
// Adaptive formatting - show 2 most significant units
new Duration.Formatter().narrow.adaptive(2).format(7323000); // "2h02m"

// Years support with proper calculations
new Duration.Formatter().narrow.format(oneYear); // "1y0d"

// Humanize function for natural language
humanize(3600000); // "about an hour"
humanize(3600000, true); // "in about an hour"
humanize(-3600000, true); // "about an hour ago"

// Trailing zero control
new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(3600000); // "1h00m"

// Fluent API with extensive customization
new Duration.Formatter()
  .short
  .separator('; ')
  .digits(0)
  .format(3661000); // "1 hr; 1 min; 1 sec"
```

**Pros:**

- ✅ Adaptive formatting (unique feature)
- ✅ Humanize function for natural language descriptions
- ✅ Internationalization support (English, French, Spanish, Chinese)
- ✅ Full years support with leap year calculations (ie. years are 365.25 days)
- ✅ Fluent API with method chaining
- ✅ Extensive customization options
- ✅ Uses modern Intl.DurationFormat internally
- ✅ TypeScript-first design
- ✅ Trailing zero control
- ✅ Multiple format styles (4 built-in)

**Cons:**

- ❌ Larger bundle size than minimal solutions
- ❌ More complex API for simple use cases
- ❌ Requires modern browser/runtime support
- ❌ Limited to 4 locales (vs comprehensive i18n libraries)

### @std/duration (Deno Standard Library)

**Best for:** Simple formatting, minimal bundle size, functional programming style

```typescript
import { format } from '@std/duration';

format(99674, { style: 'narrow' }); // "0d 0h 1m 39s 674ms 0µs 0ns"
format(99674, { style: 'digital' }); // "00:00:01:39:674:000:000"
format(99674, { ignoreZero: true }); // "1m 39s 674ms"
```

**Pros:**

- ✅ Minimal bundle size (~150 lines)
- ✅ Simple functional API
- ✅ Part of Deno standard library
- ✅ Fast execution
- ✅ No dependencies

**Cons:**

- ❌ No years support (max unit is days)
- ❌ No adaptive formatting
- ❌ Limited customization
- ❌ Only 3 format styles
- ❌ No fluent API
- ❌ Basic trailing zero handling
- ❌ No internationalized strings (English only)

### Moment.js

**Best for:** Legacy applications, comprehensive date/time manipulation (not just formatting)

```typescript
import moment from 'moment';

moment.duration(99674).humanize(); // "2 minutes"
moment.duration(99674).asHours(); // 0.027687222222222223
moment.duration(2, 'hours').add(30, 'minutes'); // Duration object
```

**Pros:**

- ✅ Mature, battle-tested library
- ✅ Comprehensive date/time manipulation
- ✅ Large ecosystem and community
- ✅ Extensive localization support
- ✅ Years support
- ✅ Wide browser compatibility

**Cons:**

- ❌ Large bundle size (~67KB minified)
- ❌ Mutable API (deprecated pattern)
- ❌ No adaptive formatting
- ❌ Limited duration formatting options
- ❌ Performance overhead
- ❌ Maintenance mode (no new features)

### Intl.DurationFormat (Native Browser API)

**Best for:** Internationalization, native performance, future-proof applications

```typescript
// Note: Limited browser support as of 2024
new Intl.DurationFormat('en', { style: 'long' })
  .format({ hours: 1, minutes: 30 }); // "1 hour, 30 minutes"

new Intl.DurationFormat('en', { style: 'narrow' })
  .format({ hours: 2, minutes: 15 }); // "2h 15m"
```

**Pros:**

- ✅ Native browser API (no bundle size)
- ✅ Built-in internationalization
- ✅ Future-proof standard
- ✅ Optimal performance
- ✅ Years support

**Cons:**

- ❌ Limited browser support (cutting-edge)
- ❌ No adaptive formatting
- ❌ Requires duration objects, not milliseconds
- ❌ Limited customization
- ❌ No fluent API
- ❌ Complex setup for simple cases

## Feature Deep Dive

### Adaptive Formatting (Unique to @epdoc/duration)

Show only the N most significant time units:

```typescript
const duration = 7323000; // 2h 2m 3s

// Standard libraries show all units
format(duration); // "0d 2h 2m 3s 0ms 0µs 0ns" (verbose)

// @epdoc/duration adaptive formatting
new Duration.Formatter().narrow.adaptive(1).format(duration); // "2h"
new Duration.Formatter().narrow.adaptive(2).format(duration); // "2h02m"
new Duration.Formatter().narrow.adaptive(3).format(duration); // "2h02m03s"
```

### Humanize Function Comparison

Natural language duration descriptions:

```typescript
const duration = 3600000; // 1 hour

// @epdoc/duration - Dedicated humanize function with i18n
humanize(duration); // "about an hour"
humanize(duration, true); // "in about an hour"
humanize(-duration, true); // "about an hour ago"

// Internationalization support
humanize(duration, { locale: 'fr' }); // "environ une heure"
humanize(duration, { locale: 'es' }); // "cerca de una hora"
humanize(duration, { locale: 'zh' }); // "大约一小时"

// @std/duration - No humanize function
// Must use regular formatting
format(duration); // "0d 1h 0m 0s 0ms 0µs 0ns"

// Moment.js - Built-in humanize with extensive i18n
moment.duration(duration).humanize(); // "an hour"
moment.duration(duration).humanize(true); // "in an hour"
moment.locale('fr').duration(duration).humanize(); // "une heure"

// Intl.DurationFormat - No humanize function
// Must use regular formatting
new Intl.DurationFormat('en').format({ hours: 1 }); // "1 hr"
```

### Years Support Comparison

```typescript
const oneYear = 365.25 * 24 * 60 * 60 * 1000;

// @std/duration - No years support
format(oneYear); // "365d 6h 0m 0s..." (incorrect)

// @epdoc/duration - Proper years calculation
new Duration.Formatter().narrow.format(oneYear); // "1y0d"

// Moment.js - Years support
moment.duration(oneYear).humanize(); // "a year"

// Intl.DurationFormat - Years support
new Intl.DurationFormat('en').format({ years: 1 }); // "1 yr"
```

### Customization Comparison

```typescript
// @epdoc/duration - Extensive customization
new Duration.Formatter()
  .short
  .separator(' | ')
  .digits(2)
  .adaptiveDisplay('always')
  .format(duration);

// @std/duration - Limited options
format(duration, { style: 'full', ignoreZero: true });

// Moment.js - Basic customization
moment.duration(duration).humanize(true);

// Intl.DurationFormat - Style options only
new Intl.DurationFormat('en', { style: 'narrow' }).format(durationObj);
```

## Migration Guide

### From @std/duration

```typescript
// Before
import { format } from '@std/duration';
format(ms, { style: 'narrow', ignoreZero: true });

// After
import { Duration } from '@epdoc/duration';
new Duration.Formatter().narrow.format(ms); // Auto-handles trailing zeros
```

### From Moment.js

```typescript
// Before
import moment from 'moment';
moment.duration(ms).humanize();

// After
import { Duration } from '@epdoc/duration';
new Duration.Formatter().long.format(ms);
```

### From Intl.DurationFormat

```typescript
// Before
new Intl.DurationFormat('fr', { style: 'narrow' })
  .format({ heures: 1, minutes: 30 });

// After
import { Duration } from '@epdoc/duration';
new Duration.Formatter().narrow.format(5400000); // 1.5 hours in ms
```

## Performance Comparison

| Library             | Bundle Size | Runtime Performance | Memory Usage |
| ------------------- | ----------- | ------------------- | ------------ |
| @epdoc/duration     | ~15KB       | Fast                | Medium       |
| @std/duration       | ~3KB        | Fastest             | Minimal      |
| Moment.js           | ~67KB       | Slow                | High         |
| Intl.DurationFormat | 0KB         | Fastest             | Minimal      |

## When to Choose Each

### Choose @epdoc/duration when:

- ✅ You need adaptive formatting (show N most significant units)
- ✅ Humanize function for natural language descriptions is needed
- ✅ Years support is required
- ✅ Extensive customization is needed
- ✅ You prefer fluent/builder APIs
- ✅ Working with enterprise applications
- ✅ Need fine-grained control over display
- ✅ Need internationalization for English, French, Spanish, or Chinese

### Choose @std/duration when:

- ✅ Simple formatting is sufficient
- ✅ Bundle size is critical
- ✅ Using Deno runtime
- ✅ Prefer functional programming style
- ✅ No years support needed
- ✅ English-only applications (no internationalization needed)

### Choose Moment.js when:

- ✅ Already using Moment.js in your project
- ✅ Need comprehensive date/time manipulation
- ✅ Working with legacy browsers
- ✅ Bundle size is not a concern
- ✅ Extensive internationalization support is required (100+ locales)
- ✅ Need humanize functionality with comprehensive localization

### Choose Intl.DurationFormat when:

- ✅ Internationalization is critical
- ✅ Bundle size must be zero
- ✅ Can target modern browsers only
- ✅ Native performance is required
- ✅ Simple formatting needs
- ✅ Need native browser localization support

## Conclusion

**@epdoc/duration** fills a unique niche by providing advanced duration formatting features not available in other
libraries, particularly adaptive formatting, humanize function for natural language descriptions with
internationalization support, and comprehensive customization options. It's the best choice when you need more than
basic formatting but don't want the overhead of a full date/time library like Moment.js.

For simple use cases, @std/duration is sufficient. For complex applications requiring adaptive display, humanize
functionality with i18n support, years support, and extensive customization, @epdoc/duration is the optimal choice.
