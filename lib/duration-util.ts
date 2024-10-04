import {
  asInt,
  deepCopy,
  isArray,
  isBoolean,
  isDefined,
  isDict,
  isIntegerInRange,
  isNonEmptyString,
  isString,
  pad,
} from 'https://raw.githubusercontent.com/jpravetz/typeutil/master/mod.ts';
import { Milliseconds } from './types.ts';

const REG = {
  formatName: new RegExp(/^(long|hms|:)$/),
  formatMsLen: new RegExp(/^([0-3])(\??)$/),
};

/**
 * For `compact` mode this must be a string. Otherwise this can be a string or
 * an array of one or two strings. If it is an array, the first string is used
 * for singular values (_e.g. 1 day_) and the second string is used for plural
 * values (_e.g. 2 days_).
 *
 * An example value is `[ 'hour', 'hours' ]`.
 */
export type FormatMsUnit = string | string[] | false;
export type FormatMsLength = '0' | '1' | '2' | '3' | '0?' | '1?' | '2?' | '3?';
export function isFormatMsUnit(val: any): val is FormatMsUnit {
  if (isString(val) || val === false) {
    return true;
  }
  if (isArray(val) && isString(val[0]) && (val.length === 1 || isString(val[1]))) {
    return true;
  }
  return false;
}
export function isFormatMsLength(val: any): val is FormatMsLength {
  return isIntegerInRange(val, 0, 3) || REG.formatMsLen.test(val);
}

/**
 * Defines the output format for the duration string.
 */
export type FormatMsOptions = {
  /**
   * Controls whether a compact or  long output format is used. With the compact
   * format there are no spaces, and numbers padded to a standard width (_e.g._
   * for minutes '2' becomes '02'). With the long format there are spaces and
   * numbers are not padded. The long format is suitable for when the output is
   * going to be read with text to speech, while the compact format is more
   * suited to display.
   */
  compact?: boolean;
  /**
   * The unit string to append to days.
   */
  d?: FormatMsUnit;
  /**
   * The unit string to append for hours.
   */
  h?: FormatMsUnit;
  /**
   * The unit string to append for minutes.
   */
  m?: FormatMsUnit;
  /**
   * The unit string to append for seconds.
   */
  s?: FormatMsUnit | false; // set to a non string (false, null) to supress output, where compact is false
  /**
   * For compact mode:
   *
   * Indicates the number of digits of milliseconds to display. Can be a
   * boolean, number 0-3 or '0?' to '3?', where the '?' results in truncation of
   * any trailing zeros. The values `true` and `3?` are the same as `3`, `false`
   * is the same as `0`. '0?' truncates any zeros in milliseconds. '1?'
   * truncates any zeros past the first digit of milliseconds, '2?' truncates
   * any zeros past the second digit of milliseconds.
   *
   * For non-compact mode:
   *
   * The value can only be a boolean `false` or a string and the string is
   * appended to the output (e.g. 'milliseconds')
   */
  ms?: boolean | 0 | 1 | 2 | 3 | FormatMsUnit | '0?' | '1?' | '2?';
  /**
   * The character to use for a decimal place. Defaults to `.`.
   */
  decimal?: string | false;
  /**
   * A separator to use when `compact` is false.
   */
  sep?: string;
};
const OPT_KEYS = ['d', 'h', 'm', 's', 'ms', 'compact', 'sep', 'decimal'];

export function isFormatMsOptions(val: any): val is FormatMsOptions {
  if (
    isDict(val) &&
    (!isDefined(val.d) || isFormatMsUnit(val.d)) &&
    (!isDefined(val.h) || isFormatMsUnit(val.h)) &&
    (!isDefined(val.m) || isFormatMsUnit(val.m)) &&
    (!isDefined(val.s) || isFormatMsUnit(val.s)) &&
    (!isDefined(val.ms) || isFormatMsUnit(val.ms) || isBoolean(val.ms) || isFormatMsLength(val.ms))
  ) {
    return true;
  }
  return false;
}

/**
 * Construct a new `DurationUtil` instance. If `formatting` is not a
 * `FormatMsName` then will initialize formatting with default `:` format.
 * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
 * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
 * @see options
 */
export function durationUtil(ms: Milliseconds, opts?: FormatMsOptions | FormatMsName) {
  return new DurationUtil(ms, opts);
}

/**
 * Predefined output formats.
 *
 *  - `long` output format is `1 hour, 14 minutes, 3 seconds, 454 milliseconds`
 *  - `hms` output format is `1h14m03.454s`
 *  - `:` output format is `1:14:03.454`
 */
export type FormatMsName = 'hms' | ':' | 'long';
export function isFormatMsName(val: any): val is FormatMsName {
  return REG.formatName.test(val);
}

