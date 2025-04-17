import type { Integer } from './dep/epdoc.ts';

const DAY = 24 * 3600 * 1000;
const REG = {
  DATE: /^(\d{4})(\d\d)(\d\d)(\d\d)?(\d\d)?(\d\d)?$/,
};

/**
 * Represents a definition of a date range with optional before and after dates.
 * @typedef {Object} DateRangeDef
 * @property {Date} [before] - The end date of the range.
 * @property {Date} [after] - The start date of the range.
 */

export type DateRangeDef = {
  before?: Date;
  after?: Date;
};

// export function dateListH0(val: string): DateRangeDef[] {
//   return dateList(val, 0);
// }

/**
 * Converts a string representation of date ranges into an array of DateRangeDef
 * objects using the dateStringToDate function. When the start and finish hours
   are not specified, the start hour is set to 0, and the finish hour is set to
   24 such that the entire end day is included.
 * @param {string} val - A string containing date ranges separated by commas.
   @param {number} h - The hour of the day, in local time, to use when not specified in the definitions.
 * @returns {DateRangeDef[]} An array of DateRangeDef objects.
 */
export function dateList(val: string, h: Integer = 0): DateRangeDef[] {
  const result: DateRangeDef[] = [];
  const ranges = val.split(',');
  for (let idx = 0; idx < ranges.length; ++idx) {
    const range = ranges[idx];
    const p = range.split('-');
    let t0: Date;
    let t1: Date;
    try {
      if (p && p.length > 1) {
        t0 = dateStringToDate(p[0], h);
        t1 = dateStringToDate(p[1], h + 24);
      } else if (idx === ranges.length - 1) {
        t0 = dateStringToDate(range);
        t1 = new Date(new Date().getTime() + 3600 * 1000); // now plus an hour
      } else {
        t0 = dateStringToDate(range);
        t1 = new Date(t0.getTime() + DAY);
      }
    } catch (e: unknown) {
      console.log(String(e));
      Deno.exit(1);
    }
    result.push({ after: t0, before: t1 });
  }
  return result;
}

/**
 * Converts a date string in the format YYYYMMDD to a Date object. As with the
 * Date constructor, the timezone uses the local timezone.
 * @param {string} s - The date string to convert.
 * @param {Integer} [h=0] - The hour to set for the Date object (default is 0).
 * @returns {Date} The corresponding Date object.
 * @throws {Error} Throws an error if the date string is invalid.
 */
export function dateStringToDate(s: string, h: Integer = 0): Date {
  let hour = h;
  let minute = 0;
  let second = 0;
  const p: RegExpMatchArray | null = s.match(REG.DATE);
  if (p) {
    if (p[4]) {
      hour = parseInt(p[4], 10);
    }
    if (p[5]) {
      minute = parseInt(p[5], 10);
    }
    if (p[6]) {
      second = parseInt(p[6], 10);
    }
    return new Date(parseInt(p[1], 10), parseInt(p[2], 10) - 1, parseInt(p[3], 10), hour, minute, second, 0);
  } else {
    throw new Error('Invalid date');
  }
}
