import type { Integer } from '@epdoc/type';

/**
 * Represents a timezone offset in minutes from UTC.
 */
export type Minutes = Integer;

/**
 * A string representing a timezone offset in ISO 8601 format.
 * @example "-06:00", "+01:00", "Z"
 */
export type ISOTZ = string;

/**
 * A string representing a timezone offset in GMT format.
 * @example "GMT-05:00", "GMT+01:00"
 */
export type GMTTZ = string;

/**
 * A string representing a timezone offset in the format found in PDF file
 * date strings.
 * @example "-0600", "-06", "+03", "Z"
 */
export type PDFTZ = string;

/**
 * A string representing an IANA (Internet Assigned Numbers Authority) timezone.
 * @example "America/New_York", "Europe/London", "Asia/Tokyo"
 */
export type IANATZ = string;

/**
 * An integer value representing the Julian Day, a continuous count of days
 * since the beginning of the Julian Period.
 * @see {@link https://en.wikipedia.org/wiki/Julian_day}
 */
export type JulianDay = Integer;

/**
 * A floating-point number representing a date and time in a format compatible
 * with Google Sheets.
 */
export type GoogleSheetsDate = number;

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
  offset?: Minutes;
  /**
   * A timezone offset in minutes. A value of 0 indicates UTC. If `undefined`,
   * the local timezone is used.
   */
  tz?: number | undefined;
}
