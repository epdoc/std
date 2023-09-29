export type Minutes = number;
export type Seconds = number;
export type JulianDate = number;
export declare class DateUtil {
    private _date;
    private _invalidDateString;
    constructor(date: Date);
    set invalidDateString(val: string);
    toISOLocaleString(bNoMs?: boolean): string;
    julianDate(): JulianDate;
    private static tz;
}
