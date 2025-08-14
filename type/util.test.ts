import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import type { ExactlyOne, SingleDigitChar, SingleLetterChar, SingleLowerCaseChar, SingleUpperCaseChar } from './types.ts';
import {
  asBoolean,
  asDate,
  asFloat,
  asInt,
  asString,
  camel2dash,
  dash2camel,
  hasValue,
  isArray,
  isBoolean,
  isDate,
  isDefined,
  isDict,
  isError,
  isFalse,
  isFunction,
  isInteger,
  isIntegerInRange,
  isNonEmptyString,
  isNull,
  isNumber,
  isNumberInRange,
  isObject,
  isPosNumber,
  isRegExp,
  isRegExpDef,
  isStringArray,
  isTrue,
  isValidDate,
  isWholeNumber,
  msub,
  pad,
  underscoreCapitalize,
} from './util.ts';

describe('util', () => {
  describe('number', () => {
    it('isNumber', () => {
      expect(isNumber(4)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber({})).toBe(false);
    });

    it('isPosNumber', () => {
      expect(isPosNumber(4)).toBe(true);
      expect(isPosNumber(NaN)).toBe(false);
      expect(isPosNumber(-0.01)).toBe(false);
      expect(isPosNumber(0)).toBe(false);
    });

    it('isInteger', () => {
      expect(isInteger(4)).toBe(true);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(0.2)).toBe(false);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-1)).toBe(true);
    });

    it('isWholeNumber', () => {
      expect(isWholeNumber(4)).toBe(true);
      expect(isWholeNumber(NaN)).toBe(false);
      expect(isWholeNumber(0.2)).toBe(false);
      expect(isWholeNumber(0)).toBe(true);
      expect(isWholeNumber(-1)).toBe(false);
    });

    it('isIntegerInRange', () => {
      expect(isIntegerInRange(4, 0, 4)).toBe(true);
      expect(isIntegerInRange(NaN, -99, 99)).toBe(false);
      expect(isIntegerInRange(0.2, 0, 1)).toBe(false);
      expect(isIntegerInRange(0, 0, 1)).toBe(true);
      expect(isIntegerInRange(-1, 1, 5)).toBe(false);
      expect(isIntegerInRange(0, 1, 5)).toBe(false);
      expect(isIntegerInRange(1, 1, 5)).toBe(true);
      expect(isIntegerInRange(3, 1, 5)).toBe(true);
      expect(isIntegerInRange(5, 1, 5)).toBe(true);
      expect(isIntegerInRange(6, 1, 5)).toBe(false);
    });

    it('isNumberInRange', () => {
      expect(isNumberInRange(4, 0, 4)).toBe(true);
      expect(isNumberInRange(NaN, -99, 99)).toBe(false);
      expect(isNumberInRange(0.2, 0, 1)).toBe(true);
      expect(isNumberInRange(0, 0, 1)).toBe(true);
      expect(isNumberInRange(-1, 1, 5)).toBe(false);
      expect(isNumberInRange(0.999, 1, 5)).toBe(false);
      expect(isNumberInRange(1, 1.1, 5)).toBe(false);
      expect(isNumberInRange(1.1, 1, 5)).toBe(true);
      expect(isNumberInRange(3, 1, 5)).toBe(true);
      expect(isNumberInRange(5, 1, 5)).toBe(true);
      expect(isNumberInRange(6, 1, 5)).toBe(false);
    });
  });

  describe('Booleans', () => {
    it('isBoolean', () => {
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(undefined)).toBe(false);
    });

    it('isTrue false', () => {
      expect(isTrue({})).toBe(false);
      expect(isTrue(0)).toBe(false);
      expect(isTrue('no')).toBe(false);
      expect(isTrue('false')).toBe(false);
      expect(isTrue('orange')).toBe(false);
      expect(isTrue(-1)).toBe(false);
      expect(isTrue(false)).toBe(false);
    });

    it('isTrue true', () => {
      expect(isTrue(1)).toBe(true);
      expect(isTrue(true)).toBe(true);
      expect(isTrue('ON')).toBe(true);
      expect(isTrue('YES')).toBe(true);
      expect(isTrue('TRUE')).toBe(true);
      expect(isTrue(2)).toBe(true);
    });

    it('isFalse false', () => {
      expect(isFalse({})).toBe(false);
      expect(isFalse(1)).toBe(false);
      expect(isFalse('yes')).toBe(false);
      expect(isFalse('true')).toBe(false);
      expect(isFalse('orange')).toBe(false);
      expect(isFalse(2)).toBe(false);
      expect(isFalse(-1)).toBe(false);
      expect(isFalse(true)).toBe(false);
    });

    it('isFalse true', () => {
      expect(isFalse(false)).toBe(true);
      expect(isFalse('no')).toBe(true);
      expect(isFalse('off')).toBe(true);
      expect(isFalse('FALSE')).toBe(true);
      expect(isFalse('false')).toBe(true);
      expect(isFalse(0)).toBe(true);
    });

    it('asBoolean false', () => {
      expect(asBoolean(false)).toBe(false);
      expect(asBoolean('no')).toBe(false);
      expect(asBoolean('off')).toBe(false);
      expect(asBoolean('FALSE')).toBe(false);
      expect(asBoolean('false')).toBe(false);
      expect(asBoolean(0)).toBe(false);
    });
    it('asBoolean true', () => {
      expect(asBoolean(true)).toBe(true);
      expect(asBoolean('yes')).toBe(true);
      expect(asBoolean('ON')).toBe(true);
      expect(asBoolean('TRUE')).toBe(true);
      expect(asBoolean('true')).toBe(true);
      expect(asBoolean(1)).toBe(true);
    });
    it('asBoolean default true', () => {
      expect(asBoolean({}, false)).toBe(false);
      expect(asBoolean({}, true)).toBe(true);
      expect(asBoolean([], false)).toBe(false);
      expect(asBoolean([], true)).toBe(true);
      expect(asBoolean('orange', false)).toBe(false);
      expect(asBoolean('orange', true)).toBe(true);
    });
  });

  describe('Date', () => {
    it('isDate', () => {
      expect(isDate(/^.*$/)).toBe(false);
      expect(isDate({})).toBe(false);
      expect(isDate(false)).toBe(false);
      expect(isDate(233433)).toBe(false);
      expect(isDate(new Date())).toBe(true);
      expect(isDate(() => {})).toBe(false);
    });

    it('isValidDate', () => {
      expect(isValidDate(/^.*$/)).toBe(false);
      expect(isValidDate({})).toBe(false);
      expect(isValidDate(false)).toBe(false);
      expect(isValidDate(233433)).toBe(false);
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('//'))).toBe(false);
      expect(isValidDate(() => {})).toBe(false);
    });
  });

  describe('asDate', () => {
    it('should return a valid Date object if value is a valid Date', () => {
      const d = new Date();
      expect(asDate(d)).toEqual(d);
    });

    it('should return null if value is an invalid Date object', () => {
      const d = new Date('invalid date');
      expect(asDate(d)).toBeNull();
    });

    it('should return a valid Date from a number (milliseconds)', () => {
      const timestamp = 1672531200000; // 2023-01-01T00:00:00.000Z
      const d = new Date(timestamp);
      expect(asDate(timestamp)).toEqual(d);
    });

    it('should return a valid Date from a valid date string', () => {
      const dateString = '2023-01-01T00:00:00.000Z';
      const d = new Date(dateString);
      expect(asDate(dateString)).toEqual(d);
    });

    it('should return null for an invalid date string', () => {
      const dateString = 'not a date';
      expect(asDate(dateString)).toBeNull();
    });

    it('should return a valid Date from an array of numbers', () => {
      const dateArray = [2023, 0, 1]; // Jan 1, 2023
      const d = new Date(2023, 0, 1);
      expect(asDate(dateArray)).toEqual(d);
    });

    it('should return a valid Date from a full array of numbers', () => {
      const dateArray = [2023, 0, 1, 10, 30, 0]; // Jan 1, 2023, 10:30:00
      const d = new Date(2023, 0, 1, 10, 30, 0);
      expect(asDate(dateArray)).toEqual(d);
    });

    it('should return null for an array with non-number elements', () => {
      const dateArray = [2023, 'January', 1];
      // @ts-ignore for test purposes
      expect(asDate(dateArray)).toBeNull();
    });

    it('should return null for an array of numbers that results in an invalid date', () => {
      const dateArray = [NaN];
      expect(asDate(dateArray)).toBeNull();
    });

    it('should return null for other types', () => {
      expect(asDate({})).toBeNull();
      expect(asDate(null)).toBeNull();
      expect(asDate(undefined)).toBeNull();
      expect(asDate(() => {})).toBeNull();
    });

    it('should use defVal if the primary value is invalid', () => {
      const defDate = new Date();
      expect(asDate('invalid', defDate)).toEqual(defDate);
      expect(asDate(null, '2023-01-01')).toEqual(new Date('2023-01-01'));
      expect(asDate(undefined, [2023, 0, 1])).toEqual(new Date(2023, 0, 1));
    });

    it('should return null if both primary value and defVal are invalid', () => {
      expect(asDate('invalid', 'also invalid')).toBeNull();
      expect(asDate(null, new Date('invalid'))).toBeNull();
    });

    it('should return null if primary value is invalid and no defVal is provided', () => {
      expect(asDate('invalid')).toBeNull();
    });
  });

  describe('strings', () => {
    it('isNonEmptyString', () => {
      const s = 'my string';
      expect(isNonEmptyString(s)).toBe(true);
      expect(s).toEqual('my string');
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(4)).toBe(false);
    });

    it('asString', () => {
      expect(asString(4)).toEqual('4');
      expect(asString('my string')).toEqual('my string');
      expect(asString(null)).toEqual('null');
      expect(asString(undefined)).toEqual('undefined');
      expect(asString(false)).toEqual('false');
      expect(asString(true)).toEqual('true');
      expect(asString({ a: 'b', c: 'd' })).toEqual('{"a":"b","c":"d"}');
      expect(asString([1, 2, 3])).toEqual('{"0":1,"1":2,"2":3}');
      expect(asString(new Error('my error'))).toContain('Error: my error');
      expect(asString(new Date())).toEqual('{}');
      expect(asString(Symbol('my symbol'))).toEqual('Symbol(my symbol)');
    });
  });
  describe('isDict', () => {
    it('should identify plain objects', () => {
      expect(isDict({})).toBe(true);
      expect(isDict({ key: 'value' })).toBe(true);
    });

    it('should reject non-object values', () => {
      expect(isDict(null)).toBe(false);
      expect(isDict(undefined)).toBe(false);
      expect(isDict(42)).toBe(false);
      expect(isDict('string')).toBe(false);
      expect(isDict(true)).toBe(false);
    });

    it('should reject special objects', () => {
      expect(isDict([])).toBe(false);
      expect(isDict(new Date())).toBe(false);
      expect(isDict(/regex/)).toBe(false);
      expect(isDict(new Error())).toBe(false);
    });

    it('should reject class instances', () => {
      class Test {}
      expect(isDict(new Test())).toBe(false);
    });

    it('should reject functions', () => {
      expect(isDict(() => {})).toBe(false);
    });

    it('should handle objects with null prototype', () => {
      const obj = Object.create(null);
      expect(isDict(obj)).toBe(true); // or true if you want to allow these
    });
  });
  describe('misc', () => {
    const _obj = {
      a: 'b',
      c: 'd',
      e: 4,
    };
    const _strArray = ['a', 'b', 'c'];

    it('isArray', () => {
      expect(isArray(['string'])).toBe(true);
      expect(isArray(4)).toBe(false);
      expect(isArray({ a: 'string' })).toBe(false);
    });
    it('isStringArray', () => {
      expect(isStringArray(_strArray)).toBe(true);
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray({ a: 'string' })).toBe(false);
    });

    it('isFunction', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction(3)).toBe(false);
      expect(isFunction(false)).toBe(false);
      expect(isFunction(() => {})).toBe(true);
    });

    it('isNull', () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(false)).toBe(false);
      expect(isNull(() => {})).toBe(false);
    });

    it('isDefined', () => {
      expect(isDefined(null)).toBe(true);
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(false)).toBe(true);
      expect(isDefined(() => {})).toBe(true);
    });

    it('hasValue', () => {
      expect(hasValue('test')).toBe(true);
      expect(hasValue(NaN)).toBe(true);
      expect(hasValue(0.2)).toBe(true);
      expect(hasValue(0)).toBe(true);
      expect(hasValue(undefined)).toBe(false);
      expect(hasValue(null)).toBe(false);
      expect(hasValue({})).toBe(true);
    });

    it('isRegExp', () => {
      expect(isRegExp(/^.*$/)).toBe(true);
      expect(isRegExp({})).toBe(false);
      expect(isRegExp(false)).toBe(false);
      expect(isRegExp(Date.now())).toBe(false);
      expect(isRegExp(() => {})).toBe(false);
    });

    it('isRegExpDef', () => {
      expect(isRegExpDef(/^.*$/)).toBe(false);
      expect(isRegExpDef({})).toBe(false);
      expect(isRegExpDef({ pattern: 'stuff' })).toBe(true);
      expect(isRegExpDef({ pattern: 'stuff', flags: 'i' })).toBe(true);
      expect(isRegExpDef({ flags: 'stuff' })).toBe(false);
    });

    it('isObject', () => {
      expect(isObject(/^.*$/)).toBe(false);
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(false)).toBe(false);
      expect(isRegExp(Date.now())).toBe(false);
      expect(isObject(() => {})).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });

    it('isError', () => {
      expect(isError(/^.*$/)).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError(false)).toBe(false);
      expect(isError(new Error())).toBe(true);
      expect(isError(() => {})).toBe(false);
    });

    describe('translate', () => {
      it('camel2dash', () => {
        expect(camel2dash('myStringHere')).toEqual('my-string-here');
        expect(camel2dash('MyStringHere')).toEqual('my-string-here');
      });
      it('dash2camel', () => {
        expect(dash2camel('my-string-here')).toEqual('myStringHere');
        expect(dash2camel('my-string')).toEqual('myString');
      });
      it('underscoreCapitalize', () => {
        expect(underscoreCapitalize('my_string_here')).toEqual('My String Here');
        expect(underscoreCapitalize('anOTHer_String')).toEqual('AnOTHer String');
      });
      it('pad', () => {
        expect(pad(32, 4)).toEqual('0032');
        expect(pad(32, 4, 'a')).toEqual('aa32');
        expect(pad(32, 2)).toEqual('32');
      });
      it('asInt', () => {
        expect(asInt(32)).toEqual(32);
        expect(asInt(32.5)).toEqual(33);
        expect(asInt(9.49)).toEqual(9);
        expect(asInt('9.49')).toEqual(9);
        expect(asInt('3')).toEqual(3);
        expect(asInt('11.5')).toEqual(12);
        expect(asInt('aba')).toEqual(0);
        expect(asInt([])).toEqual(0);
      });
      it('asFloat', () => {
        expect(asFloat(32)).toEqual(32);
        expect(asFloat(32.5)).toEqual(32.5);
        expect(asFloat('32.5')).toEqual(32.5);
        expect(asFloat('9.49')).toEqual(9.49);
        expect(asFloat('11.5')).toEqual(11.5);
        expect(asFloat('aba')).toEqual(0);
        expect(asFloat('aba', { def: 4 })).toEqual(4);
        expect(asFloat('32,222,456.55')).toEqual(32222456.55);
        expect(asFloat('32.222.456,55', { commaAsDecimal: true })).toEqual(32222456.55);
        expect(asFloat([])).toEqual(0);
      });
    });
  });
  describe('msub', () => {
    it('replaces simple keys', () => {
      expect(msub('Hello ${name}!', { name: 'World' })).toBe('Hello World!');
    });
    it('leaves unknown keys unchanged', () => {
      expect(msub('Hello ${name}!', {})).toBe('Hello ${name}!');
    });
    it('works with custom delimiters', () => {
      expect(msub('Hello <<name>>!', { name: 'World' }, '<<', '>>')).toBe('Hello World!');
    });
    it('replaces multiple occurrences', () => {
      expect(msub('${a} and ${a}', { a: 'x' })).toBe('x and x');
    });
    it('works with adjacent keys', () => {
      expect(msub('${a}${b}', { a: 'x', b: 'y' })).toBe('xy');
    });
    it('returns original string if no replacements', () => {
      expect(msub('no keys here', { a: 'x' })).toBe('no keys here');
    });
    it('handles empty string', () => {
      expect(msub('', { a: 'x' })).toBe('');
    });
    it('handles missing delimiters gracefully', () => {
      expect(msub('Hello ${name}!', { name: 'World' }, '', '')).toBe('Hello ${name}!');
    });
  });

  describe('Type Utilities', () => {
    describe('SingleLetterChar', () => {
      it('should accept single-character strings', () => {
        const valid: SingleLetterChar = 'a';
        const validNumber: SingleLetterChar = 'Z';
        const validSymbol: SingleLetterChar = 'c';
        expect(valid).toBe('a');
        expect(validNumber).toBe('Z');
        expect(validSymbol).toBe('c');
      });
    });

    describe('SingleUpperCaseChar', () => {
      it('should accept single upper case character strings', () => {
        const valid: SingleUpperCaseChar = 'A';
        const valid2: SingleUpperCaseChar = 'Z';
        expect(valid).toBe('A');
        expect(valid2).toBe('Z');
      });
    });

    describe('SingleLowerCaseChar', () => {
      it('should accept single lower case character strings', () => {
        const valid: SingleLowerCaseChar = 'a';
        const valid2: SingleLowerCaseChar = 'z';
        expect(valid).toBe('a');
        expect(valid2).toBe('z');
      });
    });

    describe('SingleDigit', () => {
      it('should accept single digit strings', () => {
        const valid: SingleDigitChar = '0';
        const valid2: SingleDigitChar = '9';
        expect(valid).toBe('0');
        expect(valid2).toBe('9');
      });
    });

    describe('ExactlyOne<T>', () => {
      it('should require exactly one property from the union', () => {
        type TestUnion = { a: number } | { b: string } | { c: boolean };
        const valid: ExactlyOne<TestUnion> = { a: 1 };
        const validAlt: ExactlyOne<TestUnion> = { b: 'test' };
        expect(Object.keys(valid).length).toBe(1);
        expect(Object.keys(validAlt).length).toBe(1);
      });

      it('should work with nested object types', () => {
        type ComplexUnion =
          | { meta: { id: string } }
          | { config: { enabled: boolean } };

        const valid: ExactlyOne<ComplexUnion> = { meta: { id: '123' } };
        const validAlt: ExactlyOne<ComplexUnion> = {
          config: { enabled: true },
        };
        expect(Object.keys(valid).length).toBe(1);
        expect(Object.keys(validAlt).length).toBe(1);
      });

      it('should enforce runtime single-key checks', () => {
        const isExactlyOne = (obj: object) => Object.keys(obj).length === 1;

        expect(isExactlyOne({ a: 1 })).toBe(true);
        expect(isExactlyOne({})).toBe(false);
        expect(isExactlyOne({ a: 1, b: 2 })).toBe(false);
      });
    });

    describe('Integration', () => {
      it('should compose SingleLetterChar with ExactlyOne', () => {
        type CharOption = { charA: 'a' } | { charB: 'b' };

        const valid: ExactlyOne<CharOption> = { charA: 'a' };
        const valid2: ExactlyOne<CharOption> = { charB: 'b' };
        expect(valid.charA).toBe('a');
        expect(valid2.charB).toBe('b');
      });
    });
  });
});
