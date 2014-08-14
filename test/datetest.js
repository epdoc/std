/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var dateutil = require('../index');

var d = new Date();

dtest( d );
dtest( d, 0 );
dtest( d, 60 );
dtest( d, -60 );
dtest( d, 4*60 );
dtest( d, d.getTimezoneOffset() );

function dtest( d, offset ) {
    console.log( "Offset %d date %s", offset, dateutil.toSortableString(d,offset) );
}

console.log( d.toLocaleString() );       // Existing Date object method
console.log( d.toISOString() );         // Existing Date object method
console.log( d.toISOLocaleString() );
console.log( d.toFileString() );
console.log( d.toFileString('d') );
console.log( d.toFileString('ms') );

console.log( dateutil.formatMS(d) );