/**
 * @module ex
 *
 * This module provides utilities for string manipulation, including
 * pluralization, padding, and encoding.
 */

import * as msub from './msub.ts';

export function StringEx(str: unknown): StringUtil {
  return new StringUtil(str);
}

/**
 * Options for initializing the StringUtil instance.
 * @typedef {Object} StringExOptions
 * @property {msub.InitOptions} [msub] - Options for initializing MSub.
 */
export type StringExOptions = {
  msub?: msub.InitOptions;
};

/**
 * A utility class for string manipulation.
 * @class StringUtil
 */
export class StringUtil {
  private _str: string;
  private _msub: msub.MSub | undefined;

  /**
   * Creates an instance of StringUtil.
   * @param {unknown} str - The string to manipulate.
   * @example
   * const util = new StringUtil('example');
   */
  constructor(str: unknown) {
    this._str = String(str);
  }

  /**
   * Initializes the StringUtil instance with options.
   * @param {StringExOptions} opts - Initialization options.
   * @returns {this} The instance of StringUtil.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * const util = StringEx('example {{replacement}}').init({ msub: { open: '{{', close: '}}' } });
   * ```
   */
  init(opts: StringExOptions): this {
    if (opts.msub) {
      this._msub = msub.createMSub(opts.msub);
    }
    return this;
  }

  /**
   * Replaces placeholders in the string using MSub.
   * @param {...msub.Param} args - The values to replace the placeholders.
   * @returns {string} The formatted string.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * const result = StringEx('Hello, ${name}!').replace({ name: 'World' });
   * assert(result === 'Hello, World!');
   * ```
   */
  replace(...args: msub.Param[]): string {
    if (!this._msub) {
      this._msub = msub.createMSub();
    }
    return this._msub.replace(this._str, ...args);
  }

  /**
   * Returns the plural form of a word based on the given count. If the plural
   * form is not provided, it defaults to the singular form with an 's'
   * appended.
   * @param {number} count - The count of items.
   * @param {string} [str] - The plural form of the word (optional).
   * @returns {string} The plural form of the word.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * const plural = StringEx('cat').pluralize(2);
   * assert(plural === 'cats');
   * const plural2 = StringEx('fox').pluralize(2, 'foxes');
   * assert(plural2 === 'foxes');
   * const singular = StringEx('fox').pluralize(1, 'foxes');
   * assert(singular === 'fox');
   * ```
   */
  pluralize(count: number, str?: string): string {
    if (count === 1) {
      return this._str;
    }
    return str ? str : this._str + 's';
  }

  /**
   * Counts the number of tabs at the beginning of the string.
   * @returns {number} The number of leading tabs.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * const tabCount = StringEx('\t\tHello, world!').countLeadingTabs();
   * assert(tabCount === 2);
   * ```
   */
  countLeadingTabs(): number {
    let count = 0;
    for (let i = 0; i < this._str.length; i++) {
      if (this._str[i] === '\t') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Right pads the string to a specified length with a character and truncates if necessary.
   * @param {number} length - The desired length of the string.
   * @param {string} [char=' '] - The character to pad with (default is space).
   * @param {boolean} [truncate=true] - Whether to truncate the string if it exceeds the length (default is true).
   * @returns {string} The padded or truncated string.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * assert(StringEx('Hello').rightPad(10) === 'Hello     ');
   * ```
   */
  rightPad(length: number, char = ' ', truncate = true): string {
    if (this._str.length > length) {
      return truncate ? this._str.slice(0, length) : this._str;
    }
    return this._str + char.repeat(length - this._str.length);
  }

  /**
   * Left pads the string to a specified length with a character and truncates if necessary.
   * @param {number} length - The desired length of the string.
   * @param {string} [char=' '] - The character to pad with (default is space).
   * @param {boolean} [truncate=true] - Whether to truncate the string if it exceeds the length (default is true).
   * @returns {string} The padded or truncated string.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * assert(StringEx('Hello').leftPad(10) === '     Hello');
   * ```
   */
  leftPad(length: number, char = ' ', truncate = true): string {
    if (this._str.length > length) {
      return truncate ? this._str.slice(0, length) : this._str;
    }
    return char.repeat(length - this._str.length) + this._str;
  }

  /**
   * Centers the string within a specified length with a character and truncates if necessary.
   * @param {number} length - The desired length of the string.
   * @param {string} [char=' '] - The character to pad with (default is space).
   * @param {boolean} [truncate=true] - Whether to truncate the string if it exceeds the length (default is true).
   * @returns {string} The centered or truncated string.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * assert(StringEx('Hello').center(10) === '  Hello   ');
   * ```
   */
  center(length: number, char = ' ', truncate = true): string {
    if (this._str.length > length) {
      return truncate ? this._str.slice(0, length) : this._str;
    }
    const padding = Math.floor((length - this._str.length) / 2);
    return char.repeat(padding) + this._str + char.repeat(length - this._str.length - padding);
  }

  /**
   * Encodes the string into a 16-bit hexadecimal representation.
   * @returns {string} The hexadecimal encoded string.
   * @example
   * ```ts
   * import { StringEx } from '@epdoc/string';
   *
   * assert(StringEx('Hello').hexEncode() === '00480065006c006c006f');
   * ```
   */
  hexEncode(): string {
    let result = '';
    for (let i = 0; i < this._str.length; i++) {
      const hex = this._str.charCodeAt(i).toString(16);
      result += ('000' + hex).slice(-4);
    }
    return result;
  }

}
