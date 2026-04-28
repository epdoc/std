import type { CompareResult } from '@epdoc/type';
import { _ } from '@epdoc/type';
import type { GoogleSheetsDate, IANATZ, ISOTZ, ISOTzDate, JulianDay, TzAny, TzMinutes } from './types.ts';
import { INSTANT_MAX, INSTANT_MIN } from './types.ts';
import * as util from './utils.ts';

/**
 * @module @epdoc/datetime
 *
 * A robust wrapper around JavaScript's Temporal API providing enhanced date/time
 * handling with timezone support, formatting, and compatibility features.
 *
 * ## Internal Storage
 *
 * DateTime uses Temporal API types internally for all date storage:
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
 * | `DateTime` | Copy | Duplicates the internal value |
 * | Multiple args (y,m,d...) | PlainDateTime | Year, month, day, etc. |
 *
 * ## Timezone Handling
 *
 * When created without timezone information (Instant or PlainDateTime), methods
 * requiring timezone context will throw an error. Use `setTz()` or `withTz()` to
 * set the timezone before calling such methods.
 *
 * @example
 * ```typescript
 * // Create with timezone
 * const d1 = DateTime.from('2024-01-15T10:30:00Z').withTz('America/New_York');
 *
 * // Create as Instant, then add timezone using ISO offset
 * const d2 = DateTime.from().withTz('-06:00'); // UTC-06:00 offset
 *
 * // Create with wall-clock time
 * const d3 = DateTime.fromComponents(2024, 1, 15, 10, 30); // January 15, 2024 10:30:00
 * d3.setTz('America/New_York'); // Now has timezone
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
const _MS_PER_MIN = 60000;
const _MIN_PER_DAY = 1440;
const MS_PER_DAY = 86400000;
const tNullMs = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)).getTime(); // the starting value for Google

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
 * DateTime objects are immutable. Methods that would change the date/time value
 * return a new DateTime instance (e.g., `withTz()`, `clone()`). The mutable
 * exception is `setTz()`, which sets timezone on the current instance.
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
 * import { DateTime } from '@epdoc/datetime';
 *
 * // Current time
 * const now = DateTime.from();
 *
 * // From ISO string with timezone
 * const meeting = DateTime.from('2024-03-15T14:30:00-05:00');
 *
 * // From components
 * const birthday = DateTime.fromComponents(2024, 3, 15); // March 15, 2024
 * birthday.setTz('America/Chicago');
 *
 * // Formatting
 * console.log(birthday.format('MMMM dd, yyyy')); // "March 15, 2024"
 * console.log(birthday.toISOLocalString()); // "2024-03-15T14:30:00-05:00"
 *
 * // Chain operations
 * const utcTime = DateTime.from().withTz('UTC').format('yyyy-MM-dd HH:mm:ss');
 * ```
 *
 * @since 1.0.0
 * @see {@link DateTime.from} Factory method for creating DateTime instances
 */
export class DateTime {
  /** * Internal Temporal storage.
   */
  protected _value: Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime;

  /**
   * Private constructor to enforce static factory usage.
   * No logic happens here; it is purely for assignment.
   */
  private constructor(value: Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime) {
    this._value = value;
  }

  /**
   * Creates a copy of this DateTime instance.
   * The clone has the same internal value but is a separate object.
   *
   * @returns A new DateTime instance with the same value
   *
   * @example
   * ```typescript
   * const d1 = DateTime.from('2024-03-15T10:30:00Z');
   * const d2 = d1.clone();
   * console.log(d1.equals(d2)); // true (same value)
   * console.log(d1 === d2);     // false (different objects)
   * ```
   */
  clone(): DateTime {
    return new DateTime(this._value);
  }

  /**
   * Creates a DateTime from a Temporal object.
   * This is a convenience wrapper around the private constructor.
   *
   * @param value - A Temporal.Instant, Temporal.PlainDateTime, or Temporal.ZonedDateTime
   * @returns A new DateTime instance wrapping the provided Temporal object
   *
   * @example
   * ```typescript
   * const instant = Temporal.Now.instant();
   * const dt = DateTime.of(instant);
   *
   * const zdt = Temporal.ZonedDateTime.from('2024-03-15T10:30:00-05:00[America/New_York]');
   * const dt2 = DateTime.of(zdt);
   * ```
   */
  static of(value: Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime): DateTime {
    return new DateTime(value);
  }

  /**
   * Creates a DateTime representing the current moment.
   * Returns an Instant (UTC time without timezone context).
   * Use withTimezone() to convert to a specific timezone.
   *
   * @example
   * ```typescript
   * // Current time as Instant
   * const now = DateTime.now();
   *
   * // Current time in a specific timezone
   * const nyNow = DateTime.now().withTz('America/New_York');
   * ```
   */
  static now(): DateTime {
    return DateTime.from();
  }

  /**
   * Creates a DateTime from a legacy JavaScript Date object.
   * The Date object is converted to an Instant based on its epoch milliseconds.
   *
   * @param date - A JavaScript Date object
   * @returns A new DateTime instance representing the same instant
   * @throws Error if the Date object is invalid
   *
   * @example
   * ```typescript
   * const jsDate = new Date('2024-03-15T10:30:00Z');
   * const dt = DateTime.fromDate(jsDate);
   * console.log(dt.toISOString()); // "2024-03-15T10:30:00Z"
   * ```
   */
  static fromDate(date: Date): DateTime {
    if (!_.isValidDate(date)) throw new Error('Invalid Date object provided.');
    return new DateTime(Temporal.Instant.fromEpochMilliseconds(date.getTime()));
  }

  /**
   * Creates a DateTime from epoch milliseconds (Unix timestamp).
   * The timestamp represents the number of milliseconds since January 1, 1970, 00:00:00 UTC.
   *
   * @param ms - Epoch milliseconds
   * @returns A new DateTime instance representing that instant
   *
   * @example
   * ```typescript
   * const timestamp = 1710499800000; // 2024-03-15T10:30:00Z
   * const dt = DateTime.fromEpochMilliseconds(timestamp);
   * console.log(dt.toISOString()); // "2024-03-15T10:30:00Z"
   * ```
   */
  static fromEpochMilliseconds(ms: number): DateTime {
    return new DateTime(Temporal.Instant.fromEpochMilliseconds(ms));
  }

  /**
   * Parses an ISO 8601 date string or attempts to parse using legacy Date parsing.
   *
   * - Strings with timezone info (Z or offset like +05:00) become ZonedDateTime
   * - Strings without timezone become PlainDateTime (wall-clock time)
   * - Falls back to legacy Date parsing for non-ISO formats like "July 4, 1776"
   *
   * @param isoString - The date string to parse
   * @returns A new DateTime instance
   * @throws Error if the string cannot be parsed
   *
   * @example
   * ```typescript
   * // With timezone - becomes ZonedDateTime
   * const d1 = DateTime.fromString('2024-03-15T10:30:00-05:00');
   *
   * // UTC - becomes ZonedDateTime with Z offset
   * const d2 = DateTime.fromString('2024-03-15T10:30:00Z');
   *
   * // Without timezone - becomes PlainDateTime
   * const d3 = DateTime.fromString('2024-03-15T10:30:00');
   *
   * // Legacy format fallback
   * const d4 = DateTime.fromString('July 4, 2024');
   * ```
   */
  static fromString(isoString: string): DateTime {
    try {
      // Logic fix: Detect if the string has a timezone offset/ID
      // 'Z', '+05:00', or '[America/New_York]'
      const hasTimezone = /Z|[+-]\d{2}:?\d{2}|\[.*\]$/.test(isoString);

      if (hasTimezone) {
        // Temporal natively handles Z and offsets (+05:00)
        return new DateTime(Temporal.ZonedDateTime.from(isoString));
      } else {
        // No timezone: treat as PlainDateTime (wall-clock time without timezone)
        return new DateTime(Temporal.PlainDateTime.from(isoString));
      }
    } catch {
      // Fallback for non-ISO strings like "July 4, 1776"
      const d = new Date(isoString);
      if (!isNaN(d.getTime())) {
        return new DateTime(Temporal.Instant.fromEpochMilliseconds(d.getTime()));
      }
      throw new Error(`Invalid date string: "${isoString}"`);
    }
  }

