/**
 * This module contains utility functions for working with durations.
 * @module
 */
import { type CompareResult, isInteger } from '@epdoc/type';
import * as Time from './consts.ts';
import type * as Format from './duration/format.ts';
import * as Duration from './duration/mod.ts';
import type { EpochMilliseconds, EpochSeconds, Milliseconds } from './time-types.ts';

/**
 * Type guard for Duration.Field type.
 * @param {string} field - The value to check.
 * @returns {field is Duration.Field} - True if the value is a Duration.Field type, false otherwise.
 */
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

/**
 * Compare two duration fields.
 * @param {Duration.Field} a - The first field.
 * @param {Duration.Field} b - The second field.
 * @returns {CompareResult} - -1 if a < b, 0 if a === b, 1 if a > b.
 */
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
 * Factory function to create a new Duration.Formatter instance.
 * @param {Format.DurationFormatOptions} format - Defines the format.
 * @returns {Duration.Formatter} A new Duration.Formatter instance.
 */
export function duration(format?: Format.DurationFormatOptions): Duration.Formatter {
  return new Duration.Formatter(format);
}