export class DurationUtil {
  protected static OPTS: Record<string, FormatMsOptions> = {
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
  protected _opts: FormatMsOptions = {};

  protected _ms: Milliseconds = 0;

  /**
   * Construct a new `DurationUtil` instance. If `formatting` is not a
   * `FormatMsName` then will initialize formatting with default `:` format.
   * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
   * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
   * @see options
   */
  constructor(ms: Milliseconds, formatting?: FormatMsOptions | FormatMsName) {
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
  public options(formatting?: FormatMsOptions | FormatMsName): DurationUtil {
    if (isFormatMsName(formatting)) {
      this._opts = deepCopy(DurationUtil.OPTS[formatting]) as FormatMsOptions;
    } else if (isFormatMsOptions(formatting)) {
      OPT_KEYS.forEach((key) => {
        if (key in formatting) {
          // @ts-ignore too lazy to fix the casting
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
  public format(formatting?: FormatMsOptions | FormatMsName): string {
    this.options(formatting);
    let ms = this._ms;
    if (ms < 0) {
      ms = -ms;
    }
    const opts = this._opts;
    if (opts.h === false) {
      opts.m = false;
      opts.s = false;
      opts.ms = false;
      // ms = Math.round(ms / (24 * 3600000)) * 24 * 3600000;
    } else if (opts.m === false) {
      opts.s = false;
      opts.ms = false;
      // ms = Math.round(ms / 3600000) * 3600000;
    } else if (opts.s === false) {
      opts.ms = false;
      // ms = Math.round(ms / 60000) * 60000;
    }
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

      // Format from decimal to end
      let msPadded = pad(time.ms, 3);
      let msLen = 3;
      if (msPadded.charAt(2) === '0') {
        msLen = 2;
        if (msPadded.charAt(1) === '0') {
          msLen = 1;
          if (msPadded.charAt(0) === '0') {
            msLen = 0;
          }
        }
      }
      let num = 3;
      let trunc = false;
      if (opts.ms === false) {
        num = 0;
      } else if (isIntegerInRange(opts.ms, 0, 3)) {
        num = opts.ms;
      } else if (isNonEmptyString(opts.ms)) {
        const m = opts.ms.match(REG.formatMsLen);
        if (m && m.length > 1) {
          num = asInt(m[1]);
          if (m.length > 2 && m[2] === '?') {
            trunc = true;
          }
        }
      }
      if (trunc) {
        const n = Math.max(num, msLen);
        if (n > 0) {
          res = opts.decimal + msPadded.slice(0, n) + opts.s;
        } else {
          res = opts.s;
        }
        // if (num === 3 && msLen <= 3) {
        //   res = opts.decimal + msPadded + opts.s;
        // } else if (num === 2 && msLen <= 2) {
        //   res = opts.decimal + msPadded.slice(0, 2) + opts.s;
        // } else if (num === 1 && msLen <= 1) {
        //   res = opts.decimal + msPadded.slice(0, 1) + opts.s;
        // } else if (num === 0 && msLen === 0) {
        //   res = opts.s;
        // } else {
        //   res = opts.decimal + msPadded + opts.s;
        // }
      } else if (num === 3) {
        res = opts.decimal + msPadded + opts.s;
      } else if (num === 0) {
        res = opts.s;
      } else {
        ms = Math.round(ms / 10 ** (3 - asInt(num)));
        res = opts.decimal + pad(ms, 3).slice(-num) + opts.s;
      }

      // Format before the decimal
      if (time.d) {
        let s = String(time.d) + opts.d;
        if (opts.h !== false) {
          s += pad(time.h, 2) + opts.h;
        }
        if (opts.m !== false) {
          s += pad(time.m, 2) + opts.m;
        }
        if (opts.s !== false) {
          s += pad(Math.floor(time.s), 2) + res;
        }
        return s;
      } else if (time.h) {
        let s = String(time.h) + opts.h;
        if (opts.m !== false) {
          s += pad(time.m, 2) + opts.m;
        }
        if (opts.s !== false) {
          s += pad(Math.floor(time.s), 2) + res;
        }
        return s;
      } else if (time.m || !isNonEmptyString(opts.s)) {
        let s = String(time.m) + opts.m;
        if (opts.s !== false) {
          s += pad(Math.floor(time.s), 2) + res;
        }
        return s;
      }
      return String(time.s) + res;
    } else {
      return Object.entries(time)
        .filter((val) => val[1] !== 0)
        .map(([key, val]) => {
          // @ts-ignore xxx
          let units = opts[key];
          if (isArray(units)) {
            if (val !== 1 && units.length > 1) {
              units = units[1];
            } else {
              units = units[0];
            }
          }
          if (isString(units)) {
            return `${val} ${units}`;
          }
        })
        .filter((val) => isNonEmptyString(val))
        .join(opts.sep);
    }
  }
}
