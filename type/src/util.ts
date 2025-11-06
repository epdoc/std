import { decodeAscii85, encodeAscii85 } from '@std/encoding/ascii85';
import stripJsonComments from './strip-comments.ts';
import type {
  AsFloatOpts,
  CompareResult,
  DeepCopyOpts,
  Dict,
  Integer,
  JsonDeserializeOpts,
  RegExpDef,
} from './types.ts';

/**
 * Regular expression definitions for various patterns.
 */
const REGEX = {
  isTrue: new RegExp(/^(true|yes|on)$/, 'i'),
  isFalse: new RegExp(/^(false|no|off)$/, 'i'),
  allHex: new RegExp(/^[0-9a-fA-F]+$/),
  firstUppercase: new RegExp(/(^[A-Z])/),
  allUppercase: new RegExp(/([A-Z])/, 'g'),
  firstCapitalize: new RegExp(/^([a-z])/),
  allCapitalize: new RegExp(/(\_[a-z])/, 'gi'),
  tr: new RegExp(/^[\[]tr[\]](.+)$/),
  camel2dash: new RegExp(/([a-z0-9])([A-Z])/, 'g'),
  dash2camel: new RegExp(/-(.)/, 'g'),
  isISODate: new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/),
  escMatch: new RegExp(/[.*+?^${}()|[\]\\]/g),
  // customElement: new RegExp(/CustomElement$/),
  // html: new RegExp(/[&<>"'\/]/, 'g'),
  // instr: new RegExp(/^[\[]([^\]]+)[\]](.*)$/),
};

/**
 * Checks if the given value is a boolean.
 * @param val - The value to check.
 * @returns True if the value is a boolean, otherwise false.
 */
export function isBoolean(val: unknown): val is boolean {
  return typeof val === 'boolean';
}

/**
 * Checks if the given value is a string.
 * @param val - The value to check.
 * @returns True if the value is a string, otherwise false.
 */
export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

/**
 * Checks if the given value is a non-empty string.
 * @param val - The value to check.
 * @returns True if the value is a non-empty string, otherwise false.
 */
export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}

/**
 * Checks if the given value is a Uint8Array.
 * @param val - The value to check.
 * @returns True if the value is a Uint8Array, otherwise false.
 */

export function isUint8Array(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array;
}

/**
 * Checks if the given value is a Uint8Array.
 * @param val - The value to check.
 * @returns True if the value is a Uint8Array, otherwise false.
 */

export function isNonEmptyUint8Array(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array && val.length > 0;
}

/**
 * Checks if the given value is a hexadecimal string.
 * @param val - The value to check.
 * @param len - Optional. If provided, checks if the hexadecimal string has this exact length.
 * @returns True if the value is a hexadecimal string (and optionally of the specified length), otherwise false.
 */
export function isHexString<T extends string>(val: unknown, len?: Integer): val is T {
  if (typeof val !== 'string') {
    return false;
  }
  if (isInteger(len) && val.length !== len) {
    return false;
  }
  return REGEX.allHex.test(val);
}

/**
 * Checks if the given value is a number.
 * @param val - The value to check.
 * @returns True if the value is a number, otherwise false.
 */
export function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Checks if the given value is an integer.
 * @param val - The value to check.
 * @returns True if the value is an integer, otherwise false.
 */
export function isInteger(val: unknown): val is Integer {
  return isNumber(val) && Number.isInteger(val);
}

/**
 * Checks if the given value is a positive integer (1, 2, 3, ...).
 * @param val - The value to check.
 * @returns True if the value is a positive integer, otherwise false.
 */
export function isPosInteger(val: unknown): val is Integer {
  return isInteger(val) && val > 0;
}

/**
 * Checks if the given value is a whole number (0, 1, 2, 3, ...).
 * @param val - The value to check.
 * @returns True if the value is a whole number, otherwise false.
 */
export function isWholeNumber(val: unknown): val is Integer {
  return isInteger(val) && val >= 0;
}

/**
 * Checks if the given value is an integer within the specified range.
 * @param val - The value to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns True if the value is an integer within the range, otherwise false.
 */
export function isIntegerInRange(val: unknown, min: number, max: number): val is Integer {
  return isInteger(val) && val >= min && val <= max;
}

/**
 * Checks if the given value is a number within the specified range.
 * @param val - The value to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns True if the value is a number within the range, otherwise false.
 */
export function isNumberInRange(val: unknown, min: number, max: number): val is number {
  return isNumber(val) && val >= min && val <= max;
}

