/**
 * @module
 *
 * This module provides utility functions for parsing date range strings and converting
 * them to DateTime-based date ranges.
 */
import { DateTime } from '@epdoc/datetime';
import type { Integer } from '@epdoc/type';
import { DateRanges } from './date-ranges.ts';
import { parseRelativeTime } from './relative-time.ts';
import type { DateRangeDef, DateRangeParseOptions } from './types.ts';

const _DAY_MS = 24 * 3600 * 1000;

/**
 * Converts a compact date string to a DateTime in local time.
 *
 * Supported formats:
 * - `YYYY`, `YYYYMM`, `YYYYMMDD`
 * - `YYYYMMDDhh`, `YYYYMMDDhhmm`, `YYYYMMDDhhmmss`
 *
 * All times are interpreted in the local timezone.
 */
export function dateStringToInstant(s: string, h: Integer = 0): DateTime {
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

  return DateTime.of(plainDateTime.toZonedDateTime(localTz));
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

  const ranges = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  for (const range of ranges) {
    const p = range.split('-');
    let after: DateTime | undefined;
    let before: DateTime | undefined;

    try {
      if (p.length > 1) {
        const startStr = p[0].trim();
        const endStr = p[1].trim();

        if (startStr) {
          after = parseRangeComponent(startStr, reference) ?? dateStringToInstant(startStr, defaultHour);
        }
        if (endStr) {
          const endDt = parseRangeComponent(endStr, reference) ?? dateStringToInstant(endStr, defaultHour);
          before = calculateBeforeInstant(endDt, endStr.length, defaultHour, inclusiveEnd);
        }
      } else {
        const dt = parseRangeComponent(range, reference) ?? dateStringToInstant(range, defaultHour);
        after = dt;
        before = calculateBeforeInstant(dt, range.length, defaultHour, inclusiveEnd);
      }
    } catch (e: unknown) {
      throw e;
    }
    result.push({ after, before });
  }
  return result;
}

/**
 * Parses a range component that could be a relative time string, ISO string, or compact date.
 * Returns a DateTime or undefined if not parseable as relative/ISO.
 * Compact digit-only strings (e.g. "20250115") are NOT parsed here — they go to dateStringToInstant.
 */
function parseRangeComponent(s: string, reference?: DateTime): DateTime | undefined {
  const relative = parseRelativeTime(s, reference);
  if (relative) return relative;

  // Only try ISO parsing for strings that look like ISO dates (contain - or T or Z)
  if (/[-TZ+]/.test(s)) {
    return DateTime.tryFrom(s);
  }

  return undefined;
}

/**
 * Calculates the 'before' DateTime for a given 'after' DateTime based on the original string length.
 */
function calculateBeforeInstant(
  start: DateTime,
  originalLength: number,
  h: number,
  inclusive: boolean,
): DateTime {
  // Ensure we are working with a ZonedDateTime in the local timezone
  const zdt = start.withTz('local').temporal as Temporal.ZonedDateTime;

  // Define the time components based on inclusivity
  const timeParams = inclusive
    ? { hour: 23, minute: 59, second: 59, millisecond: 999 }
    : { hour: h, minute: 0, second: 0, millisecond: 0 };

  switch (originalLength) {
    case 4: // YYYY - Move to the last moment of the year
      return DateTime.of(
        zdt.with({ month: 12, day: 31, ...timeParams }),
      );

    case 6: // YYYYMM - Move to the last moment of the month
      return DateTime.of(
        zdt.with({ day: zdt.daysInMonth, ...timeParams }),
      );

    case 8: // YYYYMMDD - Move to the end of the day or start of next
      if (inclusive) {
        return DateTime.of(zdt.with(timeParams));
      }
      // If exclusive, simply add 1 day
      return start.add({ days: 1 });

    default: // Precise timestamp or unrecognized length
      return start;
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
  return DateRanges.fromDef(defs);
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
  return new Date(dateStringToInstant(s, h).epochMilliseconds);
}
