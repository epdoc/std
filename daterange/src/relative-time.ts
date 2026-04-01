/**
 * @module
 *
 * This module provides utilities for parsing relative time strings like "1d12h30m",
 * "-2h", "now", "today", etc., and converting them to Temporal.Instant values.
 *
 * @example
 * ```ts
 * import { parseRelativeTime } from '@epdoc/daterange';
 *
 * const oneDayAgo = parseRelativeTime('1d');
 * const future = parseRelativeTime('-1h');  // 1 hour from now
 * const startOfToday = parseRelativeTime('today');
 * ```
 */
import { isString } from '@epdoc/type';

// Time unit multipliers in milliseconds
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_YEAR = 365.25 * MS_PER_DAY; // Average accounting for leap years

/**
 * Maps time unit characters to their millisecond values.
 */
const UNIT_MULTIPLIERS: Record<string, number> = {
  y: MS_PER_YEAR,
  d: MS_PER_DAY,
  h: MS_PER_HOUR,
  m: MS_PER_MINUTE,
  s: MS_PER_SECOND,
};

/**
 * Parses a relative time string and returns a Temporal.Instant.
 *
 * Supported formats:
 * - Single units: "1d", "2h", "30m", "10s", "1y"
 * - Combined units: "1d12h", "2h30m15s", "1y6m"
 * - Negative (future): "-1d", "-2h30m"
 * - Keywords: "now", "today", "yesterday", "tomorrow", "startOfDay", "endOfDay"
 *
 * @param input - The relative time string to parse
 * @param reference - The reference instant (defaults to current time)
 * @returns A Temporal.Instant, or undefined if the input cannot be parsed
 *
 * @example
 * ```ts
 * // Past (relative to now)
 * parseRelativeTime('1d');     // 24 hours ago
 * parseRelativeTime('2h30m');  // 2 hours 30 minutes ago
 * parseRelativeTime('30s');    // 30 seconds ago
 *
 * // Future (negative values)
 * parseRelativeTime('-1h');    // 1 hour from now
 * parseRelativeTime('-30m');   // 30 minutes from now
 *
 * // Keywords
 * parseRelativeTime('now');         // Current instant
 * parseRelativeTime('today');       // Start of today (00:00:00 local time)
 * parseRelativeTime('yesterday');   // Start of yesterday
 * parseRelativeTime('tomorrow');    // Start of tomorrow
 * parseRelativeTime('startOfDay');  // Same as 'today'
 * parseRelativeTime('endOfDay');    // End of today (23:59:59.999)
 * ```
 */
export function parseRelativeTime(
  input: string,
  reference?: Temporal.Instant,
): Temporal.Instant | undefined {
  if (!isString(input)) {
    return undefined;
  }

  const trimmed = input.trim().toLowerCase();
  const now = reference ?? Temporal.Now.instant();

  // Handle keywords
  const keywordResult = parseKeyword(trimmed, now);
  if (keywordResult !== undefined) {
    return keywordResult;
  }

  // Handle relative time with units (e.g., "1d12h", "-2h30m")
  return parseUnitExpression(trimmed, now);
}

/**
 * Parses keyword-based relative time strings.
 */
function parseKeyword(input: string, now: Temporal.Instant): Temporal.Instant | undefined {
  // Get local timezone for day-boundary calculations
  const localTz = Temporal.Now.timeZoneId();

  switch (input) {
    case 'now':
      return now;

    case 'today':
    case 'startofday': {
      // Get the current date in local timezone, then create instant at 00:00:00
      const zdt = now.toZonedDateTimeISO(localTz);
      const startOfDay = Temporal.PlainDateTime.from({
        year: zdt.year,
        month: zdt.month,
        day: zdt.day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      return startOfDay.toZonedDateTime(localTz).toInstant();
    }

    case 'endofday': {
      const zdt = now.toZonedDateTimeISO(localTz);
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

    case 'yesterday': {
      const zdt = now.toZonedDateTimeISO(localTz);
      const yesterday = zdt.subtract({ days: 1 });
      const startOfYesterday = Temporal.PlainDateTime.from({
        year: yesterday.year,
        month: yesterday.month,
        day: yesterday.day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      return startOfYesterday.toZonedDateTime(localTz).toInstant();
    }

    case 'tomorrow': {
      const zdt = now.toZonedDateTimeISO(localTz);
      const tomorrow = zdt.add({ days: 1 });
      const startOfTomorrow = Temporal.PlainDateTime.from({
        year: tomorrow.year,
        month: tomorrow.month,
        day: tomorrow.day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      return startOfTomorrow.toZonedDateTime(localTz).toInstant();
    }

    default:
      return undefined;
  }
}

/**
 * Parses unit-based expressions like "1d12h30m" or "-2h".
 */
function parseUnitExpression(input: string, now: Temporal.Instant): Temporal.Instant | undefined {
  // Check for negative sign (indicates future time)
  let isNegative = false;
  let expr = input;

  if (expr.startsWith('-')) {
    isNegative = true;
    expr = expr.slice(1).trim();
  } else if (expr.startsWith('+')) {
    expr = expr.slice(1).trim();
  }

  // Parse all unit-value pairs (e.g., "1d12h30m" -> [{value: 1, unit: 'd'}, ...])
  const pattern = /^(\d+)([y,d,h,m,s])/gi;
  let totalMs = 0;
  let hasMatch = false;
  let remaining = expr;

  while (remaining.length > 0) {
    pattern.lastIndex = 0;
    const match = pattern.exec(remaining);

    if (!match) {
      // If we haven't matched anything yet, this is not a valid expression
      if (!hasMatch) {
        return undefined;
      }
      // If we have matches but can't parse more, check if remaining is just whitespace
      if (remaining.trim().length === 0) {
        break;
      }
      return undefined;
    }

    hasMatch = true;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multiplier = UNIT_MULTIPLIERS[unit];

    if (multiplier === undefined) {
      return undefined;
    }

    totalMs += value * multiplier;
    remaining = remaining.slice(match[0].length);
  }

  if (!hasMatch) {
    return undefined;
  }

  // Apply the offset (negative means future, positive means past)
  const offsetMs = isNegative ? -totalMs : totalMs;
  return now.subtract({ milliseconds: offsetMs });
}
