import type { CompareResult } from '@epdoc/type';

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

export function compareFields(a: Field, b: Field): CompareResult {
  if (TIME[a] < TIME[b]) {
    return -1;
  }
  if (TIME[a] > TIME[b]) {
    return 1;
  }
  return 0;
}
