import { isDict, pad, roundNumber } from "epdoc-util";

export type Milliseconds = number;

export type FormatMsOptions = {
  h?: string;
  m?: string;
  s?: string;
  decimal?: string;
  precision?: number;
};

export function isFormatMsOptions(val: any): val is FormatMsOptions {
  if (isDict(val)) {
    return true;
  }
  return false;
}

export class DurationUtil {
  private _opts: FormatMsOptions = { h: 'h', m: 'm', s: 's', decimal: '.', precision: 3 };
  private _ms: Milliseconds = 0;

  constructor(ms: Milliseconds, opts?: FormatMsOptions) {
    this._ms = ms;
    if (isFormatMsOptions(opts)) {
      this._opts = opts;
    }
  }

  options(opts: FormatMsOptions): DurationUtil {
    this._opts = opts;
    return this;
  }

  /**
   * Set the number for ms precision. To show all ms digits, set to 3. To show
   * no ms digits, set to 0.
   * @param precision
   * @returns 
   */
  precision(precision:number): DurationUtil {
    this._opts.precision = precision;
    return this;
  }

  /**
   * Set the character to use for decimal points. Default to '.'. Example use is
   * to set to a comma for certain latin countries.
   * @param decimal
   * @returns 
   */
  decimal(decimal:string='.'): DurationUtil {
    this._opts.decimal = decimal;
    return this;
  }

  /**
   * Set hms separators to the same string `val`. Defaults to colon.
   * @returns this
   */
  sep(val:string=':'): DurationUtil {
    this._opts.h = val;
    this._opts.m = val;
    this._opts.s = val;
    return this;
  }

  /**
   * Formats a duration into a string of the form 3:03:22.333 or 3.123, with as few leading numbers
   * as is necessary to display the time.
   * @returns string
   */
  toString(): string {
    const opts = this._opts;
    let neg = '';
    let ms = this._ms;
    if (ms < 0) {
      ms = 0 - ms;
      neg = '-';
    }
    // const milliseconds = ms % 1000;
    const seconds = roundNumber(ms / 1000, opts.precision) % 60;
    const minutes = Math.floor(ms / (60 * 1000)) % 60;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    let res = '';
    if( opts.precision ) {
      res = opts.decimal + pad(roundNumber((1000*seconds)%1000,opts.precision),opts.precision) + opts.s
    }
    if (hours) {
      return neg + hours + opts.h + pad(minutes, 2) + opts.m + pad(Math.floor(seconds), 2) + res;
    } else if (minutes) {
      return neg + minutes + opts.m + pad(Math.floor(seconds), 2) + res;
    }
    return neg + seconds + res;
  }
}