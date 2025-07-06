import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import {
  asBoolean,
  asDate,
  asFloat,
  asInt,
  asString,
  camel2dash,
  compareDictValue,
  compareValues,
  dash2camel,
  deepCopy,
  deepEquals,
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
  omit,
  pad,
  pick,
  underscoreCapitalize,
} from './util.ts';

describe('util', () => {
  describe('number', () => {
    Deno.test('isNumber', () => {
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

    describe('compare', () => {
      const a = { a: 'boo', c: 'd', e: 4 };
      const b = { a: 'boo', c: 'd', e: 4 };
      const c = { a: 'ba', c: 'd', e: 4 };
      const d = { a: 'boo', c: 'e', e: 4 };
      it('compare equals', () => {
        expect(compareDictValue(a, b, 'a')).toBe(0);
        expect(compareDictValue(a, b, 'c')).toBe(0);
        expect(compareDictValue(a, b, 'e')).toBe(0);
        expect(compareDictValue(a, b, 'f')).toBe(0);
        expect(compareDictValue(a, b, 'a', 'c', 'e')).toBe(0);
      });
      it('compare not equal a', () => {
        expect(compareDictValue(a, c, 'a')).toBe(1);
        expect(compareDictValue(a, c, 'c')).toBe(0);
        expect(compareDictValue(a, c, 'e')).toBe(0);
        expect(compareDictValue(a, c, 'f')).toBe(0);
        expect(compareDictValue(a, c, 'a', 'c', 'e')).toBe(1);
      });
      it('compare not equal b', () => {
        expect(compareDictValue(a, d, 'a')).toBe(0);
        expect(compareDictValue(a, d, 'c')).toBe(-1);
        expect(compareDictValue(a, d, 'e')).toBe(0);
        expect(compareDictValue(a, d, 'f')).toBe(0);
        expect(compareDictValue(a, d, 'a', 'c', 'e')).toBe(-1);
      });
    });
    describe('deep', () => {
      const obj = {
        a: 'b',
        c: 'd',
        e: 4,
      };
      it('pick and deepEquals', () => {
        const result1 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 4 });
        expect(result1).toBe(true);
        const result2 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 5 });
        expect(result2).toBe(false);
        // @ts-ignore this is okay
        const result3 = deepEquals(pick(obj, ['a', 'c']), { a: 'b', c: 'd' });
        expect(result3).toBe(true);
      });

      it('omit and deepEquals', () => {
        const result1 = deepEquals(omit(obj, 'a', 'e'), { c: 'd' });
        expect(result1).toBe(true);
        const result2 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'd' });
        expect(result2).toBe(true);
        // @ts-ignore this is okay
        const result3 = deepEquals(omit(obj, ['a', 'c']), { e: 4 });
        expect(result3).toBe(true);
        const result4 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'f' });
        expect(result4).toBe(false);
      });
    });

    describe('deepCopy', () => {
      const obj = {
        a: 'b',
        c: '{home}/hello/world',
        e: 4,
        f: [{ a: '{home}/hello/world' }],
        g: { pattern: 'serial$', flags: 'i' },
        h: { pattern: '(a|bc)' },
      };
      const obj1 = {
        a: 'b',
        c: '<{home}>/hello/world',
        e: 4,
        f: [{ a: '<{home}>/hello/world' }],
        g: { pattern: 'serial$', flags: 'i' },
        h: { pattern: '(a|bc)' },
      };
      const obj2 = {
        a: 'b',
        c: 'well$$$/hello/world',
        e: 4,
        f: [{ a: 'well$$$/hello/world' }],
        g: { pattern: 'serial$', flags: 'i' },
        h: { pattern: '(a|bc)' },
      };
      const obj3 = {
        a: 'b',
        c: 'well$$$/hello/world',
        e: 4,
        f: [{ a: 'well$$$/hello/world' }],
        g: /serial$/i,
        h: /(a|bc)/,
      };
      const replace = { home: 'well$$$' };
      it('no replace', () => {
        const result1 = deepCopy(obj);
        const isEqual1: boolean = deepEquals(obj, result1);
        expect(isEqual1).toBe(true);
      });
      it('replace', () => {
        const result2 = deepCopy(obj, { replace: replace });
        const isEqual2: boolean = deepEquals(obj, result2);
        expect(isEqual2).toBe(false);
        expect(result2).toEqual(obj2);
        const isEqual3: boolean = deepEquals(obj2, result2);
        expect(isEqual3).toBe(true);
      });
      it('replace change delimiter', () => {
        const result1 = deepCopy(obj1, {
          replace: replace,
          pre: '<{',
          post: '}>',
        });
        const isEqual2: boolean = deepEquals(obj, result1);
        expect(isEqual2).toBe(false);
        expect(result1).toEqual(obj2);
        const isEqual3: boolean = deepEquals(obj2, result1);
        expect(isEqual3).toBe(true);
      });
      it('regexp', () => {
        const result3 = deepCopy(obj, { replace: replace, detectRegExp: true });
        expect(result3).toEqual(obj3);
        const isEqual4: boolean = deepEquals(obj, result3);
        expect(isEqual4).toBe(false);
        const isEqual5: boolean = deepEquals(obj3, result3);
        expect(isEqual5).toBe(true);
      });
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

  describe('compareValues', () => {
    const date1 = new Date('2023-01-01T00:00:00.000Z');
    const date2 = new Date('2023-01-02T00:00:00.000Z');
    const date3 = new Date('2023-01-01T00:00:00.000Z'); // same as date1

    it('should compare numbers directly', () => {
      expect(compareValues(1, 2)).toBe(-1);
      expect(compareValues(2, 1)).toBe(1);
      expect(compareValues(1, 1)).toBe(0);
    });

    it('should compare strings directly', () => {
      expect(compareValues('a', 'b')).toBe(-1);
      expect(compareValues('b', 'a')).toBe(1);
      expect(compareValues('a', 'a')).toBe(0);
    });

    it('should compare Dates directly', () => {
      expect(compareValues(date1, date2)).toBe(-1);
      expect(compareValues(date2, date1)).toBe(1);
      expect(compareValues(date1, date3)).toBe(0);
    });

    it('should return 0 for mixed types in direct comparison', () => {
      expect(compareValues(1, 'a')).toBe(0);
      expect(compareValues('a', 1)).toBe(0);
      expect(compareValues(date1, 1)).toBe(0);
      expect(compareValues(null, 1)).toBe(0);
      expect(compareValues(undefined, 'a')).toBe(0);
      expect(compareValues({}, [])).toBe(0);
    });

    it('should return 0 for unsupported types in direct comparison', () => {
      expect(
        compareValues(
          () => {},
          () => {},
        ),
      ).toBe(0);
      expect(compareValues(Symbol('a'), Symbol('b'))).toBe(0);
      expect(compareValues(true, false)).toBe(0); // Booleans are not explicitly supported for < >
    });

    describe('object property comparison', () => {
      const objA = { name: 'Alice', age: 30, city: 'New York', joined: date1 };
      const objB = { name: 'Bob', age: 25, city: 'New York', joined: date2 };
      const objC = { name: 'Alice', age: 30, city: 'London', joined: date1 }; // Same name, age as A, diff city
      const objD = { name: 'Alice', age: 30, city: 'New York', joined: date1 }; // Identical to A
      const objE = { name: 'Alice', age: '30', city: 'New York' }; // Age is string
      const objF = { name: 'Alice', city: 'New York' }; // Missing age

      it('should compare objects by a single numeric property', () => {
        expect(compareValues(objA, objB, 'age')).toBe(1); // 30 > 25
        expect(compareValues(objB, objA, 'age')).toBe(-1); // 25 < 30
      });

      it('should compare objects by a single string property', () => {
        expect(compareValues(objA, objB, 'name')).toBe(-1); // Alice < Bob
        expect(compareValues(objB, objA, 'name')).toBe(1); // Bob > Alice
      });

      it('should compare objects by a single Date property', () => {
        expect(compareValues(objA, objB, 'joined')).toBe(-1); // date1 < date2
        expect(compareValues(objB, objA, 'joined')).toBe(1); // date2 > date1
      });

      it('should compare objects by multiple properties with precedence', () => {
        // objA vs objC: name and age are same, city differs
        expect(compareValues(objA, objC, 'name', 'age', 'city')).toBe(1); // New York > London
        expect(compareValues(objC, objA, 'name', 'age', 'city')).toBe(-1); // London < New York

        // objA vs objB: name differs first
        expect(compareValues(objA, objB, 'name', 'age')).toBe(-1); // Alice < Bob
      });

      it('should return 0 if all specified properties are equal', () => {
        expect(compareValues(objA, objD, 'name', 'age', 'city', 'joined')).toBe(0);
      });

      it('should skip properties with mismatched types', () => {
        // Comparing objA.age (number) with objE.age (string)
        expect(compareValues(objA, objE, 'age')).toBe(0); // Skipped
        // If 'name' is compared first, it's equal, then 'age' is skipped
        expect(compareValues(objA, objE, 'name', 'age', 'city')).toBe(0);
      });

      it('should skip properties missing in one object', () => {
        // Comparing objA.age with objF (missing age)
        expect(compareValues(objA, objF, 'age')).toBe(0); // Skipped
        // If 'name' is compared first, it's equal, then 'age' is skipped
        expect(compareValues(objA, objF, 'name', 'age', 'city')).toBe(0);
      });

      it('should return 0 if one of the items is not an object when props are provided', () => {
        expect(compareValues(objA, null, 'name')).toBe(0);
        expect(compareValues(null, objA, 'name')).toBe(0);
        expect(compareValues(objA, 123, 'name')).toBe(0);
        expect(compareValues('string', objA, 'name')).toBe(0);
      });

      it('should return 0 if props array is empty (falls back to direct object comparison)', () => {
        expect(compareValues(objA, objB)).toBe(0); // No props, direct comparison of objects
        expect(compareValues(objA, objB, ...[])).toBe(0); // Spread empty array
      });

      it('should handle objects with undefined or null property values', () => {
        const objWithNull = { val: null };
        const objWithUndefined = { val: undefined };
        const objWithNumber = { val: 1 };

        expect(compareValues(objWithNull, objWithNumber, 'val')).toBe(0); // null vs number -> skip
        expect(compareValues(objWithUndefined, objWithNumber, 'val')).toBe(0); // undefined vs number -> skip
        expect(compareValues(objWithNull, objWithUndefined, 'val')).toBe(0); // null vs undefined -> skip
      });

      it('should correctly compare when a property value is explicitly undefined', () => {
        const o1 = { a: 1, b: undefined };
        const o2 = { a: 1, b: 2 };
        const o3 = { a: 1, b: undefined };

        expect(compareValues(o1, o2, 'b')).toBe(0); // undefined vs number -> skip
        expect(compareValues(o1, o2, 'a', 'b')).toBe(0); // a is equal, b is skipped

        expect(compareValues(o1, o3, 'b')).toBe(0); // undefined vs undefined -> skip
        expect(compareValues(o1, o3, 'a', 'b')).toBe(0); // a is equal, b is skipped
      });

      it('should return 0 for non-existent properties', () => {
        expect(compareValues(objA, objB, 'nonExistentProp')).toBe(0);
        expect(compareValues(objA, objB, 'name', 'nonExistentProp')).toBe(-1); // 'name' determines outcome
      });
    });
  });
});
