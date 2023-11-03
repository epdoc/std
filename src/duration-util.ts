import {
  Integer,
  deepCopy,
  isArray,
  isBoolean,
  isDefined,
  isDict,
  isInteger,
  isNonEmptyString,
  isString,
  pad,
} from 'epdoc-util';

const REG = {
  formatName: new RegExp(/^(long|hms|:)$/),
};

export type Milliseconds = Integer;
/**
 * For `compact` mode this must be a string. Otherwise this can be a string or
 * an array of one or two strings. If it is an array, the first string is used
 * for singular values (_e.g. 1 day_) and the second string is used for plural
 * values (_e.g. 2 days_).
 *
 * An example value is `[ 'hour', 'hours' ]`.
 */
export type FormatMsUnit = string | string[] | false;
export function isFormatMsUnit(val: any): val is FormatMsUnit {
  if (isString(val) || val === false) {
    return true;
  }
  if (isArray(val) && isString(val[0]) && (val.length === 1 || isString(val[1]))) {
    return true;
  }
  return false;
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
   * The value `true` is the same as `3`, `false` is the same as `0`. Indicates
   * the number of digits of milliseconds to display. For non-compact mode, this
   * can only be a boolean `false` or a string and the string is appended to the
   * output.
   */
  ms?: boolean | 0 | 1 | 2 | 3 | FormatMsUnit;
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
    (!isDefined(val.ms) || isFormatMsUnit(val.ms) || isBoolean(val.ms) || isInteger(val.ms))
  ) {
    return true;
  }
  return false;
}

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
  private static OPTS: Record<string, FormatMsOptions> = {
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
  private _opts: FormatMsOptions = {};
  // private _showMs: boolean;

  private _ms: Milliseconds = 0;

  /**
   * Construct a new `DurationUtil` instance. If `formatting` is not a
   * `FormatMsName` then will initialize formatting with default `:` format.
   * @param ms The duration we are outputing. We use the absolute value.
   * @param formatting Defines the format.
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
      this._opts = deepCopy(DurationUtil.OPTS[formatting]);
    } else if (isFormatMsOptions(formatting)) {
      OPT_KEYS.forEach((key) => {
        if (formatting.hasOwnProperty(key)) {
          // @ts-ignore
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
      if (opts.ms === true || opts.ms === 3 || isString(opts.ms)) {
        res = opts.decimal + pad(time.ms, 3) + opts.s;
      } else if (opts.ms === false || opts.ms === 0) {
        res = opts.s;
      } else if (isInteger(opts.ms) && [1, 2, 3].includes(opts.ms)) {
        ms = Math.round(ms / 10 ** (3 - opts.ms));
        res = opts.decimal + pad(ms, 3).slice(-opts.ms) + opts.s;
      }
      if (time.d) {
        return (
          String(time.d) +
          opts.d +
          pad(time.h, 2) +
          opts.h +
          pad(time.m, 2) +
          opts.m +
          pad(Math.floor(time.s), 2) +
          res
        );
      } else if (time.h) {
        return String(time.h) + opts.h + pad(time.m, 2) + opts.m + pad(Math.floor(time.s), 2) + res;
      } else if (time.m || !isNonEmptyString(opts.s)) {
        return String(time.m) + opts.m + pad(Math.floor(time.s), 2) + res;
      }
      return String(time.s) + res;
    } else {
      return Object.entries(time)
        .filter((val) => val[1] !== 0)
        .map(([key, val]) => {
          // @ts-ignore
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
