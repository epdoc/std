/**
 * A dictionary type where keys are strings and values are unknown. If you want
 * keys to be PropertyKey, then look elsewhere or submit a pull request to add
 * it as a separate type.
 */
export type Dict = { [key: string]: unknown };

/**
 * Regular expression definitions for various patterns.
 */
const REGEX = {
  isTrue: new RegExp(/^(true|yes|on)$/, 'i'),
  isFalse: new RegExp(/^(false|no|off)$/, 'i'),
  customElement: new RegExp(/CustomElement$/),
  firstUppercase: new RegExp(/(^[A-Z])/),
  allUppercase: new RegExp(/([A-Z])/, 'g'),
  firstCapitalize: new RegExp(/^([a-z])/),
  allCapitalize: new RegExp(/(\_[a-z])/, 'gi'),
  tr: new RegExp(/^\[tr\](.+)$/),
  html: new RegExp(/[&<>"'\/]/, 'g'),
  instr: new RegExp(/^\[([^\]]+)\](.*)$/),
  camel2dash: new RegExp(/([a-z0-9])([A-Z])/, 'g'),
  dash2camel: new RegExp(/-([a-z])/, 'g'),
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
 * Checks if the given value is a number.
 * @param val - The value to check.
 * @returns True if the value is a number, otherwise false.
 */
export function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Represents an integer type.
 */
export type Integer = number;

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
 * Checks if the given value is a non-empty string.
 * @param val - The value to check.
 * @returns True if the value is a non-empty string, otherwise false.
 */
export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
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
 * Type guard for Dict type, where keys are all strings.
 * @param val - The value to check.
 * @returns True if the value is a dictionary, otherwise false.
 */
export function isDict(val: unknown): val is Dict {
  return (
    val !== null &&
    typeof val === 'object' &&
    Object.getPrototypeOf(val) === Object.prototype
  );
}

/**
 * Represents a regular expression definition with pattern and optional flags.
 */
export type RegExpDef = {
  pattern: string;
  flags?: string;
};

/**
 * Checks if the given value is a valid RegExp definition.
 * @param val - The value to check.
 * @returns True if the value is a valid RegExp definition, otherwise false.
 */
export function isRegExpDef(val: unknown): val is RegExp {
  return isDict(val) && isNonEmptyString(val.pattern);
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
 * Options for converting a value to a float.
 */
export type AsFloatOpts = {
  def?: number;
  commaAsDecimal?: boolean;
};

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
export function asInt(val: unknown, defVal = 0): number {
  // for speed do this test first
  if (isNumber(val)) {
    return Number.isInteger(val) ? val : Math.round(val);
  } else if (isNonEmptyString(val)) {
    const v = parseFloat(val);
    if (isNumber(v)) {
      return Number.isInteger(v) ? v : Math.round(v);
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
 * Converts a value to a RegExp or an object with pattern and flags properties.
 * @param val - The value to convert.
 * @returns The converted RegExp or undefined if conversion fails.
 */
export function asRegExp(val: unknown): RegExp | undefined {
  if (isRegExp(val)) {
    return val;
  } else if (isDict(val) && isString(val.pattern)) {
    const keys: string[] = Object.keys(val);
    if (isString(val.flags) && keys.length === 2) {
      return new RegExp(val.pattern, val.flags);
    } else if (keys.length === 1) {
      return new RegExp(val.pattern);
    }
  }
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
        msg.push(err.message);
      } else if (isString(arg)) {
        msg.push(arg);
      } else if (isDict(arg)) {
        opts = arg;
      } else {
        msg.push(String(arg));
      }
    });
    if (err instanceof Error) {
      if (args.length > 1) {
        err.message = msg.join(' ');
      }
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
export function pick(obj: Dict, ...args: (string | number)[]): Dict {
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
  return result;
}

/**
 * Omits specified keys from the given object.
 * @param obj - The object to omit from.
 * @param args - The keys to omit.
 * @returns A new object without the omitted keys.
 */
export function omit(obj: Dict, ...args: (string | number)[]): Dict {
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  const keys = Object.keys(obj).filter((key) => args.indexOf(key) < 0);
  const newObj: Dict = {};
  keys.forEach((k) => {
    newObj[k] = obj[k];
  });
  return newObj;
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
 * Function type for deep copying an object.
 */
export type DeepCopyFn = (a: unknown, opts: DeepCopyOpts) => unknown;

/**
 * Options for deep copying an object.
 */
export type DeepCopyOpts = {
  replace?: Dict;
  detectRegExp?: boolean;
  pre?: string;
  post?: string;
};

/**
 * Performs a deep copy of an object, optionally replacing strings.
 * @param a - The object to copy.
 * @param options - Options for the deep copy.
 * @returns The new copied object.
 */
export function deepCopy(a: unknown, options?: DeepCopyOpts): unknown {
  const opts: DeepCopyOpts = deepCopySetDefaultOpts(options);
  if (a === undefined || a === null) {
    return a;
  } else if (typeof a === 'number') {
    return a;
  } else if (typeof a === 'string') {
    if (opts.replace) {
      let r = a;
      if (isDict(opts.replace)) {
        Object.keys(opts.replace).forEach((b) => {
          const m: string = opts.pre + b + opts.post;
          if (r.includes(m)) {
            // @ts-ignore replacement string have special replacement patterns, so use a function to return the raw string
            r = r.replace(m, () => {
              // @ts-ignore we want to allow an undefined value
              return opts.replace[b];
            });
            // r = r.replace(m, opts.replace[b]);
          }
        });
      }
      return r;
    } else {
      return a;
    }
  } else if (a instanceof Date || a instanceof RegExp) {
    return a;
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
 * Sets default options for deep copying.
 * @param opts - The options to set defaults for.
 * @returns The options with defaults set.
 */
export function deepCopySetDefaultOpts(opts?: DeepCopyOpts): DeepCopyOpts {
  if (!opts) {
    opts = {};
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
 * Compares two values for deep equality.
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns True if the values are equal, otherwise false.
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  const aSet = _isSet(a);
  const bSet = _isSet(b);
  if (!aSet && !bSet) {
    return true;
  }
  if (!aSet || !bSet) {
    return false;
  }
  if (a === b || (a as object).valueOf() === (b as object).valueOf()) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) {
    return false;
  }
  // if they are dates, they must had equal valueOf
  if (a instanceof Date) {
    return false;
  }
  // if they are strictly equal, they both need to be object at least
  if (!(a instanceof Object)) {
    return false;
  }
  if (!(b instanceof Object)) {
    return false;
  }
  // recursive object equality check
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (kb.length === ka.length) {
    return ka.every((k) => {
      // @ts-ignore XXX fix this later
      return deepEquals(a[k], b[k]);
    });
  }
  return false;
}

/**
 * Result of a comparison between two Dict objects.
 */
export type CompareResult = -1 | 0 | 1;

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
 * Checks if a value is considered a set (not null, undefined, or empty).
 * @param a - The value to check.
 * @returns True if the value is a set, otherwise false.
 */
function _isSet(a: unknown): boolean {
  if (a === null || a === undefined) {
    return false;
  }
  if (Array.isArray(a) && !a.length) {
    return false;
  }
  if (a instanceof Date) {
    return true;
  }
  if (a instanceof Object && !Object.keys(a).length) {
    return false;
  }
  return true;
}

/**
 * Delays a promise for a specified number of milliseconds.
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the delay.
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
 * @deprecated
 */
export function camelToDash(str: string): string {
  return str.replace(REGEX.camel2dash, '$1-$2').toLowerCase();
}

/**
 * Converts a kebab-case string to camelCase.
 * @param str - The string to convert.
 * @returns The converted string in camelCase.
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
