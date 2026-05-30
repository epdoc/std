export type { Brand } from '@epdoc/type';
import type { Brand, Integer } from '@epdoc/type';

// ==========================================
// 1. Strict Template Literal Building Blocks
// ==========================================

/** A 4-digit year in template literal format: `${number}${number}${number}${number}` */
export type ISOYear = `${number}${number}${number}${number}`;

/** A 2-digit month in template literal format: `${number}${number}` */
export type ISOMonth = `${number}${number}`;

/** A 2-digit day in template literal format: `${number}${number}` */
export type ISODay = `${number}${number}`;

/** A 2-digit hour in template literal format: `${number}${number}` */
export type ISOHour = `${number}${number}`;

/** A 2-digit minute in template literal format: `${number}${number}` */
export type ISOMinute = `${number}${number}`;

/** A 2-digit second in template literal format: `${number}${number}` */
export type ISOSecond = `${number}${number}`;

/**
 * Fractional seconds with 1-9 digit precision.
 * Temporal supports millisecond to nanosecond precision (3-9 digits).
 * Matches patterns like "123", "123456", "123456789".
 */
export type ISOFractionalSeconds = `${number}${number}${number}${string}` | `${number}${number}${number}`;

/**
 * Strict ISO 8601 timezone offset without the 'Z' suffix.
 * Pattern: `${'+' | '-'}${number}${number}:${number}${number}`
 * @example "+05:00", "-06:00"
 */
export type StrictOffset = `${'+' | '-'}${number}${number}:${number}${number}`;

/**
 * Strict ISO 8601 timezone offset including 'Z' for UTC.
 * @example "Z", "+05:00", "-06:00"
 */
export type StrictISOTZ = 'Z' | StrictOffset;

/**
 * ISO 8601 date-only format: YYYY-MM-DD
 * @example "2024-03-15"
 */
export type ISO8601DateOnly = `${ISOYear}-${ISOMonth}-${ISODay}`;

/**
 * ISO 8601 time-only format with optional fractional seconds.
 * @example "10:30:00", "10:30:00.123", "10:30:00.123456"
 */
export type ISOTimeOnly =
  | `${ISOHour}:${ISOMinute}:${ISOSecond}`
  | `${ISOHour}:${ISOMinute}:${ISOSecond}.${ISOFractionalSeconds}`;

// ==========================================
// 2. Temporal-Aligned String Patterns
// ==========================================

/**
 * ISO 8601 instant pattern (UTC with 'Z' suffix).
 * Matches Temporal.Instant.toString() output.
 * @example "2024-03-15T10:30:00Z", "2024-03-15T10:30:00.123Z"
 */
export type PatternInstant = `${ISO8601DateOnly}T${ISOTimeOnly}Z`;

/**
 * ISO 8601 pattern with numeric timezone offset.
 * @example "2024-03-15T10:30:00+05:00", "2024-03-15T10:30:00.123-06:00"
 */
export type PatternOffset = `${ISO8601DateOnly}T${ISOTimeOnly}${StrictOffset}`;

/**
 * ISO 8601 zoned date-time pattern with IANA timezone name.
 * Matches Temporal.ZonedDateTime.toString() output.
 * @example "2024-03-15T10:30:00+05:00[Asia/Kolkata]", "2024-03-15T10:30:00Z[Europe/London]"
 */
export type PatternZoned = `${ISO8601DateOnly}T${ISOTimeOnly}${StrictISOTZ}[${string}]`;

export type TzAny = 'local' | 'utc' | TzMinutes | ISOTZ | IANATZ;
/**
 * Represents a timezone offset in minutes from UTC.
 * This is a **semantic type alias** for `number` (specifically an integer in the range -720 to +720),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {Integer} Milliseconds
 */
export type TzMinutes = Brand<Integer, 'TzMinutes'>;

/**
 * The ultimate generic ISO 8601 Date/Time string.
 * Encompasses all valid variations of full timestamp formats.
 */
export type ISODate = ISODateInstant | ISODateOffset;
export type ISODateAny = ISODateInstant | ISODateOffset | ISODateZoned;

