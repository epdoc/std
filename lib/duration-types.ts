import { Integer } from 'https://raw.githubusercontent.com/jpravetz/typeutil/master/mod.ts';

export const SECONDS_PER_SOLAR_YEAR = ((365 * 24 + 5) * 60 + 48) * 60 + 46;

export const TIME: Record<string, number> = {
  // years: SECONDS_PER_YEAR * 1000,
  // months: Math.floor((SECONDS_PER_YEAR * 1000) / 12),
  // weeks: 7 * 24 * 3600 * 1000,
  days: 24 * 3600 * 1000,
  hours: 3600 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
  milliseconds: 1,
  microseconds: 1 / 1000,
  nanoseconds: 1 / 1000000,
} as const;
export const RATIO: Record<string, number> = {
  // years: SECONDS_PER_YEAR * 1000,
  // months: Math.floor((SECONDS_PER_YEAR * 1000) / 12),
  // weeks: 7 * 24 * 3600 * 1000,
  days: 1,
  hours: 24,
  minutes: 60,
  seconds: 60,
  milliseconds: 1000,
  microseconds: 1000,
  nanoseconds: 1000,
} as const;
export const Fields = Object.keys(TIME) as Field[];

export type Field = keyof typeof TIME;

export function isField(field: string): field is Field {
  return Fields.includes(field as Field);
}
// export type Field =
//   | 'days'
//   | 'hours'
//   | 'minutes'
//   | 'seconds'
//   | 'milliseconds'
//   | 'microseconds'
//   | 'nanoseconds';

export type Format = {
  locale: string;
  numberingSystem: string;
  style: 'long' | 'short' | 'narrow' | 'digital';
  fractionalDigits?: Integer;
  hoursMinutesSeparator?: string;
  minutesSecondsSeparator?: string;
  days?: 'long' | 'short' | 'narrow';
  daysDisplay?: 'auto' | 'always';
  hours?: 'long' | 'short' | 'narrow' | '2-digit' | 'numeric';
  hoursDisplay?: 'auto' | 'always';
  minutes?: 'long' | 'short' | 'narrow' | '2-digit' | 'numeric';
  minutesDisplay?: 'auto' | 'always';
  seconds?: 'long' | 'short' | 'narrow' | '2-digit' | 'numeric';
  secondsDisplay?: 'auto' | 'always';
  milliseconds?: 'long' | 'short' | 'narrow' | 'fractional';
  millisecondsDisplay?: 'auto' | 'always';
  microseconds?: 'long' | 'short' | 'narrow' | 'fractional';
  microsecondsDisplay?: 'auto' | 'always';
  nanoseconds?: 'long' | 'short' | 'narrow' | 'fractional';
  nanosecondsDisplay?: 'auto' | 'always';
};

export type Options = Partial<{
  style: 'long' | 'short' | 'narrow' | 'digital';
  minDisplay: Field;
  maxDisplay: Field;
  fractionalDigits: Integer;
  daysHoursSeparator: string;
  hoursMinutesSeparator: string;
  minutesSecondsSeparator: string;
  secondsUnit: string;
}>;
