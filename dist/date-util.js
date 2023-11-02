"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = exports.dateUtil = void 0;
const epdoc_util_1 = require("epdoc-util");
/**
 * Calls and returns `new DateUtil(date)`.
 * @param date
 * @returns
 */
function dateUtil(date) {
    return new DateUtil(date);
}
exports.dateUtil = dateUtil;
/**
 * A wrapper for a javascript `Date` object.
 */
class DateUtil {
    /**
     * Create a DateUtil object, which is a wrapper for a javascript `Date` object.
     * @param date Optional Date object, or a string or number that can be used
     * with the Date constructor method. If undefined then uses the value of `new Date()`.
     */
    constructor(date) {
        this._invalidDateString = 'Invalid Date';
        this._date = date ? new Date(date) : new Date();
    }
    /**
     * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
     * `Date.toISOString` which always uses UTC in the output.
     * @param showMs Set to false to hide (truncate) milliseconds
     * @returns
     */
    toISOLocaleString(showMs = true) {
        this.validate();
        const d = this._date;
        let s = String(d.getFullYear()) +
            '-' +
            (0, epdoc_util_1.pad)(d.getMonth() + 1, 2) +
            '-' +
            (0, epdoc_util_1.pad)(d.getDate(), 2) +
            'T' +
            (0, epdoc_util_1.pad)(d.getHours(), 2) +
            ':' +
            (0, epdoc_util_1.pad)(d.getMinutes(), 2) +
            ':' +
            (0, epdoc_util_1.pad)(d.getSeconds(), 2);
        if (showMs !== false) {
            s += '.' + (0, epdoc_util_1.pad)(d.getMilliseconds(), 3);
        }
        s += DateUtil.tz(d.getTimezoneOffset());
        return s;
    }
    /**
     * Validate whether the date is a valid Date object.
     */
    validate() {
        if (!(0, epdoc_util_1.isValidDate)(this._date)) {
            throw new Error(this._invalidDateString);
        }
    }
    /**
     * Get the Julian Day.
     * @returns A number which is the Julian Day
     * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
     */
    julianDate() {
        this.validate();
        return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
    }
    static tz(m) {
        return (m < 0 ? '+' : '-') + (0, epdoc_util_1.pad)(Math.abs(m) / 60, 2) + ':' + (0, epdoc_util_1.pad)(Math.abs(m) % 60, 2);
    }
    /**
     * Get the date in a Google Sheets value
     * @returns A number which is the date with a value suitable for use in Google
     * Sheets
     */
    googleSheetsDate() {
        this.validate();
        const d = this._date;
        const tNull = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)); // the starting value for Google
        return ((d.getTime() - tNull.getTime()) / 60000 - d.getTimezoneOffset()) / 1440;
    }
}
exports.DateUtil = DateUtil;
//# sourceMappingURL=date-util.js.map