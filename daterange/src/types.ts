/**
 * @module
 *
 * This module exports the type definitions for the @epdoc/daterange package.
 */

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
  after?: Temporal.Instant;
  /** The end of the range (inclusive). If undefined, range extends to the end of time. */
  before?: Temporal.Instant;
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
  after?: string;
  /** ISO 8601 formatted instant string for the end of the range */
  before?: string;
};

/**
 * Options for parsing date range strings.
 */
export type DateRangeParseOptions = {
  /** Reference instant for relative time calculations (default: now) */
  reference?: Temporal.Instant;
  /** Whether to make end dates inclusive by setting to 23:59:59.999 (default: true) */
  inclusiveEnd?: boolean;
  /** Default hour to use for day-only dates (0-23, default: 0) */
  defaultHour?: number;
};

/**
 * Type guard to check if a value is a valid DateRangeDef.
 */
export function isDateRangeDef(val: unknown): val is DateRangeDef {
  if (typeof val !== 'object' || val === null) {
    return false;
  }
  const obj = val as Record<string, unknown>;

  // Check if it has valid after/before properties (both optional)
  const hasAfter = 'after' in obj;
  const hasBefore = 'before' in obj;

  if (!hasAfter && !hasBefore) {
    return false;
  }

  // If present, after/before should be Temporal.Instant-like
  if (hasAfter && obj.after !== undefined) {
    const after = obj.after;
    if (!(after instanceof Temporal.Instant) && typeof after !== 'object') {
      return false;
    }
  }

  if (hasBefore && obj.before !== undefined) {
    const before = obj.before;
    if (!(before instanceof Temporal.Instant) && typeof before !== 'object') {
      return false;
    }
  }

  return true;
}
