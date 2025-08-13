import { DateRanges } from './date-ranges.ts';
import type { Integer } from './dep.ts';

const DAY_MS = 24 * 3600 * 1000;

/**
 * Represents a definition of a date range with optional before and after dates.
 * @typedef {Object} DateRangeDef
 * @property {Date} [before] - The end datetime of the range.
 * @property {Date} [after] - The start datetime of the range.
 */

export type DateRangeDef = {
  before?: Date;
  after?: Date;
};

/**
 * Converts a string representation of date ranges into an array of `DateRangeDef` objects. This
 * function supports various date string formats and range specifications.
 *
 * Supported single date formats:
 * - `YYYY`: Represents the entire year. `after` is Jan 1st, `before` is Jan 1st of the next year.
 * - `YYYYMM`: Represents the entire month. `after` is the 1st day of the month, `before` is the 1st
 *   day of the next month.
 * - `YYYYMMDD`: Represents the entire day. `after` is the start of the day, `before` is the start
 *   of the next day.
 * - `YYYYMMDDhh`, `YYYYMMDDhhmm`, `YYYYMMDDhhmmss`: Represents a precise point in time.
 *
 * Supported range formats (separated by '-'):
 * - `start-end`: Both `start` and `end` can be any of the above formats. The `before` date for the
 *   `end` part of the range is calculated to include the entire specified period. For example,
 *   `20250101-20250102` includes all of Jan 1 and Jan 2. A mixed-format range like
 *   `2025010113-20250102` starts at 13:00 on Jan 1 and includes all of Jan 2.
 * - `start-`: Open-ended range, `before` is `undefined`.
 * - `-end`: Open-ended range, `after` is `undefined`.
 *
 * Multiple ranges can be specified by separating them with commas (e.g., "2025,202601-202603").
 * @param {string} val - A string containing date ranges separated by commas.
 * @param {number} h - The hour of the day, in local time, to use for zeroing to the beginning or
 * end of a day, when not specified in the definitions. This naturally defaults to 0h.
 * @returns {DateRangeDef[]} An array of DateRangeDef objects.
 */
export function dateList(val: string, h: Integer = 0): DateRangeDef[] {
  const result: DateRangeDef[] = [];
  // Trim whitespace from input and filter out empty strings from the split
  const ranges = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  for (const range of ranges) {
    const p = range.split('-');
    let after: Date | undefined;
    let before: Date | undefined;

    try {
      if (p.length > 1) { // A range like "date1-date2", "date1-", or "-date2"
        const startStr = p[0].trim();
        const endStr = p[1].trim();

        if (startStr) {
          after = dateStringToDate(startStr, h);
        }
        if (endStr) {
          const tempDate = dateStringToDate(endStr, h);
          before = calculateBeforeDate(tempDate, endStr.length, h);
        }
      } else { // A single date specification (e.g., "2025", "202501", "20250101", "2025010112")
        after = dateStringToDate(range, h);
        before = calculateBeforeDate(after, range.length, h);
      }
    } catch (e: unknown) {
      // Re-throw the error to be handled by the caller, instead of exiting.
      throw e;
    }
    result.push({ after, before });
  }
  return result;
}

/**
 * Converts a string representation of date ranges into a `DateRanges` object. This
 * function supports various date string formats and range specifications.
 *
 * Supported single date formats:
 * - `YYYY`: Represents the entire year. `after` is Jan 1st, `before` is Jan 1st of the next year.
 * - `YYYYMM`: Represents the entire month. `after` is the 1st day of the month, `before` is the 1st
 *   day of the next month.
 * - `YYYYMMDD`: Represents the entire day. `after` is the start of the day, `before` is the start
 *   of the next day.
 * - `YYYYMMDDhh`, `YYYYMMDDhhmm`, `YYYYMMDDhhmmss`: Represents a precise point in time.
 *
 * Supported range formats (separated by '-'):
 * - `start-end`: Both `start` and `end` can be any of the above formats. The `before` date for the
 *   `end` part of the range is calculated to include the entire specified period. For example,
 *   `20250101-20250102` includes all of Jan 1 and Jan 2. A mixed-format range like
 *   `2025010113-20250102` starts at 13:00 on Jan 1 and includes all of Jan 2.
 * - `start-`: Open-ended range, `before` is `undefined`.
 * - `-end`: Open-ended range, `after` is `undefined`.
 *
 * Multiple ranges can be specified by separating them with commas (e.g., "2025,202601-202603").
 * @param {string} val - A string containing date ranges separated by commas.
 * @param {number} h - The hour of the day, in local time, to use for zeroing to the beginning or
 * end of a day, when not specified in the definitions. This naturally defaults to 0h.
 * @returns {DateRanges} An object containing an array of date ranges.
 */
