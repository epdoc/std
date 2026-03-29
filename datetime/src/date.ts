import { _ } from '@epdoc/type';
import type { GMTTZ, GoogleSheetsDate, IANATZ, ISOTZ, ISOTzDate, JulianDay, TzMinutes } from './types.ts';
import * as util from './utils.ts';

/**
 * @module @epdoc/datetime
 *
 * A robust wrapper around JavaScript's Temporal API providing enhanced date/time
 * handling with timezone support, formatting, and compatibility features.
 *
 * ## Internal Storage
 *
 * DateEx uses Temporal API types internally for all date storage:
 *
 * | Input Type | Stored As | Description |
 * |------------|-----------|-------------|
 * | No arguments | `Temporal.Instant` | Current time in UTC |
 * | `Temporal.Instant` | Instant | Point in time without timezone |
 * | `Temporal.ZonedDateTime` | ZonedDateTime | Point in time with timezone info |
 * | `Temporal.PlainDateTime` | PlainDateTime | Wall-clock time without timezone |
 * | `Date` object | Instant | Converted to epoch milliseconds |
 * | `number` (timestamp) | Instant | Treated as epoch milliseconds |
 * | ISO string | Instant or ZonedDateTime | Parsed, with timezone if present |
 * | `DateEx` | Copy | Duplicates the internal value |
 * | Multiple args (y,m,d...) | PlainDateTime | Year, month, day, etc. |
 *
 * ## Timezone Handling
 *
 * When created without timezone information (Instant or PlainDateTime), methods
 * requiring timezone context will throw an error. Use `.tz()` or `.withTz()` to
 * set the timezone before calling such methods.
 *
 * @example
 * ```typescript
 * // Create with timezone
 * const d1 = dateEx('2024-01-15T10:30:00Z').withTz('America/New_York');
 *
 * // Create as Instant, then add timezone
 * const d2 = dateEx().withTz(360); // 360 minutes = -06:00 offset
 *
 * // Create with wall-clock time
 * const d3 = new DateEx(2024, 0, 15, 10, 30); // January 15, 2024 10:30:00
 * d3.tz('America/New_York'); // Now has timezone
 * ```
 *
 * ## Formatting
 *
 * Custom format strings support these tokens:
 * - `yyyy` - Full year (2024)
 * - `MM` - Month with zero padding (01-12)
 * - `M` - Month without padding (1-12)
 * - `dd` - Day with zero padding (01-31)
 * - `d` - Day without padding (1-31)
 * - `HH` - Hours with zero padding (00-23)
 * - `H` - Hours without padding (0-23)
 * - `mm` - Minutes (00-59)
 * - `ss` - Seconds (00-59)
 * - `SSS` - Milliseconds (000-999)
 * - `MMMM` - Full month name (January)
 * - `MMM` - Abbreviated month name (Jan)
 * - `EEEE` - Full weekday name (Monday)
 * - `EEE` - Abbreviated weekday name (Mon)
 * - `EE` - Short weekday name (Mo)
 *
 * @see {@link https://tc39.es/proposal-temporal/docs/|Temporal API Documentation}
 */

// const INVALID_DATE_STRING = 'Invalid Date';
// const GOOGLE_TO_UNIX_EPOCH_DAYS = 25568; // Sheets treats 1900 as a leap year, so we subtract 1.
const MS_PER_MIN = 60000;
const MIN_PER_DAY = 1440;
const MS_PER_DAY = 86400000;
const tNullMs = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)).getTime(); // the starting value for Google

/**
 * Factory function for creating DateEx instances.
 *
 * This is the recommended way to create DateEx objects. It provides a more
 * concise syntax and better type inference in some cases.
 *
 * @param args - Arguments passed to the DateEx constructor
 * @returns A new DateEx instance
 *
 * @example
 * ```typescript
 * // Current time
 * const now = dateEx();
 *
 * // From ISO string
 * const d1 = dateEx('2024-03-15T10:30:00Z');
 *
 * // From timestamp
 * const d2 = dateEx(1709913600000);
 *
 * // From Date object
 * const d3 = dateEx(new Date());
 *
 * // From Temporal objects
 * const d4 = dateEx(Temporal.Now.instant());
 * const d5 = dateEx(Temporal.PlainDateTime.from({ year: 2024, month: 3, day: 15 }));
 *
 * // From year/month/day components
 * const d6 = dateEx(2024, 2, 15, 10, 30, 0); // March 15, 2024 10:30:00
 *
 * // Clone another DateEx
 * const d7 = dateEx(d1);
 * ```
 *
 * @see {@link DateEx} For detailed constructor documentation
 */
