import { isNonEmptyArray, isValidDate } from '@epdoc/type';
import type { DateRangeDef } from './util.ts';

/**
 * Represents a collection of date ranges.
 */
export class DateRanges {
  private _isDateRanges = true;
  private _dateRanges: DateRangeDef[] = [];

  /**
   * Creates an instance of DateRanges.
   * @param {DateRangeDef[]} [dateRanges] - An optional array of DateRangeDef objects.
   */
  constructor(dateRanges?: DateRangeDef[]) {
    if (isNonEmptyArray(dateRanges)) {
      dateRanges.forEach((item) => {
        this._dateRanges.push({ before: item.before, after: item.after });
      });
    }
  }

  /**
   * Creates a copy of the current DateRanges instance.
   * @returns {DateRanges} A new instance of DateRanges with the same date ranges.
   */
  copy(): DateRanges {
    const result = new DateRanges(this._dateRanges);
    return result;
  }

  /**
   * Gets the array of date ranges.
   * @returns {DateRangeDef[]} The array of date ranges.
   */
  get dateRanges(): DateRangeDef[] {
    return this._dateRanges;
  }

  /**
   * Checks if a given date is within any of the defined date ranges.
   * @param {Date | undefined} date - The date to check.
   * @param {boolean} [_defVal=true] - The default value to return if the date is invalid (default is true).
   * @returns {boolean} True if the date is within the ranges, otherwise false.
   */
  isDateInRange(date: Date | undefined, _defVal = true): boolean {
    if (isValidDate(date)) {
      for (let ddx = 0; ddx < this._dateRanges.length; ++ddx) {
        const range = this._dateRanges[ddx];
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
    if (this.hasDateRanges()) {
      if (
        this._dateRanges.length === 1 &&
        this._dateRanges[0].before === undefined &&
        isValidDate(this._dateRanges[0].after)
      ) {
        return this._dateRanges[0].after;
      }
    }
  }

  /**
   * Checks if there are any date ranges defined.
   * @returns {boolean} True if there are date ranges, otherwise false.
   */
  hasDateRanges(): boolean {
    return isNonEmptyArray(this._dateRanges);
  }
}