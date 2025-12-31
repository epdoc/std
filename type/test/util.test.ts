import type { DigitChar, ExactlyOne, IError, LetterChar, LowerCaseChar, UpperCaseChar } from '@epdoc/type';
import {
  asBoolean,
  asDate,
  asError,
  asFloat,
  asInt,
  asString,
  camel2dash,
  dash2camel,
  hasOnlyAllowedProperties,
  hasValue,
  isArray,
  isBoolean,
  isDate,
  isDefined,
  isDict,
  isError,
  isFalse,
  isFunction,
  isHexString,
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
  isString,
  isStringArray,
  isTrue,
  isValidDate,
  isWholeNumber,
  msubLite,
  pad,
  underscoreCapitalize,
} from '@epdoc/type';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

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
    it('isString', () => {
      expect(isString('my string')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(null)).toBe(false);
      expect(isString(4)).toBe(false);
    });
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
    it('isHexString', () => {
      expect(isHexString('my string')).toBe(false);
      expect(isHexString('')).toBe(false);
      expect(isHexString('', 0)).toBe(false);
      expect(isHexString('', 2)).toBe(false);
      expect(isHexString(null)).toBe(false);
      expect(isHexString(4)).toBe(false);
      expect(isHexString('a3e45DD')).toBe(true);
      expect(isHexString('a3e45DD', 7)).toBe(true);
      expect(isHexString('a3e45DD', 0)).toBe(false);
      expect(isHexString('a3e45DD', 8)).toBe(false);
      expect(isHexString('a3e45DFD', 8)).toBe(true);
      expect(isHexString('a3e45DD', 1)).toBe(false);
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
  describe('hasOnlyAllowedProperties', () => {
    it('should return true if all properties are allowed', () => {
      const obj = { a: 1, b: 2 };
      const allowed = ['a', 'b', 'c'] as const;
      expect(hasOnlyAllowedProperties(obj, allowed)).toBe(true);
    });

    it('should return false if there are extra properties', () => {
      const obj = { a: 1, b: 2, d: 3 };
      const allowed = ['a', 'b', 'c'] as const;
      expect(hasOnlyAllowedProperties(obj, allowed)).toBe(false);
    });

    it('should return true for an empty object', () => {
      const obj = {};
      const allowed = ['a', 'b'] as const;
      expect(hasOnlyAllowedProperties(obj, allowed)).toBe(true);
    });

    it('should return true if no properties are allowed and object is empty', () => {
      const obj = {};
      const allowed: string[] = [];
      expect(hasOnlyAllowedProperties(obj, allowed)).toBe(true);
    });

    it('should return false if no properties are allowed and object is not empty', () => {
      const obj = { a: 1 };
      const allowed: string[] = [];
      expect(hasOnlyAllowedProperties(obj, allowed)).toBe(false);
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
  describe('msubLite', () => {
    it('replaces simple keys', () => {
      expect(msubLite('Hello ${name}!', { name: 'World' })).toBe('Hello World!');
    });
    it('leaves unknown keys unchanged', () => {
      expect(msubLite('Hello ${name}!', {})).toBe('Hello ${name}!');
    });
    it('works with custom delimiters', () => {
      expect(msubLite('Hello <<name>>!', { name: 'World' }, '<<', '>>')).toBe('Hello World!');
    });
    it('replaces multiple occurrences', () => {
      expect(msubLite('${a} and ${a}', { a: 'x' })).toBe('x and x');
    });
    it('works with adjacent keys', () => {
      expect(msubLite('${a}${b}', { a: 'x', b: 'y' })).toBe('xy');
    });
    it('returns original string if no replacements', () => {
      expect(msubLite('no keys here', { a: 'x' })).toBe('no keys here');
    });
    it('handles empty string', () => {
      expect(msubLite('', { a: 'x' })).toBe('');
    });
    it('handles missing delimiters gracefully', () => {
      expect(msubLite('Hello ${name}!', { name: 'World' }, '', '')).toBe('Hello ${name}!');
    });
  });

  describe('Type Utilities', () => {
    describe('LetterChar', () => {
      it('should accept single-character strings', () => {
        const valid: LetterChar = 'a';
        const validNumber: LetterChar = 'Z';
        const validSymbol: LetterChar = 'c';
        expect(valid).toBe('a');
        expect(validNumber).toBe('Z');
        expect(validSymbol).toBe('c');
      });
    });

    describe('UpperCaseChar', () => {
      it('should accept single upper case character strings', () => {
        const valid: UpperCaseChar = 'A';
        const valid2: UpperCaseChar = 'Z';
        expect(valid).toBe('A');
        expect(valid2).toBe('Z');
      });
    });

    describe('LowerCaseChar', () => {
      it('should accept single lower case character strings', () => {
        const valid: LowerCaseChar = 'a';
        const valid2: LowerCaseChar = 'z';
        expect(valid).toBe('a');
        expect(valid2).toBe('z');
      });
    });

    describe('Digit', () => {
      it('should accept single digit strings', () => {
        const valid: DigitChar = '0';
        const valid2: DigitChar = '9';
        expect(valid).toBe('0');
        expect(valid2).toBe('9');
      });
    });

    describe('ExactlyOne<T>', () => {
      it('should require exactly one property from the union', () => {
        type TestUnion = { a?: number; b?: string; c?: boolean };
        const valid: ExactlyOne<TestUnion> = { a: 1 };
        const validAlt: ExactlyOne<TestUnion> = { b: 'test' };
        expect(Object.keys(valid).length).toBe(1);
        expect(Object.keys(validAlt).length).toBe(1);
      });

      it('should work with nested object types', () => {
        type ComplexUnion = {
          meta?: { id: string };
          config?: { enabled: boolean };
        };

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

    describe('ExactlyOne<T>', () => {
      it('should allow exactly one property', () => {
        type Foo = {
          a?: number;
          b?: string;
          c?: boolean;
        };

        const valid1: ExactlyOne<Foo> = { a: 1 };
        const valid2: ExactlyOne<Foo> = { b: 'hello' };
        const valid3: ExactlyOne<Foo> = { c: true };

        expect(valid1.a).toBe(1);
        expect(valid2.b).toBe('hello');
        expect(valid3.c).toBe(true);
      });

      it('should not allow more than one property', () => {
        type Foo = {
          a?: number;
          b?: string;
          c?: boolean;
        };

        // @ts-expect-error Type '{ a: number; b: string; }' is not assignable to type 'ExactlyOne<Foo>'.
        const invalid1: ExactlyOne<Foo> = { a: 1, b: 'hello' };

        // @ts-expect-error Type '{ a: number; c: boolean; }' is not assignable to type 'ExactlyOne<Foo>'.
        const invalid2: ExactlyOne<Foo> = { a: 1, c: true };

        expect(invalid1).toBeDefined();
        expect(invalid2).toBeDefined();
      });

      it('should not allow zero properties', () => {
        type Foo = {
          a?: number;
          b?: string;
          c?: boolean;
        };

        // @ts-expect-error Type '{}' is not assignable to type 'ExactlyOne<Foo>'.
        const invalid: ExactlyOne<Foo> = {};

        expect(invalid).toBeDefined();
      });

      it('should work with a complex key and RegExp value', () => {
        type SrcFile = {
          'attachment.filename': RegExp;
          'attachment.basename': RegExp;
          'attachment.ext': RegExp;
        };

        const valid: ExactlyOne<SrcFile> = { 'attachment.filename': /.pdf$/i };
        expect(valid['attachment.filename']).toEqual(/.pdf$/i);

        // @ts-expect-error we are testing for the presence of errors
        const invalid1: ExactlyOne<SrcFile> = {
          'attachment.filename': /.pdf$/i,
          'attachment.basename': /test/,
        };
        expect(invalid1).toBeDefined();

        // @ts-expect-error we are testing for the presence of errors
        const invalid2: ExactlyOne<SrcFile> = {};
        expect(invalid2).toBeDefined();
      });
    });
  });
  describe('asError', () => {
    it('should return an Error object when passed a string', () => {
      const err = asError('This is an error');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('This is an error');
    });

    it('should return the first Error object when passed an Error', () => {
      const originalError = new Error('Original error');
      const err = asError(originalError);
      expect(err).toBe(originalError);
    });

    it('should combine multiple arguments into a single error message', () => {
      const originalError = new Error('DB Error');
      const err = asError('Failed to save user:', originalError);
      expect(err.message).toBe('Failed to save user: DB Error');
      expect(err).toBe(originalError);
    });

    it('should correctly combine messages from multiple Error objects', () => {
      const err1 = new Error('First error');
      const err2 = new Error('Second error');
      const err = asError(err1, err2);
      expect(err.message).toBe('First error Second error');
      expect(err).toBe(err1);
    });

    it('should handle Symbol arguments without throwing', () => {
      const sym = Symbol('test symbol');
      const err = asError('A symbol was thrown:', sym);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('A symbol was thrown: Symbol(test symbol)');
    });

    it('should handle null and undefined arguments', () => {
      const err = asError('Error with null:', null, 'and undefined:', undefined);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Error with null: null and undefined: undefined');
    });

    it('should use a plain object as options and not part of the message', () => {
      const err = asError('Error with object:', { a: 1 });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Error with object:');
      // @ts-ignore we are testing
      expect((err as IError).a).toBe(1);
    });

    it('should create a default error when called with no arguments', () => {
      const err = asError();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Invalid Error error');
    });

    it('should handle a mix of arguments including multiple errors and options', () => {
      const err1 = new Error('Error 1');
      const err2 = new Error('Error 2');
      const err = asError('Prefix', err1, 'middle', err2, { code: 500 });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Prefix Error 1 middle Error 2');
      expect((err as IError).code).toBe(500);
      expect(err).toBe(err1);
    });
  });
});
