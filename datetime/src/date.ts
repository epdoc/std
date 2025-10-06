import { _ } from '@epdoc/type';
import type { GMTTZ, GoogleSheetsDate, IANATZ, ISOTZ, ISOTzDate, JulianDay, TzMinutes } from './types.ts';
import * as util from './utils.ts';

const INVALID_DATE_STRING = 'Invalid Date';
// const GOOGLE_TO_UNIX_EPOCH_DAYS = 25568; // Sheets treats 1900 as a leap year, so we subtract 1.
const MS_PER_MIN = 60000;
const MIN_PER_DAY = 1440;
const MS_PER_DAY = 86400000;
const tNullMs = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)).getTime(); // the starting value for Google

/**
 * Calls and returns `new DateUtil(date)`.
 * @param date
 * @returns
 */
export function dateEx(...args: unknown[]): DateEx {
  return new DateEx(...args);
}

function isMinutes(val: unknown): val is TzMinutes {
  return _.isInteger(val);
}

/**
 * A wrapper for the native Javascript `Date` object that provides enhanced
 * functionality for timezone handling, formatting, and compatibility with
 * other systems like Google Sheets.
 *
 * `DateEx` objects are designed to be immutable in terms of their date/time
 * value. Methods that would change the date/time, such as `withTz`,
 * return a new `DateEx` instance.
 */
export class DateEx {
  protected _date: Date;
  protected _tz: TzMinutes | undefined;

  /**
   * Creates a new DateEx object.
   *
   * The constructor can be called in several ways:
   * - With no arguments: creates a `DateEx` for the current date and time.
   * - With a single argument: can be a `Date` object, a timestamp number, or an
   *   ISO 8601 string. If the string contains a timezone, it will be parsed
   *   and set as the timezone of the object.
   * - With multiple arguments: passed directly to the `Date` constructor (e.g.,
   *   `new DateEx(2024, 0, 1)`).
   *
   * @param args Arguments to pass to the `Date` constructor.
   */
  constructor(...args: unknown[]) {
    // Examine args because the Date constructor drops ms if you construct with Date(args)
    if (!args.length) {
      this._date = new Date();
    } else if (args.length === 1) {
      const arg = args[0];
      if (arg instanceof DateEx) {
        this._date = new Date(arg._date.getTime());
        this._tz = arg._tz;
      } else {
        this._date = new Date(arg as string | number | Date);
        if (util.isISOTZ(arg)) {
          this.tz(arg as ISOTZ);
        }
      }
    } else {
      this._date = new Date(...(args as []));
    }
  }

  clone(): DateEx {
    return new DateEx(this);
  }

  /**
   * Set the timezone to use when outputting as a string, eg. with
   * toISOLocaleString(). A positive value of 360 is equivalent to '-06:00'.
   *
   * If using an IANA timezone string (e.g., "America/New_York"), this method
   * should be called again if the underlying date of the object is changed,
   * as the offset may need to be recalculated to account for Daylight Saving
   * Time. ISOTZ strings already contain the offset and do not need to be
   * recalculated.
   *
   * @param val Minutes, an ISOTZ string, or an IANATZ string.
   */
  tz(val: TzMinutes | ISOTZ | IANATZ): this {
    if (isMinutes(val)) {
      this._tz = val;
    } else if (util.isIANATZ(val)) {
      this._tz = this.ianaTzParse(val as IANATZ);
    } else if (util.isISOTZ(val)) {
      this._tz = util.parseISOTZ(val as ISOTZ);
    }
    return this;
  }

  /**
   * Returns the timezone offset in minutes.
   */
  getTz(): TzMinutes | undefined {
    return this._tz;
  }

  /**
   * Returns the underlying Javascript `Date` object.
   */
  get date(): Date {
    return this._date;
  }

