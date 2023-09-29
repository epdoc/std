import { deepCopy, isDict, isNonEmptyString, isString, pad } from 'epdoc-util';

export type Milliseconds = number;

export type FormatMsOptions = {
  d: string;
  h: string;
  m: string; // set to a non string (false, null) to supress output, where compact is false
  s: string | false; // set to a non string (false, null) to supress output, where compact is false
  ms: string | false; // set to a non string (false, null) to supress output, where compact is false
  decimal?: string | false;
  compact: boolean;
  sep?: string;
};

export function isFormatMsOptions(val: any): val is FormatMsOptions {
  if (
    isDict(val) &&
    isString(val.d) &&
    isString(val.h) &&
    isString(val.m) &&
    isString(val.s) &&
    isString(val.ms)
  ) {
    return true;
  }
  return false;
}

export function durationUtil(ms: Milliseconds, opts?: FormatMsOptions | FormatName) {
  return new DurationUtil(ms, opts);
}

export type FormatName = 'hms' | ':' | 'long';
export function isFormatName(val: any): val is FormatName {
  if (isNonEmptyString(val)) {
    if (val === 'hms' || val === ':' || val === 'long') {
      return true;
    }
  }
  return false;
}

export class DurationUtil {
  private static OPTS: Record<string, FormatMsOptions> = {
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
  private _opts: FormatMsOptions = DurationUtil.OPTS[':'];
  // private _showMs: boolean;
  private _decimal: string;

  private _ms: Milliseconds = 0;

  /**
   *
   * @param ms The duration we are outputing
   * @param opts
   */
  constructor(ms: Milliseconds, formatting?: FormatMsOptions | FormatName) {
    this._ms = ms;
    if (isFormatName(formatting)) {
      this.options(formatting);
    } else {
      this.options(':').options(formatting);
    }
  }

  /**
   * Define a custom format by overwriting the default format.
   * @param opts The name of one of the preset formatting options, or a
   * Dictionary with entries from a FormatMsOptions object, which are then used
   * to override the individual default values.
   * @returns this
   */
  public options(formatting: FormatMsOptions | FormatName): DurationUtil {
    if (isFormatName(formatting)) {
      this._opts = deepCopy(DurationUtil.OPTS[formatting]);
    } else if (isDict(formatting)) {
      Object.keys(DurationUtil.OPTS.long).forEach((key) => {
        if (formatting.hasOwnProperty(key)) {
          this._opts[key] = formatting[key];
        }
      });
    }
    return this;
  }

  public format(formatting?: FormatMsOptions | FormatName): string {
    this.options(formatting);
    let ms = this._ms;
    if (ms < 0) {
      ms = -ms;
    }
    const opts = this._opts;
    if (!isString(opts.ms)) {
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
      if (isString(opts.ms)) {
        res = opts.decimal + pad(time.ms, 3) + opts.s;
      }
      if (time.d) {
        return (
          time.d +
          opts.d +
          pad(time.h, 2) +
          opts.h +
          pad(time.m, 2) +
          opts.m +
          pad(Math.floor(time.s), 2) +
          res
        );
      } else if (time.h) {
        return time.h + opts.h + pad(time.m, 2) + opts.m + pad(Math.floor(time.s), 2) + res;
      } else if (time.m || !isNonEmptyString(opts.s)) {
        return time.m + opts.m + pad(Math.floor(time.s), 2) + res;
      }
      return  String(time.s) + res;
    } else {
      return Object.entries(time)
        .filter((val) => val[1] !== 0)
        .map(([key, val]) => {
          if (isString(opts[key])) {
            return `${val} ${opts[key]}${val !== 1 ? 's' : ''}`;
          }
        })
        .filter((val) => isNonEmptyString(val))
        .join(opts.sep);
    }
  }
}