export function dateRanges(val: string, h: Integer = 0): DateRanges {
  const defs = dateList(val, h);
  return new DateRanges(defs);
}

/**
 * Calculates the 'before' date for a given 'after' date based on the original string length.
 * This ensures that the entire specified period (year, month, or day) is included.
 * For precise timestamps, 'before' will be the same as 'after'.
 * @param startDateOfPeriod The calculated start date of the period for which to find the end.
 * @param originalLength The length of the original date string (e.g., 4 for YYYY, 6 for YYYYMM).
 * @param h The default hour to use.
 * @returns The calculated 'before' date.
 */
function calculateBeforeDate(startDateOfPeriod: Date, originalLength: number, h: Integer): Date {
  if (originalLength === 4) { // YYYY
    return new Date(startDateOfPeriod.getFullYear() + 1, 0, 1, h);
  } else if (originalLength === 6) { // YYYYMM
    return new Date(startDateOfPeriod.getFullYear(), startDateOfPeriod.getMonth() + 1, 1, h);
  } else if (originalLength === 8) { // YYYYMMDD
    return new Date(startDateOfPeriod.getTime() + DAY_MS);
  } else { // YYYYMMDDhh, YYYYMMDDhhmm, YYYYMMDDhhmmss - precise timestamp
    return startDateOfPeriod;
  }
}

/**
 * Helper to get the number of days in a given month and year.
 * @param year The year.
 * @param month The month (0-11).
 * @returns The number of days in the month.
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Converts a date string in various formats to a `Date` object.
 *
 * Supported formats:
 * - `YYYY` (e.g., "2025")
 * - `YYYYMM` (e.g., "202501")
 * - `YYYYMMDD` (e.g., "20250115")
 * - `YYYYMMDDhh` (e.g., "2025011510")
 * - `YYYYMMDDhhmm` (e.g., "202501151030")
 * - `YYYYMMDDhhmmss` (e.g., "20250115103045")
 * to a Date object. As with the Date constructor, the timezone uses the local timezone.
 * @param {string} s - The date string to convert.
 * @param {Integer} [h=0] - The hour to set for the Date object (default is 0).
 * @returns {Date} The corresponding Date object.
 * @throws {Error} Throws an error if the date string is invalid.
 */
export function dateStringToDate(s: string, h: Integer = 0): Date {
  let year: number, month: number, day: number;
  let hour: number = h;
  let minute = 0;
  let second = 0;

  let p: RegExpMatchArray | null;

  if (s.length === 4) { // YYYY
    p = s.match(/^(\d{4})$/);
    if (!p) throw new Error('Invalid year format');
    year = parseInt(p[1], 10);
    month = 0; // January
    day = 1;
  } else if (s.length === 6) { // YYYYMM
    p = s.match(/^(\d{4})(\d\d)$/);
    if (!p) throw new Error('Invalid month format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10) - 1;
    day = 1;
  } else if (s.length === 8) { // YYYYMMDD
    p = s.match(/^(\d{4})(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid day format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10) - 1;
    day = parseInt(p[3], 10);
  } else if (s.length === 10) { // YYYYMMDDhh
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid hour format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10) - 1;
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
  } else if (s.length === 12) { // YYYYMMDDhhmm
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid minute format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10) - 1;
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
    minute = parseInt(p[5], 10);
  } else if (s.length === 14) { // YYYYMMDDhhmmss
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid second format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10) - 1;
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
    minute = parseInt(p[5], 10);
    second = parseInt(p[6], 10);
  } else {
    throw new Error(`Invalid date string length: ${s}`);
  }

  // Basic validation for parsed values
  if (month < 0 || month > 11) throw new Error(`Invalid month value: ${month + 1}`);
  if (day < 1 || day > getDaysInMonth(year, month)) throw new Error(`Invalid day value: ${day} for month ${month + 1}`);
  if (hour < 0 || hour > 23) throw new Error(`Invalid hour value: ${hour}`);
  if (minute < 0 || minute > 59) throw new Error(`Invalid minute value: ${minute}`);
  if (second < 0 || second > 59) throw new Error(`Invalid second value: ${second}`);

  return new Date(year, month, day, hour, minute, second, 0);
}
