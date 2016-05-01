/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Various datetime formatting utilities. Use only when moment.js doesn't do it for your.
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
   * @returns {string}
   */
  formatMS: function (ms) {
    var milliseconds = ms % 1000;
    var seconds = Math.floor(ms / 1000) % 60;
    var minutes = Math.floor(ms / ( 60 * 1000 )) % 60;
    var hours = Math.floor(ms / ( 60 * 60 * 1000 ));
    var s = '.' + self.pad(milliseconds, 3);
    if (hours) {
      return hours + ':' + self.pad(minutes, 2) + ':' + self.pad(seconds, 2) + s;
    } else if (minutes) {
      return minutes + ':' + self.pad(seconds, 2) + s;
    }
    return seconds + s;
  },

  toISOLocaleString: function (d, bNoMs) {
    function tz (m) {
      return ((m < 0) ? '+' : '-') + self.pad(Math.abs(m) / 60, 2) + ':' + self.pad(Math.abs(m) % 60, 2);
    }

    var s = String(d.getFullYear()) + '-'
      + pad(d.getMonth() + 1, 2) + '-'
      + pad(d.getDate(), 2) + 'T'
      + pad(d.getHours(), 2) + ':'
      + pad(d.getMinutes(), 2) + ':'
      + pad(d.getSeconds(), 2);
    if (bNoMs !== true) {
      s += '.' + pad(d.getMilliseconds(), 3)
    }
    s += tz(d.getTimezoneOffset());
    return s;
  },


};

module.exports = self;


Date.prototype.toISOLocaleString = function (bNoMs) {
  return self.toISOLocaleString(this, bNoMs);
};


Date.prototype.getJulian = function () {
  return Math.floor((this / 86400000) + 2440587.5);
};


