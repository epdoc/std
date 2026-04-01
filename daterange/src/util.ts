/**
 * @module
 *
 * This module provides utility functions for parsing date range strings and converting
 * them to Temporal.Instant-based date ranges.
 */
import type { Integer } from '@epdoc/type';
import { DateRanges } from './date-ranges.ts';
import { parseRelativeTime } from './relative-time.ts';
import type { DateRangeDef, DateRangeParseOptions } from './types.ts';

const DAY_MS = 24 * 3600 * 1000;

/**
 * Converts a compact date string to a Temporal.Instant in local time.
 *
 * Supported formats:
 * - `YYYY` (e.g., "2025")
 * - `YYYYMM` (e.g., "202501")
 * - `YYYYMMDD` (e.g., "20250115")
 * - `YYYYMMDDhh` (e.g., "2025011510")
 * - `YYYYMMDDhhmm` (e.g., "202501151030")
 * - `YYYYMMDDhhmmss` (e.g., "20250115103045")
 *
 * All times are interpreted in the local timezone.
 *
 * @param s - The date string to convert
 * @param h - Default hour (0-23) for day-only formats (default: 0)
 * @returns A Temporal.Instant representing the local date/time
 * @throws Error if the date string is invalid
 */
export function dateStringToInstant(s: string, h: Integer = 0): Temporal.Instant {
  let year: number, month: number, day: number;
  let hour: number = h;
  let minute = 0;
  let second = 0;

  let p: RegExpMatchArray | null;

  if (s.length === 4) { // YYYY
    p = s.match(/^(\d{4})$/);
    if (!p) throw new Error('Invalid year format');
    year = parseInt(p[1], 10);
    month = 1; // January
    day = 1;
  } else if (s.length === 6) { // YYYYMM
    p = s.match(/^(\d{4})(\d\d)$/);
    if (!p) throw new Error('Invalid month format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10);
    day = 1;
  } else if (s.length === 8) { // YYYYMMDD
    p = s.match(/^(\d{4})(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid day format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10);
    day = parseInt(p[3], 10);
  } else if (s.length === 10) { // YYYYMMDDhh
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid hour format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10);
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
  } else if (s.length === 12) { // YYYYMMDDhhmm
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid minute format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10);
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
    minute = parseInt(p[5], 10);
  } else if (s.length === 14) { // YYYYMMDDhhmmss
    p = s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/);
    if (!p) throw new Error('Invalid second format');
    year = parseInt(p[1], 10);
    month = parseInt(p[2], 10);
    day = parseInt(p[3], 10);
    hour = parseInt(p[4], 10);
    minute = parseInt(p[5], 10);
    second = parseInt(p[6], 10);
  } else {
    throw new Error(`Invalid date string length: ${s}`);
  }

  // Basic validation for parsed values
  if (month < 1 || month > 12) throw new Error(`Invalid month value: ${month}`);
  if (day < 1 || day > getDaysInMonth(year, month)) throw new Error(`Invalid day value: ${day} for month ${month}`);
  if (hour < 0 || hour > 23) throw new Error(`Invalid hour value: ${hour}`);
  if (minute < 0 || minute > 59) throw new Error(`Invalid minute value: ${minute}`);
  if (second < 0 || second > 59) throw new Error(`Invalid second value: ${second}`);

  // Create PlainDateTime in local timezone, then convert to Instant
  const localTz = Temporal.Now.timeZoneId();
  const plainDateTime = Temporal.PlainDateTime.from({
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond: 0,
  });

  return plainDateTime.toZonedDateTime(localTz).toInstant();
}

/**
 * Converts a string representation of date ranges into an array of DateRangeDef objects.
 *
 * This function supports various date string formats, range specifications, and relative time strings.
 *
 * Supported single date formats (all in local timezone):
 * - `YYYY`: Represents the entire year. `after` is Jan 1st, `before` is Jan 1st of the next year.
 * - `YYYYMM`: Represents the entire month. `after` is the 1st day, `before` is the 1st of next month.
 * - `YYYYMMDD`: Represents the entire day. `after` is start of day, `before` is end of day (inclusive).
 * - `YYYYMMDDhh`, `YYYYMMDDhhmm`, `YYYYMMDDhhmmss`: Precise point in time.
 *
 * Relative time formats:
 * - `1d`, `2h`, `30m`, `10s`: Relative to reference time (past)
 * - `-1h`, `-30m`: Future relative to reference time
 * - `now`: Current instant
 * - `today`, `yesterday`, `tomorrow`: Start of day
 * - Combined: `1d12h30m`
 *
 * Supported range formats (separated by '-'):
 * - `start-end`: Both can be any format above
 * - `start-`: Open-ended range (before = end of time)
 * - `-end`: Open-ended range (after = beginning of time)
 *
 * Multiple ranges can be comma-separated (e.g., "2025,202601-202603,1d-now").
 *
 * @param val - A string containing date ranges separated by commas
 * @param options - Parse options including reference instant, inclusiveEnd flag, and defaultHour
 * @returns An array of DateRangeDef objects with Temporal.Instant values
 */
