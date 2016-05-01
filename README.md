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
console.log( d.toISOLocaleString(true) );
console.log( timeutil.formatMS(d) );
```

Resultant output:

```console
5/1/2016, 11:49:21 AM
2016-05-01T18:49:21.122Z
2016-05-01T11:49:21.122-07:00
2016-05-01T11:49:21-07:00
406146:49:21.122
```


```
// Run
console.log(timeutil.formatMS(3454));
console.log(timeutil.formatMS(32397843));
console.log(timeutil.formatMS(130054));
console.log(timeutil.formatMS(41234));

// Resultant output
3.454
8:59:57.843
2:10.054
41.234
```