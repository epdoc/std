import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import {
  asBoolean,
  asFloat,
  asInt,
  asString,
  camel2dash,
  compareDictValue,
  dash2camel,
  deepCopy,
  deepEquals,
  hasValue,
  isArray,
  isBoolean,
  isDate,
  isDefined,
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
});
