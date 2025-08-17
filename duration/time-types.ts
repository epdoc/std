import type { Integer } from '@epdoc/type';

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
