/**
 * @module
 *
 * This module exports the type definitions for the @epdoc/daterange package.
 */

import { DateTime, type ISODate } from '@epdoc/datetime';
import { _ } from '@epdoc/type';

/**
 * Represents a date range definition with optional after (start) and before (end) instants.
 *
 * Both boundaries are inclusive when checking if a date falls within the range.
 *
 * @example
 * ```ts
 * // Last 24 hours
 * const last24h: DateRangeDef = {
 *   after: Temporal.Now.instant().subtract({ hours: 24 }),
 *   before: Temporal.Now.instant()
 * };
 *
 * // All time after a specific date
 * const since2024: DateRangeDef = {
 *   after: Temporal.Instant.from('2024-01-01T00:00:00Z')
 * };
 * ```
 */
export type DateRangeDef = {
  /** The start of the range (inclusive). If undefined, range extends to the beginning of time. */
  after?: DateTime;
  /** The end of the range (inclusive). If undefined, range extends to the end of time. */
  before?: DateTime;
};

/**
 * JSON-serializable representation of a date range.
 * Uses ISO 8601 format strings for serialization.
 *
 * @example
 * ```ts
 * const json: DateRangeJSON = {
 *   after: '2024-01-15T10:30:00Z',
 *   before: '2024-01-20T18:00:00Z'
 * };
 * ```
 */
export type DateRangeJSON = {
  /** ISO 8601 formatted instant string for the start of the range */
  after?: ISODate;
  /** ISO 8601 formatted instant string for the end of the range */
  before?: ISODate;
};

/**
 * Options for parsing date range strings.
 */
export type DateRangeParseOptions = {
  /** Reference instant for relative time calculations (default: now) */
  reference?: DateTime;
  /** Whether to make end dates inclusive by setting to 23:59:59.999 (default: true) */
  inclusiveEnd?: boolean;
  /** Default hour to use for day-only dates (0-23, default: 0) */
  defaultHour?: number;
};

/**
 * Type guard to check if a value is a valid DateRangeDef.
 */
export function isDateRangeDef(obj: unknown): obj is DateRangeDef {
  if (!_.isDict(obj)) return false;

  const dict = obj as Record<string, unknown>;
  const keys = Object.keys(dict);

  return (
    keys.length > 0 &&
    keys.every((k) => (k === 'after' || k === 'before') && dict[k] instanceof DateTime)
  );
}
