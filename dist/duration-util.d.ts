export type Milliseconds = number;
export type FormatMsOptions = {
    d: string;
    h: string;
    m: string;
    s: string | false;
    ms: string | false;
    decimal?: string | false;
    compact: boolean;
    sep?: string;
};
export declare function isFormatMsOptions(val: any): val is FormatMsOptions;
export declare function durationUtil(ms: Milliseconds, opts?: FormatMsOptions | FormatName): DurationUtil;
export type FormatName = 'hms' | ':' | 'long';
export declare function isFormatName(val: any): val is FormatName;
export declare class DurationUtil {
    private static OPTS;
    private _opts;
    private _decimal;
    private _ms;
    /**
     *
     * @param ms The duration we are outputing
     * @param opts
     */
    constructor(ms: Milliseconds, formatting?: FormatMsOptions | FormatName);
    /**
     * Define a custom format by overwriting the default format.
     * @param opts The name of one of the preset formatting options, or a
     * Dictionary with entries from a FormatMsOptions object, which are then used
     * to override the individual default values.
     * @returns this
     */
    options(formatting: FormatMsOptions | FormatName): DurationUtil;
    format(formatting?: FormatMsOptions | FormatName): string;
}