  /**
   * Creates a DateTime from individual date/time components.
   * Returns a PlainDateTime (wall-clock time without timezone).
   *
   * Note: Month is 1-indexed (1 = January, 12 = December) to align with Temporal standard.
   * Time components default to midnight (00:00:00.000) if not specified.
   *
   * @param year - The full year (e.g., 2024)
   * @param month - The month (1-12, where 1 = January)
   * @param day - The day of the month (1-31)
   * @param hour - The hour (0-23), defaults to 0
   * @param minute - The minute (0-59), defaults to 0
   * @param second - The second (0-59), defaults to 0
   * @param millisecond - The millisecond (0-999), defaults to 0
   * @returns A new DateTime instance representing the specified components
   *
   * @example
   * ```typescript
   * // Date only - defaults to midnight
   * const d1 = DateTime.fromComponents(2024, 3, 15); // March 15, 2024 00:00:00
   *
   * // With time components
   * const d2 = DateTime.fromComponents(2024, 3, 15, 14, 30, 0, 0); // March 15, 2024 14:30:00
   *
   * // Add timezone after creation
   * const d3 = DateTime.fromComponents(2024, 1, 1);
   * d3.setTz('America/New_York');
   * ```
   */
  static fromComponents(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  ): DateTime {
    const val = new Temporal.PlainDateTime(year, month, day, hour, minute, second, millisecond);
    return new DateTime(val);
  }

  /**
   * Creates a new DateTime instance with flexible input options.
   *
   * The constructor accepts various input types and stores them internally as
   * Temporal objects (Instant, PlainDateTime, or ZonedDateTime).
   *
   * ## Constructor Signatures
   *
   * ### No Arguments
   * Creates a DateTime for the current moment as a {@link Temporal.Instant}.
   * ```typescript
   * const now = DateTime.from();
   * ```
   *
   * ### Single Temporal Object
   * Stores the Temporal object directly:
   * - {@link Temporal.Instant} - Point in UTC time
   * - {@link Temporal.ZonedDateTime} - Time with timezone
   * - {@link Temporal.PlainDateTime} - Wall-clock time without timezone
   *
   * ```typescript
   * const d1 = DateTime.from(Temporal.Now.instant());
   * const d2 = DateTime.from(Temporal.ZonedDateTime.from('2024-03-15T10:30:00-05:00[America/New_York]'));
   * const d3 = DateTime.from(Temporal.PlainDateTime.from({ year: 2024, month: 3, day: 15 }));
   * ```
   *
   * ### Single Legacy Object
   * Converts legacy JavaScript Date objects:
   * ```typescript
   * const d = DateTime.from(new Date()); // Converts to Instant
   * ```
   *
   * ### Numeric Timestamp
   * Interprets numbers as epoch milliseconds:
   * ```typescript
   * const d = DateTime.from(1709913600000); // Specific timestamp as Instant
   * ```
   *
   * ### ISO String
   * Parses ISO 8601 strings:
   * - Strings with timezone info (e.g., `Z` or `+05:00`) become ZonedDateTime
   * - Strings without timezone become PlainDateTime
   * ```typescript
   * const d1 = DateTime.from('2024-03-15T10:30:00Z'); // Instant
   * const d2 = DateTime.from('2024-03-15T10:30:00+05:00'); // ZonedDateTime
   * ```
   *
   * ### Date Components
   * Creates a {@link Temporal.PlainDateTime} from year, month, day, etc using {@link DateTime.fromComponents}:
   * ```typescript
   * // Year, month (1-12), day, hour, minute, second, millisecond
   * const d = DateTime.fromComponents(2024, 3, 15, 10, 30, 0, 0); // March 15, 2024 10:30:00
   * ```
   *
   * ### Clone Another DateTime
   * ```typescript
   * const original = DateTime.from('2024-03-15');
   * const clone = original.clone(); // Independent copy
   * ```
   *
   * ## Important Notes
   *
   * - **Month Indexing**: When using fromComponents, month is 1-indexed (1=January, 12=December) to match Temporal standard
   * - **Timezone Required**: Methods like `toISOLocalString()` require a ZonedDateTime.
   *   Call `setTz()` or `withTz()` before using these methods.
   *
   * @param args - Variable arguments depending on the desired construction method
   * @throws {Error} When given an unsupported argument type or invalid date string
   *
   * @see {@link dateEx} Factory function with the same signatures
   * @see {@link Temporal.Instant}
   * @see {@link Temporal.PlainDateTime}
   * @see {@link Temporal.ZonedDateTime}
   */
  static from(arg?: unknown): DateTime {
    // 1. No arguments: Current Time
    if (_.isNullOrUndefined(arg)) {
      return new DateTime(Temporal.Now.instant());
    }

    // 2. Clone existing DateTime
    if (arg instanceof DateTime) {
      return new DateTime(arg._value);
    }

    // 3. Raw Temporal objects
    if (
      arg instanceof Temporal.Instant ||
      arg instanceof Temporal.ZonedDateTime ||
      arg instanceof Temporal.PlainDateTime
    ) {
      return new DateTime(arg);
    }

    // 4. Legacy JS Date
    if (_.isDate(arg)) {
      return DateTime.fromDate(arg);
    }

    // 5. Epoch Milliseconds (Numbers)
    if (typeof arg === 'number') {
      return new DateTime(Temporal.Instant.fromEpochMilliseconds(arg));
    }

    // 6. Strings (ISO, Timezones, or Legacy fallback)
    if (_.isString(arg)) {
      return DateTime.fromString(arg);
    }

    throw new Error(`Unsupported DateTime input: ${typeof arg}`);
  }

  /**
   * Returns the epoch milliseconds (Unix timestamp) of this DateTime.
   * Only available for Instant and ZonedDateTime; throws for PlainDateTime.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * console.log(d.epochMilliseconds); // 1710499800000
   * ```
   * @throws Error if the internal value is a PlainDateTime
   */
  valueOf(): number {
    return this.epochMilliseconds;
  }

  /**
   * Returns the internal Temporal object (Instant, PlainDateTime, or ZonedDateTime).
   */
  get temporal(): Temporal.Instant | Temporal.PlainDateTime | Temporal.ZonedDateTime {
    return this._value;
  }

  /**
   * Returns the epoch milliseconds (Unix timestamp) of this DateTime.
   * Only available for Instant and ZonedDateTime; throws for PlainDateTime.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * console.log(d.epochMilliseconds); // 1710499800000
   * ```
   * @throws Error if the internal value is a PlainDateTime
   */
  get epochMilliseconds(): number {
    return this.toInstant().epochMilliseconds;
  }

  /**
   * Returns the epoch seconds (Unix timestamp in seconds) of this DateTime.
   * Only available for Instant and ZonedDateTime; throws for PlainDateTime.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * console.log(d.toEpochSeconds()); // 1710499800
   * ```
   * @throws Error if the internal value is a PlainDateTime
   */
  toEpochSeconds(): number {
    return Math.floor(this.epochMilliseconds / 1000);
  }

  /**
   * Attempts to create a DateTime from the provided arguments.
   * Returns undefined if creation fails, instead of throwing an error.
   *
   * This is the non-throwing variant of {@link DateTime.from}. Use this when
   * you want to handle invalid input gracefully without try/catch.
   *
   * @param args - Same arguments as {@link DateTime.from}
   * @returns A DateTime instance if valid, otherwise undefined
   *
   * @example
   * ```typescript
   * // Valid input returns DateTime
   * const d1 = DateTime.tryFrom('2024-03-15T10:30:00Z');
   * console.log(d1?.toISOString()); // "2024-03-15T10:30:00Z"
   *
   * // Invalid input returns undefined
   * const d2 = DateTime.tryFrom('invalid-date');
   * console.log(d2); // undefined
   *
   * // Useful for conditional logic
   * const dt = DateTime.tryFrom(someUserInput) ?? DateTime.now();
   * ```
   */
  static tryFrom(...args: unknown[]): DateTime | undefined {
    try {
      return DateTime.from(...args);
    } catch {
      return undefined;
    }
  }