  /**
   * Returns a new `DateEx` object with the date adjusted to a specific
   * timezone. This is useful when a `Date` object is created in a local
   * timezone but needs to be treated as if it were in a different timezone.
   *
   * @example
   * ```ts
   * import { dateEx } from '@epdoc/datetime';
   *
   * // Create a date that is implicitly in the local timezone.
   * const d = new Date(2024, 0, 1, 11, 59, 59);
   * // Treat the date as if it were in a -06:00 timezone.
   * const d2 = dateEx(d).withTz(360).date;
   * assertStrictEquals(d2.toISOString(), '2024-01-01T17:59:59.000Z');
   * ```
   * Note that val '-06:00' `ISOTZ` equals 360 `Minutes`, and '+06:00' equals -360.
   * @param val The timezone offset in minutes or an ISOTZ string. If not
   * specified, the local timezone is used.
   * @returns A new `DateEx` object with the adjusted date.
   */
  withTz(val?: TzMinutes | ISOTZ): DateEx {
    const result = this.clone();
    let offset: TzMinutes = 0 as TzMinutes;
    if (isMinutes(val)) {
      offset = (val - this._date.getTimezoneOffset()) as TzMinutes;
    } else if (util.isISOTZ(val)) {
      offset = (util.parseISOTZ(val) as TzMinutes) - (this._date.getTimezoneOffset() as TzMinutes) as TzMinutes;
    } else {
      offset = 0 as TzMinutes;
    }
    result._date = new Date(this._date.getTime() + offset * 60000);
    return result;
  }

  /**
   * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
   * `Date.toISOString` which always uses UTC in the output. The timezone used
   * is set by the tz() method or defaults to the local timezone of the machine.
   * @param showMs Set to false to hide (truncate) milliseconds
   * @returns
   */
  public toISOLocalString(showMs: boolean = true): ISOTzDate {
    this.validate();
    const tzOffset: TzMinutes = _.isInteger(this._tz)
      ? this._tz as TzMinutes
      : this._date.getTimezoneOffset() as TzMinutes;
    const d: Date = new Date(this._date.getTime() - tzOffset * 60000);
    let s = String(d.getUTCFullYear()) +
      '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getUTCDate()).padStart(2, '0') +
      'T' +
      String(d.getUTCHours()).padStart(2, '0') +
      ':' +
      String(d.getUTCMinutes()).padStart(2, '0') +
      ':' +
      String(d.getUTCSeconds()).padStart(2, '0');
    if (showMs !== false) {
      s += '.' + String(d.getMilliseconds()).padStart(3, '0');
    }
    s += util.formatTzAsISOTZ(tzOffset);
    return s as ISOTzDate;
  }

  /**
   * Validate whether the date is a valid Date object.
   */
  private validate() {
    if (!_.isValidDate(this._date)) {
      throw new Error(INVALID_DATE_STRING);
    }
  }

  /**
   * Formats the date as a string using a custom format. This method uses the
   * timezone set on the `DateEx` object, or the local timezone if none is set.
   *
   * The format string can contain the following tokens:
   * - `yyyy`: Full year (e.g., 2024)
   * - `MM`: Month (01-12)
   * - `dd`: Day of the month (01-31)
   * - `HH`: Hours (00-23)
   * - `mm`: Minutes (00-59)
   * - `ss`: Seconds (00-59)
   * - `SSS`: Milliseconds (000-999)
   *
   * @param format The format string.
   * @returns The formatted date string.
   */
  format(format: string): string {
    const tzOffset: TzMinutes = isMinutes(this._tz) ? this._tz : this._date.getTimezoneOffset() as TzMinutes;
    const d: Date = new Date(this._date.getTime() - tzOffset * 60000);
    return DateEx.formatInternal(d, format);
  }

  /**
   * Formats the date as a string in UTC using a custom format.
   *
   * See the `format` method for a list of available format tokens.
   *
   * @param format The format string.
   * @returns The formatted date string in UTC.
   */
  formatUTC(format: string): string {
    return DateEx.formatInternal(this._date, format);
  }

