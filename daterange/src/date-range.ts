/**
 * @module
 *
 * This module provides the DateRange class for representing and manipulating
 * a single date range using Temporal.Instant.
 *
 * @example
 * ```ts
 * import { DateRange } from '@epdoc/daterange';
 *
 * // Create a range for the last 24 hours
 * const range = DateRange.fromRelative('1d');
 *
 * // Check if an instant falls within the range
 * const now = Temporal.Now.instant();
 * if (range.contains(now)) {
 *   console.log('Now is within the range');
 * }
 * ```
 */
import { isString } from '@epdoc/type';
import type { DateRangeDef, DateRangeJSON } from './types.ts';
import { parseRelativeTime } from './relative-time.ts';
import { DateTime, INSTANT_MIN, INSTANT_MAX } from '@epdoc/datetime';

/**
 * Represents a single date range with after (start) and before (end) instants.
 *
 * Both boundaries are inclusive when checking containment.
 */
export class DateRange {
  /** The start of the range (inclusive). If undefined, represents the beginning of time. */
  after: Temporal.Instant;
  /** The end of the range (inclusive). If undefined, represents the end of time. */
  before: Temporal.Instant;

  /**
   * Returns the `after` boundary as a DateTime wrapper.
   * Useful for formatting or additional DateTime operations.
   */
  get afterDateTime(): DateTime {
    return new DateTime(this.after);
  }

  /**
   * Returns the `before` boundary as a DateTime wrapper.
   * Useful for formatting or additional DateTime operations.
   */
  get beforeDateTime(): DateTime {
    return new DateTime(this.before);
  }

  /**
   * Creates a new DateRange.
   *
   * @param after - The start instant, or a string to parse, or undefined for beginning of time
   * @param before - The end instant, or a string to parse, or undefined for end of time
   *
   * @example
   * ```ts
   * // From instants
   * const r1 = new DateRange(
   *   Temporal.Instant.from('2024-01-01T00:00:00Z'),
   *   Temporal.Instant.from('2024-01-31T23:59:59Z')
   * );
   *
   * // From relative strings
   * const r2 = new DateRange('1d', 'now');
   *
   * // Open-ended ranges
   * const r3 = new DateRange('2024-01-01', undefined); // From Jan 1 to infinity
   * ```
   */
  constructor(
    after?: Temporal.Instant | Date | string,
    before?: Temporal.Instant | Date | string,
  ) {
    this.after = this._toInstant(after) ?? DateTime.min().toInstant();
    this.before = this._toInstant(before) ?? DateTime.max().toInstant();
  }

