import { isValidDate, pad, isString, isDate } from 'epdoc-util';

export type Minutes = number;
export type JulianDate = number;

export function dateUtil(date?: Date) {
  return new DateUtil(date);
}

export class DateUtil {
  private _date: Date;
  private _invalidDateString =   'Invalid Date';
  
  constructor(date?: Date) {
    this._date = isDate(date) ? new Date(date) : new Date();
  }

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

  private validate() {
    if (!isValidDate(this._date)) {
      throw new Error(this._invalidDateString);
    }
  }

  public julianDate(): JulianDate {
    this.validate();
    return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
  }

  private static tz(m: Minutes) {
    return (m < 0 ? '+' : '-') + pad(Math.abs(m) / 60, 2) + ':' + pad(Math.abs(m) % 60, 2);
  }

  /**
   * Convert a javascript Date object to a date value used by Google Sheets.
   * @param {*} jsDate A value that is passed to a Date constructor
   * @returns
   */
  public googleSheetsDate() {
    this.validate();
    const d = this._date;
    const tNull = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)); // the starting value for Google
    return ((d.getTime() - tNull.getTime()) / 60000 - d.getTimezoneOffset()) / 1440;
  }
}
