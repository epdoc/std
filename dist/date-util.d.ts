import { Integer } from 'epdoc-util';
export type EpochMilliseconds = Integer;
export type EpochSeconds = Integer;
export type Minutes = number;
/**
 * An integer value representing the Julian Day.
 * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
 */
export type JulianDay = Integer;
/**
 * A floating point number representing date and time, suitable for use in Google Sheets.
 */
export type GoogleSheetsDate = number;
/**
 * Calls and returns `new DateUtil(date)`.
 * @param date
 * @returns
 */
export declare function dateUtil(date?: Date | string | Integer): DateUtil;
/**
 * A wrapper for a javascript `Date` object.
 */
export declare class DateUtil {
    private _date;
    private _invalidDateString;
    /**
     * Create a DateUtil object, which is a wrapper for a javascript `Date` object.
     * @param date Optional Date object, or a string or number that can be used
     * with the Date constructor method. If undefined then uses the value of `new Date()`.
     */
    constructor(date?: Date | string | Integer);
    /**
     * Output the date in the form '2016-05-01T11:49:21-07:00'. This differs from
     * `Date.toISOString` which always uses UTC in the output.
     * @param showMs Set to false to hide (truncate) milliseconds
     * @returns
     */
    toISOLocaleString(showMs?: boolean): string;
    /**
     * Validate whether the date is a valid Date object.
     */
    private validate;
    /**
     * Get the Julian Day.
     * @returns A number which is the Julian Day
     * @see [Julian day](https://en.wikipedia.org/wiki/Julian_day)
     */
    julianDate(): JulianDay;
    static tz(m: Minutes): string;
    /**
     * Get the date in a Google Sheets value
     * @returns A number which is the date with a value suitable for use in Google
     * Sheets
     */
    googleSheetsDate(): GoogleSheetsDate;
}
