# time-util #

Contains date and time utilities that are not found in moment.js

## Date and Time Utilities ##

```javascript
var timeutil = require('time-util');

var d0 = new Date();
console.log( "Date is %s", dateutil.toISOLocaleString(d0);
```

The  method ```toISOLocaleString``` extends the Date object.

```javascript
var d0 = new Date();
console.log( d.toLocaleString() );       // Existing Date object method
console.log( d.toISOString() );          // Existing Date object method
console.log( d.toISOLocaleString() );
console.log( d.toISOLocaleString(true) ); // Don't output milliseconds
```

Resultant output:

```console
Tue Feb 05 2013 08:54:01 GMT-0800 (PST)
2013-02-05T16:54:01.211Z
2013-02-05T08:54:01.211-08:00
2013-02-05T08:54:01-08:00
```