  private static formatInternal(d: Date, format: string): string {
    let f = String(format);
    f = f
      .replace('yyyy', String(d.getUTCFullYear()))
      .replace('MM', String(d.getUTCMonth() + 1).padStart(2, '0'))
      .replace('dd', String(d.getUTCDate()).padStart(2, '0'))
      .replace('HH', String(d.getUTCHours()).padStart(2, '0'))
      .replace('mm', String(d.getUTCMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getUTCSeconds()).padStart(2, '0'))
      .replace('SSS', String(d.getUTCMilliseconds()).padStart(3, '0'));
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

  /**
   * Parses an IANA time zone string to get the equivalent offset in minutes for
   * the date stored in this `DateEx` object. The offset can vary by date due
   * to Daylight Saving Time.
   *
   * This method leverages the `Intl.DateTimeFormat` API to determine the
   * offset for a given IANA time zone identifier.
   *
   * @param val The IANA time zone string (e.g., "America/New_York").
   * @returns The time zone offset in minutes, or `undefined` if parsing fails.
   *          A positive value indicates a time zone that is behind UTC (e.g.,
   *          the Americas), while a negative value indicates a time zone ahead
   *          of UTC (e.g., Asia).
   *
   * @example
   * ```ts
   * // Get the offset for a winter date (EST)
   * const dWinter = new DateEx('2024-01-01T12:00:00Z');
   * const estOffset = dWinter.ianaTzParse("America/New_York");
   * // estOffset will be 300
   *
   * // Get the offset for a summer date (EDT)
   * const dSummer = new DateEx('2024-07-01T12:00:00Z');
   * const edtOffset = dSummer.ianaTzParse("America/New_York");
   * // edtOffset will be 240
   * ```
   */
  public ianaTzParse(val: IANATZ): TzMinutes | undefined {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: val,
        timeZoneName: 'longOffset',
      };

      const formattedParts = new Intl.DateTimeFormat('en-US', options).formatToParts(this._date);
      const timeZoneNamePart = formattedParts.find((part) => part.type === 'timeZoneName');

      if (!timeZoneNamePart) {
        return undefined;
      }

      const offsetString = timeZoneNamePart.value as GMTTZ; // e.g., "GMT-05:00"

      // Regex to extract hours and minutes, handling both positive and negative offsets.
      const match = offsetString.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);

      if (!match) {
        return undefined;
      }

      const sign = match[1] === '+' ? -1 : 1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3] || '0', 10);

      const totalOffsetMinutes = sign * (hours * 60 + minutes);

      return totalOffsetMinutes as TzMinutes;
    } catch (_e) {
      return undefined;
    }
  }

  /**
   * Get the date in a Google Sheets value. This method compensates for a bug in
   * Google Sheets where it incorrectly adjusts dates based on the sheet's
   * timezone setting. To ensure the date is displayed correctly in Google
   * Sheets, you must first set the timezone of the `DateEx` object to match
   * the timezone of the Google Sheet using the `tz()` method.
   *
   * @returns A number which is the date with a value suitable for use in Google
   * Sheets.
   *
   * @example
   * ```ts
   * const d = dateEx('2024-01-01T12:00:00.000Z');
   * d.tz('America/New_York' as IANATZ);
   * const sheetValue = d.googleSheetsDate();
   * ```
   */
  public googleSheetsDate(): GoogleSheetsDate {
    this.validate();
    const d = this._date;
    return ((d.getTime() - tNullMs) / MS_PER_MIN - d.getTimezoneOffset()) / MIN_PER_DAY as GoogleSheetsDate;
  }

  /**
   * Creates a DateEx object from a Google Sheets serial date number
   * that was created with a local timezone offset.
   * @param serial The Google Sheets serial date number.
   * @param ianaTz The IANA timezone string of the spreadsheet, which is a
   * required parameter. This value can be retrieved from the spreadsheet's
   * settings.
   * @returns A DateEx object.
   */
  static fromGoogleSheetsDate(serial: GoogleSheetsDate, ianaTz: IANATZ): DateEx | undefined {
    if (!_.isNumber(serial)) {
      return undefined;
    }
    const ms = MS_PER_DAY * serial + tNullMs;
    const result = new DateEx(ms);
    const minOffset = result.ianaTzParse(ianaTz);
    if (minOffset) {
      result._date = new Date(result._date.getTime() + minOffset * MS_PER_MIN);
    }
    return result;
  }

  static fromPdfDate(s: string): DateEx | undefined {
    const p = s.match(/^D:(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(.*)$/);
    if (p) {
      const tzRaw = p[7];
      if (util.isPDFTZ(tzRaw)) {
        const tzOffset: TzMinutes | undefined = util.parsePDFTZ(tzRaw);
        return new DateEx(
          _.asInt(p[1]),
          _.asInt(p[2]) - 1,
          _.asInt(p[3]),
          _.asInt(p[4]),
          _.asInt(p[5]),
          _.asInt(p[6]),
        ).withTz(tzOffset);
      }
    }
  }
}
