import { DateEx, dateEx, type ISOTZ } from '@epdoc/datetime';
import { isNonEmptyArray, isValidDate } from '@epdoc/type';
import type { DateRangeDef, DateRangeJSON } from './types.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges {
  private _ranges: DateRangeDef[] = [];

  /**
   * Creates an instance of DateRanges.
   * @param {DateRangeDef[]} [dateRanges] - An optional array of DateRangeDef objects.
   */
  constructor(dateRanges?: DateRangeDef[]) {
    if (isNonEmptyArray(dateRanges)) {
      dateRanges.forEach((item) => {
        this._ranges.push({ before: item.before, after: item.after });
      });
    }
  }

  /**
   * Creates a copy of the current DateRanges instance.
   * @returns {DateRanges} A new instance of DateRanges with the same date ranges.
   */
  copy(): DateRanges {
    const result = new DateRanges(this._ranges);
    return result;
  }

  /**
   * Gets the array of date ranges.
   * @returns {DateRangeDef[]} The array of date ranges.
   */
  get ranges(): DateRangeDef[] {
    return this._ranges;
  }

  /**
   * Checks if a given date is within any of the defined date ranges.
   * @param {Date | undefined} date - The date to check.
   * @param {boolean} [_defVal=true] - The default value to return if the date is invalid (default is true).
   * @returns {boolean} True if the date is within the ranges, otherwise false.
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
   * Tests to see if the date range has one 'after' setting and, if so, returns that date.
   * @returns {Date | undefined} The 'after' date if it exists, otherwise undefined.
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
   * @returns {boolean} True if there are date ranges, otherwise false.
   */
  hasRanges(): boolean {
    return isNonEmptyArray(this._ranges);
  }

  toJSON(): DateRangeJSON[] {
    const result: DateRangeJSON[] = [];
    this._ranges.forEach((range) => {
      const obj: { after?: ISOTZ; before?: ISOTZ } = {};
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
