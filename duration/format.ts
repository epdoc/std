import type { Integer } from './dep.ts';
import type { Field } from './types.ts';

/**
 * Styles for Intl.DurationFormat.
 * We redefine narrow and modify the other styles slightly.
 * @see https://tc39.es/proposal-intl-duration-format/#sec-intl-durationformat-constructo
 */
export type Style = 'long' | 'short' | 'narrow' | 'digital';
/**
 * Display options for Intl.DurationFormat
 */
export type Display = 'auto' | 'always';
export type Days = 'long' | 'short' | 'narrow';
export type HMS = 'long' | 'short' | 'narrow' | '2-digit' | 'numeric';
export type MS = 'long' | 'short' | 'narrow' | 'fractional';

/**
 * Base options from Intl.DurationFormat
 */
type BaseOptions = {
  locale?: string;
  numberingSystem?: string;
  style?: Style;
  fractionalDigits?: Integer;
  hoursMinutesSeparator?: string;
  minutesSecondsSeparator?: string;
  days?: Days;
  daysDisplay?: Display;
  hours?: HMS;
  hoursDisplay?: 'auto' | 'always';
  minutes?: HMS;
  minutesDisplay?: Display;
  seconds?: HMS;
  secondsDisplay?: Display;
  milliseconds?: MS;
  millisecondsDisplay?: Display;
  microseconds?: MS;
  microsecondsDisplay?: Display;
  nanoseconds?: MS;
  nanosecondsDisplay?: Display;
};

/**
 * Extended options for Intl.DurationFormat options
 */
export type Options =
  & BaseOptions
  & Partial<{
    maxDisplay: Field;
    minDisplay: Field;
    daysHoursSeparator: string;
    secondsUnit: string;
    separator: string;
  }>;