/**
 * Checks if the given value is a positive number (> 0).
 * @param val - The value to check.
 * @returns True if the value is a positive number, otherwise false.
 */
export function isPosNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val) && val > 0;
}

/**
 * Checks if the given value is a function.
 * @param val - The value to check.
 * @returns True if the value is a function, otherwise false.
 */
// deno-lint-ignore ban-types
export function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

/**
 * Checks if the given value is a Date object.
 * @param val - The value to check.
 * @returns True if the value is a Date, otherwise false.
 */
export function isDate(val: unknown): val is Date {
  return val instanceof Date;
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
 * Checks if the given value is an array.
 * @param val - The value to check.
 * @returns True if the value is an array, otherwise false.
 */
export function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

/**
 * Checks if the given value is a non-empty array.
 * @param val - The value to check.
 * @returns True if the value is a non-empty array, otherwise false.
 */
export function isNonEmptyArray(val: unknown): val is unknown[] {
  return Array.isArray(val) && val.length > 0;
}

/**
 * Checks if the given value is an array of strings.
 * @param val - The value to check.
 * @returns True if the value is an array of strings, otherwise false.
 */
export function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((v) => typeof v === 'string');
}

/**
 * Checks if the given value is a Set.
 * @param val - The value to check.
 * @returns True if the value is a Set, otherwise false.
 */
export function isSet(val: unknown): val is Set<unknown> {
  return val instanceof Set;
}

/**
 * Checks if the given value is a non-empty Set.
 * @param val - The value to check.
 * @returns True if the value is a non-empty Set, otherwise false.
 */
export function isNonEmptySet(val: unknown): val is Set<unknown> {
  return val instanceof Set && val.size > 0;
}

/**
 * Checks if the given value is a Map.
 * @param val - The value to check.
 * @returns True if the value is a Map, otherwise false.
 */
export function isMap(val: unknown): val is Map<unknown, unknown> {
  return val instanceof Map;
}

/**
 * Checks if the given value is a non-empty Map.
 * @param val - The value to check.
 * @returns True if the value is a non-empty Map, otherwise false.
 */
export function isNonEmptyMap(val: unknown): val is Map<unknown, unknown> {
  return val instanceof Map && val.size > 0;
}

/**
 * Checks if the given value is a RegExp object.
 * @param val - The value to check.
 * @returns True if the value is a RegExp, otherwise false.
 */
export function isRegExp(val: unknown): val is RegExp {
  return val instanceof RegExp;
}

/**
 * Checks if the given value is null.
 * @param val - The value to check.
 * @returns True if the value is null, otherwise false.
 */
export function isNull(val: unknown): val is null {
  return val === null ? true : false;
}

/**
 * Checks if the given value is undefined.
 * @param val - The value to check.
 * @returns True if the value is undefined, otherwise false.
 */
export function isUndefined(val: unknown): val is undefined {
  return val === undefined ? true : false;
}

/**
 * Checks if the given value is null or undefined.
 * @param val - The value to check.
 * @returns True if the value is null or undefined, otherwise false.
 */
export function isNullOrUndefined(val: unknown): boolean {
  return val === undefined || val === null ? true : false;
}

/**
 * Checks if the given value is defined (not undefined).
 * @param val - The value to check.
 * @returns True if the value is defined, otherwise false.
 */
export function isDefined(val: unknown): boolean {
  return val !== undefined;
}

/**
 * Type guard to check if a value is a Record<string, string>.
 * @param val - The value to check.
 * @returns True if the value is a Record<string, string>, otherwise false.
 */
export function isRecordStringString(val: unknown): val is Record<string, string> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false;
  const keys = Object.keys(val);
  for (const key of keys) {
    if (typeof (val as Record<string, unknown>)[key] !== 'string') return false;
  }
  return true;
}

/**
 * Type guard to check if a value is a plain JavaScript object,
 * meaning it's an object created by `{}` or `new Object()`,
 * or by `Object.create(null)`.
 * It specifically excludes arrays, functions, Dates, RegExps,
 * and instances of custom classes.
 *
 * @param val The unknown value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
export function isDict(val: unknown): val is Dict {
  // 1. Check for null and ensure it's an object
  if (val === null || typeof val !== 'object') {
    return false;
  }

  // 2. Exclude arrays
  if (Array.isArray(val)) {
    return false;
  }

  // 3. Exclude Dates, RegExps, and other built-in object types
  // You could add more checks here if needed, e.g., val instanceof Date
  if (val instanceof Date || val instanceof RegExp) {
    return false;
  }

  // 4. Check for plain object prototype. This will exclude class instances.
  // This also means objects created with Object.create(null) will return false.
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null; // proto === null handles Object.create(null)
}

/**
 * Type guard to check if an unknown value is a valid RegExpDef object.
 * It ensures that the value is an object with either a non-empty 'pattern'
 * or a non-empty 'regex' property (but not both).
 *
 * @param {unknown} val The value to check.
 * @returns {val is RegExpDef} True if the value conforms to the RegExpDef type, false otherwise.
 */
