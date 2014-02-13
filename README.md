# a5dateutil #

Contains date utility functions

## Date Utilities ##

```javascript
var dateutil = require('a5datetuil');

var d0 = new Date();
console.log( "Date is %s", dateutil.toSortableString(d0);
```

The  methods ```toISOLocaleString``` and ```toFileString``` extend the Date object.

```javascript
var d0 = new Date();
console.log( d.toLocaleString() );       // Existing Date object method
console.log( d.toISOString() );          // Existing Date object method
console.log( d.toISOLocaleString() );
console.log( d.toISOLocaleString(true) ); // Don't output milliseconds
console.log( d.toFileString() );
console.log( d.toFileString('d') );
console.log( d.toFileString('ms') );
```

Resultant output:

```console
Tue Feb 05 2013 08:54:01 GMT-0800 (PST)
2013-02-05T16:54:01.211Z
2013-02-05T08:54:01.211-08:00
20130205085401
20130205
20130205085401211

```