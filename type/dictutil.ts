import {
  asBoolean,
  asFloat,
  asInt,
  asRegExp,
  hasValue,
  type Integer,
  isArray,
  isBoolean,
  isDate,
  isDefined,
  isDict,
  isEmpty,
  isError,
  isFunction,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isNull,
  isNumber,
  isObject,
  isPosInteger,
  isPosNumber,
  isRegExp,
  isRegExpDef,
  isString,
  isValidDate,
  isWholeNumber,
} from './util.ts';

const REGEX = {
  typeSplit: new RegExp(/\s*[,\|]{1}\s*/),
};

/**
 * Verify that val is any one of the basic types.
 * @param val - The value to be tested.
 * @param types - The types to check against.
 * @returns True if the value matches any of the specified types, otherwise false.
 */
export function isType(val: unknown, ...types: (string | string[])[]) {
  const util = new DictUtil(val);
  return util.isType(...types);
}

/**
 * Interface for a source that can be converted to a string.
 */
export interface IDictUtilSource {
  toString(): string;
}

/**
 * Options for the DictUtil constructor.
 */
export type DictUtilOpts = {
  throw?: boolean; // Whether to throw an error if a property is not found.
  src?: string | IDictUtilSource; // The source of the value.
};

/**
 * Creates a new DictUtil instance.
 * @param val - The value to wrap in the DictUtil.
 * @param opts - Options for the DictUtil.
 * @returns A new instance of DictUtil.
 */
export function dictUtil(val: unknown, opts?: DictUtilOpts) {
  return new DictUtil(val, opts);
}

/**
 * A utility class for working with dictionary-like objects.
 */
export class DictUtil {
  protected _val?: unknown; // The value being wrapped.
  protected _opts: DictUtilOpts; // Options for the utility.

  /**
   * Creates an instance of DictUtil.
   * @param val - The value to wrap.
   * @param opts - Options for the DictUtil.
   */
  constructor(val?: unknown, opts: DictUtilOpts = {}) {
    this._val = val;
    this._opts = opts;
  }

  /**
   * Retrieves a property at the specified path.
   * @param path - The path to the property (e.g., 'attributes.createdAt').
   * @returns A new DictUtil instance containing the property value.
   */
  prop(...path: string[]): DictUtil {
    return this.property(...path);
  }

  /**
   * Retrieve the property at the nested path within this object.
   * @param path - A path such as 'attributes.createdAt' or 'attribute', 'createdAt'.
   * @returns A new DictUtil instance containing the property value or undefined.
   */
  property(...path: string[]): DictUtil {
    const p = DictUtil.resolvePath(...path);
    let val = this._val;
    if (p && p.length) {
      for (let i = 0, n = p.length; i < n; ++i) {
        const k = p[i];
        if (val && isDict(val) && k in val) {
          val = val[k];
        } else {
          if (this._opts.throw) {
            throw new Error(
              `Property ${p.join('.')} not found in ${this.source()}`,
            );
          }
          val = undefined;
        }
      }
    }
    const opts: DictUtilOpts = {
      throw: this._opts.throw,
      src: [this._opts.src, ...p].join('.'),
    };
    return new DictUtil(val, opts);
  }

  /**
   * Retrieves the source of the value.
   * @returns The source as a string.
   */
  private source() {
    if (!this._opts.src) {
      return 'object';
    }
    if (isString(this._opts.src)) {
      return this._opts.src;
    }
    return this._opts.src.toString();
  }

  /**
   * Sets whether to throw an error if a property is not found.
   * @param v - If true, will throw an error on property not found.
   * @returns The current DictUtil instance for chaining.
   */
  throw(v?: boolean) {
    this._opts.throw = v === true ? true : false;
    return this;
  }

  /**
   * Return the raw value of this object.
   * @returns The raw value.
   */
  val(): unknown {
    return this._val;
  }

  /**
   * Return the raw value of this object (alias for val).
   * @returns The raw value.
   */
  value(): unknown {
    return this._val;
  }

  /**
   * Resolves a path into an array of strings.
   * @param path - The path to resolve.
   * @returns An array of strings representing the resolved path.
   */
  protected static resolvePath(...path: (string | string[])[]): string[] {
    let a: string[] = [];
    path.forEach((arg) => {
      if (isString(arg)) {
        arg = arg.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        arg = arg.replace(/^\./, ''); // strip a leading dot
        const args = arg.split('.');
        a = [...a, ...args];
      } else if (isArray(arg)) {
        a = [...a, ...arg];
      }
    });
    return a;
  }

  /**
   * Converts the value to a boolean.
   * @param defval - The default value to return if conversion fails.
   * @returns The converted boolean value.
   */
  asBoolean(defval = false): boolean {
    return asBoolean(this._val, defval);
  }

  /**
   * Converts the value to an integer.
   * @param defVal - The default value to return if conversion fails.
   * @returns The converted integer value.
   */
  asInt(defVal = 0): Integer {
    return asInt(this._val, defVal);
  }

  /**
   * Converts the value to a float.
   * @param defVal - The default value to return if conversion fails.
   * @param commaAsDecimal - Whether to treat commas as decimal points.
   * @returns The converted float value.
   */
  asFloat(defVal: number = 0, commaAsDecimal = false): number {
    return asFloat(this._val, { def: defVal, commaAsDecimal: commaAsDecimal });
  }

