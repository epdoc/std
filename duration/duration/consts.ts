/**
 * @module
 */
import * as Time from '../consts.ts';
import type * as Duration from './types.ts';

/**
 * An array of all the field names in a duration.
 */
export const Fields = Object.keys(Time.Measures) as Duration.Field[];
