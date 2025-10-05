/**
 * This module contains type definitions for time-related values.
 * @module
 */
import type { Integer } from '@epdoc/type';

/**
 * Represents a duration in milliseconds.
 * This is a **semantic type alias** for `number` (specifically a non-negative integer),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {Integer} Milliseconds
 */ export type Milliseconds = Integer;

/**
 * Represents a duration in high resolution milliseconds, as would be returned
 * by performance.now();
 * This is a **semantic type alias** for `number` (specifically a non-negative number),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {number} HrMilliseconds
 */
export type HrMilliseconds = number;

/**
 * Represents a duration in milliseconds since the Unix epoch.
 * This is a **semantic type alias** for `number` (specifically a non-negative integer),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {Integer} EpochMilliseconds
 */
export type EpochMilliseconds = Integer;

/**
 * Represents a duration in seconds since the Unix epoch.
 * This is a **semantic type alias** for `number` (specifically a non-negative integer),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the integer and non-negative constraints.
 * @typedef {Integer} EpochSeconds
 */
export type EpochSeconds = Integer;

/**
 * Represents a duration in minutes.
 * This is a **semantic type alias** for `number` (specifically a positive or negative number),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the number constraints.
 */
export type Minutes = number;
/**
 * Represents a duration in seconds.
 * This is a **semantic type alias** for `number` (specifically a positive or negative number),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the number constraints.
 */
export type Seconds = number;
/**
 * Represents a duration in high resolution seconds.
 * This is a **semantic type alias** for `number` (specifically a non-negative number),
 * primarily used for **code clarity and hinting**.
 * Runtime validation is required to enforce the number and non-negative constraints.
 */
export type HrSeconds = number;