export function dateList(val: string, options: DateRangeParseOptions = {}): DateRangeDef[] {
  const { reference, inclusiveEnd = true, defaultHour = 0 } = options;
  const result: DateRangeDef[] = [];

  // Trim whitespace from input and filter out empty strings from the split
  const ranges = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  for (const range of ranges) {
    const p = range.split('-');
    let after: Temporal.Instant | undefined;
    let before: Temporal.Instant | undefined;

    try {
      if (p.length > 1) { // A range like "date1-date2", "date1-", or "-date2"
        const startStr = p[0].trim();
        const endStr = p[1].trim();

        if (startStr) {
          after = parseRangeComponent(startStr, reference) ?? dateStringToInstant(startStr, defaultHour);
        }
        if (endStr) {
          const endInstant = parseRangeComponent(endStr, reference) ?? dateStringToInstant(endStr, defaultHour);
          before = calculateBeforeInstant(endInstant, endStr.length, defaultHour, inclusiveEnd);
        }
      } else { // A single date specification (e.g., "2025", "202501", "20250101", "2025010112")
        const instant = parseRangeComponent(range, reference) ?? dateStringToInstant(range, defaultHour);
        after = instant;
        before = calculateBeforeInstant(instant, range.length, defaultHour, inclusiveEnd);
      }
    } catch (e: unknown) {
      // Re-throw the error to be handled by the caller
      throw e;
    }
    result.push({ after, before });
  }
  return result;
}

/**
 * Parses a range component that could be a relative time string or compact date.
 * @param s - The string to parse
 * @param reference - Reference instant for relative time parsing
 * @returns Temporal.Instant or undefined if not a relative time
 */
function parseRangeComponent(s: string, reference?: Temporal.Instant): Temporal.Instant | undefined {
  // Try relative time first
  const relative = parseRelativeTime(s, reference);
  if (relative) {
    return relative;
  }

  // Try ISO format
  try {
    return Temporal.Instant.from(s);
  } catch {
    // Not an ISO string - will be handled by dateStringToInstant
    return undefined;
  }
}

/**
 * Calculates the 'before' instant for a given 'after' instant based on the original string length.
 * This ensures that the entire specified period (year, month, or day) is included.
 *
 * @param startInstant - The calculated start instant of the period
 * @param originalLength - The length of the original date string (4 for YYYY, 6 for YYYYMM, etc.)
 * @param h - Default hour to use
 * @param inclusive - Whether to make end dates inclusive (23:59:59.999)
 * @returns The calculated 'before' instant
 */
function calculateBeforeInstant(
  startInstant: Temporal.Instant,
  originalLength: number,
  h: Integer,
  inclusive: boolean,
): Temporal.Instant {
  const localTz = Temporal.Now.timeZoneId();

  if (originalLength === 4) { // YYYY - end of year
    const zdt = startInstant.toZonedDateTimeISO(localTz);
    const endOfYear = Temporal.PlainDateTime.from({
      year: zdt.year,
      month: 12,
      day: 31,
      hour: inclusive ? 23 : h,
      minute: inclusive ? 59 : 0,
      second: inclusive ? 59 : 0,
      millisecond: inclusive ? 999 : 0,
    });
    return endOfYear.toZonedDateTime(localTz).toInstant();
  } else if (originalLength === 6) { // YYYYMM - end of month
    const zdt = startInstant.toZonedDateTimeISO(localTz);
    const daysInMonth = getDaysInMonth(zdt.year, zdt.month);
    const endOfMonth = Temporal.PlainDateTime.from({
      year: zdt.year,
      month: zdt.month,
      day: daysInMonth,
      hour: inclusive ? 23 : h,
      minute: inclusive ? 59 : 0,
      second: inclusive ? 59 : 0,
      millisecond: inclusive ? 999 : 0,
    });
    return endOfMonth.toZonedDateTime(localTz).toInstant();
  } else if (originalLength === 8) { // YYYYMMDD - end of day
    if (inclusive) {
      const zdt = startInstant.toZonedDateTimeISO(localTz);
      const endOfDay = Temporal.PlainDateTime.from({
        year: zdt.year,
        month: zdt.month,
        day: zdt.day,
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      });
      return endOfDay.toZonedDateTime(localTz).toInstant();
    }
    return startInstant.add({ milliseconds: DAY_MS });
  } else { // YYYYMMDDhh, YYYYMMDDhhmm, YYYYMMDDhhmmss - precise timestamp
    return startInstant;
  }
}

/**
 * Converts a string representation of date ranges into a DateRanges object.
 *
 * @param val - A string containing date ranges separated by commas
 * @param options - Parse options
 * @returns A DateRanges object
 */
export function dateRanges(val: string, options: DateRangeParseOptions = {}): DateRanges {
  const defs = dateList(val, options);
  return new DateRanges(defs);
}

/**
 * Helper to get the number of days in a given month and year.
 * @param year The year
 * @param month The month (1-12)
 * @returns The number of days in the month
 */
function getDaysInMonth(year: number, month: number): number {
  // Month is 1-12, create date for last day of month
  return new Date(year, month, 0).getDate();
}

/**
 * @deprecated Use dateStringToInstant instead
 */
export function dateStringToDate(s: string, h: Integer = 0): Date {
  const instant = dateStringToInstant(s, h);
  return new Date(instant.epochMilliseconds);
}
