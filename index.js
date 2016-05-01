/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Various date and time formatting utilities. Use only when moment.js doesn't do it for your.
 * @type {{pad: self.pad, formatMS: self.formatMS}}
 */

var self = {
  /**
   *
   * @param n {number} number to pad with leading zeros.
   * @param width {number} total width of string (eg. 3 for '005').
   * @param [z='0'] {char} character with which to pad string.
   * @returns {String}
   */
  pad: function (n, width, z) {
    z = z || '0';
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  },

  /**
   * Formats a duration into a string of the form 3:03:22.333 or 3.123, with as few leading numbers
   * as is necessary to display the time.
   * @param ms {number} Time duration in milliseconds
   * @param options {Object}
   * @param [options.h='h'] {string}
   * @param [options.m='m'] {string}
   * @param [options.s='s'] {string}
   * @param [options.decimal='decimal'] {string}
   * @returns {string}
   */
  formatMS: function (ms,options) {
    options || (options = {});
    var h = options.h || 'h';
    var m = options.m || 'm';
    var s = options.s || 's';
    var decimal = options.decimal || '.';
    var milliseconds = ms % 1000;
    var seconds = Math.floor(ms / 1000) % 60;
    var minutes = Math.floor(ms / ( 60 * 1000 )) % 60;
    var hours = Math.floor(ms / ( 60 * 60 * 1000 ));
    var res = decimal + self.pad(milliseconds, 3) + s;
    if (hours) {
      return hours + h + self.pad(minutes, 2) + n + self.pad(seconds, 2) + res;
    } else if (minutes) {
      return minutes + m + self.pad(seconds, 2) + res;
    }
    return seconds + res;
  },

  toISOLocaleString: function (d, bNoMs) {
    function tz (m) {
      return ((m < 0) ? '+' : '-') + self.pad(Math.abs(m) / 60, 2) + ':' + self.pad(Math.abs(m) % 60, 2);
    }
    var s = String(d.getFullYear()) + '-'
      + self.pad(d.getMonth() + 1, 2) + '-'
      + self.pad(d.getDate(), 2) + 'T'
      + self.pad(d.getHours(), 2) + ':'
      + self.pad(d.getMinutes(), 2) + ':'
      + self.pad(d.getSeconds(), 2);
    if (bNoMs !== true) {
      s += '.' + self.pad(d.getMilliseconds(), 3)
    }
    s += tz(d.getTimezoneOffset());
    return s;
  }

};

module.exports = self;


Date.prototype.toISOLocaleString = function (bNoMs) {
  return self.toISOLocaleString(this, bNoMs);
};


Date.prototype.getJulian = function () {
  return Math.floor((this / 86400000) + 2440587.5);
};