  /**
   * Converts various input types to Temporal.Instant.
   */
  private _toInstant(input: Temporal.Instant | Date | string | undefined): Temporal.Instant | undefined {
    if (input === undefined) {
      return undefined;
    }

    if (input instanceof Temporal.Instant) {
      return input;
    }

    if (input instanceof Date) {
      return Temporal.Instant.fromEpochMilliseconds(input.getTime());
    }

    if (isString(input)) {
      // Try relative time first
      const relative = parseRelativeTime(input);
      if (relative) {
        return relative;
      }

      // Try ISO string
      try {
        return Temporal.Instant.from(input);
      } catch {
        // Try parsing as compact date format (handled elsewhere)
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Creates a DateRange from a DateRangeDef object.
   */
  static fromDef(def: DateRangeDef): DateRange {
    return new DateRange(def.after, def.before);
  }

  /**
   * Creates a DateRange from relative time strings.
   *
   * @example
   * ```ts
   * DateRange.fromRelative('1d', 'now');     // Last 24 hours
   * DateRange.fromRelative('-1h', 'now');    // Last hour
   * DateRange.fromRelative('today', 'now');  // From start of today
   * ```
   */
  static fromRelative(after: string, before: string): DateRange | undefined {
    const afterInstant = parseRelativeTime(after);
    const beforeInstant = parseRelativeTime(before);

    if (!afterInstant || !beforeInstant) {
      return undefined;
    }

    return new DateRange(afterInstant, beforeInstant);
  }

  /**
   * Checks if this range contains the given instant.
   * Both boundaries are inclusive.
   *
   * @param instant - The instant to check (Date, Temporal.Instant, or ISO string)
   * @returns true if the instant is within the range
   */
  contains(instant: Date | Temporal.Instant | string): boolean {
    const inst = this._toInstant(instant);
    if (!inst) {
      return false;
    }

    const afterCompare = Temporal.Instant.compare(this.after, inst);
    const beforeCompare = Temporal.Instant.compare(inst, this.before);

    // after <= inst <= before (inclusive)
    return afterCompare <= 0 && beforeCompare <= 0;
  }

  /**
   * Checks if this range overlaps with another range.
   *
   * @param other - The other DateRange to check
   * @returns true if the ranges overlap
   */
  overlaps(other: DateRange): boolean {
    // Ranges overlap if neither ends before the other starts
    const thisEndsBeforeOtherStarts = Temporal.Instant.compare(this.before, other.after) < 0;
    const otherEndsBeforeThisStarts = Temporal.Instant.compare(other.before, this.after) < 0;

    return !thisEndsBeforeOtherStarts && !otherEndsBeforeThisStarts;
  }

  /**
   * Returns the intersection of this range and another range.
   *
   * @param other - The other DateRange
   * @returns A new DateRange representing the intersection, or null if they don't overlap
   */
  intersect(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) {
      return null;
    }

    const newAfter = Temporal.Instant.compare(this.after, other.after) >= 0 ? this.after : other.after;
    const newBefore = Temporal.Instant.compare(this.before, other.before) <= 0 ? this.before : other.before;

    return new DateRange(newAfter, newBefore);
  }

  /**
   * Returns the union of this range and another range.
   *
   * If the ranges overlap or touch, returns a single merged range.
   * If they don't overlap, returns an array of both ranges.
   *
   * @param other - The other DateRange
   * @returns A DateRange (if merged) or array of DateRanges
   */
  union(other: DateRange): DateRange | DateRange[] {
    // Check if they overlap or touch (adjacent)
    const thisEndsAtOrBeforeOtherStarts = Temporal.Instant.compare(this.before, other.after) < 0;
    const otherEndsAtOrBeforeThisStarts = Temporal.Instant.compare(other.before, this.after) < 0;

    if (thisEndsAtOrBeforeOtherStarts || otherEndsAtOrBeforeThisStarts) {
      // Don't overlap - return both
      return [this, other];
    }

    // Merge into single range
    const newAfter = Temporal.Instant.compare(this.after, other.after) <= 0 ? this.after : other.after;
    const newBefore = Temporal.Instant.compare(this.before, other.before) >= 0 ? this.before : other.before;

    return new DateRange(newAfter, newBefore);
  }

  /**
   * Gets the duration of the range in milliseconds.
   *
   * @returns The duration in milliseconds
   */
  duration(): number {
    return this.before.epochMilliseconds - this.after.epochMilliseconds;
  }

  /**
   * Iterates over time periods within the range.
   *
   * @param unit - The time unit to iterate by ('hour' or 'day')
   * @returns A generator yielding instants at each interval
   *
   * @example
   * ```ts
   * for (const instant of range.iterate('day')) {
   *   console.log(instant.toString());
   * }
   * ```
   */
  *iterate(unit: 'hour' | 'day'): Generator<Temporal.Instant> {
    let current = this.after;

    while (Temporal.Instant.compare(current, this.before) <= 0) {
      yield current;

      if (unit === 'hour') {
        current = current.add({ hours: 1 });
      } else {
        current = current.add({ days: 1 });
      }
    }
  }

  /**
   * Converts to a JSON-serializable object.
   */
  toJSON(): DateRangeJSON {
    const result: DateRangeJSON = {};
    if (!this.afterDateTime.isNearMin()) {
      result.after = this.after.toString();
    }
    if (!this.beforeDateTime.isNearMax()) {
      result.before = this.before.toString();
    }
    return result;
  }

  /**
   * Converts to a compact string format.
   * Shows only date (YYYYMMDD) when time is at default boundaries:
   * - After: 00:00:00 -> YYYYMMDD
   * - Before: 23:59:59 -> YYYYMMDD
   * Otherwise shows full timestamp (YYYYMMDDHHMMSS).
   */
  toCompactString(): string {
    const localTz = Temporal.Now.timeZoneId();

    const formatAfter = (instant: Temporal.Instant): string => {
      if (new DateTime(instant).isNearMin()) {
        return '';
      }

      const zdt = instant.toZonedDateTimeISO(localTz);
      const pad = (n: number) => String(n).padStart(2, '0');

      // If it's start of day (00:00:00), just show date
      if (zdt.hour === 0 && zdt.minute === 0 && zdt.second === 0) {
        return `${zdt.year}${pad(zdt.month)}${pad(zdt.day)}`;
      }

      // Otherwise show full timestamp
      return `${zdt.year}${pad(zdt.month)}${pad(zdt.day)}${pad(zdt.hour)}${pad(zdt.minute)}${pad(zdt.second)}`;
    };

    const formatBefore = (instant: Temporal.Instant): string => {
      if (new DateTime(instant).isNearMax()) {
        return '';
      }

      const zdt = instant.toZonedDateTimeISO(localTz);
      const pad = (n: number) => String(n).padStart(2, '0');

      // If it's end of day (23:59:59), just show date
      if (zdt.hour === 23 && zdt.minute === 59 && zdt.second === 59) {
        return `${zdt.year}${pad(zdt.month)}${pad(zdt.day)}`;
      }

      // Otherwise show full timestamp
      return `${zdt.year}${pad(zdt.month)}${pad(zdt.day)}${pad(zdt.hour)}${pad(zdt.minute)}${pad(zdt.second)}`;
    };

    const afterStr = formatAfter(this.after);
    const beforeStr = formatBefore(this.before);

    return `${afterStr}-${beforeStr}`;
  }

  /**
   * Converts to ISO 8601 interval format.
   */
  toISOInterval(): string {
    const afterStr = this.afterDateTime.isNearMin() ? '..' : this.after.toString();
    const beforeStr = this.beforeDateTime.isNearMax() ? '..' : this.before.toString();
    return `${afterStr}/${beforeStr}`;
  }
}