export function dateEx(...args: unknown[]): DateEx {
  return new DateEx(...args);
}

function isMinutes(val: unknown): val is TzMinutes {
  return _.isInteger(val);
}

/**
 * Enhanced date/time wrapper using the Temporal API.
 *
 * Provides timezone-aware date handling, custom formatting, and compatibility
 * with legacy systems (Google Sheets, PDF dates, Julian Day calculations).
 *
 * ## Immutability
 *
 * DateEx objects are immutable. Methods that would change the date/time value
 * return a new DateEx instance (e.g., `withTz()`, `clone()`). The mutable
 * exception is `tz()`, which sets timezone on the current instance.
 *
 * ## Type Safety
 *
 * The class stores one of three Temporal types internally:
 * - {@link Temporal.Instant} - Point in UTC time, no timezone
 * - {@link Temporal.PlainDateTime} - Wall-clock time, no timezone
 * - {@link Temporal.ZonedDateTime} - Time with timezone information
 *
 * Methods requiring timezone context throw if called on Instant or PlainDateTime.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { dateEx } from '@epdoc/datetime';
 *
 * // Current time
 * const now = dateEx();
 *
 * // From ISO string with timezone
 * const meeting = dateEx('2024-03-15T14:30:00-05:00');
 *
 * // From components
 * const birthday = new DateEx(2024, 2, 15); // March 15, 2024
 * birthday.tz('America/Chicago');
 *
 * // Formatting
 * console.log(birthday.format('MMMM dd, yyyy')); // "March 15, 2024"
 * console.log(birthday.toISOLocalString()); // "2024-03-15T14:30:00-05:00"
 *
 * // Chain operations
 * const utcTime = dateEx().withTz('UTC').format('yyyy-MM-dd HH:mm:ss');
 * ```
 *
 * @since 1.0.0
 * @see {@link dateEx} Factory function for creating DateEx instances
 */
export class DateEx {
  protected _value: Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime;

