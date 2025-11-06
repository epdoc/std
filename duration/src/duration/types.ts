/**
 * This module contains type definitions for the duration workspace.
 * @module
 */
import type * as Time from '../consts.ts';

/**
 * A type representing the fields of a duration.
 */
export type Field = keyof typeof Time.Measures;

/**
 * A type representing a part of a formatted duration string.
 */
export type Part = {
  type: 'literal' | 'integer' | 'unit' | 'decimal' | 'fraction';
  value: string;
  unit?: Field;
};
