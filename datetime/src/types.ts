import type { Brand, Integer } from '@epdoc/type';

/**
 * Represents a timezone offset in minutes from UTC.
 * This is a **semantic type alias** for `number` (specifically an integer in the range -720 to +720),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {Integer} Milliseconds
 */
export type TzMinutes = Integer;

/**
 * A string representing a date in ISO 8601 format.
 * @example "2024-01-01T12:00:00Z"
 */
export type ISODate = Brand<string, 'ISODate'>;

/**
 * A string representing a timezone offset in ISO 8601 format.
 * @example "-06:00", "+01:00", "Z"
 */
export type ISOTZ = Brand<string, 'ISOTZ'>;

/**
 * A string representing a timezone offset in GMT format.
 * @example "GMT-05:00", "GMT+01:00"
 */
export type GMTTZ = Brand<string, 'GMTTZ'>;

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