export function isRegExpDef(val: unknown): val is RegExpDef {
  // First, ensure it's a dictionary-like object
  if (!isDict(val)) {
    return false;
  }

  const asDict = val as Record<string, unknown>; // Cast for easier property access

  const hasPattern = Object.prototype.hasOwnProperty.call(asDict, 'pattern');
  const hasRegex = Object.prototype.hasOwnProperty.call(asDict, 'regex');
  const hasFlags = Object.prototype.hasOwnProperty.call(asDict, 'flags');

  // Must have exactly one of 'pattern' or 'regex'
  if (!(hasPattern || hasRegex) || (hasPattern && hasRegex)) {
    return false;
  }

  // Check the 'pattern' property if it exists
  if (hasPattern) {
    if (!isNonEmptyString(asDict.pattern)) {
      return false;
    }
  }

  // Check the 'regex' property if it exists
  if (hasRegex) {
    if (!isNonEmptyString(asDict.regex)) {
      return false;
    }
  }

  // If flags exist, ensure they are a string
  if (hasFlags && typeof asDict.flags !== 'string') {
    return false;
  }

  return true;
}

/**
 * Checks if the given value is not undefined or null.
 * @param val - The value to check.
 * @returns True if the value has a value, otherwise false.
 */
export function hasValue(val: unknown): boolean {
  return val !== null && val !== undefined;
}

/**
 * Checks if the given object is empty (no own properties).
 * @param obj - The object to check.
 * @returns True if the object is empty, otherwise false.
 */
export function isEmpty(obj: unknown): boolean {
  if (isDict(obj)) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  return true;
}

/**
 * Checks if the given value is an Error object.
 * @param val - The value to check.
 * @returns True if the value is an Error, otherwise false.
 */
