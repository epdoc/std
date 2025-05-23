import { asInt, type Integer, isInteger, isNumber, isValidDate, pad } from './dep.ts';

export type Minutes = Integer;

const REG = {
  pdfDate: new RegExp(/^D:(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(.*)$/),
  pdfTz: new RegExp(/^Z|((\+|\-)(\d\d)(\d\d)?)$/),
  isoTz: new RegExp(/^(Z|((\+|\-)(\d\d):(\d\d)))*$/),
};
const INVALID_DATE_STRING = 'Invalid Date';

export type ISOTZ = string;
export type PDFTZ = string;
/**
 * An integer value representing the Julian Day.
 * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
 */
export type JulianDay = Integer;
/**
 * A floating point number representing date and time, suitable for use in Google Sheets.
 */
export type GoogleSheetsDate = number;

/**
 * Calls and returns `new DateUtil(date)`.
 * @param date
 * @returns
 */
export function dateEx(...args: unknown[]): DateEx {
  return new DateEx(args);
}

/**
 * A wrapper for a javascript `Date` object.
 */
export class DateEx {
  protected _date: Date;
  protected _tz: Minutes | undefined;

  /**
   * Create a DateUtil object, which is a wrapper for a javascript `Date` object.
   * @param date Optional Date object, or a string or number that can be used
   * with the Date constructor method. If undefined then uses the value of `new Date()`.
   */
  constructor(...args: unknown[]) {
    // Examine args because the Date constructor drops ms if you construct with Date(args)
    if (!args.length) {
      this._date = new Date();
    } else if (args.length === 1) {
      if (!Array.isArray(args[0])) {
        this._date = new Date(args[0] as string | number | Date);
      } else {
        this._date = new Date(...(args[0] as []));
      }
    } else {
      this._date = new Date(...(args as []));
    }
  }

  /**
   * Set the timezone to use when outputting as a string, eg. with
   * toISOLocaleString(). A positive value of 360 is equivalent to '-06:00'.
   * @param val Minutes or a string of the form '-06:00' or '+06:00'.
   */
  tz(val: Minutes | ISOTZ): this {
    this._tz = isInteger(val) ? val : DateEx.tzParse(val);
    return this;
  }

  getTz(): Minutes | undefined {
    return this._tz;
  }

  get date(): Date {
    return this._date;
  }

  /**
   * When using a Date constructor that does not allow the tz to be specified,
   * and the date was, for example, created using localtime, call tz() with the
   * offset, and then adjustForTz() to adjust the Date object.
   *
   * @example
   * ```ts
   * import { dateEx } from '@epdoc/datetime';
   *
   * const d = new Date(2024,1,1,11,59,59);
   * const d2 = dateEx(d).withTz(360).date;
   * assertStrictEquals(d2.toISOString(), '2024-01-01T11:59:59.000Z');
   * ```
   * Note that val '-06:00' `ISOTZ` equals 360 `Minutes`, and '+06:00' equals -360.
   });
   * @param val If not specified, then use local timezone.
   */
  withTz(val?: Minutes | ISOTZ): this {
    let offset: Minutes = 0;
    if (isInteger(val)) {
      offset = val - this._date.getTimezoneOffset();
    } else if (DateEx.isIsoTz(val)) {
      offset = (DateEx.tzParse(val) as Minutes) - this._date.getTimezoneOffset();
    } else {
      offset = 0;
    }
    this._date = new Date(this._date.getTime() + offset * 60000);
    return this;
  }

  /**
   * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
   * `Date.toISOString` which always uses UTC in the output. The timezone used
   * is set by the tz() method or defaults to the local timezone of the machine.
   * @param showMs Set to false to hide (truncate) milliseconds
   * @returns
   */
  public toISOLocalString(showMs: boolean = true): string {
    this.validate();
    const tzOffset: Minutes = isInteger(this._tz) ? this._tz : this._date.getTimezoneOffset();
    const d: Date = new Date(this._date.getTime() - tzOffset * 60000);
    let s = String(d.getUTCFullYear()) +
      '-' +
      pad(d.getUTCMonth() + 1, 2) +
      '-' +
      pad(d.getUTCDate(), 2) +
      'T' +
      pad(d.getUTCHours(), 2) +
      ':' +
      pad(d.getUTCMinutes(), 2) +
      ':' +
      pad(d.getUTCSeconds(), 2);
    if (showMs !== false) {
      s += '.' + pad(d.getMilliseconds(), 3);
    }
    s += DateEx.tzFormat(tzOffset);
    return s;
  }

  /**
   * Validate whether the date is a valid Date object.
   */
  private validate() {
    if (!isValidDate(this._date)) {
      throw new Error(INVALID_DATE_STRING);
    }
  }

  /**
   * Format the date using the supplied format string. Will use the local
   * timezone when outputing the time. Call tz() to override this value.
   * Format strings are yyyy, MM, dd, HH, mm, ss and SSS.
   * @param format
   * @returns
   */
  format(format: string): string {
    const tzOffset: Minutes = isNumber(this._tz) ? this._tz : this._date.getTimezoneOffset();
    const d: Date = new Date(this._date.getTime() - tzOffset * 60000);
    return DateEx.formatInternal(d, format);
  }

  formatUTC(format: string): string {
    return DateEx.formatInternal(this._date, format);
  }

  private static formatInternal(d: Date, format: string): string {
    let f = String(format);
    f = f
      .replace('yyyy', String(d.getUTCFullYear()))
      .replace('MM', pad(d.getUTCMonth() + 1, 2))
      .replace('dd', pad(d.getUTCDate(), 2))
      .replace('HH', pad(d.getUTCHours(), 2))
      .replace('mm', pad(d.getUTCMinutes(), 2))
      .replace('ss', pad(d.getUTCSeconds(), 2))
      .replace('SSS', pad(d.getUTCMilliseconds(), 3));
    return f;
  }

  /**
   * Get the Julian Day.
   * @returns A number which is the Julian Day
   * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
   */
  public julianDate(): JulianDay {
    this.validate();
    return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
  }

  static isIsoTz(val: unknown): val is ISOTZ {
    return typeof val === 'string' && REG.isoTz.test(val);
  }

  /**
   * @param m
   * @returns
   * @deprecated Use tzFormat method instead
   */
  public static tz(m: Minutes): string {
    return DateEx.tzFormat(m);
  }

  /**
   * Format a timezone offset as a string
   * @param m Minutes
   * @returns string of the form '-06:00'
   */
  public static tzFormat(m: Minutes): string {
    if (m === 0) {
      return 'Z';
    }
    return (m < 0 ? '+' : '-') + pad(Math.floor(Math.abs(m) / 60), 2) + ':' + pad(Math.abs(m) % 60, 2);
  }

  /**
   * Parse a timezone offset in the form '-06:00' and return 360.
   * @param val
   * @returns Minutes of timezone offset
   */
  public static tzParse(val: ISOTZ): Minutes | undefined {
    const p = typeof val === 'string' ? val.match(REG.isoTz) : false;
    if (p && p.length > 1) {
      if (p[1] === 'Z') {
        return 0;
      } else if (p.length > 4) {
        const pol = p[3] === '-' ? 1 : -1;
        const result = asInt(p[4]) * 60 + asInt(p[5]);
        return result ? pol * result : result;
      }
    }
  }

  /**
   * Parse a timezone offset in the form '-06:00' and return 360.
   * @param val
   * @returns Minutes of timezone offset
   */
  public static pdfTzParse(val: PDFTZ): Minutes | undefined {
    const p = typeof val === 'string' ? val.match(REG.isoTz) : false;
    if (p && p.length > 1) {
      if (p[1] === 'Z') {
        return 0;
      } else if (p.length > 3) {
        const pol = p[2] === '-' ? 1 : -1;
        let val = asInt(p[3]) * 60;
        if (p.length > 3) {
          val += asInt(p[4]);
        }
        return val ? pol * val : val;
      }
    }
  }

  /**
   * Get the date in a Google Sheets value
   * @returns A number which is the date with a value suitable for use in Google
   * Sheets
   */
  public googleSheetsDate(): GoogleSheetsDate {
    this.validate();
    const d = this._date;
    const tNull = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)); // the starting value for Google
    return ((d.getTime() - tNull.getTime()) / 60000 - d.getTimezoneOffset()) / 1440;
  }

  static fromPdfDate(s: string): DateEx | undefined {
    const p = s.match(REG.pdfDate);
    if (p) {
      const tzOffset: Minutes | undefined = DateEx.pdfTzParse(p[7]);
      return new DateEx(
        asInt(p[1]),
        asInt(p[2]) - 1,
        asInt(p[3]),
        asInt(p[4]),
        asInt(p[5]),
        asInt(p[6]),
      ).withTz(tzOffset);
    }
  }
}