  /**
   * Creates a new DateEx instance with flexible input options.
   *
   * The constructor accepts various input types and stores them internally as
   * Temporal objects (Instant, PlainDateTime, or ZonedDateTime).
   *
   * ## Constructor Signatures
   *
   * ### No Arguments
   * Creates a DateEx for the current moment as a {@link Temporal.Instant}.
   * ```typescript
   * const now = new DateEx();
   * ```
   *
   * ### Single Temporal Object
   * Stores the Temporal object directly:
   * - {@link Temporal.Instant} - Point in UTC time
   * - {@link Temporal.ZonedDateTime} - Time with timezone
   * - {@link Temporal.PlainDateTime} - Wall-clock time without timezone
   *
   * ```typescript
   * const d1 = new DateEx(Temporal.Now.instant());
   * const d2 = new DateEx(Temporal.ZonedDateTime.from('2024-03-15T10:30:00-05:00[America/New_York]'));
   * const d3 = new DateEx(Temporal.PlainDateTime.from({ year: 2024, month: 3, day: 15 }));
   * ```
   *
   * ### Single Legacy Object
   * Converts legacy JavaScript Date objects:
   * ```typescript
   * const d = new DateEx(new Date()); // Converts to Instant
   * ```
   *
   * ### Numeric Timestamp
   * Interprets numbers as epoch milliseconds:
   * ```typescript
   * const d = new DateEx(1709913600000); // Specific timestamp as Instant
   * ```
   *
   * ### ISO String
   * Parses ISO 8601 strings:
   * - Strings with timezone info (e.g., `Z` or `+05:00`) become ZonedDateTime
   * - Strings without timezone become Instant
   * ```typescript
   * const d1 = new DateEx('2024-03-15T10:30:00Z'); // Instant
   * const d2 = new DateEx('2024-03-15T10:30:00+05:00'); // ZonedDateTime
   * ```
   *
   * ### Date Components (Multiple Arguments)
   * Creates a {@link Temporal.PlainDateTime} from year, month, day, etc:
   * ```typescript
   * // Year, month (0-11), day, hour, minute, second, millisecond
   * const d = new DateEx(2024, 2, 15, 10, 30, 0, 0); // March 15, 2024 10:30:00
   * ```
   *
   * ### Clone Another DateEx
   * ```typescript
   * const original = new DateEx('2024-03-15');
   * const clone = new DateEx(original); // Independent copy
   * ```
   *
   * ## Important Notes
   *
   * - **Month Indexing**: When using multiple arguments, month is 0-indexed (0=January, 11=December)
   * - **Timezone Required**: Methods like `toISOLocalString()` require a ZonedDateTime.
   *   Call `.tz()` or `.withTz()` before using these methods.
   *
   * @param args - Variable arguments depending on the desired construction method
   * @throws {Error} When given an unsupported argument type or invalid date string
   *
   * @see {@link dateEx} Factory function with the same signatures
   * @see {@link Temporal.Instant}
   * @see {@link Temporal.PlainDateTime}
   * @see {@link Temporal.ZonedDateTime}
   */
  constructor(...args: unknown[]) {
    if (!args.length) {
      // No args: current time as Instant
      this._value = Temporal.Now.instant();
    } else if (args.length === 1) {
      const arg = args[0];
      if (arg instanceof Temporal.Instant) {
        this._value = arg;
      } else if (arg instanceof Temporal.ZonedDateTime) {
        this._value = arg;
      } else if (arg instanceof Temporal.PlainDateTime) {
        this._value = arg;
      } else if (arg instanceof DateEx) {
        this._value = arg._value;
      } else if (arg instanceof Date) {
        // Convert Date to Instant
        this._value = Temporal.Instant.fromEpochMilliseconds(arg.getTime());
      } else if (_.isNumber(arg)) {
        // Number is treated as epoch milliseconds
        this._value = Temporal.Instant.fromEpochMilliseconds(arg);
      } else if (_.isString(arg)) {
        // String parsing - check for ISO with timezone first
        const isoString = arg as string;
        try {
          // Try to parse as ISO 8601 string
          if (isoString.match(/Z|[+-]\d{2}:\d{2}$/)) {
            // Has timezone info - create ZonedDateTime
            this._value = Temporal.Instant.from(isoString).toZonedDateTimeISO('UTC');
          } else {
            // No timezone - create Instant (assumes UTC for parsing)
            this._value = Temporal.Instant.from(isoString);
          }
        } catch {
          // Fallback: try Date parsing
          const d = new Date(isoString);
          if (_.isValidDate(d)) {
            this._value = Temporal.Instant.fromEpochMilliseconds(d.getTime());
          } else {
            throw new Error(`Invalid date string: ${isoString}`);
          }
        }
      } else {
        throw new Error(`Unsupported argument type: ${typeof arg}`);
      }
    } else {
      // Multiple arguments: year, month, day, hour, minute, second, ms
      // Stored as PlainDateTime (no timezone yet)
      const [year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0] = args as number[];
      this._value = new Temporal.PlainDateTime(year, month + 1, day, hour, minute, second, millisecond);
    }
  }

  clone(): DateEx {
    return new DateEx(this);
  }

  /**
   * Returns the internal Temporal object (Instant, PlainDateTime, or ZonedDateTime).
   */
  get temporal(): Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime {
    return this._value;
  }

  /**
   * Returns the underlying date as a native JavaScript Date object.
   * @deprecated Use .temporal instead to access the Temporal object.
   */
  get date(): Date {
    if (this._value instanceof Temporal.Instant) {
      return new Date(this._value.epochMilliseconds);
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      return new Date(this._value.epochMilliseconds);
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // PlainDateTime has no epoch - assume local timezone for backward compatibility
      const localTz = Temporal.Now.timeZoneId();
      const zdt = this._value.toZonedDateTime(localTz);
      return new Date(zdt.epochMilliseconds);
    }
    throw new Error('Unknown temporal type');
  }