  /**
   * Creates a DateTime set to the minimum representable instant.
   * This represents the earliest possible instant (approximately -271821-04-20T00:00:00Z).
   *
   * @returns A new DateTime instance set to INSTANT_MIN
   *
   * @example
   * ```typescript
   * const min = DateTime.min();
   * console.log(min.isMin()); // true
   * console.log(min.epochMilliseconds); // -8640000000000000
   * ```
   */
  static min(): DateTime {
    return new DateTime(INSTANT_MIN);
  }

  /**
   * Creates a DateTime set to the maximum representable instant.
   * This represents the latest possible instant (approximately +275760-09-13T00:00:00Z).
   *
   * @returns A new DateTime instance set to INSTANT_MAX
   *
   * @example
   * ```typescript
   * const max = DateTime.max();
   * console.log(max.isMax()); // true
   * console.log(max.epochMilliseconds); // 8640000000000000
   * ```
   */
  static max(): DateTime {
    return new DateTime(INSTANT_MAX);
  }

  /**
   * Checks if a value can be used to construct a valid DateTime.
   * Returns true for all supported input types without throwing.
   *
   * @example
   * DateTime.isValid('2024-03-15')        // true
   * DateTime.isValid('invalid')           // false
   * DateTime.isValid(1709913600000)       // true
   * DateTime.isValid(new Date())          // true
   * DateTime.isValid(Temporal.Now.instant()) // true
   * DateTime.isValid(null)                // false
   * DateTime.isValid({})                  // false
   */
  static isValid(val: unknown): boolean {
    try {
      DateTime.from(val);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a value is a date-like object that can be passed to the DateTime
   * constructor. Returns true for Date, DateTime, Temporal.Instant,
   * Temporal.ZonedDateTime, and Temporal.PlainDateTime instances.
   *
   * This is useful for type narrowing before passing values to DateTime methods
   * without the overhead of constructing a DateTime object.
   *
   * @param val - The value to check
   * @returns true if the value is a date-like object
   *
   * @example
   * ```typescript
   * DateTime.isDateLike(new Date())                    // true
   * DateTime.isDateLike(DateTime.from('2024-03-15'))    // true
   * DateTime.isDateLike(Temporal.Now.instant())         // true
   * DateTime.isDateLike('2024-03-15')                   // false
   * DateTime.isDateLike(1709913600000)                  // false
   * DateTime.isDateLike(null)                           // false
   * ```
   */
  static isDateLike(
    val: unknown,
  ): val is Date | DateTime | Temporal.Instant | Temporal.ZonedDateTime | Temporal.PlainDateTime {
    return val instanceof Date ||
      val instanceof DateTime ||
      val instanceof Temporal.Instant ||
      val instanceof Temporal.ZonedDateTime ||
      val instanceof Temporal.PlainDateTime;
  }

  /**
   * Converts the internal value to a Temporal.Instant for comparison.
   * Throws if the internal value is a PlainDateTime (which has no instant).
   */
  toInstant(): Temporal.Instant {
    if (this._value instanceof Temporal.Instant) {
      return this._value;
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      return this._value.toInstant();
    } else if (this._value instanceof Temporal.PlainDateTime) {
      throw new Error('Cannot convert PlainDateTime to Instant: use withTz() to set a timezone first');
    }
    throw new Error('Unknown temporal type');
  }

  /**
   * Adds a duration to the date/time.
   * @param val - The duration to add (Temporal.DurationLike).
   * @param tz - Optional timezone context for the operation. If the internal value is an Instant,
   * it will be promoted to a ZonedDateTime in the specified timezone for accurate calendar
   * arithmetic. For ZonedDateTime and PlainDateTime, the timezone context is used as needed for
   * operations involving calendar units (days, months, years). By default, it uses 'utc' for
   * Instant and 'local' for PlainDateTime.
   * @returns A new DateTime instance with the duration added.
   * @example
   * ```typescript
   * const now = DateTime.now();
   * const future = now.add({ days: 7 });
   * ```
   */
  add(val: Temporal.DurationLike, tz?: TzAny): DateTime {
    const result = this.clone();
    result._value = this.#temporalForArithmetic(tz).add(val);
    return result;
  }

  /**
   * Subtracts a duration from the date/time.
   * @param val - The duration to subtract (Temporal.DurationLike).
   * @returns A new DateTime instance with the duration subtracted.
   * @example
   * ```typescript
   * const now = DateTime.now();
   * const past = now.subtract({ days: 7 });
   * ```
   */
  subtract(val: Temporal.DurationLike, tz?: TzAny): DateTime {
    const result = this.clone();
    result._value = this.#temporalForArithmetic(tz).subtract(val);
    return result;
  }

  /**
   * Returns a new DateTime with specific date/time components replaced.
   * This delegates to the underlying Temporal object's `with()` method.
   *
   * ## Supported fields (ZonedDateTime / PlainDateTime)
   * - `year`, `month`, `day`, `hour`, `minute`, `second`, `millisecond`
   * - `microsecond`, `nanosecond`, `era`, `eraYear`
   *
   * ## Not supported for Instant
   * If the internal value is an `Instant`, you must call `withTimezone()` first
   * to establish a timezone before using `with()`.
   *
   * @param fields - The fields to replace, using Temporal's `DurationLike` shape.
   * @returns A new DateTime instance with the specified components replaced.
   * @throws Error if called on an Instant without a timezone.
   *
   * @example
   * ```typescript
   * // Floor to the start of the current hour
   * const d = DateTime.from('2024-03-15T10:30:45.123Z');
   * d.with({ minute: 0, second: 0, millisecond: 0 }).toISOString();
   * // "2024-03-15T10:00:00.000Z"
   *
   * // Ceil to the start of the next hour
   * d.add({ hours: 1 }).with({ minute: 0, second: 0, millisecond: 0 }).toISOString();
   * // "2024-03-15T11:00:00.000Z"
   *
   * // Set a specific date component
   * d.with({ day: 1 }).toISOString(); // "2024-03-01T10:30:45.123Z"
   * ```
   */
  with(
    fields: {
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
      millisecond?: number;
      microsecond?: number;
      nanosecond?: number;
      era?: string;
      eraYear?: number;
      offset?: string;
      timeZone?: string;
    },
  ): DateTime {
    const result = this.clone();
    if (this._value instanceof Temporal.ZonedDateTime) {
      result._value = this._value.with(fields as unknown as Parameters<Temporal.ZonedDateTime['with']>[0]);
    } else if (this._value instanceof Temporal.PlainDateTime) {
      result._value = this._value.with(fields as unknown as Parameters<Temporal.PlainDateTime['with']>[0]);
    } else if (this._value instanceof Temporal.Instant) {
      throw new Error('Cannot use with() on Instant: use withTz() to set a timezone first');
    } else {
      throw new Error('Unknown temporal type');
    }
    return result;
  }

  /**
   * Returns the appropriate Temporal object for arithmetic.
   * Temporal.Instant only supports time units; for calendar units (days, weeks,
   * months, years) we must use a ZonedDateTime. We promote to local tz on demand.
   */
  #temporalForArithmetic(tz?: TzAny): Temporal.Instant | Temporal.ZonedDateTime | Temporal.PlainDateTime {
    if (this._value instanceof Temporal.Instant) {
      return this.withTz(tz ? tz : 'utc').temporal;
      // return this._value.toZonedDateTimeISO(Temporal.Now.timeZoneId());
    } else if (this._value instanceof Temporal.PlainDateTime) {
      return this.withTz(tz ? tz : 'local').temporal;
    }
    return this._value;
  }

  /**
   * Returns a ZonedDateTime for calendar-boundary operations.
   * - ZonedDateTime is used as-is.
   * - Instant is promoted to UTC.
   * - PlainDateTime is promoted to the local timezone.
   */
  #zonedDateTimeForCalendar(): Temporal.ZonedDateTime {
    if (this._value instanceof Temporal.ZonedDateTime) {
      return this._value;
    } else if (this._value instanceof Temporal.Instant) {
      return this._value.toZonedDateTimeISO('UTC');
    } else if (this._value instanceof Temporal.PlainDateTime) {
      return this._value.toZonedDateTime(Temporal.Now.timeZoneId());
    }
    throw new Error('Unknown temporal type');
  }

