/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012-2013 Armor5, Inc. All Rights Reserved.
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

module.exports.toISOLocaleString = toISOLocaleString;
module.exports.toISOLocalString = toISOLocaleString;        // backward compatible
module.exports.toYYYYMMDDString = toYYYYMMDDString;
module.exports.toSortableString = toSortableString;
module.exports.formatMS = formatMS;
module.exports.toFileString = toFileString;

Date.prototype.toISOLocaleString = function() {
    return _toISOLocaleString(this);
};

/**
 * Return the date formatted as YYYYMMDDHHMMSS.
 * If level is 'd' then return YYYYMMDD.
 * If level is 'ms' then add milliseconds and return YYYYMMDDHHMMSSmmm
 * A common use of this method is to create a string that can be used in filenames.
 * @param level Default return down to seconds resolution. May also be 'd' or 'ms'.
 */
Date.prototype.toFileString = function(level) {
    var r = String(this.getFullYear())
        + pad(this.getMonth()+1)
        + pad(this.getDate());
    if( level !== 'd' ) {
        r += pad(this.getHours())
            + pad(this.getMinutes())
            + pad(this.getSeconds());
    }
    if( level === 'ms') {
        r += pad000(this.getMilliseconds());
    }
    return r;
};



/**
 * Legacy method. To be deprecated
 */
function toISOLocaleString(din){
    var d = new Date(din);
    return _toISOLocaleString(d);
}

function _toISOLocaleString(d){
    function tz(m) { return ((m<0)?'+':'-')+pad(Math.abs(m)/60)+':'+pad(Math.abs(m)%60); };
    return String(d.getFullYear())+'-'
        + pad(d.getMonth()+1)+'-'
        + pad(d.getDate())+'T'
        + pad(d.getHours())+':'
        + pad(d.getMinutes())+':'
        + pad(d.getSeconds())+'.'
        + pad000(d.getMilliseconds())
        + tz(d.getTimezoneOffset());
}

/**
 * @param din
 * @returns Return a string of the form 20121231235959 in localtime.
 */
function toFileString(din,ms) {
	var d = new Date(din);
	return String(d.getFullYear())
	+ pad(d.getMonth()+1)
	+ pad(d.getDate())
	+ pad(d.getHours())
	+ pad(d.getMinutes())
	+ pad(d.getSeconds())
	+ (ms?pad000(d.getMilliseconds()):'');
}

function toYYYYMMDDString(din){
	var d = new Date(din);
	return String(d.getFullYear())+'-'
	+ pad(d.getMonth()+1)+'-'
	+ pad(d.getDate());
}

/**
 * Return a string of the form 2012/12/31 23:59:59 using localtime
 * @param din A date, passed in to a Date constructor.
 * @param tzOffset If set, then the time is rendered for this timezone offset, otherwise the time is rendered for localtime.
 * @return {String}
 */
function toSortableString(din,tzOffset){
    var d = new Date(din);
    d = addTzOffset(d,(tzOffset !== undefined && tzOffset !== null) ? tzOffset : d.getTimezoneOffset() );
    return String(d.getUTCFullYear())+'/'
        + pad(d.getUTCMonth()+1)+'/'
        + pad(d.getUTCDate())+' '
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds()); /*+
     + tz(d.getTimezoneOffset());*/
}

function addTzOffset(d,offset) {
    var tms = d.getTime();
    tms -= offset * 60 * 1000;
    return new Date(tms);
}

/**
 * Format ms as MM:SS.mmm
 * @param ms
 * @returns {String}
 */
function formatMS( ms ) {
	var milliseconds = ms % 1000;
	var seconds = Math.floor( ms / 1000 ) % 60;
	var minutes = Math.floor( ms / ( 60 * 1000 ) );
	return pad(minutes) + ':' + pad(seconds) + '.' + pad000(milliseconds);
};

function pad(n){return n<10 ? '0'+n : n;};
function pad000(n){return n<10 ? '00'+n : (n<100 ? '0'+n : n);};

