# @epdoc/std/datetime

Contains several date utilities that are not found in [moment.js](https://github.com/moment/moment) or require a fair
amount of wrapper logic when using
[Intl.DurationFormat](https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructor).

## Date Utilities

Contains methods to generate, from a Date object:

- An ISO date string that uses the local timezone (The Date object's toISOString only uses GMT)
- The [Julian date](https://en.wikipedia.org/wiki/Julian_day) value
- A date that is suitable for use in Google Sheets
- Create a new DateUtil object from a date in the PDF date format
- Various methods to work with timezones

```typescript
import { dateUtil } from 'jsr:@epdoc/datetime';

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

## Roadmap

The goal of this package is to make it go away or be simplified by using more standard Javascript library functions.

## License

[MIT](./LICENSE)
