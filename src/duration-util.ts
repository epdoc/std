import { isDict, pad } from 'epdoc-util';

export type Milliseconds = number;

export type FormatMsOptions = {
  d: string;
  h: string;
  m: string;
  s: string;
  ms: string;
  precision?: number;
};

export function isFormatMsOptions(val: any): val is FormatMsOptions {
  if (isDict(val)) {
    return true;
  }
  return false;
}

export class DurationUtil {
  private _opts: Record<string, FormatMsOptions> = {
    short: { d: 'd', h: 'h', m: 'm', s: 's', ms: '' },
    colon: { d: 'd', h: ':', m: ':', s: ':', ms: '' },
    long: { d: 'day', h: 'hour', m: 'minute', s: 'second', ms: 'millisecond' },
  };
  private _long: boolean = false;
  private _decimal: string = '.';
  private _showMs: boolean = true;
  private _ms: Milliseconds = 0;

  constructor(ms: Milliseconds, opts?: FormatMsOptions) {
    this._ms = ms;
    if (isFormatMsOptions(opts)) {
      this._opts.short = opts;
    }
  }

  options(opts: FormatMsOptions): DurationUtil {
    this._opts.short = opts;
    return this;
  }

  /**
   * Set the number for ms precision. To show all ms digits, set to 3. To show
   * no ms digits, set to 0.
   * @param precision
   * @returns
   */
  precision(precision: number): DurationUtil {
    this._opts.short.precision = precision;
    return this;
  }

  long(): string {
    this._long = true;
    return this.format();
  }

  short(): string {
    this._long = false;
    return this.format();
  }

  noms(): DurationUtil {
    this._showMs = false;
    return this;
  }

  /**
   * Set the character to use for decimal points. Default to '.'. Example use is
   * to set to a comma for certain latin countries.
   * @param decimal
   * @returns
   */
  decimal(decimal: string = '.'): DurationUtil {
    this._decimal = decimal;
    return this;
  }

  /**
   * Set hms separators to the same string `val`. Defaults to colon.
   * @returns this
   */
  sep(val: string = ':'): string {
    this._opts.short.h = val;
    this._opts.short.m = val;
    this._opts.short.s = '';
    this._long = false;
    return this.format();
  }

  format(): string {
    let ms = this._ms;
    if (ms < 0) {
      ms = -ms;
    }
    if (!this._showMs) {
      ms = Math.round(ms / 1000) * 1000;
    }
    const time = {
      d: Math.floor(ms / 86400000),
      h: Math.floor(ms / 3600000) % 24,
      m: Math.floor(ms / 60000) % 60,
      s: Math.floor(ms / 1000) % 60,
      ms: Math.floor(ms) % 1000,
    };

    if (this._long) {
      const opts = this._opts.long;
      return Object.entries(time)
        .filter((val) => val[1] !== 0)
        .map(([key, val]) => {
          return `${val} ${opts[key]}${val !== 1 ? 's' : ''}`;
        })
        .join(', ');
    } else {
      const opts = this._opts.short;
      let res = opts.s;
      if (this._showMs) {
        res = this._decimal + pad(time.ms, 3) + opts.s;
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
      } else if (time.m) {
        return time.m + opts.m + pad(Math.floor(time.s), 2) + res;
      }
      return time.s + res;
    }
  }
}