export function isError(val: unknown): val is Error {
  return val instanceof Error;
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
 * Tests if the given value is definitively true.
 * @param val - The value to test.
 * @returns True if the value is true, otherwise false.
 */
export function isTrue(val: unknown): boolean {
  if (typeof val === 'boolean') {
    return val;
  } else if (typeof val === 'number') {
    return val > 0 ? true : false;
  } else if (typeof val === 'string') {
    return val.length && REGEX.isTrue.test(val) ? true : false;
  }
  return false;
}

/**
 * Tests if the given value is definitively false.
 * @param val - The value to test.
 * @returns True if the value is false, otherwise false.
 */
export function isFalse(val: unknown): boolean {
  if (typeof val === 'boolean') {
    return val === false ? true : false;
  } else if (typeof val === 'number') {
    return val === 0 ? true : false;
  } else if (typeof val === 'string') {
    return val.length && REGEX.isFalse.test(val) ? true : false;
  }
  return false;
}

/**
 * Checks if the given object is a class of a specified name.
 * @param obj - The object to check.
 * @param name - The name of the class to check against.
 * @returns True if the object is an instance of the class, otherwise false.
 */
export function isClass(obj: unknown, name: string): boolean {
  return isObject(obj) && obj.constructor.name === name;
}

/**
 * Converts a value to a boolean, using a default value if necessary.
 * @param val - The value to convert.
 * @param defval - The default value to use if conversion fails.
 * @returns The converted boolean value.
 */
export function asBoolean(val: unknown, defval = false): boolean {
  if (defval) {
    return isFalse(val) ? false : defval;
  }
  return isTrue(val) ? true : defval;
}

/**
 * Converts a value to a float, handling thousands separators.
 * @param val - The value to convert.
 * @param opts - Options for conversion.
 * @returns The converted float value.
 */
export function asFloat(val: unknown, opts?: AsFloatOpts): number {
  if (typeof val === 'number') {
    return val;
  }
  let v: number;
  if (isNonEmptyString(val)) {
    let s: string;
    if (opts && opts.commaAsDecimal) {
      s = val.replace(/(\d)\.(\d)/g, '$1$2').replace(/(\d),/g, '$1.');
    } else {
      s = val.replace(/(\d),(\d)/g, '$1$2');
    }
    v = parseFloat(s);
  } else {
    v = NaN;
  }
  if (isNaN(v)) {
    if (opts && isNumber(opts.def)) {
      return opts.def;
    }
    return 0;
  }
  return v;
}

/**
 * Converts a value to an integer, returning a default value if conversion fails.
 * @param val - The value to convert.
 * @param defVal - The default value to return if conversion fails.
 * @returns The converted integer value.
 */
export function asInt(val: unknown, defVal: Integer = 0 as Integer): Integer {
  // for speed do this test first
  if (isNumber(val)) {
    return Number.isInteger(val) ? val as Integer : Math.round(val) as Integer;
  }
  if (isNonEmptyString(val)) {
    const v = parseFloat(val);
    if (isNumber(v)) {
      return Number.isInteger(v) ? v as Integer : Math.round(v) as Integer;
    }
  }
  return defVal;
}

/**
 * Converts a value to a string.
 * Credit to jsr:@std/log for this function
 * @param data - The value to convert.
 * @param isProperty - Whether the string is a property name.
 * @returns The converted string.
 */
export function asString(data: unknown, isProperty = false): string {
  if (typeof data === 'string') {
    if (isProperty) return `"${data}"`;
    return data;
  } else if (
    data === null ||
    typeof data === 'number' ||
    typeof data === 'bigint' ||
    typeof data === 'boolean' ||
    typeof data === 'undefined' ||
    typeof data === 'symbol'
  ) {
    return String(data);
  } else if (data instanceof Error) {
    return data.stack!;
  } else if (typeof data === 'object') {
    return `{${
      Object.entries(data)
        .map(([k, v]) => `"${k}":${asString(v, true)}`)
        .join(',')
    }}`;
  }
  return 'undefined';
}

/**
 * Safely casts an unknown value to a Date object.
 * If the value cannot be cast to a valid Date, it attempts to cast `defVal`.
 * If both fail, it returns null.
 *
 * @param {unknown} value The value to attempt to cast to a Date. Can be a Date object,
 * a number (milliseconds since epoch), a string (parsable by Date constructor),
 * or an array of numbers representing Date constructor arguments (e.g., [year, monthIndex, day]).
 * @param {unknown} [defVal] An optional default value to return if `value` cannot be
 * cast to a valid Date. This default value will also be attempted to be cast to a valid Date.
 * @returns {Date | null} A valid Date object if casting is successful for `value` or `defVal`,
 * otherwise null.
 */
export function asDate(value: unknown, defVal?: unknown): Date | null {
  // Helper function to attempt casting and validation,
  // returning a valid Date or null.
  const tryCast = (val: unknown): Date | null => {
    // Case 1: Already a Date object
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null; // Invalid Date object
      return val;
    }

    // Case 2: String (custom format or standard parsable)
    if (typeof val === 'string') {
      const date = new Date(val);
      if (isNaN(date.getTime())) return null; // Invalid standard string
      return date;
    }

    // Case 3: Number (milliseconds since epoch)
    if (typeof val === 'number') {
      const date = new Date(val);
      if (isNaN(date.getTime())) return null; // Invalid number
      return date;
    }

    // Case 4: Array of arguments (e.g., [year, month, day])
    if (Array.isArray(val)) {
      // Ensure all elements in the array are numbers for the Date constructor
      if (val.every((arg) => typeof arg === 'number')) {
        const date = Reflect.construct(Date, val as number[]) as Date;
        if (isNaN(date.getTime())) return null; // Array results in invalid date
        return date;
      }
      return null; // Array contains non-numbers
    }

    return null; // Not a convertible type
  };

  // First, try to cast the primary `value`.
  const primaryDate = tryCast(value);
  if (primaryDate !== null) {
    return primaryDate;
  }

  // If the primary `value` didn't yield a valid date,
  // and `defVal` is provided, try to cast `defVal`.
  if (defVal !== undefined) {
    const defaultDate = tryCast(defVal);
    if (defaultDate !== null) {
      return defaultDate;
    }
  }

  // If both attempts fail, return null.
  return null;
}

/**
 * Converts a value to a RegExp object.
 * It handles native RegExp objects, and objects conforming to RegExpDef (with 'pattern' or 'regex' and optional 'flags').
 *
 * @param {unknown} val The value to convert.
 * @returns {RegExp | undefined} The converted RegExp object, or undefined if conversion fails.
 */