  /**
   * Set the timezone to use when outputting as a string, eg. with
   * toISOLocaleString(). A positive value of 360 is equivalent to '-06:00'.
   *
   * Converts the internal value to a ZonedDateTime if it's an Instant or PlainDateTime.
   * If using an IANA timezone string (e.g., "America/New_York"), this method
   * should be called again if the underlying date of the object is changed,
   * as the offset may need to be recalculated to account for Daylight Saving
   * Time. ISOTZ strings already contain the offset and do not need to be
   * recalculated.
   *
   * @param val Minutes, an ISOTZ string, or an IANATZ string.
   * @throws Error if the timezone cannot be determined or set.
   */
  tz(val: TzMinutes | ISOTZ | IANATZ): this {
    let timeZoneId: string;

    if (util.isIANATZ(val)) {
      timeZoneId = val as string;
    } else if (util.isISOTZ(val)) {
      // Convert ISOTZ to a timezone identifier
      // For offset strings like "-06:00", we use Etc/GMT+6
      // Etc/GMT+X = UTC-X (behind UTC), Etc/GMT-X = UTC+X (ahead of UTC)
      const offset = util.parseISOTZ(val as ISOTZ);
      if (offset === undefined) {
        throw new Error(`Invalid ISOTZ value: ${val}`);
      }
      const hours = Math.floor(Math.abs(offset) / 60);
      // Invert sign: positive offset (behind UTC) -> Etc/GMT+, negative offset (ahead UTC) -> Etc/GMT-
      const sign = offset >= 0 ? '+' : '-';
      timeZoneId = `Etc/GMT${sign}${hours}`;
    } else if (isMinutes(val)) {
      // Convert minutes to Etc/GMT format
      const hours = Math.floor(Math.abs(val) / 60);
      // Invert sign: positive offset (behind UTC) -> Etc/GMT+, negative offset (ahead UTC) -> Etc/GMT-
      const sign = val >= 0 ? '+' : '-';
      timeZoneId = `Etc/GMT${sign}${hours}`;
    } else if (_.isNumber(val)) {
      // Handle the case where val is a number (TzMinutes without undefined)
      const hours = Math.floor(Math.abs(val) / 60);
      // Invert sign: positive offset (behind UTC) -> Etc/GMT+, negative offset (ahead UTC) -> Etc/GMT-
      const sign = val >= 0 ? '+' : '-';
      timeZoneId = `Etc/GMT${sign}${hours}`;
    } else {
      throw new Error(`Invalid timezone value: ${val}`);
    }

    // Convert to ZonedDateTime based on current type
    if (this._value instanceof Temporal.Instant) {
      this._value = this._value.toZonedDateTimeISO(timeZoneId);
    } else if (this._value instanceof Temporal.PlainDateTime) {
      this._value = this._value.toZonedDateTime(timeZoneId);
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      this._value = this._value.withTimeZone(timeZoneId);
    }

    return this;
  }

  /**
   * Returns the timezone offset in minutes.
   * Only available if the internal value is a ZonedDateTime.
   * Uses JavaScript convention where positive values indicate timezones behind UTC
   * (e.g., Americas) and negative values indicate timezones ahead of UTC (e.g., Asia).
   * @returns The timezone offset in minutes, or undefined if no timezone is set.
   */
  getTz(): TzMinutes | undefined {
    if (this._value instanceof Temporal.ZonedDateTime) {
      // Parse the offset string (e.g., "-05:00" or "+05:30")
      const offsetStr = this._value.offset;
      const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
      if (match) {
        const sign = match[1] === '-' ? 1 : -1; // Invert sign for JS convention
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        return (sign * (hours * 60 + minutes)) as TzMinutes;
      }
    }
    return undefined;
  }

