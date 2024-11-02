# @epdoc/std/datetime

Contains date utilities that are not found in [moment.js](https://github.com/moment/moment) or require a fair amount of
wrapper logic when using
[Intl.DurationFormat](https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructor).

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
