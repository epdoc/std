/**
 * @module
 *
 * Provides the DateRanges class for working with collections of date ranges.
 */
import { DateTime } from '@epdoc/datetime';
import { _, isNonEmptyArray } from '@epdoc/type';
import { DateRange } from './date-range.ts';
import { type DateRangeDef, type DateRangeJSON, type DateRangeParseOptions, isDateRangeDef } from './types.ts';
import { dateList } from './util.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges implements Iterable<DateRange> {
  readonly _ranges: DateRange[] = [];

  private constructor(ranges: DateRange[]) {
    this._ranges = ranges;
  }

  clone(): DateRanges {
    return DateRanges.fromDef(this._ranges.map((r) => ({ after: r.after, before: r.before })));
  }

  get ranges(): readonly DateRange[] {
    return this._ranges;
  }

  get isSingle(): boolean {
    return this._ranges.length === 1;
  }

  add(range: DateRange | DateRangeDef | DateRangeDef[] | DateRanges): DateRanges {
    const newRange = DateRanges.from(range);
    return new DateRanges([...this._ranges, ...newRange]);
  }

  /**
   * Merges overlapping or adjacent ranges in the collection. Ranges that are within `msTolerance`
   * milliseconds of each other will also be merged. We allow this because in some of our scenarios
   * we create date ranges that go up to the before time minus 1 ms, to ensure we do not round the
   * date incorrectly.
   *
   * @param msTolerance - The maximum gap in milliseconds between ranges to consider them for
   * merging (default: 10ms)
   * @returns A new DateRanges instance with merged ranges
   */
  merge(msTolerance: number = 10): DateRanges {
    if (this._ranges.length <= 1) return this;

    const sorted = [...this._ranges].sort((a, b) => DateTime.compare(a.after, b.after));
    const merged: DateRange[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const union = current.union(sorted[i], msTolerance);
      if (_.isArray(union)) {
        merged.push(current);
        current = sorted[i];
      } else {
        current = union;
      }
    }
    merged.push(current);
    return new DateRanges(merged);
  }

  /**
   * Checks if a given DateTime (or convertible value) is within any range.
   */
  contains(dt: DateTime | Date | Temporal.Instant | string): boolean {
    const target = dt instanceof DateTime ? dt : DateTime.tryFrom(dt);
    if (!target) return false;
    return this._ranges.some((range) => range.contains(target));
  }

  /**
   * Returns the `after` DateTime if there is exactly one range with a non-min after.
   */
  hasOneAfterDate(): DateTime | undefined {
    if (this._ranges.length === 1 && !this._ranges[0].after.isNearMin()) {
      return this._ranges[0].after;
    }
    return undefined;
  }

  hasRanges(): boolean {
    return isNonEmptyArray(this._ranges);
  }

  static from(arg: DateRangeDef | DateRangeDef[] | string | DateRange[] | DateRanges): DateRanges {
    if (arg instanceof DateRanges) return arg.clone();
    if (isDateRangeDef(arg) || (_.isArray(arg) && arg.every(isDateRangeDef))) {
      return DateRanges.fromDef(arg);
    } else if (_.isString(arg)) {
      return DateRanges.fromCliString(arg);
    }
    return new DateRanges([]);
  }

  /**
   * Populates from an array of DateRangeDef objects (DateTime values).
   */
  static fromDef(def?: DateRangeDef | DateRangeDef[]): DateRanges {
    const ranges: DateRange[] = [];
    const defs = _.isArray(def) ? def : def ? [def] : [];
    if (isNonEmptyArray(defs)) {
      for (const def of defs) {
        ranges.push(DateRange.fromDef(def));
      }
    }
    return new DateRanges(ranges);
  }

  /**
   * Converts a string representation of date ranges into a DateRanges object.
   *
   * @param val - A string containing date ranges separated by commas
   * @param options - Parse options
   * @returns A DateRanges object
   * @see dateList for the parsing logic
   */
  static fromCliString(val: string, options?: DateRangeParseOptions): DateRanges {
    return DateRanges.fromDef(dateList(val, options));
  }

  /**
   * Populates from an array of DateRangeJSON objects (ISO string values). Any data that is invalid
   * or unparseable will be skipped, but valid entries will still be included.
   *
   * @param json - An array of DateRangeJSON objects
   */
  static fromJSON(json?: DateRangeJSON[]): DateRanges {
    if (!isNonEmptyArray(json)) return DateRanges.fromDef([]);
    const ranges: DateRange[] = [];
    for (const item of json) {
      const def: DateRangeDef = {};
      if (item.after) def.after = DateTime.tryFrom(item.after);
      if (item.before) def.before = DateTime.tryFrom(item.before);
      if (isDateRangeDef(def)) {
        ranges.push(DateRange.fromDef(def));
      }
    }
    return new DateRanges(ranges);
  }

  toJSON(): DateRangeJSON[] {
    return this._ranges.map((r) => r.toJSON());
  }

  static parse(input: string, options?: DateRangeParseOptions): DateRanges {
    return DateRanges.fromCliString(input, options);
  }

  toCompactString(): string {
    return this._ranges.map((r) => r.toCompactString()).join(',');
  }

  toISOInterval(): string[] {
    return this._ranges.map((r) => r.toISOInterval());
  }

  toString(): string {
    return this._ranges.map((r) => {
      const fmt = (dt: DateTime): string => {
        if (dt.isNearMin()) return 'beginning';
        if (dt.isNearMax()) return 'now';
        const zdt = dt.withTz('local').temporal as Temporal.ZonedDateTime;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${zdt.year}/${pad(zdt.month)}/${pad(zdt.day)} ${pad(zdt.hour)}:${pad(zdt.minute)}:${pad(zdt.second)}`;
      };
      return `from ${fmt(r.after)} to ${fmt(r.before)}`;
    }).join(', ');
  }

  [Symbol.iterator](): Iterator<DateRange> {
    return this._ranges[Symbol.iterator]();
  }
}
