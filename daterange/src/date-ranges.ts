/**
 * @module
 *
 * This module provides a DateRanges class for working with collections of date
 * ranges using Temporal.Instant.
 *
 * @example
 * ```ts
 * import { DateRanges } from '@epdoc/daterange';
 *
 * const dr = new DateRanges();
 * dr.fromJSON([
 *   { after: '2024-01-01T00:00:00.000Z' },
 *   { before: '2024-01-02T00:00:00.000Z' },
 * ]);
 * console.log(dr.toCompactString());
 * //-> "20240101-,-20240101"
 * ```
 */
import type { DateTime } from '@epdoc/datetime';
import { isNonEmptyArray } from '@epdoc/type';
import { DateRange } from './date-range.ts';
import type { DateRangeDef, DateRangeJSON, DateRangeParseOptions } from './types.ts';
import { dateList } from './util.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges {
  private _ranges: DateRange[] = [];

  /**
   * Creates an instance of DateRanges.
   * @param dateRanges - An optional array of DateRangeDef objects.
   */
  constructor(dateRanges?: DateRangeDef[]) {
    if (isNonEmptyArray(dateRanges)) {
      this._ranges = dateRanges.map((def) => DateRange.fromDef(def));
    }
  }

  /**
   * Initializes the DateRanges instance with an array of DateRangeDef objects.
   *
   * @param ranges - An optional array of DateRangeDef objects. If not specified then the current
   * values are cleared.
   * @returns The DateRanges instance.
   */
  init(ranges?: DateRangeDef[]): this {
    this.clear();
    if (isNonEmptyArray(ranges)) {
      this._ranges = ranges.map((def) => DateRange.fromDef(def));
    }
    return this;
  }

  /**
   * Creates a copy of the current DateRanges instance.
   * @returns A new instance of DateRanges with the same date ranges.
   */
  copy(): DateRanges {
    const defs = this._ranges.map((r) => ({ after: r.after, before: r.before }));
    return new DateRanges(defs);
  }

  /**
   * Gets the array of date ranges.
   */
  get ranges(): readonly DateRange[] {
    return this._ranges;
  }

  /**
   * Checks if this collection contains only a single range.
   */
  get isSingle(): boolean {
    return this._ranges.length === 1;
  }

  /**
   * Clears all date ranges from the instance.
   */
  clear(): this {
    this._ranges = [];
    return this;
  }

  /**
   * Adds a date range to the collection.
   * @param range - A DateRange or DateRangeDef to add.
   * @returns The DateRanges instance for chaining.
   */
  add(range: DateRange | DateRangeDef): this {
    if (range instanceof DateRange) {
      this._ranges.push(range);
    } else {
      this._ranges.push(DateRange.fromDef(range));
    }
    return this;
  }

  /**
   * Merges overlapping ranges in the collection.
   * @returns The DateRanges instance for chaining.
   */
  merge(): this {
    if (this._ranges.length <= 1) {
      return this;
    }

    // Sort ranges by after date
    const sorted = [...this._ranges].sort((a, b) => Temporal.Instant.compare(a.after, b.after));
    const merged: DateRange[] = [];

    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const union = current.union(next);

      if (Array.isArray(union)) {
        // No overlap - push current and move to next
        merged.push(current);
        current = next;
      } else {
        // Overlap - merge them
        current = union;
      }
    }
    merged.push(current);

    this._ranges = merged;
    return this;
  }

  /**
   * Checks if a given instant is within any of the defined date ranges.
   * Both boundaries are inclusive.
   *
   * @param instant - The instant to check (Date, Temporal.Instant, or ISO string)
   * @returns True if the instant is within any range, otherwise false.
   */
  contains(instant: Date | Temporal.Instant | string): boolean {
    // Convert input to Temporal.Instant
    let inst: Temporal.Instant;
    if (instant instanceof Temporal.Instant) {
      inst = instant;
    } else if (instant instanceof Date) {
      inst = Temporal.Instant.fromEpochMilliseconds(instant.getTime());
    } else if (typeof instant === 'string') {
      try {
        inst = Temporal.Instant.from(instant);
      } catch {
        return false;
      }
    } else {
      return false;
    }

    return this._ranges.some((range) => range.contains(inst));
  }

  /**
   * Tests to see if the date range collection has one 'after' setting and, if so, returns
   * that date.
   * @returns The 'after' instant if it exists and there's only one range, otherwise undefined.
   */
  hasOneAfterDate(): Temporal.Instant | undefined {
    if (this._ranges.length === 1) {
      const range = this._ranges[0];
      if (!range.afterDateTime.isNearMin()) {
        return range.after;
      }
    }
    return undefined;
  }

  /**
   * Checks if there are any date ranges defined.
   * @returns True if there are date ranges, otherwise false.
   */
  hasRanges(): boolean {
    return isNonEmptyArray(this._ranges);
  }

  /**
   * Populates the DateRanges instance from an array of DateRangeJSON objects.
   *
   * @param json - An array of DateRangeJSON objects.
   */
  fromJSON(json?: DateRangeJSON[]): void {
    this._ranges = [];
    if (isNonEmptyArray(json)) {
      json.forEach((item) => {
        const def: DateRangeDef = {};
        if (item.after) {
          try {
            def.after = Temporal.Instant.from(item.after);
          } catch {
            // Invalid date string - leave undefined
          }
        }
        if (item.before) {
          try {
            def.before = Temporal.Instant.from(item.before);
          } catch {
            // Invalid date string - leave undefined
          }
        }
        this._ranges.push(DateRange.fromDef(def));
      });
    }
  }

  /**
   * Converts the DateRanges instance to an array of DateRangeJSON objects.
   *
   * @returns An array of DateRangeJSON objects.
   */
  toJSON(): DateRangeJSON[] {
    return this._ranges.map((range) => range.toJSON());
  }

  /**
   * Parses a date range string and returns a DateRanges instance.
   *
   * Supports the same formats as the dateList function, plus relative time strings.
   *
   * @param input - The date range string (e.g., "1d-now", "20240101-20240131")
   * @param options - Parse options including reference instant for relative times
   * @returns A new DateRanges instance
   */
  static parse(input: string, options?: DateRangeParseOptions): DateRanges {
    const defs = dateList(input, options);
    return new DateRanges(defs);
  }

  /**
   * Converts the date ranges to a human-editable string format that is in local time.
   *
   * @returns A string representation of the date ranges.
   *
   * @example
   * ```ts
   * import { DateRanges } from '@epdoc/daterange';
   *
   * const dr = new DateRanges();
   * dr.fromJSON([
   *   { after: '2024-01-01T00:00:00.000Z' },
   *   { before: '2024-01-02T00:00:00.000Z' },
   * ]);
   * console.log(dr.toCompactString());
   * //-> "20240101-,-20240101"
   * ```
   */
  toCompactString(): string {
    return this._ranges.map((range) => range.toCompactString()).join(',');
  }

  /**
   * Converts the date ranges to ISO 8601 interval format strings.
   * @returns An array of ISO interval strings.
   */
  toISOInterval(): string[] {
    return this._ranges.map((range) => range.toISOInterval());
  }

  /**
   * Converts the date ranges to a human-readable string format that uses local time.
   *
   * @returns A string representation of the date ranges.
   */
  toString(): string {
    const localTz = Temporal.Now.timeZoneId();

    return this._ranges.map((range) => {
      const format = (instant: Temporal.Instant, dt: DateTime): string => {
        if (dt.isNearMin()) return 'beginning';
        if (dt.isNearMax()) return 'now';
        const zdt = instant.toZonedDateTimeISO(localTz);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${zdt.year}/${pad(zdt.month)}/${pad(zdt.day)} ${pad(zdt.hour)}:${pad(zdt.minute)}:${pad(zdt.second)}`;
      };

      return `from ${format(range.after, range.afterDateTime)} to ${format(range.before, range.beforeDateTime)}`;
    }).join(', ');
  }
}