export function asRegExp(val: unknown): RegExp | undefined {
  // Case 1: Value is already a RegExp object
  if (isRegExp(val)) {
    return val;
  }

  // Case 2: Value is a RegExpDef object
  if (isRegExpDef(val)) {
    const patternString: string | undefined = val.pattern ? val.pattern : val.regex;

    if (isNonEmptyString(patternString)) {
      // Create and return the RegExp object
      try {
        return new RegExp(patternString, val.flags);
      } catch (_e) {
        // Catch potential errors if the pattern or flags are invalid for RegExp constructor
        // console.warn('Failed to create RegExp from RegExpDef:', e, 'Input:', val);
        return undefined;
      }
    }
  }

  // Case 3: Value is neither a RegExp nor a valid RegExpDef.
  return undefined;
}

/**
 * Converts arguments into an Error object. If there is more than one argument
 * then the arguments are concatenated into a single error.
 * @param args - The arguments to convert.
 * @returns The resulting Error object.
 */
export function asError(...args: unknown[]): IError {
  let err: Error | undefined;
  const msg: string[] = [];
  if (args.length) {
    let opts: Dict = {};
    args.forEach((arg) => {
      if (arg instanceof Error) {
        if (!err) {
          err = arg;
        }
        msg.push(arg.message); // <-- Logic bug fixed
      } else if (isString(arg)) {
        msg.push(arg);
      } else if (isDict(arg)) {
        opts = arg;
      } else {
        msg.push(String(arg));
      }
    });
    if (err instanceof Error) {
      // The message is a combination of all arguments
      err.message = msg.join(' ');
      Object.keys(opts).forEach((key) => {
        // @ts-ignore add our own properties anyway
        err[key] = opts[key];
      });
    } else {
      err = newError(msg.join(' '), opts);
    }
    return err;
  }
  return newError('Invalid Error error');
}

/**
 * Reflects the fact that the js Error object actually has a code property.
 */
export interface IError extends Error {
  code?: string | number;
}

function newError(msg: string, opts: Dict = {}): IError {
  const result = new Error(msg);
  Object.assign(result, opts);
  return result;
}

/**
 * Picks specified keys from the given object.
 * @param obj - The object to pick from.
 * @param args - The keys to pick.
 * @returns A new object with the picked keys.
 */
export function pick<T = Dict>(obj: Dict, ...args: (string | number)[]): T {
  // eslint-disable-line no-extend-native
  const result: Dict = {};
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  args.forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result as T;
}

/**
 * Omits specified keys from the given object.
 * @param obj - The object to omit from.
 * @param args - The keys to omit.
 * @returns A new object without the omitted keys.
 */
export function omit<T = Dict>(obj: Dict, ...args: (string | number)[]): T {
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  const keys = Object.keys(obj).filter((key) => args.indexOf(key) < 0);
  const newObj: Dict = {};
  keys.forEach((k) => {
    newObj[k] = obj[k];
  });
  return newObj as T;
}

/**
 * Pads a number or string with leading characters to a specified width.
 * @param n - The number or string to pad.
 * @param width - The total width of the resulting string.
 * @param [z='0'] - The character to use for padding. Defaults to 0, as is used for numbers.
 * @returns The padded string.
 * @deprecated Use String.padStart() instead.
 * @example
 * ```typescript
 * const num = 5;
 * const paddedNum = String(num).padStart(4, '0');
 * console.log(paddedNum); // '0005'
 * ```
 */