  /**
   * Converts the value to a string.
   * @returns The converted string value.
   */
  asString(): string {
    return String(this._val);
  }

  /**
   * Converts the value to a RegExp.
   * @returns The converted RegExp or undefined if conversion fails.
   */
  asRegExp(): RegExp | undefined {
    return asRegExp(this._val);
  }

  /**
   * Checks if the value is a dictionary.
   * @returns True if the value is a dictionary, otherwise false.
   */
  isDict() {
    return isDict(this._val);
  }

  /**
   * Checks if the value is a boolean.
   * @returns True if the value is a boolean, otherwise false.
   */
  isBoolean() {
    return isBoolean(this._val);
  }

  /**
   * Checks if the value is a string.
   * @returns True if the value is a string, otherwise false.
   */
  isString() {
    return isString(this._val);
  }

  /**
   * Checks if the value is a number.
   * @returns True if the value is a number, otherwise false.
   */
  isNumber() {
    return isNumber(this._val);
  }

  /**
   * Checks if the value is a positive number.
   * @returns True if the value is a positive number, otherwise false.
   */
  isPosNumber() {
    return isPosNumber(this._val);
  }

  /**
   * Checks if the value is an integer.
   * @returns True if the value is an integer, otherwise false.
   */
  isInteger() {
    return isInteger(this._val);
  }

  /**
   * Checks if the value is a positive integer.
   * @returns True if the value is a positive integer, otherwise false.
   */
  isPosInteger() {
    return isPosInteger(this._val);
  }

  /**
   * Checks if the value is a whole number.
   * @returns True if the value is a whole number, otherwise false.
   */
  isWholeNumber() {
    return isWholeNumber(this._val);
  }

  /**
   * Checks if the value is a non-empty string.
   * @returns True if the value is a non-empty string, otherwise false.
   */
  isNonEmptyString() {
    return isNonEmptyString(this._val);
  }

  /**
   * Checks if the value is a function.
   * @returns True if the value is a function, otherwise false.
   */
  isFunction() {
    return isFunction(this._val);
  }

  /**
   * Checks if the value is a Date object.
   * @returns True if the value is a Date, otherwise false.
   */
  isDate() {
    return isDate(this._val);
  }

  /**
   * Checks if the value is a valid Date object.
   * @returns True if the value is a valid Date, otherwise false.
   */
  isValidDate() {
    return isValidDate(this._val);
  }

  /**
   * Checks if the value is an array.
   * @returns True if the value is an array, otherwise false.
   */
  isArray() {
    return isArray(this._val);
  }

  /**
   * Checks if the value is a non-empty array.
   * @returns True if the value is a non-empty array, otherwise false.
   */
  isNonEmptyArray() {
    return isNonEmptyArray(this._val);
  }

  /**
   * Checks if the value is a RegExp object.
   * @returns True if the value is a RegExp, otherwise false.
   */
  isRegExp() {
    return isRegExp(this._val);
  }

  /**
   * Checks if the value is a valid RegExp definition.
   * @returns True if the value is a valid RegExp definition, otherwise false.
   */
  isRegExpDef() {
    return isRegExpDef(this._val);
  }

  /**
   * Checks if the value is null.
   * @returns True if the value is null, otherwise false.
   */
  isNull() {
    return isNull(this._val);
  }

  /**
   * Checks if the value is defined (not undefined).
   * @returns True if the value is defined, otherwise false.
   */
  isDefined() {
    return isDefined(this._val);
  }

  /**
   * Checks if the value has a value (not null or undefined).
   * @returns True if the value has a value, otherwise false.
   */
  hasValue() {
    return hasValue(this._val);
  }

  /**
   * Checks if the value is empty (for objects, arrays, etc.).
   * @returns True if the value is empty, otherwise false.
   */
  isEmpty() {
    return isEmpty(this._val);
  }

  /**
   * Checks if the value is an Error object.
   * @returns True if the value is an Error, otherwise false.
   */
  isError() {
    return isError(this._val);
  }

  /**
   * Checks if the value is an object (not an array or Date).
   * @returns True if the value is an object, otherwise false.
   */
  isObject() {
    return isObject(this._val);
  }

  /**
   * Checks if the value matches any of the specified types.
   * @param types - The types to check against.
   * @returns True if the value matches any of the specified types, otherwise false.
   * @throws Error if the value does not match any of the specified types.
   */
  isType(...types: (string | string[])[]) {
    const v = this._val;
    let ts: unknown[] = [];

    for (const t of types) {
      if (isNonEmptyString(t)) {
        ts = [...ts, ...t.trim().split(REGEX.typeSplit)];
      } else if (isArray(t)) {
        for (const t1 of t) {
          if (isNonEmptyString(t1)) {
            ts = [...ts, ...(t1 as string).split(REGEX.typeSplit)];
          }
        }
      }
    }
    const ts2 = [];
    for (const t of ts) {
      if (isString(t)) {
        const s = t.trim();
        if (s.length) {
          ts2.push(s);
        }
      }
    }
    const errors = [];
    for (const t of ts2) {
      const fn = 'is' + t.charAt(0).toUpperCase() + t.slice(1);
      // @ts-ignore XXX
      if (isFunction(this[fn])) {
        // @ts-ignore XXX
        if (this[fn](v)) {
          return true;
        }
      } else {
        errors.push(t);
      }
    }
    if (errors.length) {
      throw new Error(`Invalid type [${errors.join(',')}]`);
    }
    return false;
  }
}