/**
 * Matches Temporal.Instant.toString()
 * Always pinned to UTC with a trailing 'Z'.
 * @example "2026-05-30T15:30:00Z"
 */
export type ISODateInstant = Brand<PatternInstant, 'ISODateInstant'>;

/**
 * Matches a date-time with a numeric offset, but no named timezone location.
 * @example "2024-01-01T12:00:00-06:00"
 */
export type ISODateOffset = Brand<PatternOffset, 'ISODateOffset'> & { readonly __tz: true };

/**
 * Matches Temporal.ZonedDateTime.toString()
 * Includes the exact IANA geographic timezone in brackets.
 * @example "2026-05-30T09:30:00-06:00[America/Chicago]"
 * @example "2026-05-30T15:30:00Z[Europe/London]"
 */
export type ISODateZoned = Brand<PatternZoned, 'ISODateZoned'>;

/**
 * A string representing a timezone offset in ISO 8601 format.
 * @example "-06:00", "+01:00", "Z"
 */
export type ISOTZ = Brand<StrictISOTZ, 'ISOTZ'>;
/**
 * A string representing a timezone offset in GMT format.
 * @example "GMT-05:00", "GMT+01:00"
 */
export type GMTTZ = Brand<`GMT${StrictISOTZ}`, 'GMTTZ'>;
/**
 * A string representing a timezone offset in the format found in PDF file
 * date strings.
 * @example "-0600", "-06", "+03", "Z"
 */
export type PDFTZ = Brand<string, 'PDFTZ'>;

/**
 * A string representing an IANA (Internet Assigned Numbers Authority) timezone.
 * @example "America/New_York", "Europe/London", "Asia/Tokyo"
 */
export type IANATZ = Brand<string, 'IANATZ'>;

/**
 * An integer value representing the Julian Day, a continuous count of days
 * since the beginning of the Julian Period.
 * @see {@link https://en.wikipedia.org/wiki/Julian_day}
 */
export type JulianDay = Integer;

/**
 * A floating-point number representing a date and time in a format compatible
 * with Google Sheets.
 * This is a **semantic type alias** for `number` (specifically a non-negative number),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the number and non-negative constraints.
 */
export type GoogleSheetsDate = Brand<number, 'GoogleSheetsDate'>;

/**
 * Defines options for parsing date strings with the `stringToDate` function.
 */
export interface DateParseOptions {
  /**
   * An array of characters that can be used as separators for the year, month,
   * and day components of a date string.
   * @default ['-', '_', '/', ' ']
   */
  ymdSep?: string[];
  /**
   * An array of characters that can be used to separate the date and time
   * components of a string.
   * @default [' ', '_', '-']
   */
  midSep?: string[];
  /**
   * An array of characters that can be used as separators for the hour, minute,
   * and second components of a time string.
   * @default [':']
   */
  hmsSep?: string[];
  /**
   * The default value to use for unspecified time components (hour, minute,
   * second). Month and day will always default to 1.
   * @default 0 (midnight)
   */
  offset?: TzMinutes;
  /**
   * A timezone offset in minutes. A value of 0 indicates UTC. If `undefined`,
   * the local timezone is used.
   */
  tz?: number | undefined;
}

/**
 * Defines the timezone for a date.
 * - 'local': The local timezone of the machine.
 * - 'utc': Coordinated Universal Time.
 * - 'original': The original timezone of the Temporal.ZonedDateTime.
 */
export type DateTz = 'local' | 'utc' | 'original';

/**
 * Minimum representable instant (approximately -271821-04-20T00:00:00Z).
 * This represents the earliest possible instant that can be represented
 * using Temporal.Instant epoch milliseconds.
 */
export const INSTANT_MIN: Temporal.Instant = Temporal.Instant.fromEpochMilliseconds(-8640000000000000);

/**
 * Maximum representable instant (approximately +275760-09-13T00:00:00Z).
 * This represents the latest possible instant that can be represented
 * using Temporal.Instant epoch milliseconds.
 */
export const INSTANT_MAX: Temporal.Instant = Temporal.Instant.fromEpochMilliseconds(8640000000000000);
