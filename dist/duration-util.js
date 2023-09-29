"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurationUtil = exports.isFormatMsOptions = void 0;
const epdoc_util_1 = require("epdoc-util");
function isFormatMsOptions(val) {
    if ((0, epdoc_util_1.isDict)(val)) {
        return true;
    }
    return false;
}
exports.isFormatMsOptions = isFormatMsOptions;
class DurationUtil {
    constructor(ms, opts) {
        this._opts = { h: 'h', m: 'm', s: 's', decimal: '.' };
        this._ms = 0;
        this._ms = ms;
        if (isFormatMsOptions(opts)) {
            this._opts = opts;
        }
    }
    altOpts() {
        return this.options({ h: ':', m: ':', s: ':', decimal: '.' });
    }
    options(opts) {
        this._opts = opts;
        return this;
    }
    /**
     * Formats a duration into a string of the form 3:03:22.333 or 3.123, with as few leading numbers
     * as is necessary to display the time.
     * @param ms
     * @param options
     * @returns string
     */
    asString() {
        const opts = this._opts;
        let neg = '';
        let ms = this._ms;
        if (ms < 0) {
            ms = 0 - ms;
            neg = '-';
        }
        const milliseconds = ms % 1000;
        const seconds = (0, epdoc_util_1.roundNumber)(ms / 1000) % 60;
        const minutes = Math.floor(ms / (60 * 1000)) % 60;
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const res = opts.decimal + (0, epdoc_util_1.pad)(milliseconds, 3) + opts.s;
        if (hours) {
            return neg + hours + opts.h + (0, epdoc_util_1.pad)(minutes, 2) + opts.m + (0, epdoc_util_1.pad)(seconds, 2) + res;
        }
        else if (minutes) {
            return neg + minutes + opts.m + (0, epdoc_util_1.pad)(seconds, 2) + res;
        }
        return neg + seconds + res;
    }
}
exports.DurationUtil = DurationUtil;
//# sourceMappingURL=duration-util.js.map