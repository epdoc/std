/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var timeutil = require('../index');

var d = new Date();

console.log( d.toLocaleString() );       // Existing Date object method
console.log( d.toISOString() );         // Existing Date object method
console.log( d.toISOLocaleString() );
console.log( d.toISOLocaleString(true) );

console.log( timeutil.formatMS(d) );

console.log(timeutil.formatMS(3454));
console.log(timeutil.formatMS(32397843));
console.log(timeutil.formatMS(130054));
console.log(timeutil.formatMS(41234));
