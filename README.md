# @epdoc/timeutil

Contains date and time duration utilities that are not found in
[moment.js](https://github.com/moment/moment). Written in TypeScript. The
examples below use plain vanilla ES6.

## Date Utilities

Contains methods to generate, from a Date object:

- an ISO date string that uses the local timezone
- the [Julian date](https://en.wikipedia.org/wiki/Julian_day) value

```javascript
let dateutil = require('@epdoc/timeutil').dateUtil;

var d0 = new Date();
console.log( d0.toLocaleString() );
console.log( d0.toISOString() );
console.log( dateutil(d0).toISOLocaleString() );
console.log( dateutil(d0).toISOLocaleString(false) );

console.log( dateutil(d0).julianDate() );
console.log( dateutil(d0).googleSheetsDate() );


// Resultant output:

11/25/1997, 06:13:14 AM
1997-11-25T12:13:14.456Z
1997-11-25T06:13:14.456-06:00
1997-11-25T06:13:14-06:00'
2450778
35759.25918981482
```

## Duration Utilities

```javascript
let durationUtil = require('@epdoc/timeutil').durationUtil;

// Run
console.log(durationUtil(-4443454).options('long').format());
console.log(durationUtil(-4443454).format());
console.log(durationUtil(3454, 'hms').format());
console.log(durationUtil(982440990,':').format({ms:false}));
// Useful when generating audible messages
console.log( durationUtil(982442990, 'long').options({ sep: ' ', ms: false }).format())
// Same as previous, but use options to turn off both s and ms.
console.log( durationUtil(982442990, 'long').options({ sep: ' ', ms: false, s: false }).format())

// Resultant output
1 hour, 14 minutes, 3 seconds, 454 milliseconds
1:14:03.454
3.454s
11d08:54:01
11 days 8 hours 54 minutes 2 seconds
11 days 8 hours 54 minutes
```