  /**
   * Compares two DateTime values and returns a comparison result.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @returns -1 if a < b, 0 if a === b, 1 if a > b
   * @throws Error if either DateTime is a PlainDateTime
   *
   * @example
   * const d1 = DateTime.from('2024-03-15');
   * const d2 = DateTime.from('2024-03-16');
   *
   * DateTime.compare(d1, d2) // -1
   * DateTime.compare(d2, d1) // 1
   * DateTime.compare(d1, d1) // 0
   *
   * // Use with Array.sort()
   * const dates = [d2, d1];
   * dates.sort(DateTime.compare);
   */
  static compare(a: DateTime, b: DateTime): CompareResult {
    const aInstant = a.toInstant();
    const bInstant = b.toInstant();

    const aMs = aInstant.epochMilliseconds;
    const bMs = bInstant.epochMilliseconds;

    if (aMs < bMs) return -1;
    if (aMs > bMs) return 1;
    return 0;
  }

  /**
   * Compares this DateTime with another for equality.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns true if both represent the same instant in time
   * @throws Error if either DateTime is a PlainDateTime
   *
   * @example
   * const d1 = DateTime.from('2024-03-15T10:30:00Z');
   * const d2 = DateTime.from('2024-03-15T10:30:00Z');
   * d1.equals(d2) // true
   *
   * // Same instant, different timezone representation
   * const d3 = DateTime.from('2024-03-15T05:30:00-05:00');
   * d1.equals(d3) // true (same UTC instant)
   */
  equals(other: DateTime): boolean {
    const thisInstant = this.toInstant();
    const otherInstant = other.toInstant();
    return thisInstant.epochMilliseconds === otherInstant.epochMilliseconds;
  }

  /**
   * Instance method for comparison. Delegates to DateTime.compare().
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   * @throws Error if either DateTime is a PlainDateTime
   */
  compareTo(other: DateTime): CompareResult {
    return DateTime.compare(this, other);
  }

  /**
   * Checks if this DateTime is before another.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns true if this instant is before the other
   * @throws Error if either DateTime is a PlainDateTime
   */
  isBefore(other: DateTime): boolean {
    return this.compareTo(other) === -1;
  }

  /**
   * Checks if this DateTime is after another.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns true if this instant is after the other
   * @throws Error if either DateTime is a PlainDateTime
   */
  isAfter(other: DateTime): boolean {
    return this.compareTo(other) === 1;
  }

  /**
   * Checks if this DateTime is the same as or before another.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns true if this instant is same as or before the other
   * @throws Error if either DateTime is a PlainDateTime
   */
  isSameOrBefore(other: DateTime): boolean {
    return this.compareTo(other) <= 0;
  }

  /**
   * Checks if this DateTime is the same as or after another.
   * Both DateTimes must represent Instants (not PlainDateTime).
   *
   * @param other - The DateTime to compare with
   * @returns true if this instant is same as or after the other
   * @throws Error if either DateTime is a PlainDateTime
   */
  isSameOrAfter(other: DateTime): boolean {
    return this.compareTo(other) >= 0;
  }

  /**
   * Checks if this DateTime represents the minimum possible instant.
   * Throws if the internal value is a PlainDateTime.
   *
   * @returns true if this DateTime equals INSTANT_MIN
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const min = DateTime.min();
   * console.log(min.isMin()); // true
   *
   * const now = DateTime.now();
   * console.log(now.isMin()); // false
   * ```
   */
  isMin(): boolean {
    return this.toInstant().epochMilliseconds === INSTANT_MIN.epochMilliseconds;
  }

  /**
   * Checks if this DateTime represents the maximum possible instant.
   * Throws if the internal value is a PlainDateTime.
   *
   * @returns true if this DateTime equals INSTANT_MAX
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const max = DateTime.max();
   * console.log(max.isMax()); // true
   *
   * const now = DateTime.now();
   * console.log(now.isMax()); // false
   * ```
   */
  isMax(): boolean {
    return this.toInstant().epochMilliseconds === INSTANT_MAX.epochMilliseconds;
  }

  /**
   * Checks if this DateTime is near the minimum possible instant within a tolerance.
   * Useful for checking if a value is "effectively" the minimum (e.g., for open-ended ranges).
   * Throws if the internal value is a PlainDateTime.
   *
   * @param toleranceSeconds - The tolerance in seconds. Defaults to 3 days (259200 seconds).
   * @returns true if this DateTime is within tolerance of INSTANT_MIN
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const nearMin = new DateTime(Temporal.Instant.fromEpochMilliseconds(-8640000000000000 + 100000));
   * console.log(nearMin.isNearMin()); // true (within 3 days)
   * console.log(nearMin.isNearMin(100)); // false (within 100 seconds)
   *
   * const now = DateTime.now();
   * console.log(now.isNearMin()); // false
   * ```
   */
  isNearMin(toleranceSeconds: number = 259200): boolean {
    const toleranceMs = toleranceSeconds * 1000;
    const epochMs = this.toInstant().epochMilliseconds;
    return epochMs <= INSTANT_MIN.epochMilliseconds + toleranceMs;
  }

  /**
   * Checks if this DateTime is near the maximum possible instant within a tolerance.
   * Useful for checking if a value is "effectively" the maximum (e.g., for open-ended ranges).
   * Throws if the internal value is a PlainDateTime.
   *
   * @param toleranceSeconds - The tolerance in seconds. Defaults to 3 days (259200 seconds).
   * @returns true if this DateTime is within tolerance of INSTANT_MAX
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const nearMax = new DateTime(Temporal.Instant.fromEpochMilliseconds(8640000000000000 - 100000));
   * console.log(nearMax.isNearMax()); // true (within 3 days)
   * console.log(nearMax.isNearMax(100)); // false (within 100 seconds)
   *
   * const now = DateTime.now();
   * console.log(now.isNearMax()); // false
   * ```
   */
  isNearMax(toleranceSeconds: number = 259200): boolean {
    const toleranceMs = toleranceSeconds * 1000;
    const epochMs = this.toInstant().epochMilliseconds;
    return epochMs >= INSTANT_MAX.epochMilliseconds - toleranceMs;
  }

  /**
   * Checks if this DateTime represents "now" within an asymmetric tolerance window.
   * Throws if the internal value is a PlainDateTime.
   *
   * ## Tolerance Behavior (Asymmetric)
   *
   * - **Positive tolerance**: Returns true if this DateTime is within `toleranceSeconds`
   *   BEFORE the current time (i.e., is it "recent"?).
   * - **Negative tolerance**: Returns true if this DateTime is within `abs(toleranceSeconds)`
   *   AFTER the current time (i.e., is it "soon"?).
   * - **Zero tolerance** (default): Returns true only if exactly equal to now.
   *
   * @param toleranceSeconds - Asymmetric tolerance in seconds. Positive means within
   *   that many seconds BEFORE now; negative means within that many seconds AFTER now.
   *   Default is 0 (exact match).
   * @returns true if this DateTime falls within the tolerance window
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const now = DateTime.now();
   * const recent = DateTime.from(Date.now() - 30000); // 30 seconds ago
   * const future = DateTime.from(Date.now() + 30000); // 30 seconds from now
   *
   * // Check if within the last 60 seconds (is it recent?)
   * console.log(recent.isNow(60)); // true
   *
   * // Check if within the next 60 seconds (is it soon?)
   * console.log(future.isNow(-60)); // true
   *
   * // Exact match only
   * console.log(now.isNow()); // true (or very close)
   * ```
   */

