/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012 Armor5, Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5, Inc. and its suppliers, if any. The intellectual and
 * technical concepts contained herein are proprietary to Armor5, Inc.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from
 * Armor5, Inc..
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