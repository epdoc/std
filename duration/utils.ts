import { type CompareResult, isInteger } from '@epdoc/type';
import * as Time from './consts.ts';
import * as Duration from './duration/mod.ts';
import type * as Format from './format.ts';
import type { EpochMilliseconds, EpochSeconds, Milliseconds } from './time-types.ts';

export function isField(field: string): field is Duration.Field {
  return Duration.Fields.includes(field as Duration.Field);
}
// export type Field =
//   | 'days'
//   | 'hours'
//   | 'minutes'
//   | 'seconds'
//   | 'milliseconds'
//   | 'microseconds'
//   | 'nanoseconds';

export function compareFields(a: Duration.Field, b: Duration.Field): CompareResult {
  if (Time.Measures[a] < Time.Measures[b]) {
    return -1;
  }
  if (Time.Measures[a] > Time.Measures[b]) {
    return 1;
  }
  return 0;
}

/**
 * Type guard for Milliseconds type.
 * @param {unknown} val - The value to check.
 * @returns {val is Milliseconds} - True if the value is a Milliseconds type, false otherwise.
 */
export function isMilliseconds(val: unknown): val is Milliseconds {
  return isInteger(val);
}

/**
 * Type guard for EpochMilliseconds type.
 * @param {unknown} val - The value to check.
 * @returns {val is EpochMilliseconds} - True if the value is a EpochMilliseconds type, false otherwise.
 */
export function isEpochMilliseconds(val: unknown): val is EpochMilliseconds {
  return isInteger(val);
}

/**
 * Type guard for EpochSeconds type.
 * @param {unknown} val - The value to check.
 * @returns {val is EpochSeconds} - True if the value is a EpochSeconds type, false otherwise.
 */
export function isEpochSeconds(val: unknown): val is EpochSeconds {
  return isInteger(val);
}

/**
 * Construct a new `DurationUtil` instance. If `formatting` is not a
 * `FormatMsName` then will initialize formatting with default `:` format.
 * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
 * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
 * @see options
 */
export function duration(format?: Format.Options): Duration.Util {
  return new Duration.Util(format);
}
