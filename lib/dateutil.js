/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

module.exports.toISOLocaleString = toISOLocaleString;
module.exports.toISOLocalString = toISOLocaleString;        // backward compatible
module.exports.toYYYYMMDDString = toYYYYMMDDString;
module.exports.toSortableString = toSortableString;
module.exports.formatMS = formatMS;
module.exports.toFileString = toFileString;

Date.prototype.toISOLocaleString = function(bNoMs) {
    return _toISOLocaleString(this,bNoMs);
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
 * din Date object, string or milliseconds, will be cast to a Date object
 * bNoMs If true then do not output milliseconds
 */
function toISOLocaleString(din,bNoMs){
    var d = new Date(din);
    return _toISOLocaleString(d,bNoMs);
}

function _toISOLocaleString(d,bNoMs){
    function tz(m) { return ((m<0)?'+':'-')+pad(Math.abs(m)/60)+':'+pad(Math.abs(m)%60); };
    var s = String(d.getFullYear())+'-'
        + pad(d.getMonth()+1)+'-'
        + pad(d.getDate())+'T'
        + pad(d.getHours())+':'
        + pad(d.getMinutes())+':'
        + pad(d.getSeconds());
        if( bNoMs !== true ) {
            s += '.' + pad000(d.getMilliseconds())
        }
        s += tz(d.getTimezoneOffset());
    return s;
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
 * @param options hours: show hours (default false), seconds: show seconds (default true), ms: show milliseconds (default true)
 * @returns {String}
 */
function formatMS( ms, options ) {
    var milliseconds = ms % 1000;
    var seconds = Math.floor( ms / 1000 ) % 60;
    var minutes = Math.floor( ms / ( 60 * 1000 ) );
    var result = '';
    if( options && options.hours === true ) {
	var hours = Math.floor( ms / ( 60 * 60 * 1000 ) );
        minutes = minutes % 60;
        result = pad(hours) + ':';
    }
    result += pad(minutes);
    if( options && options.seconds === false ) {
        return result;
    } else {
        result += ':' + pad(seconds);
        if( options && options.ms === false) {
            return result;
        } else {
            result += '.' + pad000(milliseconds);
        }
        return result;
    }
}

function pad(n){return n<10 ? '0'+n : n;};
function pad000(n){return n<10 ? '00'+n : (n<100 ? '0'+n : n);};

