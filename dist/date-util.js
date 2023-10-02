"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = exports.dateUtil = void 0;
const epdoc_util_1 = require("epdoc-util");
function dateUtil(date) {
    return new DateUtil(date);
}
exports.dateUtil = dateUtil;
class DateUtil {
    constructor(date) {
        this._invalidDateString = 'Invalid Date';
        this._date = (0, epdoc_util_1.isDate)(date) ? new Date(date) : new Date();
    }
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
    validate() {
        if (!(0, epdoc_util_1.isValidDate)(this._date)) {
            throw new Error(this._invalidDateString);
        }
    }
    julianDate() {
        this.validate();
        return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
    }
    static tz(m) {
        return (m < 0 ? '+' : '-') + (0, epdoc_util_1.pad)(Math.abs(m) / 60, 2) + ':' + (0, epdoc_util_1.pad)(Math.abs(m) % 60, 2);
    }
    /**
     * Convert a javascript Date object to a date value used by Google Sheets.
     * @param {*} jsDate A value that is passed to a Date constructor
     * @returns
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