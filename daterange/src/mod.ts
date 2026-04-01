/**
 * @module
 *
 * This module exports the public API for the @epdoc/daterange package.
 *
 * The daterange package provides utilities for working with date ranges using
 * Temporal.Instant for modern, timezone-aware date handling.
 *
 * @example
 * ```ts
 * import { DateRanges, DateRange, parseRelativeTime, dateList } from '@epdoc/daterange';
 *
 * // Parse relative time
 * const oneDayAgo = parseRelativeTime('1d');
 *
 * // Create a single date range
 * const range = new DateRange('1d', 'now');
 *
 * // Create a collection of ranges from a string
 * const ranges = DateRanges.parse('2024-2025,1d-now');
 *
 * // Check if an instant is in any range
 * if (ranges.contains(Temporal.Now.instant())) {
 *   console.log('Now is in range');
 * }
 * ```
 */
export { DateRanges } from './date-ranges.ts';
export { DateRange } from './date-range.ts';
export { parseRelativeTime } from './relative-time.ts';
export { dateList, dateRanges, dateStringToDate, dateStringToInstant } from './util.ts';
export {
  type DateRangeDef,
  type DateRangeJSON,
  type DateRangeParseOptions,
  INSTANT_MAX,
  INSTANT_MIN,
  isDateRangeDef,
} from './types.ts';

// CLI option helpers (framework-agnostic)
export { type DateRangeOptionDef, dateRangeOptions, isDateRangeOptionDef } from './cli.ts';
