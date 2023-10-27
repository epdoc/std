import { isValidDate, pad } from 'epdoc-util';

export type Minutes = number;
export type JulianDate = number;
export type GoogleSheetsDate = number;

export function dateUtil(date?: Date | string | number) {
  return new DateUtil(date);
}

export class DateUtil {
  private _date: Date;
  private _invalidDateString = 'Invalid Date';

  /**
   * Create a DateUtil object.
   * @param date Optional Date object, or a string or number that can be used
   * with the Date constructor method.
   */
  constructor(date?: Date | string | number) {
    this._date = date ? new Date(date) : new Date();
  }

  /**
   * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
   * `Date.toISOString` which always uses UTC in the output.
   * @param showMs Set to false to not show (truncate) milliseconds
   * @returns
   */
  public toISOLocaleString(showMs: boolean = true): string {
    this.validate();
    const d = this._date;
    let s =
      String(d.getFullYear()) +
      '-' +
      pad(d.getMonth() + 1, 2) +
      '-' +
      pad(d.getDate(), 2) +
      'T' +
      pad(d.getHours(), 2) +
      ':' +
      pad(d.getMinutes(), 2) +
      ':' +
      pad(d.getSeconds(), 2);
    if (showMs !== false) {
      s += '.' + pad(d.getMilliseconds(), 3);
    }
    s += DateUtil.tz(d.getTimezoneOffset());
    return s;
  }

  /**
   * Validate whether the date is a valid Date object.
   */
  private validate() {
    if (!isValidDate(this._date)) {
      throw new Error(this._invalidDateString);
    }
  }

  /**
   * Get the Julian Date.
   * @returns A number which is the Julian Date
   */
  public julianDate(): JulianDate {
    this.validate();
    return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
  }

  public static tz(m: Minutes) {
    return (m < 0 ? '+' : '-') + pad(Math.abs(m) / 60, 2) + ':' + pad(Math.abs(m) % 60, 2);
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
}
