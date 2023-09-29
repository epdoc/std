"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = void 0;
const epdoc_util_1 = require("epdoc-util");
class DateUtil {
    constructor(date) {
        this._invalidDateString = 'Invalid Date';
        this._date = date;
    }
    set invalidDateString(val) {
        if ((0, epdoc_util_1.isString)(val)) {
            this._invalidDateString = val;
        }
    }
    toISOLocaleString(bNoMs = false) {
        const d = this._date;
        if ((0, epdoc_util_1.isValidDate)(d)) {
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
            if (bNoMs !== true) {
                s += '.' + (0, epdoc_util_1.pad)(d.getMilliseconds(), 3);
            }
            s += DateUtil.tz(d.getTimezoneOffset());
            return s;
        }
        throw new Error(this._invalidDateString);
    }
    julianDate() {
        if ((0, epdoc_util_1.isValidDate)(this._date)) {
            return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
        }
        throw new Error(this._invalidDateString);
    }
    static tz(m) {
        return (m < 0 ? '+' : '-') + (0, epdoc_util_1.pad)(Math.abs(m) / 60, 2) + ':' + (0, epdoc_util_1.pad)(Math.abs(m) % 60, 2);
    }
}
exports.DateUtil = DateUtil;
//# sourceMappingURL=date-util.js.map