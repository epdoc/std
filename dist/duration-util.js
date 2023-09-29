"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurationUtil = exports.isFormatName = exports.durationUtil = exports.isFormatMsOptions = void 0;
const epdoc_util_1 = require("epdoc-util");
function isFormatMsOptions(val) {
    if ((0, epdoc_util_1.isDict)(val) &&
        (0, epdoc_util_1.isString)(val.d) &&
        (0, epdoc_util_1.isString)(val.h) &&
        (0, epdoc_util_1.isString)(val.m) &&
        (0, epdoc_util_1.isString)(val.s) &&
        (0, epdoc_util_1.isString)(val.ms)) {
        return true;
    }
    return false;
}
exports.isFormatMsOptions = isFormatMsOptions;
function durationUtil(ms, opts) {
    return new DurationUtil(ms, opts);
}
exports.durationUtil = durationUtil;
function isFormatName(val) {
    if ((0, epdoc_util_1.isNonEmptyString)(val)) {
        if (val === 'hms' || val === ':' || val === 'long') {
            return true;
        }
    }
    return false;
}
exports.isFormatName = isFormatName;
class DurationUtil {
    /**
     *
     * @param ms The duration we are outputing
     * @param opts
     */
    constructor(ms, formatting) {
        this._opts = DurationUtil.OPTS[':'];
        this._ms = 0;
        this._ms = ms;
        this.options(formatting);
    }
    /**
     * Define a custom format by overwriting the default format.
     * @param opts The name of one of the preset formatting options, or a
     * Dictionary with entries from a FormatMsOptions object, which are then used
     * to override the individual default values.
     * @returns this
     */
    options(formatting) {
        if (isFormatName(formatting)) {
            this._opts = (0, epdoc_util_1.deepCopy)(DurationUtil.OPTS[formatting]);
        }
        else if ((0, epdoc_util_1.isDict)(formatting)) {
            Object.keys(DurationUtil.OPTS.long).forEach((key) => {
                if (formatting.hasOwnProperty(key)) {
                    this._opts[key] = formatting[key];
                }
            });
        }
        return this;
    }
    /**
     * Do not display milliseconds in output string.
     * @returns this
     */
    // public showMs(val: boolean = true): DurationUtil {
    //   this._showMs = val;
    //   return this;
    // }
    /**
     * Set the character to use for decimal points. Default to '.'. Example use is
     * to set to a comma for certain latin countries.
     * @param decimal
     * @returns
     */
    decimal(decimal = '.') {
        this._decimal = decimal;
        return this;
    }
    format(formatting) {
        this.options(formatting);
        let ms = this._ms;
        if (ms < 0) {
            ms = -ms;
        }
        const opts = this._opts;
        // if (isBoolean(this._showMs)) {
        //   opts.showMs = this._showMs;
        //   this._showMs = undefined;
        // }
        if ((0, epdoc_util_1.isString)(this._decimal)) {
            opts.decimal = this._decimal;
            this._decimal = undefined;
        }
        if (!(0, epdoc_util_1.isString)(opts.ms)) {
            ms = Math.round(ms / 1000) * 1000;
        }
        const time = {
            d: Math.floor(ms / 86400000),
            h: Math.floor(ms / 3600000) % 24,
            m: Math.floor(ms / 60000) % 60,
            s: Math.floor(ms / 1000) % 60,
            ms: Math.floor(ms) % 1000,
        };
        if (opts.compact) {
            let res = opts.s;
            if ((0, epdoc_util_1.isString)(opts.ms)) {
                res = opts.decimal + (0, epdoc_util_1.pad)(time.ms, 3) + opts.s;
            }
            if (time.d) {
                return (time.d +
                    opts.d +
                    (0, epdoc_util_1.pad)(time.h, 2) +
                    opts.h +
                    (0, epdoc_util_1.pad)(time.m, 2) +
                    opts.m +
                    (0, epdoc_util_1.pad)(Math.floor(time.s), 2) +
                    res);
            }
            else if (time.h) {
                return time.h + opts.h + (0, epdoc_util_1.pad)(time.m, 2) + opts.m + (0, epdoc_util_1.pad)(Math.floor(time.s), 2) + res;
            }
            else if (time.m || !(0, epdoc_util_1.isNonEmptyString)(opts.s)) {
                return time.m + opts.m + (0, epdoc_util_1.pad)(Math.floor(time.s), 2) + res;
            }
            return time.s + res;
        }
        else {
            return Object.entries(time)
                .filter((val) => val[1] !== 0)
                .map(([key, val]) => {
                if ((0, epdoc_util_1.isString)(opts[key])) {
                    return `${val} ${opts[key]}${val !== 1 ? 's' : ''}`;
                }
            })
                .filter((val) => (0, epdoc_util_1.isNonEmptyString)(val))
                .join(opts.sep);
        }
    }
}
exports.DurationUtil = DurationUtil;
DurationUtil.OPTS = {
    hms: { d: 'd', h: 'h', m: 'm', s: 's', ms: '', compact: true, decimal: '.' },
    ':': { d: 'd', h: ':', m: ':', s: '', ms: '', compact: true, decimal: '.' },
    long: {
        d: 'day',
        h: 'hour',
        m: 'minute',
        s: 'second',
        ms: 'millisecond',
        compact: false,
        sep: ', ',
        decimal: '.',
    },
};
//# sourceMappingURL=duration-util.js.map