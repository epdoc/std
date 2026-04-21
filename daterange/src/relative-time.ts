/**
 * @module
 *
 * Utilities for parsing relative time strings like "1d12h30m", "-2h", "now",
 * "today", etc., returning DateTime values.
 */
import { DateTime } from '@epdoc/datetime';
import { isString } from '@epdoc/type';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

const UNIT_MULTIPLIERS: Record<string, number> = {
  y: MS_PER_YEAR,
  d: MS_PER_DAY,
  h: MS_PER_HOUR,
  m: MS_PER_MINUTE,
  s: MS_PER_SECOND,
};

/**
 * Parses a relative time string and returns a DateTime.
 *
 * Supported formats:
 * - Single/combined units: "1d", "2h30m", "1y6d"
 * - Negative (future): "-1d", "-2h30m"
 * - Keywords: "now", "today", "yesterday", "tomorrow", "startOfDay", "endOfDay"
 *
 * @param input - The relative time string to parse
 * @param reference - Reference DateTime (defaults to current time)
 * @returns A DateTime, or undefined if the input cannot be parsed
 */
export function parseRelativeTime(
  input: string,
  reference?: DateTime,
): DateTime | undefined {
  if (!isString(input)) return undefined;

  const trimmed = input.trim().toLowerCase();
  const now = reference ?? DateTime.now();

  const keyword = parseKeyword(trimmed, now);
  if (keyword !== undefined) return keyword;

  return parseUnitExpression(trimmed, now);
}

function parseKeyword(input: string, now: DateTime): DateTime | undefined {
  switch (input) {
    case 'now':
      return now;
    case 'today':
    case 'startofday':
      return now.startOfDay('local');
    case 'endofday':
      return now.endOfDay('local');
    case 'yesterday':
      return now.subtract({ days: 1 }).startOfDay('local');
    case 'tomorrow':
      return now.add({ days: 1 }).startOfDay('local');
    default:
      return undefined;
  }
}

function parseUnitExpression(input: string, now: DateTime): DateTime | undefined {
  let isNegative = false;
  let expr = input;

  if (expr.startsWith('-')) {
    isNegative = true;
    expr = expr.slice(1).trim();
  } else if (expr.startsWith('+')) {
    expr = expr.slice(1).trim();
  }

  const pattern = /^(\d+)([ydhmS])/gi;
  let totalMs = 0;
  let hasMatch = false;
  let remaining = expr;

  while (remaining.length > 0) {
    pattern.lastIndex = 0;
    const match = pattern.exec(remaining);
    if (!match) {
      if (!hasMatch || remaining.trim().length > 0) return undefined;
      break;
    }
    hasMatch = true;
    const multiplier = UNIT_MULTIPLIERS[match[2].toLowerCase()];
    if (multiplier === undefined) return undefined;
    totalMs += parseInt(match[1], 10) * multiplier;
    remaining = remaining.slice(match[0].length);
  }

  if (!hasMatch) return undefined;

  const offsetMs = isNegative ? -totalMs : totalMs;
  return now.subtract({ milliseconds: offsetMs });
}