  isNow(seconds: number = 0): boolean {
    const now = Temporal.Now.instant().epochMilliseconds;
    const thisMs = this.epochMilliseconds;
    return Math.abs(now - thisMs) <= seconds * 1000;
  }

  /**
   * Sets this DateTime to the minimum representable instant (INSTANT_MIN).
   * Replaces the internal value with INSTANT_MIN.
   *
   * @returns this DateTime instance for chaining
   *
   * @example
   * ```typescript
   * const d = DateTime.now();
   * d.setMin();
   * console.log(d.isMin()); // true
   * ```
   */
  setMin(): this {
    this._value = INSTANT_MIN;
    return this;
  }

  /**
   * Sets this DateTime to the maximum representable instant (INSTANT_MAX).
   * Replaces the internal value with INSTANT_MAX.
   *
   * @returns this DateTime instance for chaining
   *
   * @example
   * ```typescript
   * const d = DateTime.now();
   * d.setMax();
   * console.log(d.isMax()); // true
   * ```
   */
  setMax(): this {
    this._value = INSTANT_MAX;
    return this;
  }

  /**
   * Returns a new DateTime set to the minimum representable instant (INSTANT_MIN).
   * The original DateTime is not modified.
   *
   * @returns A new DateTime instance set to INSTANT_MIN
   *
   * @example
   * ```typescript
   * const now = DateTime.now();
   * const min = now.withMin();
   * console.log(min.isMin()); // true
   * console.log(now.isMin()); // false (original unchanged)
   * ```
   */
  withMin(): DateTime {
    return DateTime.min();
  }

  /**
   * Returns a new DateTime set to the maximum representable instant (INSTANT_MAX).
   * The original DateTime is not modified.
   *
   * @returns A new DateTime instance set to INSTANT_MAX
   *
   * @example
   * ```typescript
   * const now = DateTime.now();
   * const max = now.withMax();
   * console.log(max.isMax()); // true
   * console.log(now.isMax()); // false (original unchanged)
   * ```
   */
  withMax(): DateTime {
    return DateTime.max();
  }

