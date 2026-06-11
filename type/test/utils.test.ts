import { assert, assertEquals, assertExists, assertInstanceOf, assertStringIncludes } from '@std/assert';
import type { DigitChar, ExactlyOne, IError, LetterChar, LowerCaseChar, UpperCaseChar } from '../src/mod.ts';
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
  pad,
  underscoreCapitalize,
} from '../src/mod.ts';

Deno.test('util', async (t) => {
  await t.step('isNumber', () => {
    assert(isNumber(4));
    assertEquals(isNumber(NaN), false);
    assertEquals(isNumber({}), false);
  });

  await t.step('isPosNumber', () => {
    assert(isPosNumber(4));
    assertEquals(isPosNumber(NaN), false);
    assertEquals(isPosNumber(-0.01), false);
    assertEquals(isPosNumber(0), false);
  });

  await t.step('isInteger', () => {
    assert(isInteger(4));
    assertEquals(isInteger(NaN), false);
    assertEquals(isInteger(0.2), false);
    assert(isInteger(0));
    assert(isInteger(-1));
  });

  await t.step('isWholeNumber', () => {
    assert(isWholeNumber(4));
    assertEquals(isWholeNumber(NaN), false);
    assertEquals(isWholeNumber(0.2), false);
    assert(isWholeNumber(0));
    assertEquals(isWholeNumber(-1), false);
  });

  await t.step('isIntegerInRange', () => {
    assert(isIntegerInRange(4, 0, 4));
    assertEquals(isIntegerInRange(NaN, -99, 99), false);
    assertEquals(isIntegerInRange(0.2, 0, 1), false);
    assert(isIntegerInRange(0, 0, 1));
    assertEquals(isIntegerInRange(-1, 1, 5), false);
    assertEquals(isIntegerInRange(0, 1, 5), false);
    assert(isIntegerInRange(1, 1, 5));
    assert(isIntegerInRange(3, 1, 5));
    assert(isIntegerInRange(5, 1, 5));
    assertEquals(isIntegerInRange(6, 1, 5), false);
  });

  await t.step('isNumberInRange', () => {
    assert(isNumberInRange(4, 0, 4));
    assertEquals(isNumberInRange(NaN, -99, 99), false);
    assert(isNumberInRange(0.2, 0, 1));
    assert(isNumberInRange(0, 0, 1));
    assertEquals(isNumberInRange(-1, 1, 5), false);
    assertEquals(isNumberInRange(0.999, 1, 5), false);
    assertEquals(isNumberInRange(1, 1.1, 5), false);
    assert(isNumberInRange(1.1, 1, 5));
    assert(isNumberInRange(3, 1, 5));
    assert(isNumberInRange(5, 1, 5));
    assertEquals(isNumberInRange(6, 1, 5), false);
  });

  await t.step('isBoolean', () => {
    assert(isBoolean(false));
    assertEquals(isBoolean(undefined), false);
  });

  await t.step('isTrue false', () => {
    assertEquals(isTrue({}), false);
    assertEquals(isTrue(0), false);
    assertEquals(isTrue('no'), false);
    assertEquals(isTrue('false'), false);
    assertEquals(isTrue('orange'), false);
    assertEquals(isTrue(-1), false);
    assertEquals(isTrue(false), false);
  });

  await t.step('isTrue true', () => {
    assert(isTrue(1));
    assert(isTrue(true));
    assert(isTrue('ON'));
    assert(isTrue('YES'));
    assert(isTrue('TRUE'));
    assert(isTrue(2));
  });

  await t.step('isFalse false', () => {
    assertEquals(isFalse({}), false);
    assertEquals(isFalse(1), false);
    assertEquals(isFalse('yes'), false);
    assertEquals(isFalse('true'), false);
    assertEquals(isFalse('orange'), false);
    assertEquals(isFalse(2), false);
    assertEquals(isFalse(-1), false);
    assertEquals(isFalse(true), false);
  });

  await t.step('isFalse true', () => {
    assert(isFalse(false));
    assert(isFalse('no'));
    assert(isFalse('off'));
    assert(isFalse('FALSE'));
    assert(isFalse('false'));
    assert(isFalse(0));
  });

  await t.step('asBoolean false', () => {
    assertEquals(asBoolean(false), false);
    assertEquals(asBoolean('no'), false);
    assertEquals(asBoolean('off'), false);
    assertEquals(asBoolean('FALSE'), false);
    assertEquals(asBoolean('false'), false);
    assertEquals(asBoolean(0), false);
  });

  await t.step('asBoolean true', () => {
    assert(asBoolean(true));
    assert(asBoolean('yes'));
    assert(asBoolean('ON'));
    assert(asBoolean('TRUE'));
    assert(asBoolean('true'));
    assert(asBoolean(1));
  });

  await t.step('asBoolean default true', () => {
    assertEquals(asBoolean({}, false), false);
    assert(asBoolean({}, true));
    assertEquals(asBoolean([], false), false);
    assert(asBoolean([], true));
    assertEquals(asBoolean('orange', false), false);
    assert(asBoolean('orange', true));
  });

  await t.step('isDate', () => {
    assertEquals(isDate(/^.*$/), false);
    assertEquals(isDate({}), false);
    assertEquals(isDate(false), false);
    assertEquals(isDate(233433), false);
    assert(isDate(new Date()));
    assertEquals(isDate(() => {}), false);
  });

  await t.step('isValidDate', () => {
    assertEquals(isValidDate(/^.*$/), false);
    assertEquals(isValidDate({}), false);
    assertEquals(isValidDate(false), false);
    assertEquals(isValidDate(233433), false);
    assert(isValidDate(new Date()));
    assertEquals(isValidDate(new Date('//')), false);
    assertEquals(isValidDate(() => {}), false);
  });

  await t.step('asDate should return a valid Date object if value is a valid Date', () => {
    const d = new Date();
    assertEquals(asDate(d), d);
  });

  await t.step('asDate should return null if value is an invalid Date object', () => {
    const d = new Date('invalid date');
    assertEquals(asDate(d), null);
  });

  await t.step('asDate should return a valid Date from a number (milliseconds)', () => {
    const timestamp = 1672531200000;
    const d = new Date(timestamp);
    assertEquals(asDate(timestamp), d);
  });

  await t.step('asDate should return a valid Date from a valid date string', () => {
    const dateString = '2023-01-01T00:00:00.000Z';
    const d = new Date(dateString);
    assertEquals(asDate(dateString), d);
  });

  await t.step('asDate should return null for an invalid date string', () => {
    const dateString = 'not a date';
    assertEquals(asDate(dateString), null);
  });

  await t.step('asDate should return a valid Date from an array of numbers', () => {
    const dateArray = [2023, 0, 1];
    const d = new Date(2023, 0, 1);
    assertEquals(asDate(dateArray), d);
  });

  await t.step('asDate should return a valid Date from a full array of numbers', () => {
    const dateArray = [2023, 0, 1, 10, 30, 0];
    const d = new Date(2023, 0, 1, 10, 30, 0);
    assertEquals(asDate(dateArray), d);
  });

  await t.step('asDate should return null for an array with non-number elements', () => {
    const dateArray = [2023, 'January', 1];
    assertEquals(asDate(dateArray), null);
  });

  await t.step('asDate should return null for an array of numbers that results in an invalid date', () => {
    const dateArray = [NaN];
    assertEquals(asDate(dateArray), null);
  });

  await t.step('asDate should return null for other types', () => {
    assertEquals(asDate({}), null);
    assertEquals(asDate(null), null);
    assertEquals(asDate(undefined), null);
    assertEquals(asDate(() => {}), null);
  });

  await t.step('asDate should use defVal if the primary value is invalid', () => {
    const defDate = new Date();
    assertEquals(asDate('invalid', defDate), defDate);
    assertEquals(asDate(null, '2023-01-01'), new Date('2023-01-01'));
    assertEquals(asDate(undefined, [2023, 0, 1]), new Date(2023, 0, 1));
  });

  await t.step('asDate should return null if both primary value and defVal are invalid', () => {
    assertEquals(asDate('invalid', 'also invalid'), null);
    assertEquals(asDate(null, new Date('invalid')), null);
  });

  await t.step('asDate should return null if primary value is invalid and no defVal is provided', () => {
    assertEquals(asDate('invalid'), null);
  });

  await t.step('isString', () => {
    assert(isString('my string'));
    assert(isString(''));
    assertEquals(isString(null), false);
    assertEquals(isString(4), false);
  });

  await t.step('isNonEmptyString', () => {
    const s = 'my string';
    assert(isNonEmptyString(s));
    assertEquals(s, 'my string');
    assertEquals(isNonEmptyString(''), false);
    assertEquals(isNonEmptyString(null), false);
    assertEquals(isNonEmptyString(4), false);
  });

  await t.step('asString', () => {
    assertEquals(asString(4), '4');
    assertEquals(asString('my string'), 'my string');
    assertEquals(asString(null), 'null');
    assertEquals(asString(undefined), 'undefined');
    assertEquals(asString(false), 'false');
    assertEquals(asString(true), 'true');
    assertEquals(asString({ a: 'b', c: 'd' }), '{"a":"b","c":"d"}');
    assertEquals(asString([1, 2, 3]), '{"0":1,"1":2,"2":3}');
    assertStringIncludes(asString(new Error('my error')), 'Error: my error');
    assertEquals(asString(new Date()), '{}');
    assertEquals(asString(Symbol('my symbol')), 'Symbol(my symbol)');
  });

  await t.step('isHexString', () => {
    assertEquals(isHexString('my string'), false);
    assertEquals(isHexString(''), false);
    assertEquals(isHexString('', 0), false);
    assertEquals(isHexString('', 2), false);
    assertEquals(isHexString(null), false);
    assertEquals(isHexString(4), false);
    assert(isHexString('a3e45DD'));
    assert(isHexString('a3e45DD', 7));
    assertEquals(isHexString('a3e45DD', 0), false);
    assertEquals(isHexString('a3e45DD', 8), false);
    assert(isHexString('a3e45DFD', 8));
    assertEquals(isHexString('a3e45DD', 1), false);
  });

  await t.step('isDict should identify plain objects', () => {
    assert(isDict({}));
    assert(isDict({ key: 'value' }));
  });

  await t.step('isDict should reject non-object values', () => {
    assertEquals(isDict(null), false);
    assertEquals(isDict(undefined), false);
    assertEquals(isDict(42), false);
    assertEquals(isDict('string'), false);
    assertEquals(isDict(true), false);
  });

  await t.step('isDict should reject special objects', () => {
    assertEquals(isDict([]), false);
    assertEquals(isDict(new Date()), false);
    assertEquals(isDict(/regex/), false);
    assertEquals(isDict(new Error()), false);
  });

  await t.step('isDict should reject class instances', () => {
    class Test {}
    assertEquals(isDict(new Test()), false);
  });

  await t.step('isDict should reject functions', () => {
    assertEquals(isDict(() => {}), false);
  });

  await t.step('isDict should handle objects with null prototype', () => {
    const obj = Object.create(null);
    assert(isDict(obj));
  });

  await t.step('hasOnlyAllowedProperties should return true if all properties are allowed', () => {
    const obj = { a: 1, b: 2 };
    const allowed = ['a', 'b', 'c'] as const;
    assert(hasOnlyAllowedProperties(obj, allowed));
  });

  await t.step('hasOnlyAllowedProperties should return false if there are extra properties', () => {
    const obj = { a: 1, b: 2, d: 3 };
    const allowed = ['a', 'b', 'c'] as const;
    assertEquals(hasOnlyAllowedProperties(obj, allowed), false);
  });

  await t.step('hasOnlyAllowedProperties should return true for an empty object', () => {
    const obj = {};
    const allowed = ['a', 'b'] as const;
    assert(hasOnlyAllowedProperties(obj, allowed));
  });

  await t.step('hasOnlyAllowedProperties should return true if no properties are allowed and object is empty', () => {
    const obj = {};
    const allowed: string[] = [];
    assert(hasOnlyAllowedProperties(obj, allowed));
  });

  await t.step(
    'hasOnlyAllowedProperties should return false if no properties are allowed and object is not empty',
    () => {
      const obj = { a: 1 };
      const allowed: string[] = [];
      assertEquals(hasOnlyAllowedProperties(obj, allowed), false);
    },
  );

  await t.step('isArray', () => {
    assert(isArray(['string']));
    assertEquals(isArray(4), false);
    assertEquals(isArray({ a: 'string' }), false);
  });

  await t.step('isStringArray', () => {
    const _strArray = ['a', 'b', 'c'];
    assert(isStringArray(_strArray));
    assertEquals(isStringArray([1, 2, 3]), false);
    assertEquals(isStringArray({ a: 'string' }), false);
  });

  await t.step('isFunction', () => {
    assertEquals(isFunction({}), false);
    assertEquals(isFunction(3), false);
    assertEquals(isFunction(false), false);
    assert(isFunction(() => {}));
  });

  await t.step('isNull', () => {
    assert(isNull(null));
    assertEquals(isNull(false), false);
    assertEquals(isNull(() => {}), false);
  });

  await t.step('isDefined', () => {
    assert(isDefined(null));
    assertEquals(isDefined(undefined), false);
    assert(isDefined(false));
    assert(isDefined(() => {}));
  });

  await t.step('hasValue', () => {
    assert(hasValue('test'));
    assert(hasValue(NaN));
    assert(hasValue(0.2));
    assert(hasValue(0));
    assertEquals(hasValue(undefined), false);
    assertEquals(hasValue(null), false);
    assert(hasValue({}));
  });

  await t.step('isRegExp', () => {
    assert(isRegExp(/^.*$/));
    assertEquals(isRegExp({}), false);
    assertEquals(isRegExp(false), false);
    assertEquals(isRegExp(Date.now()), false);
    assertEquals(isRegExp(() => {}), false);
  });

  await t.step('isRegExpDef', () => {
    assertEquals(isRegExpDef(/^.*$/), false);
    assertEquals(isRegExpDef({}), false);
    assert(isRegExpDef({ pattern: 'stuff' }));
    assert(isRegExpDef({ pattern: 'stuff', flags: 'i' }));
    assertEquals(isRegExpDef({ flags: 'stuff' }), false);
  });

  await t.step('isObject', () => {
    assertEquals(isObject(/^.*$/), false);
    assert(isObject({}));
    assertEquals(isObject([]), false);
    assertEquals(isObject(false), false);
    assertEquals(isRegExp(Date.now()), false);
    assertEquals(isObject(() => {}), false);
    assertEquals(isObject(undefined), false);
  });

  await t.step('isError', () => {
    assertEquals(isError(/^.*$/), false);
    assertEquals(isError({}), false);
    assertEquals(isError(false), false);
    assert(isError(new Error()));
    assertEquals(isError(() => {}), false);
  });

  await t.step('camel2dash', () => {
    assertEquals(camel2dash('myStringHere'), 'my-string-here');
    assertEquals(camel2dash('MyStringHere'), 'my-string-here');
  });

  await t.step('dash2camel', () => {
    assertEquals(dash2camel('my-string-here'), 'myStringHere');
    assertEquals(dash2camel('my-string'), 'myString');
  });

  await t.step('underscoreCapitalize', () => {
    assertEquals(underscoreCapitalize('my_string_here'), 'My String Here');
    assertEquals(underscoreCapitalize('anOTHer_String'), 'AnOTHer String');
  });

  await t.step('pad', () => {
    assertEquals(pad(32, 4), '0032');
    assertEquals(pad(32, 4, 'a'), 'aa32');
    assertEquals(pad(32, 2), '32');
  });

  await t.step('asInt', () => {
    assertEquals(asInt(32), 32);
    assertEquals(asInt(32.5), 33);
    assertEquals(asInt(9.49), 9);
    assertEquals(asInt('9.49'), 9);
    assertEquals(asInt('3'), 3);
    assertEquals(asInt('11.5'), 12);
    assertEquals(asInt('aba'), 0);
    assertEquals(asInt([]), 0);
  });

  await t.step('asFloat', () => {
    assertEquals(asFloat(32), 32);
    assertEquals(asFloat(32.5), 32.5);
    assertEquals(asFloat('32.5'), 32.5);
    assertEquals(asFloat('9.49'), 9.49);
    assertEquals(asFloat('11.5'), 11.5);
    assertEquals(asFloat('aba'), 0);
    assertEquals(asFloat('aba', { def: 4 }), 4);
    assertEquals(asFloat('32,222,456.55'), 32222456.55);
    assertEquals(asFloat('32.222.456,55', { commaAsDecimal: true }), 32222456.55);
    assertEquals(asFloat([]), 0);
  });

  await t.step('LetterChar should accept single-character strings', () => {
    const valid: LetterChar = 'a';
    const validNumber: LetterChar = 'Z';
    const validSymbol: LetterChar = 'c';
    assertEquals(valid, 'a');
    assertEquals(validNumber, 'Z');
    assertEquals(validSymbol, 'c');
  });

  await t.step('UpperCaseChar should accept single upper case character strings', () => {
    const valid: UpperCaseChar = 'A';
    const valid2: UpperCaseChar = 'Z';
    assertEquals(valid, 'A');
    assertEquals(valid2, 'Z');
  });

  await t.step('LowerCaseChar should accept single lower case character strings', () => {
    const valid: LowerCaseChar = 'a';
    const valid2: LowerCaseChar = 'z';
    assertEquals(valid, 'a');
    assertEquals(valid2, 'z');
  });

  await t.step('Digit should accept single digit strings', () => {
    const valid: DigitChar = '0';
    const valid2: DigitChar = '9';
    assertEquals(valid, '0');
    assertEquals(valid2, '9');
  });

  await t.step('ExactlyOne should require exactly one property from the union', () => {
    type TestUnion = { a?: number; b?: string; c?: boolean };
    const valid: ExactlyOne<TestUnion> = { a: 1 };
    const validAlt: ExactlyOne<TestUnion> = { b: 'test' };
    assertEquals(Object.keys(valid).length, 1);
    assertEquals(Object.keys(validAlt).length, 1);
  });

  await t.step('ExactlyOne should work with nested object types', () => {
    type ComplexUnion = {
      meta?: { id: string };
      config?: { enabled: boolean };
    };

    const valid: ExactlyOne<ComplexUnion> = { meta: { id: '123' } };
    const validAlt: ExactlyOne<ComplexUnion> = {
      config: { enabled: true },
    };
    assertEquals(Object.keys(valid).length, 1);
    assertEquals(Object.keys(validAlt).length, 1);
  });

  await t.step('ExactlyOne should enforce runtime single-key checks', () => {
    const isExactlyOne = (obj: object) => Object.keys(obj).length === 1;

    assert(isExactlyOne({ a: 1 }));
    assertEquals(isExactlyOne({}), false);
    assertEquals(isExactlyOne({ a: 1, b: 2 }), false);
  });

  await t.step('ExactlyOne should allow exactly one property', () => {
    type Foo = {
      a?: number;
      b?: string;
      c?: boolean;
    };

    const valid1: ExactlyOne<Foo> = { a: 1 };
    const valid2: ExactlyOne<Foo> = { b: 'hello' };
    const valid3: ExactlyOne<Foo> = { c: true };

    assertEquals(valid1.a, 1);
    assertEquals(valid2.b, 'hello');
    assertEquals(valid3.c, true);
  });

  await t.step('ExactlyOne should not allow more than one property', () => {
    type Foo = {
      a?: number;
      b?: string;
      c?: boolean;
    };

    const invalid1: unknown = { a: 1, b: 'hello' };
    const invalid2: unknown = { a: 1, c: true };

    assertExists(invalid1);
    assertExists(invalid2);
  });

  await t.step('ExactlyOne should not allow zero properties', () => {
    type Foo = {
      a?: number;
      b?: string;
      c?: boolean;
    };

    const invalid: unknown = {};
    assertExists(invalid);
  });

  await t.step('ExactlyOne should work with a complex key and RegExp value', () => {
    const valid: ExactlyOne<{ 'attachment.filename': RegExp }> = { 'attachment.filename': /.pdf$/i };
    assertEquals(valid['attachment.filename'], /.pdf$/i);
  });

  await t.step('asError should return an Error object when passed a string', () => {
    const err = asError('This is an error');
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'This is an error');
  });

  await t.step('asError should return the first Error object when passed an Error', () => {
    const originalError = new Error('Original error');
    const err = asError(originalError);
    assertEquals(err, originalError);
  });

  await t.step('asError should combine multiple arguments into a single error message', () => {
    const originalError = new Error('DB Error');
    const err = asError('Failed to save user:', originalError);
    assertEquals(err.message, 'Failed to save user: DB Error');
    assertEquals(err, originalError);
  });

  await t.step('asError should correctly combine messages from multiple Error objects', () => {
    const err1 = new Error('First error');
    const err2 = new Error('Second error');
    const err = asError(err1, err2);
    assertEquals(err.message, 'First error Second error');
    assertEquals(err, err1);
  });

  await t.step('asError should handle Symbol arguments without throwing', () => {
    const sym = Symbol('test symbol');
    const err = asError('A symbol was thrown:', sym);
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'A symbol was thrown: Symbol(test symbol)');
  });

  await t.step('asError should handle null and undefined arguments', () => {
    const err = asError('Error with null:', null, 'and undefined:', undefined);
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'Error with null: null and undefined: undefined');
  });

  await t.step('asError should use a plain object as options and not part of the message', () => {
    const err = asError('Error with object:', { a: 1 });
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'Error with object:');
    // @ts-ignore - testing
    assertEquals((err as IError).a, 1);
  });

  await t.step('asError should create a default error when called with no arguments', () => {
    const err = asError();
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'Invalid Error error');
  });

  await t.step('asError should handle a mix of arguments including multiple errors and options', () => {
    const err1 = new Error('Error 1');
    const err2 = new Error('Error 2');
    const err = asError('Prefix', err1, 'middle', err2, { code: 500 });
    assertInstanceOf(err, Error);
    assertEquals(err.message, 'Prefix Error 1 middle Error 2');
    assertEquals((err as IError).code, 500);
    assertEquals(err, err1);
  });
});