export function pad(n: number | string, width: number, z: string = '0'): string {
  const sn = String(n);
  return sn.length >= width ? sn : new Array(width - sn.length + 1).join(z) + sn;
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param num - The number to round.
 * @param dec - The number of digits after the decimal.
 * @returns The rounded number.
 */
export function roundNumber(num: number, dec: number = 3): number {
  const factor = Math.pow(10, dec);
  return Math.round(num * factor) / factor;
}

/**
 * Performs a deep copy of the provided value, with advanced options for transformation.
 *
 * This function is unique in that it supports:
 *   - Deep cloning of objects, arrays, and primitives.
 *   - Optional transformation or replacement of values during the copy.
 *   - Preserving RegExp, Date, and other special objects if specified.
 *
 * @param {unknown} value - The value to deep copy.
 * @param {object} [options] - Options for the deep copy operation:
 *   @param {boolean} [options.replace=Dict] - If set, replaces keys with values throughout `a`.
 *   @param {string} [options.pre='{'] - Prefix string for detecting replacement strings in string values.
 *   @param {string} [options.post='}'] - Suffix string for detecting replacement strings in string values.
 *   @param {boolean} [options.detectRegExp=false] - If true, detects and reconstructs RegExp objects from plain objects using asRegExp.
 * @returns {unknown} The deeply copied value, possibly transformed.
 *
 * @example
 * // Deep copy with transformation
 * const result = deepCopy(obj, { transform: (v) => typeof v === 'string' ? v.toUpperCase() : v });
 */
export function deepCopy(a: unknown, options?: DeepCopyOpts): unknown {
  const opts: DeepCopyOpts = deepCopySetDefaultOpts(options);
  if (a === undefined || a === null) {
    return a;
  } else if (typeof a === 'number') {
    return a;
  } else if (typeof a === 'string') {
    if (opts.replace) {
      return msub(a, opts.replace, opts.pre!, opts.post!);
    } else {
      return a;
    }
  } else if (a instanceof Date || a instanceof RegExp) {
    return a;
  } else if (a instanceof Set) {
    const result = new Set();
    for (const b of a) {
      result.add(deepCopy(b, opts));
    }
    return result;
  } else if (a instanceof Map) {
    const result = new Map();
    for (const [k, v] of a) {
      result.set(deepCopy(k, opts), deepCopy(v, opts));
    }
    return result;
  } else if (Array.isArray(a)) {
    const result = [];
    for (const b of a) {
      const r = deepCopy(b, opts);
      result.push(r);
    }
    return result;
  } else if (isDict(a)) {
    const re: RegExp | undefined = opts && opts.detectRegExp ? asRegExp(a) : undefined;
    if (re) {
      return re;
    } else {
      const result2: Dict = {};
      Object.keys(a).forEach((key) => {
        result2[key] = deepCopy(a[key], opts);
      });
      return result2;
    }
  }
  return a;
}

/**
 * Performs string substitution similar to JavaScript template strings.
 * Replaces all occurrences of `${key}` (or custom delimiters) in `s` with values from `replace`.
 * Does not use eval, so is safe for user input.
 *
 * @param s - The input string.
 * @param replace - The dictionary of replacements.
 * @param pre - The prefix for a placeholder (default: '${').
 * @param post - The suffix for a placeholder (default: '}').
 * @returns The substituted string.
 */
export function msub(
  s: string,
  replace: Record<string, string> = {},
  pre = '${',
  post = '}',
): string {
  if (!isRecordStringString(replace) || !isNonEmptyString(pre) || !isNonEmptyString(post)) {
    return s;
  }
  // Build a global regex for ${key}
  const escapedPre = escapeString(pre);
  const escapedPost = escapeString(post);
  // const escapedPre = pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // const escapedPost = post.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedPre}(.*?)${escapedPost}`, 'g');
  return s.replace(
    pattern,
    (_match, key) => Object.prototype.hasOwnProperty.call(replace, key) ? replace[key] : _match,
  );
}

function escapeString(s: string): string {
  return s.replace(REGEX.escMatch, '\\$&');
}

/**
 * Sets default options for deep copying.
 * @param opts - The options to set defaults for.
 * @returns The options with defaults set.
 */
export function deepCopySetDefaultOpts<T extends DeepCopyOpts = DeepCopyOpts>(opts?: T): T {
  if (!opts) {
    opts = {} as T;
  }
  if (!opts.pre) {
    opts.pre = '{';
  }
  if (!opts.post) {
    opts.post = '}';
  }
  return opts;
}

/**
 * Options for deep copy and serialization.
 * @typedef {object} DeepCopyOpts
 * @property {boolean | Dict} [replace] - If set, replaces keys/values in strings using pre/post delimiters.
 * @property {string} [pre='${'] - Prefix for string replacements (default: '${').
 * @property {string} [post='}'] - Suffix for string replacements (default: '}').
 * @property {boolean} [detectRegExp=false] - If true, RegExp objects are serialized as {regex, flags}.
 */

/**
 * Serializes a JavaScript value to a JSON string, preserving special types.
 * Supports Uint8Array, Set, Map, and RegExp. Also handles string replacements.
 *
 * @param {unknown} value - The value to serialize.
 * @param {DeepCopyOpts} [options] - Serialization options.
 * @returns {string} The serialized JSON string.
 */
export function jsonSerialize(value: unknown, options: DeepCopyOpts | null = null, space?: string | number): string {
  const opts = deepCopySetDefaultOpts(options ?? undefined);

  const replacer = (_key: string, val: unknown) => {
    // String replacement before other checks to ensure placeholders are processed
    if (isString(val) && opts.replace) {
      val = msub(val, opts.replace, opts.pre!, opts.post!);
    }

    // Check for special types after potential string replacement
    if (val instanceof Uint8Array) {
      return { __filter: ['ASCII85Decode'], data: encodeAscii85(val) };
    }

    if (isSet(val)) {
      return { __filter: 'Set', data: Array.from(val) };
    }

    if (isMap(val)) {
      return { __filter: 'Map', data: Array.from(val.entries()) };
    }

    if (isRegExp(val)) {
      return { __filter: 'RegExp', regex: val.source, flags: val.flags };
    }

    // if (isDate(val)) {
    //   return { __filter: 'Date', data: val.toISOString() };
    // }

    // Pass through Dates and other types as-is for default JSON.stringify behavior
    return val;
  };

  return JSON.stringify(value, replacer, space);
}

/**
 * Deserializes a JSON string produced by jsonSerialize, restoring special types.
 * It uses a custom reviver function with JSON.parse.
 *
 * @param {string} json - The JSON string to deserialize.
 * @param {JsonDeserializeOpts} [opts] - Deserialization options.
 * @returns {unknown} The restored value.
 */
export function jsonDeserialize<T = unknown>(json: string, opts: JsonDeserializeOpts = {}): T {
  opts = deepCopySetDefaultOpts<JsonDeserializeOpts>(opts);
  if (opts.stripComments) {
    json = stripJsonComments(json, opts.stripComments);
  }

  const reviver = (_key: string, val: unknown) => {
    // First, handle the special `__filter` objects
    if (isDict(val) && '__filter' in val) {
      // Check for RegExp first, as it's a special case that doesn't use the `data` property from the source file.
      if (val.__filter === 'RegExp' && isString((val as Dict).regex)) {
        try {
          return new RegExp((val as Dict).regex as string, ((val as Dict).flags as string) || '');
        } catch {
          return null;
        }
      }

      if (hasValue(val.data)) {
        const filters = Array.isArray(val.__filter) ? val.__filter : [val.__filter];
        let result = val.data;

        // Apply filters in order
        for (const filter of filters) {
          if (filter === 'ASCII85Decode' && isString(result)) {
            result = decodeAscii85(result);
          } else if (filter === 'Set' && isArray(result)) {
            result = new Set(result);
          } else if (filter === 'Map' && isArray(result)) {
            result = new Map(result as Iterable<readonly [unknown, unknown]>);
          }
        }
        return result;
      }
    }

    if (typeof val === 'string') {
      let s = val;
      // String replacement if opts.replace is set
      if (opts.replace) {
        s = msub(s, opts.replace, opts.pre, opts.post);
      }
      if (REGEX.isISODate.test(s)) {
        return new Date(s);
      }
      return s;
    }

    // Pass other values through
    return val;
  };

  return JSON.parse(json, reviver) as T;
}

/**
 * Compares two values for deep equality.
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns True if the values are equal, otherwise false.
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) {
      return false;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      const aValues = [...a].sort();
      const bValues = [...b].sort();
      return deepEquals(aValues, bValues);
    }

    if (a instanceof Uint8Array && b instanceof Uint8Array) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    if (isDict(a) && isDict(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEquals((a as Dict)[key], (b as Dict)[key])) {
          return false;
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Compares two Dict objects using specified keys.
 * @param a - The first Dict to compare.
 * @param b - The second Dict to compare.
 * @param keys - The keys to use for comparison.
 * @returns The comparison result.
 * @deprecated - Use compareValues instead
 */
export function compareDictValue(a: Dict, b: Dict, ...keys: string[]): CompareResult {
  return compareValues(a, b, ...keys);
}

/**
 * Compares two values, `a` and `b`.
 *
 * It operates in two modes:
 *
 * 1.  **Object Property Comparison Mode:**
 *     If `props` are provided (one or more property names) AND both `a` and `b`
 *     are general objects (i.e., not arrays, Dates, RegExps, null, or primitives,
 *     as determined by the `isObject` check), the function will compare
 *     `a` and `b` based on these properties in the order specified.
 *     - For each property, its values from `a` and `b` are compared directly
 *       (as if calling `compareValues` on them without `props`).
 *     - If a property's values are of different types (e.g., number vs. string) or
 *       are not comparable (e.g., two functions), that property is skipped (treated as equal).
 *     - The comparison stops at the first property that shows a difference.
 *
 * 2.  **Direct Value Comparison Mode:**
 *     This mode is used if:
 *     - No `props` are provided.
 *     - `props` are provided, but `a` or `b` (or both) are not general objects
 *       suitable for property-based comparison (e.g., if `a` is a number and `b` is a string,
 *       or if `a` is an object but `b` is a Date). In this case, `props` are ignored.
 *     In this mode:
 *     - It directly compares `a` and `b` if they are both numbers, both strings, or both Dates.
 *     - If `a` and `b` are of different types (e.g., number vs. string) or are not
 *       both numbers, strings, or Dates (e.g., two functions, or a boolean and an object),
 *       they are treated as equal for sorting purposes (returns 0), effectively skipping them.
 *
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @param props - Optional. A list of string property keys to use for comparison
 *                if `a` and `b` are both general objects.
 * @returns
 *   - `-1` if `a` is considered less than `b`.
 *   - `1` if `a` is considered greater than `b`.
 *   - `0` if `a` and `b` are considered equal, or if they/their properties are
 *     of mismatched types or non-comparable types and thus skipped.
 */
export function compareValues(a: unknown, b: unknown, ...props: string[]): CompareResult {
  // Mode 1: Object Property Comparison
  // Check if props are provided and both a and b are general objects
  if (props.length > 0 && isObject(a) && isObject(b)) {
    for (const key of props) {
      const valA = (a as Record<string, unknown>)[key];
      const valB = (b as Record<string, unknown>)[key];

      // Recursively call compareValues WITHOUT props for direct value comparison of properties
      const propComparisonResult = compareValues(valA, valB);

      if (propComparisonResult !== 0) {
        return propComparisonResult; // Difference found, return immediately
      }
      // If propComparisonResult is 0, properties were equal or skipped, continue to next property
    }
    return 0; // All specified properties were equal or skipped
  } // Mode 2: Direct Value Comparison
  // This block is reached if:
  // - No props were provided.
  // - Props were provided, but a or b (or both) are not general objects (e.g., primitives, Dates, arrays).
  else {
    if (isNumber(a) && isNumber(b)) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
    if (isString(a) && isString(b)) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
    if (isDate(a) && isDate(b)) {
      const timeA = a.getTime();
      const timeB = b.getTime();
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    }

    // If types mismatch for a and b, or if they are not number/string/Date,
    // they are considered "equal" for sorting purposes by this comparison,
    // meaning this pair doesn't define an order and should be skipped.
    return 0;
  }
}

/**
 * Delays a promise for a specified number of milliseconds.
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the delay.
 * @example
 * ```typescript
 * await delayPromise(1000); // Pauses execution for 1 second
 * ```
 */
export function delayPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve();
    }, ms);
  });
}

