# @epdoc/timeutil

Contains date and time duration utilities that are not found in
[moment.js](https://github.com/moment/moment) or require a fair amount of
wrapper logic when using [Intl.DurationFormat](https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructor).

Contains no external dependencies.

## Date Utilities

Contains methods to generate, from a Date object:

- an ISO date string that uses the local timezone
- the [Julian date](https://en.wikipedia.org/wiki/Julian_day) value
- a date that is suitable for use in Google Sheets
- create a new DateUtil object from a date in the PDF date format
- various methods to work with timezones

```typescript
import { dateUtil } from './mod.ts';

const d0 = new Date();
console.log(d0.toLocaleString());
console.log(d0.toISOString());
console.log(dateUtil(d0).toISOLocalString());
console.log(dateUtil(d0).toISOLocalString(false));

console.log(dateUtil(d0).julianDate());
console.log(dateUtil(d0).googleSheetsDate());

console.log(dateUtil(d0).format('YYYYMMDD_HHmmss'));
console.log(dateUtil(d0).formatUTC('YYYYMMDD_HHmmss'));
```

Resultant output:

```
11/25/1997, 06:13:14 AM
1997-11-25T12:13:14.456Z
1997-11-25T06:13:14.456-06:00
1997-11-25T06:13:14-06:00'
2450778
35759.25918981482
19971125_061314
19971125_121314
```

## Duration Utilities

Contains methods to generate a duration string from a number of milliseconds.

```typescript
import { Duration } from './mod.ts';

console.log('digital');
console.log(' ', Duration.util().digital.format(-4443454));
console.log(' ', Duration.util().digital.digits(0).format(-4443454));
console.log(' ', Duration.util().digital.format(3454)); // default 3 fractional digits
console.log(' ', Duration.util().digital.digits(0).format(3454.123456));
console.log(' ', Duration.util().digital.digits(6).format(3454.123456));
console.log(' ', Duration.util().digital.digits(9).format(3454.123456));

console.log('narrow');
console.log(' ', Duration.util().narrow.format(-4443454));
console.log(' ', Duration.util().narrow.max('minutes').digits(0).format(4443454));
console.log(' ', Duration.util().narrow.format(3454));

console.log('long');
console.log(' ', Duration.util().long.format(-4443454));
console.log(' ', Duration.util().long.separator(' ').digits(0).max('minutes').format(-4443454));

console.log('short');
console.log(' ', Duration.util().short.digits(0).format(982440990));
console.log(' ', Duration.util().short.digits(3).format(982440990));
```

Resultant output:

```
digital
  1:14:03.454
  1:14:03
  00:03.454
  00:03
  00:03.454123
  00:03.454123456
narrow
  1h14m03.454s
  74m03s
  3.454s
long
  1 hour, 14 minutes, 3 seconds, 454 milliseconds
  74 minutes 3 seconds
short
  11 days 8 hr 54 min
  11 days 8 hr 54 min 990 ms
```

## Type Definitions

There are type definitions for the following:

- `Milliseconds`: Integer
- `HrMilliseconds`: number
- `EpochMilliseconds`: Integer
- `EpochSeconds`: Integer
- `Minutes`: number
- `Seconds`: number

```typescript
import type { Milliseconds, HrMilliseconds, EpochMilliseconds, EpochSeconds, Minutes } from './mod.ts';
```
