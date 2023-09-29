import { isValidDate, pad, isString } from 'epdoc-util';

export type Minutes = number;
export type Seconds = number;
export type JulianDate = number;

export class DateUtil {
  private _date: Date;
  private _invalidDateString = 'Invalid Date';

  constructor(date: Date) {
    this._date = date;
  }

  set invalidDateString(val: string) {
    if (isString(val)) {
      this._invalidDateString = val;
    }
  }

  toISOLocaleString(bNoMs: boolean = false): string {
    const d = this._date;
    if (isValidDate(d)) {
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
      if (bNoMs !== true) {
        s += '.' + pad(d.getMilliseconds(), 3);
      }
      s += DateUtil.tz(d.getTimezoneOffset());
      return s;
    }
    throw new Error(this._invalidDateString);
  }

  julianDate(): JulianDate {
    if (isValidDate(this._date)) {
      return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
    }
    throw new Error(this._invalidDateString);
  }

  private static tz(m: Minutes) {
    return (m < 0 ? '+' : '-') + pad(Math.abs(m) / 60, 2) + ':' + pad(Math.abs(m) % 60, 2);
  }
}
