import { type Integer, isInteger } from './dep.ts';

/**
 * Represents a duration in milliseconds.
 * @typedef {Integer} Milliseconds
 */
export type Milliseconds = Integer;

/**
 * Represents a duration in high resolution milliseconds, as would be returned
 * by performance.now();
 * @typedef {number} HrMilliseconds
 */
export type HrMilliseconds = number;

/**
 * Represents a duration in milliseconds since the Unix epoch.
 * @typedef {Integer} EpochMilliseconds
 */
export type EpochMilliseconds = Integer;

/**
 * Represents a duration in seconds since the Unix epoch.
 * @typedef {Integer} EpochSeconds
 */
export type EpochSeconds = Integer;

export type Minutes = number;
export type Seconds = number;
export type HrSeconds = number;

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
