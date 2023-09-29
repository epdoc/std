# epdoc-timeutil #

Contains date and time duration utilities that are not found in
[moment.js](https://github.com/moment/moment). Written in TypeScript. The
examples below use plain vanilla ES6.

## Date Utilities ##

There are date utilities to generate from a Date object:

 * an ISO date string that uses the local timezone
 * the [Julian date](https://en.wikipedia.org/wiki/Julian_day) value

```javascript
let dateutil = require('epdoc-timeutil').dateUtil;

let d0 = new Date();
console.log( `Date is ${dateutil(d0).toISOLocaleString()}` );
```

Resultant output:

```
Date is 2023-09-29T14:21:03.861-06:00
```

```javascript
var d0 = new Date();
console.log( d0.toLocaleString() );
console.log( d0.toISOString() );
console.log( dateutil(d0).toISOLocaleString() );
console.log( dateutil(d0).toISOLocaleString(false) );
```

Resultant output:

```console
5/1/2016, 11:49:21 AM
2016-05-01T18:49:21.122Z
2016-05-01T11:49:21.122-07:00
2016-05-01T11:49:21-07:00
```

## Duration Utilities

```javascript
let durationUtil = require('epdoc-timeutil').durationUtil;

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