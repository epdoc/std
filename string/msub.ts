import { assert } from '@std/assert';
import { isDate, isNumber, isObject } from '../type/mod.ts';
import { isFunction, isString } from '../type/util.ts';

export type InitOptions = {
  open?: string;
  close?: string;
  uppercase?: boolean;
  format?: unknown;
};

export type SubParam = string | number | boolean | Date;
export type Param = SubParam | SubParam[] | { [key: string]: SubParam };

export type FormatCallback = (val: unknown, format: string) => string;

interface IMSub {
  init(options?: InitOptions): this;
  replace(s: string, ...args: Param[]): string;
}

const REG: Record<string, RegExp> = {
  number: new RegExp(/\d+/),
  prim: new RegExp(/^(number|string|boolean)$/),
};

const braceMap: { [key: string]: string } = {
  '{': '}',
  '(': ')',
  '[': ']',
  '<': '>',
} as const;
const openingBraces = Object.keys(braceMap);

const isAllowedPrim = (val: unknown): boolean => {
  if (isDate(val) || val === null) {
    return true;
  }
  return REG.prim.test(typeof val);
};

class MSubImpl implements IMSub {
  open: string = '${';
  close: string = '}';
  uppercase: boolean = false;
  format?: unknown;

  constructor() {}

  init(options?: InitOptions): this {
    if (options) {
      this.open = options.open ? options.open : '${';
      if (options.close) {
        this.close = options.close;
      } else {
        this.close = this.mirrorBraces(this.open);
      }
      assert(this.close !== undefined, 'close brace cannot be undefined');
      this.uppercase = options.uppercase === true ? true : false;
      this.format = options.format ? options.format : undefined;
    } else {
      this.open = '${';
      this.close = this.mirrorBraces(this.open);
      this.uppercase = false;
      this.format = undefined;
    }
    return this;
  }

  private mirrorBraces(s: string): string {
    let braceString = '';

    // Iterate through the string in reverse to find the last sequence of opening braces
    for (let i = s.length - 1; i >= 0; i--) {
      if (openingBraces.includes(s[i])) {
        braceString += braceMap[s[i]]; // Map the opening brace to its closing brace
      } else {
        // Stop when we hit a non-opening brace character
        break;
      }
    }

    return braceString; // Return the mirrored closing braces
  }

  replace(s: string, ...args: Param[]): string {
    if (args !== undefined && args !== null) {
      // Resolve input args
      let obj: Record<string, unknown> = {};
      let arr: unknown[] = [];
      for (let idx = 0; idx < args.length; ++idx) {
        const item = args[idx];
        if (isObject(item)) {
          obj = Object.assign(obj, item);
        } else if (Array.isArray(item)) {
          arr = [...arr, ...item];
        } else if (isAllowedPrim(item)) {
          arr.push(item);
        }
      }

      const sub = (str: string): string => {
        const p = str.split(':');
        const key = p.shift();
        assert(isString(key), 'key must be a string');
        const format = p.shift();
        let val;
        const index = arr.length && REG.number.test(key) ? parseInt(key, 10) : -1;
        if (index >= 0 && arr[index] !== undefined) {
          val = arr[index];
        } else {
          val = obj[this.convertKey(key)];
        }
        if (isDate(val)) {
          if (format && isFunction(val[format as keyof Date])) {
            // @ts-ignore cannot find a ts syntax that makes lint happy
            val = val[format as keyof Date](...p);
          } else if (format && isFunction(this.format)) {
            val = this.format(val, format);
          } else {
            val = val.toString();
          }
        } else if (isNumber(val)) {
          // Eg. format = 'toFixed'
          if (format && isFunction(val[format as keyof number])) {
            // @ts-ignore cannot find a ts syntax that makes lint happy
            val = val[format as keyof number](...p);
          } else if (format && isFunction(this.format)) {
            val = this.format(val, format);
          } else {
            val = String(val);
          }
        }
        return val;
      };

      let j = s.indexOf(this.open);
      if (j >= 0) {
        let remainder = s;
        let out = '';
        let k = 1;
        let loop = 100; // extra endless-loop protection
        while (j >= 0 && k >= 0 && loop > 0) {
          out += remainder.slice(0, j);
          remainder = remainder.slice(j + this.open.length);
          k = remainder.indexOf(this.close);
          if (k >= 0) {
            const key = remainder.slice(0, k);
            const val = sub(key);
            if (val !== undefined) {
              out += val;
            } else {
              out += this.open + key + this.close;
            }
            remainder = remainder.slice(k + this.close.length);
            j = remainder.indexOf(this.open);
          }
          --loop;
        }
        out += remainder;
        return out.toString();
      }
    }
    return s.toString();
  }

  // Convert uppercase with underscores to camelcase, eg. USE_STRING to useString
  private convertKey(s: string): string {
    if (this.uppercase) {
      const r = s
        .split('_')
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
      return r.charAt(0).toLowerCase() + r.slice(1);
    }
    return s;
  }

  // static isObject(val: unknown) {
  //   return val !== undefined && val !== null && val.constructor === Object;
  // }
  // static isDate(val: unknown) {
  //   return val !== undefined && val !== null && val.constructor === Date;
  // }
}

const __msub: MSubImpl = new MSubImpl();
export type MSub = MSubImpl;
// export const msub: MSub = __msub as MSub;

export const replace = (s: string, ...args: Param[]): string => {
  return __msub.replace(s, ...args);
};

export const init = (options?: InitOptions): MSub => {
  return __msub.init(options);
};

export function createMSub(options?: InitOptions): MSub {
  return new MSubImpl().init(options);
}

// declare global {
//   interface String {
//     /**
//      * String replacement, similar to ES2015 back tick quotes.
//      * @param args
//      */
//     msub(...args: (MSubParam | MSubParam[] | { [key: string]: MSubParam })[]): string;
//   }
// }

// export function addMsubPrototypeMethods() {
//   // @ts-ignore Deno doesn't like this. Use at your own risk.
//   String.prototype.msub = function (...args: MSubParam[]) {
//     //let s = this;
//     return __msub.exec(this, ...args);
//   };
// }
