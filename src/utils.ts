import { Dict, Integer } from './types.ts';

export function isInteger(val: unknown): val is Integer {
  return isNumber(val) && Number.isInteger(val);
}

export function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val);
}

export function asInt(val: unknown, defVal = 0): number {
  // for speed do this test first
  if (isNumber(val)) {
    return Number.isInteger(val) ? val : Math.round(val);
  } else if (typeof val === 'string') {
    const v = parseFloat(val);
    if (isNumber(v)) {
      return Number.isInteger(v) ? v : Math.round(v);
    }
  }
  return defVal;
}

/**
 * Pads a number with leading zeros to a specified width.
 * @param n - The number to pad.
 * @param width - The total width of the resulting string.
 * @param [z='0'] - The character to use for padding.
 * @returns The padded string.
 */
export function pad(n: number, width: number, z: string = '0'): string {
  const sn = String(n);
  return sn.length >= width ? sn : new Array(width - sn.length + 1).join(z) + sn;
}

/**
 * Checks if the given value is a valid Date object.
 * @param val - The value to check.
 * @returns True if the value is a valid Date, otherwise false.
 */
export function isValidDate(val: unknown): val is Date {
  return val instanceof Date && !isNaN(val.getTime());
}

/**
 * Checks if the given value is a dictionary (object).
 * @param val - The value to check.
 * @returns True if the value is a dictionary, otherwise false.
 */
export function isDict(val: unknown): val is Dict {
  if (!isObject(val)) {
    return false;
  }
  return true;
}

/**
 * Checks if the given value is an object (not an array or Date).
 * @param val - The value to check.
 * @returns True if the value is an object, otherwise false.
 */
export function isObject(val: unknown): val is object {
  return (
    hasValue(val) &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Date) &&
    !(val instanceof RegExp)
  );
}

/**
 * Checks if the given value is not undefined or null.
 * @param val - The value to check.
 * @returns True if the value has a value, otherwise false.
 */
export function hasValue(val: unknown): boolean {
  return val !== null && val !== undefined;
}