  /**
   * Returns the timezone offset as an ISO 8601 string (e.g., "-05:00", "+09:30").
   * Only available if the internal value is a ZonedDateTime.
   * @returns The timezone offset string, or undefined if no timezone is set.
   */
  getTzString(): ISOTZ | undefined {
    if (this._value instanceof Temporal.ZonedDateTime) {
      return this._value.offset as ISOTZ;
    }
    return undefined;
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
  withTz(val?: TzMinutes | ISOTZ | IANATZ): DateEx {
    const result = this.clone();
    if (val === undefined) {
      // Default to local timezone
      result.tz(Temporal.Now.timeZoneId() as IANATZ);
    } else {
      result.tz(val);
    }
    return result;
  }

  /**
   * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
   * `Date.toISOString` which always uses UTC in the output. The timezone used
   * is set by the tz() method or defaults to the local timezone of the machine.
   *
   * @param showMs Set to false to hide (truncate) milliseconds
   * @returns The formatted date string with timezone offset
   * @throws Error if the internal value is not a ZonedDateTime (call .tz() or .withTz() first)
   */
  public toISOLocalString(showMs: boolean = true): ISOTzDate {
    this.validate();

    let zdt: Temporal.ZonedDateTime;

    if (this._value instanceof Temporal.ZonedDateTime) {
      zdt = this._value;
    } else if (this._value instanceof Temporal.Instant) {
      // Default to local timezone for Instant
      const localTz = Temporal.Now.timeZoneId();
      zdt = this._value.toZonedDateTimeISO(localTz);
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // Default to local timezone for PlainDateTime
      const localTz = Temporal.Now.timeZoneId();
      zdt = this._value.toZonedDateTime(localTz);
    } else {
      throw new Error('Cannot format: unknown temporal type');
    }

    // Use Temporal's built-in formatting
    const pad = (n: number, len: number = 2) => String(n).padStart(len, '0');

    let s = `${zdt.year}-${pad(zdt.month)}-${pad(zdt.day)}T${pad(zdt.hour)}:${pad(zdt.minute)}:${pad(zdt.second)}`;

    if (showMs) {
      s += `.${pad(zdt.millisecond, 3)}`;
    }

    // Add timezone offset using the offset string directly
    // Replace +00:00 with Z for UTC
    const offset = zdt.offset;
    s += offset === '+00:00' ? 'Z' : offset;

    return s as ISOTzDate;
  }

  /**
   * Validate whether the internal Temporal object is valid.
   * Temporal objects are always valid when properly constructed.
   */
  private validate() {
    // Temporal objects are always valid after construction
    // This method is kept for API compatibility
  }

  /**
   * Formats the date as a string using a custom format. This method uses the
   * timezone set on the `DateEx` object, or the local timezone if none is set.
   *
   * The format string can contain the following tokens:
   * - `yyyy`: Full year (e.g., 2024)
   * - `MMMM`: Full month name (e.g., January)
   * - `MMM`: Abbreviated month name (e.g., Jan)
   * - `MM`: Month number with zero padding (01-12)
   * - `M`: Month number without zero padding (1-12)
   * - `dd`: Day of the month with zero padding (01-31)
   * - `d`: Day of the month without zero padding (1-31)
   * - `HH`: Hours with zero padding (00-23)
   * - `H`: Hours without zero padding (0-23)
   * - `mm`: Minutes (00-59)
   * - `ss`: Seconds (00-59)
   * - `SSS`: Milliseconds (000-999)
   * - `EEEE`: Full weekday name (e.g., Monday)
   * - `EEE`: Abbreviated weekday name (e.g., Mon)
   * - `EE`: Short weekday name (e.g., Mo)
   *
   * @param format The format string.
   * @returns The formatted date string.
   */
  format(format: string): string {
    // For formatting, we need a ZonedDateTime
    let zdt: Temporal.ZonedDateTime;

    if (this._value instanceof Temporal.ZonedDateTime) {
      zdt = this._value;
    } else if (this._value instanceof Temporal.Instant) {
      // Use local timezone for Instant
      const localTz = Temporal.Now.timeZoneId();
      zdt = this._value.toZonedDateTimeISO(localTz);
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // Use local timezone for PlainDateTime
      const localTz = Temporal.Now.timeZoneId();
      zdt = this._value.toZonedDateTime(localTz);
    } else {
      throw new Error('Unknown temporal type');
    }

    return DateEx.formatZDT(zdt, format);
  }

  /**
   * Formats the date as a string in UTC using a custom format.
   *
   * Available format tokens:
   * - `yyyy`: Full year (e.g., 2024)
   * - `MMMM`: Full month name (e.g., January)
   * - `MMM`: Abbreviated month name (e.g., Jan)
   * - `MM`: Month number with zero padding (01-12)
   * - `M`: Month number without zero padding (1-12)
   * - `dd`: Day of the month with zero padding (01-31)
   * - `d`: Day of the month without zero padding (1-31)
   * - `HH`: Hours with zero padding (00-23)
   * - `H`: Hours without zero padding (0-23)
   * - `mm`: Minutes (00-59)
   * - `ss`: Seconds (00-59)
   * - `SSS`: Milliseconds (000-999)
   * - `EEEE`: Full weekday name (e.g., Monday)
   * - `EEE`: Abbreviated weekday name (e.g., Mon)
   * - `EE`: Short weekday name (e.g., Mo)
   *
   * @param format The format string.
   * @returns The formatted date string in UTC.
   */
  formatUTC(format: string): string {
    // Convert to UTC ZonedDateTime for formatting
    let instant: Temporal.Instant;

    if (this._value instanceof Temporal.Instant) {
      instant = this._value;
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      instant = this._value.toInstant();
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // PlainDateTime has no timezone - interpret as UTC
      instant = this._value.toZonedDateTime('UTC').toInstant();
    } else {
      throw new Error('Unknown temporal type');
    }

    const zdtUtc = instant.toZonedDateTimeISO('UTC');
    return DateEx.formatZDT(zdtUtc, format);
  }

  private static formatInternal(d: Date, format: string): string {
    let f = String(format);

    // Use placeholder strategy to avoid conflicts between tokens
    // Use only underscores and numbers to be completely safe
    const placeholders: Record<string, string> = {};

    // Step 1: Replace day names with safe placeholders
    if (f.includes('EEEE')) {
      const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(d);
      const placeholder = '___1___';
      placeholders[placeholder] = weekdayLong;
      f = f.replace('EEEE', placeholder);
    }
    if (f.includes('EEE')) {
      const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(d);
      const placeholder = '___2___';
      placeholders[placeholder] = weekdayShort;
      f = f.replace('EEE', placeholder);
    }
    if (f.includes('EE')) {
      const weekdayNarrow = new Intl.DateTimeFormat('en-US', { weekday: 'narrow', timeZone: 'UTC' }).format(d);
      const placeholder = '___3___';
      placeholders[placeholder] = weekdayNarrow;
      f = f.replace('EE', placeholder);
    }

    // Step 2: Replace month names with safe placeholders
    if (f.includes('MMMM')) {
      const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(d);
      const placeholder = '___4___';
      placeholders[placeholder] = monthLong;
      f = f.replace('MMMM', placeholder);
    }
    if (f.includes('MMM')) {
      const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d);
      const placeholder = '___5___';
      placeholders[placeholder] = monthShort;
      f = f.replace('MMM', placeholder);
    }

    // Step 3: Replace numeric/time tokens
    // Must check longer tokens before shorter ones to avoid partial replacement
    f = f
      .replace('yyyy', String(d.getUTCFullYear()))
      .replace('MM', String(d.getUTCMonth() + 1).padStart(2, '0'))
      .replace('dd', String(d.getUTCDate()).padStart(2, '0'))
      .replace('HH', String(d.getUTCHours()).padStart(2, '0'))
      .replace('mm', String(d.getUTCMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getUTCSeconds()).padStart(2, '0'))
      .replace('SSS', String(d.getUTCMilliseconds()).padStart(3, '0'))
      .replace('M', String(d.getUTCMonth() + 1))
      .replace('d', String(d.getUTCDate()))
      .replace('H', String(d.getUTCHours()));

    // Step 4: Replace placeholders with actual month names
    for (const [placeholder, value] of Object.entries(placeholders)) {
      f = f.replace(placeholder, value);
    }

    return f;
  }

