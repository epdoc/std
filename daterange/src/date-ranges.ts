/**
 * @module
 *
 * This module provides a `DateRanges` class for working with collections of date
 * ranges.
 *
 * @example
 * ```ts
 * import { DateRanges } from '@epdoc/std/daterange/date-ranges';
 *
 * const dr = new DateRanges();
 * dr.fromJSON([
 *   { after: '2024-01-01T00:00:00.000Z' },
 *   { before: '2024-01-02T00:00:00.000Z' },
 * ]);
 * console.log(dr.toEditableString());
 * //-> "20240101-,-20240101"
 * ```
 */
import { DateEx, dateEx, type ISOTzDate } from '@epdoc/datetime';
import { isNonEmptyArray, isValidDate } from '@epdoc/type';
import type { DateRangeDef, DateRangeJSON } from './types.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges {
  private _ranges: DateRangeDef[] = [];

  /**
   * Creates an instance of DateRanges.
   * @param dateRanges - An optional array of DateRangeDef objects.
   */
  constructor(dateRanges?: DateRangeDef[]) {
    if (isNonEmptyArray(dateRanges)) {
      dateRanges.forEach((item) => {
        this._ranges.push({ before: item.before, after: item.after });
      });
    }
  }

  /**
   * Initializes the `DateRanges` instance with an array of `DateRangeDef` objects.
   *
   * @param ranges - An optional array of `DateRangeDef` objects. If not specified then the current
   * values are cleared.
   * @returns The `DateRanges` instance.
   */
  init(ranges?: DateRangeDef[]): this {
    this.clear();
    if (isNonEmptyArray(ranges)) {
      ranges.forEach((item) => {
        this._ranges.push({ before: item.before, after: item.after });
      });
    }
    return this;
  }

  /**
   * Creates a copy of the current DateRanges instance.
   * @returns A new instance of DateRanges with the same date ranges.
   */
  copy(): DateRanges {
    const result = new DateRanges(this._ranges);
    return result;
  }

  /**
   * Gets the array of date ranges.
   */
  get ranges(): DateRangeDef[] {
    return this._ranges;
  }

  /**
   * Clears all date ranges from the instance.
   */
  clear(): this {
    this._ranges = [];
    return this;
  }

  /**
   * Checks if a given date is within any of the defined date ranges.
   * @param date - The date to check.
   * @param _defVal - The default value to return if the date is invalid
   * (default is true).
   * @returns True if the date is within the ranges, otherwise false.
   */
  isDateInRange(date: Date | undefined, _defVal = true): boolean {
    if (isValidDate(date)) {
      for (let ddx = 0; ddx < this._ranges.length; ++ddx) {
        const range = this._ranges[ddx];
        if (isValidDate(range.after) && date.getTime() < range.after.getTime()) {
          return false;
        }
        if (isValidDate(range.before) && date.getTime() > range.before.getTime()) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Tests to see if the date range has one 'after' setting and, if so, returns
   * that date.
   * @returns The 'after' date if it exists, otherwise undefined.
   */
  hasOneAfterDate(): Date | undefined {
    if (this.hasRanges()) {
      if (
        this._ranges.length === 1 &&
        this._ranges[0].before === undefined &&
        isValidDate(this._ranges[0].after)
      ) {
        return this._ranges[0].after;
      }
    }
  }

  /**
   * Checks if there are any date ranges defined.
   * @returns True if there are date ranges, otherwise false.
   */
  hasRanges(): boolean {
    return isNonEmptyArray(this._ranges);
  }

  /**
   * Populates the `DateRanges` instance from an array of `DateRangeJSON`
   * objects.
   *
   * @param json - An array of `DateRangeJSON` objects.
   */
  fromJSON(json?: DateRangeJSON[]): void {
    this._ranges = [];
    if (isNonEmptyArray(json)) {
      json.forEach((item) => {
        const range: DateRangeDef = {};
        if (item.after) {
          const d = new Date(item.after);
          if (isValidDate(d)) {
            range.after = d;
          }
        }
        if (item.before) {
          const d = new Date(item.before);
          if (isValidDate(d)) {
            range.before = d;
          }
        }
        this._ranges.push(range);
      });
    }
  }

  /**
   * Converts the `DateRanges` instance to an array of `DateRangeJSON` objects.
   *
   * @returns An array of `DateRangeJSON` objects.
   */
  toJSON(): DateRangeJSON[] {
    const result: DateRangeJSON[] = [];
    this._ranges.forEach((range) => {
      const obj: { after?: ISOTzDate; before?: ISOTzDate } = {};
      if (range.after) {
        obj.after = new DateEx(range.after).toISOLocalString();
      }
      if (range.before) {
        obj.before = new DateEx(range.before).toISOLocalString();
      }
      result.push(obj);
    });
    return result;
  }

  /**
   * Converts the date ranges to a human-editable string format that is in local
   * time.
   *
   * @returns A string representation of the date ranges.
   *
   * @example
   * ```ts
   * import { DateRanges } from '@epdoc/std/daterange/date-ranges';
   *
   * const dr = new DateRanges();
   * dr.fromJSON([
   *   { after: '2024-01-01T00:00:00.000Z' },
   *   { before: '2024-01-02T00:00:00.000Z' },
   * ]);
   * console.log(dr.toEditableString());
   * //-> "20240101-,-20240101"
   * ```
   */
  toEditableString(): string {
    const isStart = (d: Date) => {
      return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
    };

    const format = (d: Date, isBefore: boolean) => {
      if (isBefore) {
        if (d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59 && d.getMilliseconds() === 999) {
          return dateEx(d).format('yyyyMMdd');
        }
      } else {
        if (isStart(d)) {
          return dateEx(d).format('yyyyMMdd');
        }
      }
      return dateEx(d).format('yyyyMMddHHmmss');
    };

    const strs: string[] = [];
    this._ranges.forEach((range) => {
      let s = '';
      if (range.after) {
        s = format(range.after, false) + '-';
      }
      if (range.before) {
        if (!range.after) {
          s += '-';
        }
        let d = range.before;
        if (isStart(d)) {
          d = new Date(d.getTime() - 1);
        }
        s += format(d, true);
      }
      strs.push(s);
    });
    return strs.join(',');
  }

  /**
   * Converts the date ranges to a human-readable string format that uses local
   * time.
   *
   * @returns A string representation of the date ranges.
   */
  toString(): string {
    const s: string[] = [];
    this._ranges.forEach((range) => {
      s.push(
        `from ${range.after ? dateEx(range.after).format('yyyy/MM/dd HH:mm:ss') : '2000'} to ${
          range.before ? dateEx(range.before).format('yyyy/MM/dd HH:mm:ss') : 'now'
        }`,
      );
    });
    return s.join(', ');
  }
}
