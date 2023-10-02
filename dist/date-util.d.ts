export type Minutes = number;
export type JulianDate = number;
export declare function dateUtil(date?: Date): DateUtil;
export declare class DateUtil {
    private _date;
    private _invalidDateString;
    constructor(date?: Date);
    toISOLocaleString(showMs?: boolean): string;
    private validate;
    julianDate(): JulianDate;
    private static tz;
    /**
     * Convert a javascript Date object to a date value used by Google Sheets.
     * @param {*} jsDate A value that is passed to a Date constructor
     * @returns
     */
    googleSheetsDate(): number;
}
