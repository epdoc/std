/**
 * @module
 *
 * Provides the DateRanges class for working with collections of date ranges.
 */
import { DateTime } from '@epdoc/datetime';
import { isNonEmptyArray } from '@epdoc/type';
import { DateRange } from './date-range.ts';
import type { DateRangeDef, DateRangeJSON, DateRangeParseOptions } from './types.ts';
import { dateList } from './util.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges {
  private _ranges: DateRange[] = [];

  constructor(dateRanges?: DateRangeDef | DateRangeDef[]) {
    if (isNonEmptyArray(dateRanges)) {
      this._ranges = dateRanges.map((def) => DateRange.fromDef(def));
    } else if (dateRanges) {
      this._ranges = [DateRange.fromDef(dateRanges)];
    }
  }

  init(ranges?: DateRangeDef | DateRangeDef[]): this {
    this._ranges = [];
    if (isNonEmptyArray(ranges)) {
      this._ranges = ranges.map((def) => DateRange.fromDef(def));
    } else if (ranges) {
      this._ranges = [DateRange.fromDef(ranges)];
    }
    return this;
  }

  copy(): DateRanges {
    return new DateRanges(this._ranges.map((r) => ({ after: r.after, before: r.before })));
  }

  get ranges(): readonly DateRange[] {
    return this._ranges;
  }

  get isSingle(): boolean {
    return this._ranges.length === 1;
  }

  clear(): this {
    this._ranges = [];
    return this;
  }

  add(range: DateRange | DateRangeDef): this {
    this._ranges.push(range instanceof DateRange ? range : DateRange.fromDef(range));
    return this;
  }

  /**
   * Merges overlapping or adjacent ranges in the collection.
   */
  merge(): this {
    if (this._ranges.length <= 1) return this;

    const sorted = [...this._ranges].sort((a, b) => DateTime.compare(a.after, b.after));
    const merged: DateRange[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const union = current.union(sorted[i]);
      if (Array.isArray(union)) {
        merged.push(current);
        current = sorted[i];
      } else {
        current = union;
      }
    }
    merged.push(current);
    this._ranges = merged;
    return this;
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

  /**
   * Populates from an array of DateRangeJSON objects (ISO string values).
   */
  fromJSON(json?: DateRangeJSON[]): void {
    this._ranges = [];
    if (!isNonEmptyArray(json)) return;
    for (const item of json) {
      const def: DateRangeDef = {};
      if (item.after) def.after = DateTime.tryFrom(item.after);
      if (item.before) def.before = DateTime.tryFrom(item.before);
      this._ranges.push(DateRange.fromDef(def));
    }
  }

  toJSON(): DateRangeJSON[] {
    return this._ranges.map((r) => r.toJSON());
  }

  static parse(input: string, options?: DateRangeParseOptions): DateRanges {
    return new DateRanges(dateList(input, options));
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
}
