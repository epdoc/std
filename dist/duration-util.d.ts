import { Integer } from 'epdoc-util';
export type Milliseconds = Integer;
/**
 * For `compact` mode this must be a string. Otherwise this can be a string or
 * an array of one or two strings. If it is an array, the first string is used
 * for singular values (_e.g. 1 day_) and the second string is used for plural
 * values (_e.g. 2 days_).
 *
 * An example value is `[ 'hour', 'hours' ]`.
 */
export type FormatMsUnit = string | string[] | false;
export declare function isFormatMsUnit(val: any): val is FormatMsUnit;
/**
 * Defines the output format for the duration string.
 */
export type FormatMsOptions = {
    /**
     * Controls whether a compact or  long output format is used. With the compact
     * format there are no spaces, and numbers padded to a standard width (_e.g._
     * for minutes '2' becomes '02'). With the long format there are spaces and
     * numbers are not padded. The long format is suitable for when the output is
     * going to be read with text to speech, while the compact format is more
     * suited to display.
     */
    compact?: boolean;
    /**
     * The unit string to append to days.
     */
    d?: FormatMsUnit;
    /**
     * The unit string to append for hours.
     */
    h?: FormatMsUnit;
    /**
     * The unit string to append for minutes.
     */
    m?: FormatMsUnit;
    /**
     * The unit string to append for seconds.
     */
    s?: FormatMsUnit | false;
    /**
     * The value `true` is the same as `3`, `false` is the same as `0`. Indicates
     * the number of digits of milliseconds to display. For non-compact mode, this
     * can only be a boolean `false` or a string and the string is appended to the
     * output.
     */
    ms?: boolean | 0 | 1 | 2 | 3 | FormatMsUnit;
    /**
     * The character to use for a decimal place. Defaults to `.`.
     */
    decimal?: string | false;
    /**
     * A separator to use when `compact` is false.
     */
    sep?: string;
};
export declare function isFormatMsOptions(val: any): val is FormatMsOptions;
export declare function durationUtil(ms: Milliseconds, opts?: FormatMsOptions | FormatMsName): DurationUtil;
/**
 * Predefined output formats.
 *
 *  - `long` output format is `1 hour, 14 minutes, 3 seconds, 454 milliseconds`
 *  - `hms` output format is `1h14m03.454s`
 *  - `:` output format is `1:14:03.454`
 */
export type FormatMsName = 'hms' | ':' | 'long';
export declare function isFormatMsName(val: any): val is FormatMsName;
export declare class DurationUtil {
    private static OPTS;
    private _opts;
    private _decimal;
    private _ms;
    /**
     * Construct a new `DurationUtil` instance. If `formatting` is not a
     * `FormatMsName` then will initialize formatting with default `:` format.
     * @param ms The duration we are outputing. We use the absolute value.
     * @param formatting Defines the format.
     * @see options
     */
    constructor(ms: Milliseconds, formatting?: FormatMsOptions | FormatMsName);
    /**
     * Define a custom format by overwriting the already-set format options.
     * @param opts The `FormatMsName` name of one of the preset formats, or a
     * `FormatMsOptions` object, which are then used to override the individual
     * values.
     * @returns this
     */
    options(formatting: FormatMsOptions | FormatMsName): DurationUtil;
    /**
     * Formats the output string.
     * @param formatting Same as per the `options` method. A format to be used
     * when constructing the output.
     * @returns The formatted output string.
     */
    format(formatting?: FormatMsOptions | FormatMsName): string;
}