  /**
   * Set the timezone to use when outputting as a string, eg. with
   * toISOString(). A positive value of 360 is equivalent to '+06:00' (ISO 8601
   * convention: positive = ahead of UTC).
   *
   * Converts the internal value to a ZonedDateTime if it's an Instant or PlainDateTime.
   * If using an IANA timezone string (e.g., "America/New_York"), this method
   * should be called again if the underlying date of the object is changed,
   * as the offset may need to be recalculated to account for Daylight Saving
   * Time. ISOTZ strings already contain the offset and do not need to be
   * recalculated.
   *
   * Special values:
   * - 'local': Use the local system timezone
   * - 'utc': Use UTC timezone
   * - undefined: Leave timezone as-is if already set, otherwise use local timezone
   *
   * @param val Minutes (ISO 8601 convention: positive = ahead of UTC), an ISOTZ string,
   * an IANATZ string, or a special value ('local' | 'utc').
   * @throws Error if the timezone cannot be determined or set.
   */
  setTz(val?: TzAny): this {
    let timeZoneId: string | undefined;

    if (val === undefined && this._value instanceof Temporal.ZonedDateTime) {
      return this;
    } else if (val === 'local' || val === undefined) {
      timeZoneId = Temporal.Now.timeZoneId();
    } else if (val === 'utc') {
      timeZoneId = 'UTC';
    } else if (util.isIANATZ(val)) {
      timeZoneId = val as string;
    } else if (util.isISOTZ(val)) {
      // Use the offset string directly as timezone ID — Temporal supports this
      // and it preserves sub-hour offsets (e.g. "+05:30")
      timeZoneId = val as string;
    } else if (isMinutes(val)) {
      // Convert minutes offset to ±HH:MM offset string
      // ISO 8601 convention: positive minutes = ahead of UTC (Asia), negative = behind (Americas)
      const absMin = Math.abs(val);
      const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
      const mm = String(absMin % 60).padStart(2, '0');
      // ISO convention: positive offset (ahead UTC) → positive ISO offset
      timeZoneId = val >= 0 ? `+${hh}:${mm}` : `-${hh}:${mm}`;
    } else {
      throw new Error(`Invalid timezone value: ${val}`);
    }

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
   * Returns a new `DateTime` object with the date adjusted to a specific
   * timezone. This is useful when a `Date` object is created in a local
   * timezone but needs to be treated as if it were in a different timezone.
   *
   * Special values:
   * - 'local': Use the local system timezone
   * - 'utc': Use UTC timezone
   * - undefined: Leave timezone as-is if already set, otherwise use local timezone
   *
   * @example
   * ```ts
   * import { DateTime } from '@epdoc/datetime';
   *
   * // Create a date that is implicitly in the local timezone.
   * const d = new Date(2024, 0, 1, 11, 59, 59);
   * // Treat the date as if it were in a +06:00 timezone using minutes.
   * const d2 = DateTime.from(d).withTz(-360).date;
   * assertStrictEquals(d2.toISOString(), '2024-01-01T17:59:59.000Z');
   * ```
   *
   * @example
   * ```ts
   * // Format output in different timezones
   * const d = DateTime.from('2024-03-15T10:30:00Z').withTz('America/New_York');
   *
   * // Output in the original timezone (America/New_York)
   * console.log(d.toISOString()); // "2024-03-15T06:30:00.000-04:00"
   *
   * // Output in local timezone
   * console.log(d.withTz('local').toISOString()); // e.g. "2024-03-15T03:30:00.000-07:00"
   *
   * // Output in UTC
   * console.log(d.withTz('utc').toISOString()); // "2024-03-15T10:30:00.000Z"
   *
   * // Use ISO offset string (positive = ahead of UTC, as per ISO 8601)
   * console.log(d.withTz('+05:30').toISOString()); // "2024-03-15T16:00:00.000+05:30"
   * ```
   *
   * Note: val '-06:00' `ISOTZ` equals -360 `Minutes` (ISO 8601 convention),
   * and '+06:00' equals +360.
   * @param val Minutes (ISO 8601 convention: positive = ahead of UTC), an ISOTZ string,
   * an IANATZ string, or a special value ('local' | 'utc').
   * If not specified and no timezone is set, the local timezone is used.
   * @returns A new `DateTime` object with the adjusted date.
   */
  withTz(val?: TzAny): DateTime {
    const result = this.clone();
    result.setTz(val);
    return result;
  }

  /**
   * Returns the timezone offset in minutes.
   * Only available if the internal value is a ZonedDateTime.
   * Uses ISO 8601 convention where positive values indicate timezones ahead of UTC
   * (e.g., Asia) and negative values indicate timezones behind UTC (e.g., Americas).
   * @returns The timezone offset in minutes, or undefined if no timezone is set.
   */
  getTzOffset(): TzMinutes | undefined {
    if (this._value instanceof Temporal.ZonedDateTime) {
      // Parse the offset string (e.g., "-05:00" or "+05:30")
      const offsetStr = this._value.offset;
      const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
      if (match) {
        // ISO convention: positive offset = ahead of UTC
        const sign = match[1] === '+' ? 1 : -1;
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
   * Validate whether the internal Temporal object exists.
   * Throws an error if the DateTime instance has no internal value.
   * @throws Error if the DateTime instance has no internal value
   */
  #validate() {
    if (!this._value) {
      throw new Error('DateTime instance has no internal value.');
    }
  }

  /**
   * Returns an ISO 8601 string representation of this DateTime.
   *
   * - For Instant: Returns UTC format with 'Z' suffix (e.g., "2024-03-15T10:30:00.000Z")
   * - For ZonedDateTime: Returns format with timezone offset (e.g., "2024-03-15T05:30:00.000-05:00")
   * - For PlainDateTime: Throws (no instant to represent)
   *
   * @param options - Optional configuration for the output format
   * @param options.fractionalSecondDigits - Number of fractional second digits (0-9) to show.
   *   Use 0 to hide fractional seconds, 3 to show milliseconds, or 'auto' (default) to show
   *   nonzero fractional seconds only. Matches Temporal's toString() behavior.
   * @returns ISO 8601 formatted string
   * @throws Error if the internal value is a PlainDateTime
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * console.log(d.toISOString()); // "2024-03-15T10:30:00Z"
   * console.log(d.toISOString({ fractionalSecondDigits: 3 })); // "2024-03-15T10:30:00.000Z"
   * console.log(d.toISOString({ fractionalSecondDigits: 0 })); // "2024-03-15T10:30:00Z"
   *
   * const d2 = d.withTz('America/New_York');
   * console.log(d2.toISOString()); // "2024-03-15T05:30:00-05:00"
   * console.log(d2.toISOString({ fractionalSecondDigits: 3 })); // "2024-03-15T05:30:00.000-05:00"
   * ```
   */
  public toISOString(options?: { fractionalSecondDigits?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'auto' }): string {
    if (this._value instanceof Temporal.Instant) {
      return this._value.toString(options);
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      return this._value.toString({ timeZoneName: 'never', ...options });
    } else if (this._value instanceof Temporal.PlainDateTime) {
      throw new Error('Cannot convert PlainDateTime to ISO string: use withTz() to set a timezone first');
    }
    throw new Error('Unknown temporal type');
  }

  /**
   * Returns an ISO 8601 string representing this date in its local timezone.
   * If the internal value is not a ZonedDateTime, it converts it to the
   * local timezone before formatting.
   *
   * @param showMs - Whether to include milliseconds in the output. Defaults to true.
   *                 When true: "2024-03-15T10:30:00.000-05:00"
   *                 When false: "2024-03-15T10:30:00-05:00"
   * @returns An ISO 8601 string with timezone offset
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00.123Z').withTz('America/New_York');
   * console.log(d.toISOLocalString());        // "2024-03-15T06:30:00.000-04:00"
   * console.log(d.toISOLocalString(false));   // "2024-03-15T06:30:00-04:00"
   * ```
   * @deprecated Use toISOString({ fractionalSecondDigits: showMs ? 3 : 0 }) instead for more consistent formatting options.
   * This method is retained for backward compatibility but may be removed in future versions.
   * The toISOString() method with options provides more flexible and consistent formatting capabilities, including control over fractional seconds and timezone name inclusion.
   * Example using toISOString():
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00.123Z').withTz('America/New_York');
   * console.log(d.toISOString({ fractionalSecondDigits: 3 })); // "2024-03-15T06:30:00.000-04:00"
   * console.log(d.toISOString({ fractionalSecondDigits: 0 })); // "2024-03-15T06:30:00-04:00"
   * ```
   */
  public toISOLocalString(showMs: boolean = true): ISOTzDate {
    // 1. Ensure we have a ZonedDateTime to get an accurate offset-aware string
    const zdt = this._value instanceof Temporal.ZonedDateTime
      ? this._value
      : this.withTz('local').temporal as Temporal.ZonedDateTime;

    // 2. Use Temporal's native toString for accuracy and performance.
    // 'fractionalSecondDigits' handles the showMs requirement perfectly.
    // 'offset: "always"' ensures we get 'Z' or '+05:00' suffix.
    const result = zdt.toString({
      fractionalSecondDigits: showMs ? 3 : 0,
      timeZoneName: 'never', // We want the offset, not the [America/New_York] label
      offset: 'auto', // 'auto' uses 'Z' for UTC, '+HH:MM' otherwise
    });

    return result as ISOTzDate;
  }

  /**
   * Returns a string representation of this DateTime using the underlying
   * Temporal object's toString method with full options support.
   *
   * This provides direct access to Temporal's native formatting capabilities.
   * The available options depend on the internal Temporal type:
   *
   * ## For Instant and ZonedDateTime:
   * - `fractionalSecondDigits`: Number of fractional second digits (0-9 or 'auto').
   *   Use 0 to hide fractional seconds, 3 to show milliseconds. Default is 'auto'
   *   which omits trailing zeros.
   * - `smallestUnit`: Round to a specific unit ('minute', 'second', 'millisecond', etc.)
   * - `roundingMode`: Rounding method ('ceil', 'floor', 'trunc', 'halfExpand')
   *
   * ## For ZonedDateTime only:
   * - `timeZoneName`: Include timezone name ('auto', 'never', 'critical').
   *   'auto' shows the IANA name, 'critical' includes offset for disambiguation.
   * - `offset`: Include timezone offset ('auto', 'never'). 'auto' shows the offset.
   *
   * ## For PlainDateTime:
   * - `fractionalSecondDigits`: Number of fractional second digits (0-9 or 'auto')
   * - `smallestUnit`: Round to a specific unit
   * - `roundingMode`: Rounding method
   *
   * @param options - Formatting options passed to the underlying Temporal object
   * @returns Formatted string representation
   *
   * @example
   * ```typescript
   * // Instant with milliseconds
   * const d = DateTime.from('2024-03-15T10:30:00.123Z');
   * console.log(d.toString()); // "2024-03-15T10:30:00.123Z"
   * console.log(d.toString({ fractionalSecondDigits: 0 })); // "2024-03-15T10:30:00Z"
   *
   * // ZonedDateTime with timezone name
   * const d2 = d.withTz('America/New_York');
   * console.log(d2.toString({ timeZoneName: 'auto' }));
   * // "2024-03-15T06:30:00.123-04:00[America/New_York]"
   *
   * // PlainDateTime (no timezone in output)
   * const d3 = new DateTime(2024, 2, 15, 10, 30, 0, 123);
   * console.log(d3.toString()); // "2024-03-15T10:30:00.123"
   * ```
   *
   * @see {@link https://tc39.es/proposal-temporal/docs/instant.html#toString|Temporal.Instant.toString}
   * @see {@link https://tc39.es/proposal-temporal/docs/zoneddatetime.html#toString|Temporal.ZonedDateTime.toString}
   * @see {@link https://tc39.es/proposal-temporal/docs/plaindatetime.html#toString|Temporal.PlainDateTime.toString}
   */
  public toString(
    options?:
      | Temporal.InstantToStringOptions
      | Temporal.ZonedDateTimeToStringOptions
      | Temporal.PlainDateTimeToStringOptions,
  ): string {
    return this._value.toString(options as Temporal.InstantToStringOptions);
  }

  /**
   * Formats the date as a string using a custom format. This method uses the
   * timezone set on the `DateTime` object, or the local timezone if none is set.
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

    return DateTime.formatZDT(zdt, format);
  }

  static #formatInternal(d: Date, format: string): string {
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
    this.#validate();
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
   * Returns the Julian Day Number (integer) for the **calendar date** this
   * DateTime falls on in the given timezone.
   *
   * Two events at the same instant but in different timezones may return
   * different Julian Day Numbers — e.g. an event at 23:00 UTC on Wednesday
   * in Canada (UTC-7) is still Wednesday there (JDN N), but already Thursday
   * in Australia (UTC+10) (JDN N+1).
   *
   * @param tz - Timezone to use. Defaults to the timezone already set on this
   *   DateTime, or local if none.
   */
  public julianDayInTz(tz?: TzAny): JulianDay {
    const zdt = this.withTz(tz ?? (this._value instanceof Temporal.ZonedDateTime ? undefined : 'local'))
      ._value as Temporal.ZonedDateTime;
    const { year, month, day } = zdt;
    // Proleptic Gregorian calendar → Julian Day Number (integer, noon-based)
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return (day + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045) as JulianDay;
  }

  /**
   * Returns a new DateTime set to the start of the calendar day (00:00:00.000)
   * using the timezone already set on this DateTime.
   *
   * - If the internal value is a `ZonedDateTime`, its timezone is used.
   * - If the internal value is an `Instant`, UTC is used.
   * - If the internal value is a `PlainDateTime`, the local timezone is used.
   *
   * Chain `.withTimezone()` before this method to operate in a specific timezone.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:45.123Z');
   * d.startOfDay().toISOString(); // "2024-03-15T00:00:00.000Z"
   *
   * const d2 = DateTime.from('2024-03-15T10:30:45.123Z').withTz('America/New_York');
   * d2.startOfDay().toISOString(); // "2024-03-15T00:00:00.000-04:00"
   * ```
   */
  public startOfDay(): DateTime {
    const zdt = this.#zonedDateTimeForCalendar();
    return new DateTime(zdt.with({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }));
  }

  /**
   * Returns a new DateTime set to the end of the calendar day.
   * By default this is 23:59:59.999 (one millisecond before the next day).
   * The `backoffMs` parameter controls how far to back off from the start
   * of the next day.
   *
   * - If the internal value is a `ZonedDateTime`, its timezone is used.
   * - If the internal value is an `Instant`, UTC is used.
   * - If the internal value is a `PlainDateTime`, the local timezone is used.
   *
   * @param backoffMs - Milliseconds to subtract from the start of the next day.
   *   Defaults to 1, giving 23:59:59.999. Use 0 for the exact start of the next day.
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * d.endOfDay().toISOString();       // "2024-03-15T23:59:59.999Z"
   * d.endOfDay(0).toISOString();      // "2024-03-16T00:00:00.000Z"
   * d.endOfDay(1000).toISOString();   // "2024-03-15T23:59:59.000Z"
   * ```
   */
  public endOfDay(backoffMs: number = 1): DateTime {
    return this.startOfDay().add({ days: 1 }).subtract({ milliseconds: backoffMs });
  }

  /**
   * Returns a new DateTime set to the start of the calendar year (Jan 1 00:00:00.000)
   * using the timezone already set on this DateTime.
   *
   * - If the internal value is a `ZonedDateTime`, its timezone is used.
   * - If the internal value is an `Instant`, UTC is used.
   * - If the internal value is a `PlainDateTime`, the local timezone is used.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-07-15T10:30:00Z');
   * d.startOfYear().toISOString(); // "2024-01-01T00:00:00.000Z"
   * ```
   */
  public startOfYear(): DateTime {
    const zdt = this.#zonedDateTimeForCalendar();
    return new DateTime(
      zdt.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }),
    );
  }

  /**
   * Returns a new DateTime set to the end of the calendar year.
   * By default this is Dec 31 23:59:59.999 (one millisecond before the next year).
   *
   * @param backoffMs - Milliseconds to subtract from the start of the next year.
   *   Defaults to 1.
   * @example
   * ```typescript
   * const d = DateTime.from('2024-07-15T10:30:00Z');
   * d.endOfYear().toISOString(); // "2024-12-31T23:59:59.999Z"
   * ```
   */
  public endOfYear(backoffMs: number = 1): DateTime {
    return this.startOfYear().add({ years: 1 }).subtract({ milliseconds: backoffMs });
  }

  /**
   * Returns a new DateTime set to the start of the calendar month (1st 00:00:00.000)
   * using the timezone already set on this DateTime.
   *
   * - If the internal value is a `ZonedDateTime`, its timezone is used.
   * - If the internal value is an `Instant`, UTC is used.
   * - If the internal value is a `PlainDateTime`, the local timezone is used.
   *
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * d.startOfMonth().toISOString(); // "2024-03-01T00:00:00.000Z"
   * ```
   */
  public startOfMonth(): DateTime {
    const zdt = this.#zonedDateTimeForCalendar();
    return new DateTime(
      zdt.with({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }),
    );
  }

  /**
   * Returns a new DateTime set to the end of the calendar month.
   * By default this is the last millisecond of the last day of the month.
   *
   * @param backoffMs - Milliseconds to subtract from the start of the next month.
   *   Defaults to 1.
   * @param tz - The timezone to use for the calculation. Defaults to 'local'.
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * d.endOfMonth().toISOString(); // "2024-03-31T23:59:59.999Z"
   * ```
   */
  public endOfMonth(backoffMs: number = 1, tz: TzAny = 'local'): DateTime {
    return this.startOfMonth().add({ months: 1 }, tz).subtract({ milliseconds: backoffMs }, tz);
  }

  /**
   * Returns a new DateTime set to the start of the calendar week at 00:00:00.000
   * using the timezone already set on this DateTime.
   *
   * The week start day follows ISO-8601 conventions where Monday=1 and Sunday=7.
   *
   * - If the internal value is a `ZonedDateTime`, its timezone is used.
   * - If the internal value is an `Instant`, UTC is used.
   * - If the internal value is a `PlainDateTime`, the local timezone is used.
   *
   * @param dayOfWeek - The day that starts the week (1=Monday, 7=Sunday). Defaults to 1.
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z'); // Friday
   * d.startOfWeek().toISOString();            // "2024-03-11T00:00:00.000Z" (Monday)
   * d.startOfWeek(7).toISOString();           // "2024-03-10T00:00:00.000Z" (Sunday)
   * d.startOfWeek(5).toISOString();           // "2024-03-15T00:00:00.000Z" (Friday)
   * ```
   */
  startOfWeek(dayOfWeek: number = 1): DateTime {
    const zdt = this.#zonedDateTimeForCalendar();

    // Calculate difference to the requested start day
    const diff = (zdt.dayOfWeek - dayOfWeek + 7) % 7;

    // 1. Subtract the days
    // 2. Use startOfDay() - it's cleaner than manually setting 00:00:00
    const startZdt = zdt.subtract({ days: diff }).startOfDay();

    return DateTime.of(startZdt);
  }

  /**
   * Returns a new DateTime set to the end of the calendar week.
   * By default this is the last millisecond before the start of the next week.
   *
   * @param dayOfWeek - The day that starts the week (1=Monday, 7=Sunday). Defaults to 1.
   * @param backoffMs - Milliseconds to subtract from the start of the next week.
   *   Defaults to 1.
   * @example
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z'); // Friday
   * d.endOfWeek().toISOString();      // "2024-03-17T23:59:59.999Z" (Sunday)
   * d.endOfWeek(7).toISOString();     // "2024-03-16T23:59:59.999Z" (Saturday)
   * ```
   */
  endOfWeek(dayOfWeek: number = 1, backoffMs: number = 1): DateTime {
    return this.startOfWeek(dayOfWeek).add({ weeks: 1 }).subtract({ milliseconds: backoffMs });
  }

  /**
   * Returns the `Temporal.PlainDate` for the calendar date this DateTime falls
   * on in the given timezone.
   *
   * @param tz - Timezone to use. Defaults to the timezone already set, or local.
   */
  toPlainDate(tz?: TzAny): Temporal.PlainDate {
    // Determine the context. If no TZ provided, try to use existing, fallback to local.
    const contextTz = tz ?? (this._value instanceof Temporal.ZonedDateTime ? undefined : 'local');

    // withTz handles the conversion logic
    const dt = this.withTz(contextTz);

    // Access the temporal object directly (casting safely because withTz returns a ZonedDateTime)
    return (dt.temporal as Temporal.ZonedDateTime).toPlainDate();
  }

  /**
   * Parses an IANA time zone string to get the equivalent offset in minutes for
   * the date stored in this `DateTime` object. The offset can vary by date due
   * to Daylight Saving Time.
   *
   * Uses ISO 8601 convention where positive values indicate timezones ahead of UTC
   * (e.g., Asia) and negative values indicate timezones behind UTC (e.g., Americas).
   *
   * @param iana The IANA time zone string (e.g., "America/New_York").
   * @returns The time zone offset in minutes, or `undefined` if parsing fails.
   *          A positive value indicates a time zone that is ahead of UTC (e.g.,
   *          Asia), while a negative value indicates a time zone behind UTC
   *          (e.g., Americas).
   *
   * @example
   * ```ts
   * // Get the offset for a winter date (EST = UTC-05:00)
   * const dWinter = DateTime.from('2024-01-01T12:00:00Z');
   * const estOffset = dWinter.getOffsetForIANA("America/New_York");
   * // estOffset will be -300
   *
   * // Get the offset for a summer date (EDT = UTC-04:00)
   * const dSummer = DateTime.from('2024-07-01T12:00:00Z');
   * const edtOffset = dSummer.getOffsetForIANA("America/New_York");
   * // edtOffset will be -240
   *
   * // Asia/Tokyo is ahead of UTC (UTC+09:00)
   * const dTokyo = DateTime.from('2024-01-01T12:00:00Z');
   * const tokyoOffset = dTokyo.getOffsetForIANA("Asia/Tokyo");
   * // tokyoOffset will be +540
   * ```
   */
  getTzOffsetForIANA(iana: IANATZ): TzMinutes | undefined {
    try {
      // 1. Get an Instant from our internal value
      let instant: Temporal.Instant;

      if (this._value instanceof Temporal.Instant) {
        instant = this._value;
      } else if (this._value instanceof Temporal.ZonedDateTime) {
        instant = this._value.toInstant();
      } else {
        // For PlainDateTime, we must assume a timezone to find the offset
        // Use the system local timezone as your previous code did
        const localTz = Temporal.Now.timeZoneId();
        instant = this._value.toZonedDateTime(localTz).toInstant();
      }

      // 2. Use Temporal to get the offset string (e.g., "-05:00")
      // This is much faster and safer than Intl.DateTimeFormat
      const offsetString = instant.toZonedDateTimeISO(iana).offset;

      // 3. Convert ISO offset string to minutes
      // Temporal offsets are always in [+|-]HH:MM format or 'Z'
      if (offsetString === 'Z' || offsetString === '+00:00') {
        return 0 as TzMinutes;
      }

      const match = offsetString.match(/^([+-])(\d{2}):(\d{2})$/);
      if (!match) return undefined;

      const [_, signStr, hoursStr, minutesStr] = match;
      const sign = signStr === '+' ? 1 : -1;
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // Return total offset in minutes
      return (sign * (hours * 60 + minutes)) as TzMinutes;
    } catch {
      return undefined;
    }
  }
  /**
   * Get the date in a Google Sheets value. This method compensates for a bug in
   * Google Sheets where it incorrectly adjusts dates based on the sheet's
   * timezone setting. To ensure the date is displayed correctly in Google
   * Sheets, you must first set the timezone of the `DateTime` object to match
   * the timezone of the Google Sheet using the `tz()` method.
   *
   * @returns A number which is the date with a value suitable for use in Google
   * Sheets.
   *
   * @example
   * ```ts
   * const d = DateTime.from('2024-01-01T12:00:00.000Z');
   * d.setTz('America/New_York' as IANATZ);
   * const sheetValue = d.toGoogleSheetsDate();
   * ```
   */
  toGoogleSheetsDate(): GoogleSheetsDate {
    this.#validate();

    // 1. Convert whatever we have to a PlainDateTime (Wall Clock)
    // If it's a ZonedDateTime, we use its specific timezone.
    // If it's an Instant, we must assume a timezone (usually 'local' or 'UTC').
    let plain: Temporal.PlainDateTime;

    if (this._value instanceof Temporal.PlainDateTime) {
      plain = this._value;
    } else if (this._value instanceof Temporal.ZonedDateTime) {
      plain = this._value.toPlainDateTime();
    } else {
      // For Instant: Convert to the local wall clock time
      plain = this._value.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDateTime();
    }

    // 2. Calculate epoch milliseconds for this Wall Clock time as if it were UTC.
    // This aligns it with the tNullMs (Dec 30, 1899) which is also wall-clock based.
    const wallClockMs = plain.toZonedDateTime('UTC').epochMilliseconds;

    // 3. Simple division: (Difference in MS) / (MS per Day)
    return (wallClockMs - tNullMs) / MS_PER_DAY as GoogleSheetsDate;
  }

  /**
   * Converts a Google Sheets serial date to a DateTime instance. Google Sheets serials represent
   * the number of days since Dec 30, 1899, and are created with a local timezone offset. To
   * correctly convert a Google Sheets serial date to a DateTime object, you must provide the IANA
   * timezone string of the spreadsheet. This ensures that the conversion accounts for any
   * timezone differences and DST transitions specific to that zone.
   *
   * @param serial The Google Sheets serial date number.
   * @param ianaTz The IANA timezone string of the spreadsheet, which is a required parameter. This
   * value can be retrieved from the spreadsheet's settings.
   * @returns A DateTime object.
   */
  /**
   * Converts a Google Sheets serial date to a DateTime instance.
   * Google Sheets serials represent the number of days since Dec 30, 1899.
   */
  static fromGoogleSheetsDate(serial: GoogleSheetsDate, ianaTz: IANATZ): DateTime | undefined {
    if (!_.isNumber(serial)) {
      return undefined;
    }

    // 1. Calculate the absolute epoch milliseconds
    // tNullMs should be the epoch for 1899-12-30
    const ms = MS_PER_DAY * serial + tNullMs;

    // 2. Google Sheets dates represent "Wall Clock" time.
    // We create an Instant representing that wall clock time in UTC.
    const tempInstant = Temporal.Instant.fromEpochMilliseconds(ms);

    // 3. Convert that Instant to a PlainDateTime (removing the UTC context)
    const plain = tempInstant.toZonedDateTimeISO('UTC').toPlainDateTime();

    // 4. "Attach" the intended timezone to that wall-clock time
    // This correctly handles DST transitions for that specific IANA zone.
    try {
      const zdt = plain.toZonedDateTime(ianaTz);
      return DateTime.of(zdt);
    } catch (_e) {
      // Fallback if IANA zone is invalid or transition is ambiguous
      return DateTime.from(ms);
    }
  }

  /**
   * Creates a DateTime from a PDF date string (e.g., "D:20230526144100-06'00'").
   * Returns undefined if the string is not a valid PDF date format.
   */
  static fromPdfDate(s: string): DateTime | undefined {
    // PDF Date Format: D:YYYYMMDDHHmmSSOHH'mm'
    const p = s.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(.*)$/);
    if (!p) return undefined;

    const [_full, year, month, day, hour, minute, second, tzRaw] = p;

    // Create the base DateTime using our components factory.
    // Note: PDF months are 01-12, which matches our 1-indexed fromComponents.
    const dt = DateTime.fromComponents(
      _.asInt(year),
      _.asInt(month),
      _.asInt(day),
      _.asInt(hour),
      _.asInt(minute),
      _.asInt(second),
    );

    if (util.isPDFTZ(tzRaw)) {
      const tzOffset: TzMinutes | undefined = util.parsePDFTZ(tzRaw);

      if (tzOffset !== undefined) {
        // withTz returns a new DateTime instance with the offset applied
        return dt.withTz(tzOffset);
      }
    }

    return dt;
  }

