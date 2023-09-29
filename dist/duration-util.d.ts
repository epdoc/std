export type Milliseconds = number;
export type FormatMsOptions = {
    h?: string;
    m?: string;
    s?: string;
    decimal?: string;
};
export declare function isFormatMsOptions(val: any): val is FormatMsOptions;
export declare class DurationUtil {
    private _opts;
    private _ms;
    constructor(ms: Milliseconds, opts?: FormatMsOptions);
    altOpts(): DurationUtil;
    options(opts: FormatMsOptions): DurationUtil;
    /**
     * Formats a duration into a string of the form 3:03:22.333 or 3.123, with as few leading numbers
     * as is necessary to display the time.
     * @param ms
     * @param options
     * @returns string
     */
    asString(): string;
}
