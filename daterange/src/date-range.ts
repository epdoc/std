/**
 * @module
 *
 * Provides the DateRange class for representing and manipulating a single date
 * range using DateTime objects.
 */
import { DateTime } from '@epdoc/datetime';
import { parseRelativeTime } from './relative-time.ts';
import { type DateRangeDef, type DateRangeJSON, isDateRangeDef } from './types.ts';

const LIMIT: Record<'min' | 'max', DateTime> = {
  min: DateTime.min().add({ hours: 48 }),
  max: DateTime.max().subtract({ hours: 48 }),
};

/**
 * Represents a single date range with `after` (start) and `before` (end) DateTime values.
 * Both boundaries are inclusive when checking containment.
 */
export class DateRange {
  /** Start of the range (inclusive). DateTime.min() represents the beginning of time. */
  readonly after: DateTime;
  /** End of the range (inclusive). DateTime.max() represents the end of time. */
  readonly before: DateTime;

  /**
   * The constructor is now "Dumb" and Private.
   * It performs no logic; it only receives validated data.
   */
  private constructor(after: DateTime, before: DateTime) {
    this.after = after;
    this.before = before;
  }

  /**
   * The 'Standard' way to create a range from raw values.
   */
  static from(after?: DateTime, before?: DateTime): DateRange {
    return new DateRange(
      after ?? LIMIT.min,
      before ?? LIMIT.max,
    );
  }

  /**
   * Specialized factory for the definition object.
   */
  static fromDef(def: DateRangeDef): DateRange {
    // Note: Type guard check is still performed here
    if (!isDateRangeDef(def)) throw new Error('Invalid DateRangeDef');

    return new DateRange(
      def.after ?? LIMIT.min,
      def.before ?? LIMIT.max,
    );
  }

  /**
   * Clone factory to create a new instance from an existing one.
   */
  static fromRange(other: DateRange): DateRange {
    return new DateRange(other.after, other.before);
  }

  static fromISO(after: string, before: string): DateRange | undefined {
    const a = DateTime.fromString(after);
    const b = DateTime.fromString(before);
    // // Assuming Luxon or similar where .isValid is the check
    // if (!a.isValid || !b.isValid) return undefined;
    return DateRange.from(a, b);
  }

  /**
   * Creates a DateRange from relative time strings (e.g. '1d', 'now').
   * Returns undefined if either string cannot be parsed.
   */
  static fromRelative(after: string, before: string): DateRange | undefined {
    const a = parseRelativeTime(after);
    const b = parseRelativeTime(before);
    if (!a || !b) return undefined;
    return DateRange.from(a, b);
  }

  /**
   * Checks if this range contains the given DateTime (or value convertible to DateTime).
   * Both boundaries are inclusive.
   */
  contains(dt: DateTime | Date | Temporal.Instant | string): boolean {
    const target = dt instanceof DateTime ? dt : DateTime.tryFrom(dt);
    if (!target) return false;
    return this.after.isSameOrBefore(target) && target.isSameOrBefore(this.before);
  }

  /**
   * Checks if this range overlaps with another range.
   */
  overlaps(other: DateRange): boolean {
    return this.after.isSameOrBefore(other.before) && other.after.isSameOrBefore(this.before);
  }

  /**
   * Returns the intersection of this range and another, or null if they don't overlap.
   */
  intersect(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) return null;
    const newAfter = this.after.isAfter(other.after) ? this.after : other.after;
    const newBefore = this.before.isBefore(other.before) ? this.before : other.before;
    return new DateRange(newAfter, newBefore);
  }

  /**
   * Returns the union of this range and another.
   * If they overlap or touch, returns a single merged DateRange.
   * If they don't overlap, returns an array of both ranges.
   */
  union(other: DateRange): DateRange | DateRange[] {
    if (!this.overlaps(other)) return [this, other];
    const newAfter = this.after.isBefore(other.after) ? this.after : other.after;
    const newBefore = this.before.isAfter(other.before) ? this.before : other.before;
    return new DateRange(newAfter, newBefore);
  }

  /**
   * Returns the duration of the range in milliseconds.
   */
  duration(): number {
    return this.before.epochMilliseconds - this.after.epochMilliseconds;
  }

  /**
   * Iterates over DateTime values within the range at the given interval.
   */
  *iterate(unit: 'hour' | 'day'): Generator<DateTime> {
    let current = this.after;
    while (current.isSameOrBefore(this.before)) {
      yield current;
      current = current.add(unit === 'hour' ? { hours: 1 } : { days: 1 });
    }
  }

  /**
   * Converts to a JSON-serializable object using ISO strings.
   */
  toJSON(): DateRangeJSON {
    const result: DateRangeJSON = {};
    if (!this.after.isNearMin()) result.after = this.after.toISOString() as import('@epdoc/datetime').ISODate;
    if (!this.before.isNearMax()) result.before = this.before.toISOString() as import('@epdoc/datetime').ISODate;
    return result;
  }

  /**
   * Converts to a compact string format (local time).
   * Shows YYYYMMDD when time is at day boundaries, otherwise YYYYMMDDHHmmss.
   */
  toCompactString(): string {
    const fmt = (dt: DateTime, isEnd: boolean): string => {
      if (isEnd ? dt.isNearMax() : dt.isNearMin()) return '';
      const localDt = dt.withTz('local');
      const zdt = localDt.temporal as Temporal.ZonedDateTime;
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${zdt.year}${pad(zdt.month)}${pad(zdt.day)}`;
      const atBoundary = isEnd
        ? (zdt.hour === 23 && zdt.minute === 59 && zdt.second === 59)
        : (zdt.hour === 0 && zdt.minute === 0 && zdt.second === 0);
      if (atBoundary) return dateStr;
      return `${dateStr}${pad(zdt.hour)}${pad(zdt.minute)}${pad(zdt.second)}`;
    };
    return `${fmt(this.after, false)}-${fmt(this.before, true)}`;
  }

  /**
   * Converts to ISO 8601 interval format (e.g. "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z").
   * Open-ended boundaries are represented as "..".
   */
  toISOInterval(): string {
    const afterStr = this.after.isNearMin() ? '..' : this.after.toISOString();
    const beforeStr = this.before.isNearMax() ? '..' : this.before.toISOString();
    return `${afterStr}/${beforeStr}`;
  }
}