  /**
   * Returns the underlying date as a native JavaScript Date object.
   */
  get date(): Date {
    if (this._value instanceof Temporal.Instant || this._value instanceof Temporal.ZonedDateTime) {
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
   * @returns
   * @deprecated Use getOffset() which follows ISO 8601 convention (positive = ahead of UTC).
   */
  getTz(): TzMinutes | undefined {
    return this.getTzOffset();
  }

  /**
   * @deprecated Use getOffsetForIANA()
   */
  ianaTzParse(iana: IANATZ): TzMinutes | undefined {
    return this.getTzOffsetForIANA(iana);
  }

  /**
   * @deprecated Use toGoogleSheetsDate()
   */
  googleSheetsDate(): GoogleSheetsDate {
    return this.toGoogleSheetsDate();
  }

  /**
   * Formats the date as a string in UTC using a custom format.
   *
   * @deprecated Use `withTz('utc').format()` instead. For example:
   * ```typescript
   * const d = DateTime.from('2024-03-15T10:30:00Z');
   * // Old way
   * d.formatUTC('yyyy-MM-dd HH:mm:ss');
   * // New way
   * d.withTz('utc').format('yyyy-MM-dd HH:mm:ss'); // "2024-03-15 10:30:00"
   * ```
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
    // Delegate to withTz('utc').format()
    return this.withTz('utc').format(format);
  }
}