  static formatZDT(zdt: Temporal.ZonedDateTime, format: string): string {
    // Use the ZonedDateTime directly - it already has the correct local time
    let f = String(format);
    const placeholders: Record<string, string> = {};

    // Step 1 & 2: Names (Weekday/Month) using Intl
    // Temporal objects work directly with Intl.DateTimeFormat
    const formatters = {
      EEEE: new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }),
      EEE: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }),
      EE: new Intl.DateTimeFormat('en-US', { weekday: 'narrow', timeZone: 'UTC' }),
      MMMM: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }),
      MMM: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }),
    };

    Object.entries(formatters).forEach(([token, formatter], index) => {
      if (f.includes(token)) {
        const placeholder = `___${index}___`;
        placeholders[placeholder] = formatter.format(new Date(zdt.epochMilliseconds));
        f = f.replace(token, placeholder);
      }
    });

    // Step 3: Numeric tokens
    // We use direct properties instead of getUTC methods
    const pad = (n: number, l: number = 2) => String(n).padStart(l, '0');

    f = f
      .replace('yyyy', String(zdt.year))
      .replace('MM', pad(zdt.month))
      .replace('dd', pad(zdt.day))
      .replace('HH', pad(zdt.hour))
      .replace('mm', pad(zdt.minute))
      .replace('ss', pad(zdt.second))
      .replace('SSS', pad(zdt.millisecond, 3))
      .replace('M', String(zdt.month))
      .replace('d', String(zdt.day))
      .replace('H', String(zdt.hour));

    // Step 4: Restore placeholders
    for (const [placeholder, value] of Object.entries(placeholders)) {
      f = f.replace(placeholder, value);
    }

    return f;
  }

  /**
   * Get the Julian Day. Dates at noon return round numbers.
   * @returns A number which is the Julian Day.
   * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
   */
  public julianDate(): JulianDay {
    this.validate();
    // Get epoch milliseconds from the internal value
    let epochMs: number;
    if (this._value instanceof Temporal.Instant) {
      epochMs = this._value.epochMilliseconds;
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      epochMs = this._value.epochMilliseconds;
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // PlainDateTime doesn't have an epoch - convert to Instant via local timezone
      const localTz = Temporal.Now.timeZoneId();
      epochMs = this._value.toZonedDateTime(localTz).epochMilliseconds;
    } else {
      throw new Error('Unknown temporal type');
    }
    return epochMs / 86400000 + 2440587.5;
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
      // Get the epoch milliseconds from the internal value to create a Date
      let epochMs: number;
      if (this._value instanceof Temporal.Instant) {
        epochMs = this._value.epochMilliseconds;
      } else if (this._value instanceof Temporal.ZonedDateTime) {
        epochMs = this._value.epochMilliseconds;
      } else if (this._value instanceof Temporal.PlainDateTime) {
        // PlainDateTime doesn't have an epoch - use local timezone
        const localTz = Temporal.Now.timeZoneId();
        epochMs = this._value.toZonedDateTime(localTz).epochMilliseconds;
      } else {
        return undefined;
      }

      const date = new Date(epochMs);
      const options: Intl.DateTimeFormatOptions = {
        timeZone: val,
        timeZoneName: 'longOffset',
      };

      const formattedParts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
      const timeZoneNamePart = formattedParts.find((part) => part.type === 'timeZoneName');

      if (!timeZoneNamePart) {
        return undefined;
      }

      const offsetString = timeZoneNamePart.value as GMTTZ; // e.g., "GMT-05:00"
      if (offsetString === 'GMT') {
        return 0 as TzMinutes;
      }

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
    // Get epoch milliseconds from the internal value
    let epochMs: number;
    if (this._value instanceof Temporal.Instant) {
      epochMs = this._value.epochMilliseconds;
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      epochMs = this._value.epochMilliseconds;
    } else if (this._value instanceof Temporal.PlainDateTime) {
      // PlainDateTime doesn't have an epoch - use local timezone
      const localTz = Temporal.Now.timeZoneId();
      epochMs = this._value.toZonedDateTime(localTz).epochMilliseconds;
    } else {
      throw new Error('Unknown temporal type');
    }

    // Get timezone offset in minutes (local machine offset)
    const localOffset = new Date(epochMs).getTimezoneOffset();
    return ((epochMs - tNullMs) / MS_PER_MIN - localOffset) / MIN_PER_DAY as GoogleSheetsDate;
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
    if (minOffset && result._value instanceof Temporal.Instant) {
      // Adjust the instant by the timezone offset
      result._value = Temporal.Instant.fromEpochMilliseconds(result._value.epochMilliseconds + minOffset * MS_PER_MIN);
    }
    return result;
  }

  static fromPdfDate(s: string): DateEx | undefined {
    const p = s.match(/^D:(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(.*)$/);
    if (p) {
      const tzRaw = p[7];
      if (util.isPDFTZ(tzRaw)) {
        const tzOffset: TzMinutes | undefined = util.parsePDFTZ(tzRaw);
        const dateEx = new DateEx(
          _.asInt(p[1]),
          _.asInt(p[2]) - 1,
          _.asInt(p[3]),
          _.asInt(p[4]),
          _.asInt(p[5]),
          _.asInt(p[6]),
        );
        if (tzOffset !== undefined) {
          return dateEx.withTz(tzOffset);
        }
        return dateEx;
      }
    }
    return undefined;
  }
}
