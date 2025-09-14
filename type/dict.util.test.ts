import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { dictUtil as t, isType } from './dictutil.ts';
import { isString } from './util.ts';

describe('dictUtil', () => {
  describe('isType', () => {
    it('isType', () => {
      expect(isType('string', 'string')).toBe(true);
      expect(isType(false, 'string|number')).toBe(false);
      expect(isType(false, ' string,number,  boolean')).toBe(true);
      expect(isType(34, ' string,boolean', 'number')).toBe(true);
      expect(isType(34, ' string,boolean', ['number'])).toBe(true);
      expect(isType({}, ' string,boolean', ['number'])).toBe(false);
      expect(isType({}, 'object')).toBe(true);
      expect(isType(34, 'date')).toBe(false);
      expect(() => {
        isType(34, 'xxx,yyy');
      }).toThrow('Invalid type [xxx,yyy]');
      expect(isType(new Date(), 'date')).toBe(true);
    });
    it('isType property', () => {
      expect(t({ a: 3 }).property('a').isType('number')).toBe(true);
      expect(t({ a: 3 }).property('a').isType('string')).toBe(false);
      expect(
        t({ a: { b: 3 } })
          .property('a.b')
          .isType('string|number'),
      ).toBe(true);
      expect(() => {
        t({ a: { b: 3 } }, { throw: true })
          .property('a.c')
          .isType('string|number');
      }).toThrow('Property a.c not found in object');
      expect(() => {
        t({ a: { b: 3 } }, { throw: true, src: 'test' })
          .property('a.c')
          .isType('string|number');
      }).toThrow('Property a.c not found in test');
    });
  });

  describe('property', () => {
    it('isString', () => {
      expect(isString('string')).toBe(true);
      expect(t({ a: 'string' }).property('a').isString()).toBe(true);
      expect(
        t({ a: { b: 'string' } })
          .prop('a.b')
          .isString(),
      ).toBe(true);
      expect(
        t({ a: { b: 'string' } })
          .property('a.c')
          .isString(),
      ).toBe(false);
      expect(isString(4)).toBe(false);
    });
  });

  describe('property2', () => {
    it('value1', () => {
      expect(
        t({ a: { b: 3 } })
          .property('a.b')
          .value(),
      ).toBe(3);
    });
    it('value2', () => {
      expect(
        t({ a: { b: 3 } })
          .property('a')
          .prop('b')
          .value(),
      ).toBe(3);
    });
    it('value3', () => {
      expect(
        t({ a: { b: 3 } })
          .property('a')
          .prop('b')
          .value(),
      ).toBe(3);
    });
  });
});
