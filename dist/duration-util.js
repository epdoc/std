"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurationUtil = exports.isFormatMsName = exports.durationUtil = exports.isFormatMsOptions = exports.isFormatMsUnit = void 0;
const epdoc_util_1 = require("epdoc-util");
const REG = {
    formatName: new RegExp(/^(long|hms|:)$/),
};
function isFormatMsUnit(val) {
    if ((0, epdoc_util_1.isString)(val) || val === false) {
        return true;
    }
    if ((0, epdoc_util_1.isArray)(val) && (0, epdoc_util_1.isString)(val[0]) && (val.length === 1 || (0, epdoc_util_1.isString)(val[1]))) {
        return true;
    }
    return false;
}
exports.isFormatMsUnit = isFormatMsUnit;
const OPT_KEYS = ['d', 'h', 'm', 's', 'ms', 'compact', 'sep', 'decimal'];
function isFormatMsOptions(val) {
    if ((0, epdoc_util_1.isDict)(val) &&
        (!(0, epdoc_util_1.isDefined)(val.d) || isFormatMsUnit(val.d)) &&
        (!(0, epdoc_util_1.isDefined)(val.h) || isFormatMsUnit(val.h)) &&
        (!(0, epdoc_util_1.isDefined)(val.m) || isFormatMsUnit(val.m)) &&
        (!(0, epdoc_util_1.isDefined)(val.s) || isFormatMsUnit(val.s)) &&
        (!(0, epdoc_util_1.isDefined)(val.ms) || isFormatMsUnit(val.ms) || (0, epdoc_util_1.isBoolean)(val.ms) || (0, epdoc_util_1.isInteger)(val.ms))) {
        return true;
    }
    return false;
}
exports.isFormatMsOptions = isFormatMsOptions;
function durationUtil(ms, opts) {
    return new DurationUtil(ms, opts);
}
exports.durationUtil = durationUtil;
function isFormatMsName(val) {
    return REG.formatName.test(val);
}
exports.isFormatMsName = isFormatMsName;
class DurationUtil {
    /**
     * Construct a new `DurationUtil` instance. If `formatting` is not a
     * `FormatMsName` then will initialize formatting with default `:` format.
     * @param ms The duration we are outputing. We use the absolute value.
     * @param formatting Defines the format.
     * @see options
     */
    constructor(ms, formatting) {
        this._ms = 0;
        this._ms = ms;
        if (!isFormatMsName(formatting)) {
            this.options(':');
        }
        this.options(formatting);
    }
    /**
     * Define a custom format by overwriting the already-set format options.
     * @param opts The `FormatMsName` name of one of the preset formats, or a
     * `FormatMsOptions` object, which are then used to override the individual
     * values.
     * @returns this
     */
    options(formatting) {
        if (isFormatMsName(formatting)) {
            this._opts = (0, epdoc_util_1.deepCopy)(DurationUtil.OPTS[formatting]);
        }
        else if (isFormatMsOptions(formatting)) {
            OPT_KEYS.forEach((key) => {
                if (formatting.hasOwnProperty(key)) {
                    this._opts[key] = formatting[key];
                }
            });
        }
        return this;
    }
    /**
     * Formats the output string.
     * @param formatting Same as per the `options` method. A format to be used
     * when constructing the output.
     * @returns The formatted output string.
     */
    format(formatting) {
        this.options(formatting);
        let ms = this._ms;
        if (ms < 0) {
            ms = -ms;
        }
        const opts = this._opts;
        if (opts.ms === false || opts.ms === 0) {
            // Round out the milliseconds
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
            if (opts.ms === true || opts.ms === 3 || (0, epdoc_util_1.isString)(opts.ms)) {
                res = opts.decimal + (0, epdoc_util_1.pad)(time.ms, 3) + opts.s;
            }
            else if (opts.ms === false || opts.ms === 0) {
                res = opts.s;
            }
            else if ((0, epdoc_util_1.isInteger)(opts.ms) && [1, 2, 3].includes(opts.ms)) {
                ms = Math.round(ms / Math.pow(10, (3 - opts.ms)));
                res = opts.decimal + (0, epdoc_util_1.pad)(ms, 3).slice(-opts.ms) + opts.s;
            }
            if (time.d) {
                return (String(time.d) +
                    opts.d +
                    (0, epdoc_util_1.pad)(time.h, 2) +
                    opts.h +
                    (0, epdoc_util_1.pad)(time.m, 2) +
                    opts.m +
                    (0, epdoc_util_1.pad)(Math.floor(time.s), 2) +
                    res);
            }
            else if (time.h) {
                return String(time.h) + opts.h + (0, epdoc_util_1.pad)(time.m, 2) + opts.m + (0, epdoc_util_1.pad)(Math.floor(time.s), 2) + res;
            }
            else if (time.m || !(0, epdoc_util_1.isNonEmptyString)(opts.s)) {
                return String(time.m) + opts.m + (0, epdoc_util_1.pad)(Math.floor(time.s), 2) + res;
            }
            return String(time.s) + res;
        }
        else {
            return Object.entries(time)
                .filter((val) => val[1] !== 0)
                .map(([key, val]) => {
                let units = opts[key];
                if ((0, epdoc_util_1.isArray)(units)) {
                    if (val !== 1 && units.length > 1) {
                        units = units[1];
                    }
                    else {
                        units = units[0];
                    }
                }
                if ((0, epdoc_util_1.isString)(units)) {
                    return `${val} ${units}`;
                }
            })
                .filter((val) => (0, epdoc_util_1.isNonEmptyString)(val))
                .join(opts.sep);
        }
    }
}
exports.DurationUtil = DurationUtil;
DurationUtil.OPTS = {
    hms: { d: 'd', h: 'h', m: 'm', s: 's', ms: true, compact: true, decimal: '.' },
    ':': { d: 'd', h: ':', m: ':', s: '', ms: true, compact: true, decimal: '.' },
    long: {
        d: ['day', 'days'],
        h: ['hour', 'hours'],
        m: ['minute', 'minutes'],
        s: ['second', 'seconds'],
        ms: ['millisecond', 'milliseconds'],
        compact: false,
        sep: ', ',
        decimal: '.',
    },
};
//# sourceMappingURL=duration-util.js.map