/**
 * Converts a camelCase string to kebab-case.
 * @param str - The string to convert.
 * @returns The converted string in kebab-case.
 * @example
 * ```typescript
 * camel2dash('myStringHere'); // Returns 'my-string-here'
 * ```
 */
export function camel2dash(str: string): string {
  return str.replace(REGEX.camel2dash, '$1-$2').toLowerCase();
  // .replace(REGEX.firstUppercase, ([first]) => (first ? first.toLowerCase() : ''))
  // .replace(REGEX.allUppercase, ([letter]) => `-${letter ? letter.toLowerCase() : ''}`);
}

/**
 * Converts a camelCase string to kebab-case (deprecated).
 * @param str - The string to convert.
 * @returns The converted string in kebab-case.
 * @example
 * ```typescript
 * camelToDash('oldFunction'); // Returns 'old-function'
 * ```
 * @deprecated
 */
export function camelToDash(str: string): string {
  return str.replace(REGEX.camel2dash, '$1-$2').toLowerCase();
}

/**
 * Converts a kebab-case string to camelCase.
 * @param str - The string to convert.
 * @returns The converted string in camelCase.
 * @example
 * ```typescript
 * dash2camel('my-string-here'); // Returns 'myStringHere'
 * ```
 */
export function dash2camel(str: string): string {
  return str.replace(REGEX.dash2camel, function (k) {
    return k[1].toUpperCase();
  });
}

/**
 * Converts a snake_case string to a capitalized string.
 * @param str - The string to convert.
 * @returns The converted capitalized string.
 * @example
 * ```typescript
 * underscoreCapitalize('my_string_here'); // Returns 'My String Here'
 * ```
 */
export function underscoreCapitalize(str: string): string {
  return str
    .replace(REGEX.firstCapitalize, function ($1) {
      return $1.toUpperCase();
    })
    .replace(REGEX.allCapitalize, function ($1) {
      return $1.toUpperCase().replace('_', ' ');
    });
}
