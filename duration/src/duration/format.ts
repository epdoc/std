import type { Integer } from '@epdoc/type';
import type * as Intl2 from './intl.ts';
import type { Field } from './types.ts';

/**
 * Styles for Intl.DurationFormat.
 * We redefine narrow and modify the other styles slightly.
 * @see https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructo
 */
export type DurationUnitStyle = 'long' | 'short' | 'narrow' | 'digital';
/**
 * Options for displaying days.
 */
export type WholeDurationUnitStyle = 'long' | 'short' | 'narrow';
/**
 * Options for displaying milliseconds.
 */
export type FractionalDurationUnitStyle = 'long' | 'short' | 'narrow' | 'fractional';

/**
 * Base options from Intl.DurationFormat
 */
type BaseOptions = {
  locale?: string;
  numberingSystem?: string;
  style?: DurationUnitStyle;
  fractionalDigits?: Integer;
  hoursMinutesSeparator?: (locale: string) => string;
  minutesSecondsSeparator?: (locale: string) => string;
  years?: WholeDurationUnitStyle;
  yearsDisplay?: Intl2.DurationUnitDisplay;
  days?: WholeDurationUnitStyle;
  daysDisplay?: Intl2.DurationUnitDisplay;
  hours?: Intl2.DurationUnitStyle;
  hoursDisplay?: 'auto' | 'always';
  minutes?: Intl2.DurationUnitStyle;
  minutesDisplay?: Intl2.DurationUnitDisplay;
  seconds?: Intl2.DurationUnitStyle;
  secondsDisplay?: Intl2.DurationUnitDisplay;
  milliseconds?: FractionalDurationUnitStyle;
  millisecondsDisplay?: Intl2.DurationUnitDisplay;
  microseconds?: FractionalDurationUnitStyle;
  microsecondsDisplay?: Intl2.DurationUnitDisplay;
  nanoseconds?: FractionalDurationUnitStyle;
  nanosecondsDisplay?: Intl2.DurationUnitDisplay;
};

/**
 * Extended options for Intl.DurationFormat options
 */
export type DurationFormatOptions =
  & BaseOptions
  & Partial<{
    maxDisplay: Field;
    minDisplay: Field;
    yearsDaysSeparator: (locale: string) => string;
    daysHoursSeparator: (locale: string) => string;
    secondsUnit: (locale: string) => string;
    separator: string;
    adaptiveDisplay: Intl2.DurationUnitDisplay;
  }>;
