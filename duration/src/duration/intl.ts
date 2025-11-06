/**
 * Full TypeScript Definition for Intl.DurationFormat and Options
 *
 * Deno runtime's built-in TypeScript definitions are slightly out-of-date and do not yet include the Intl.DurationFormatOptions interface
 */

/**
 * The style for a specific unit (e.g., years, hours, seconds).
 *
 * - 'long', 'short', 'narrow': Display style (e.g., "1 year", "1 yr", "1 y").
 * - 'numeric': Display the unit as a number, following the overall 'style' for context (e.g., "1").
 * - '2-digit': Display the unit as a two-digit number, padded with a leading zero if necessary (e.g., "01").
 */
export type DurationUnitStyle = 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';

/**
 * Controls whether a unit is displayed even if its value is zero.
 *
 * - 'always': Always display the unit, even if zero.
 * - 'auto': Display the unit only if its value is non-zero, or if it is the smallest displayed unit and the value is zero.
 */
export type DurationUnitDisplay = 'always' | 'auto';

/**
 * Options object for the Intl.DurationFormat constructor.
 */
export interface DurationFormatOptions {
  /**
   * The locale matching algorithm to use.
   * @default 'best fit'
   */
  localeMatcher?: 'lookup' | 'best fit';

  /**
   * The overall formatting style for units not individually specified.
   * @default 'long'
   */
  style?: 'long' | 'short' | 'narrow' | 'digital';

  /**
   * The numbering system to use for formatting.
   */
  numberingSystem?: string;

  // --- Unit Styles and Display ---

  years?: DurationUnitStyle;
  yearsDisplay?: DurationUnitDisplay;

  months?: DurationUnitStyle;
  monthsDisplay?: DurationUnitDisplay;

  weeks?: DurationUnitStyle;
  weeksDisplay?: DurationUnitDisplay;

  days?: DurationUnitStyle;
  daysDisplay?: DurationUnitDisplay;

  hours?: DurationUnitStyle;
  hoursDisplay?: DurationUnitDisplay;

  minutes?: DurationUnitStyle;
  minutesDisplay?: DurationUnitDisplay;

  seconds?: DurationUnitStyle;
  secondsDisplay?: DurationUnitDisplay;

  milliseconds?: DurationUnitStyle;
  millisecondsDisplay?: DurationUnitDisplay;

  microseconds?: DurationUnitStyle;
  microsecondsDisplay?: DurationUnitDisplay;

  nanoseconds?: DurationUnitStyle;
  nanosecondsDisplay?: DurationUnitDisplay;

  // --- Fractional and Rounding Options (for the smallest displayed unit) ---

  /**
   * The number of fractional digits to display for the smallest unit.
   */
  fractionalDigits?: number;

  /**
   * The minimum number of fractional digits to display for the smallest unit.
   */
  minimumFractionDigits?: number;

  /**
   * The maximum number of fractional digits to display for the smallest unit.
   */
  maximumFractionDigits?: number;

  /**
   * The rounding behavior for fractional units.
   */
  roundingMode?:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven';

  /**
   * How to handle displaying the sign (e.g., positive or negative).
   * @default 'auto'
   */
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
}

/**
 * A utility type representing the structure of the duration object passed to .format().
 */
export interface DurationRecord {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  microseconds?: number;
  nanoseconds?: number;
}
