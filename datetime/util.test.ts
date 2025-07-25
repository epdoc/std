import { describe, it } from 'jsr:@std/testing/bdd';
import { expect } from 'jsr:@std/expect@^1.0.15';
import { stringToDate } from './util.ts';
import { pad } from '../type/util.ts';

describe('pad', () => {
  it('should pad single digit numbers', () => {
    expect(pad(0, 2)).toBe('00');
    expect(pad(1, 2)).toBe('01');
    expect(pad(9, 2)).toBe('09');
  });

  it('should not pad double digit numbers', () => {
    expect(pad(10, 2)).toBe('10');
    expect(pad(99, 2)).toBe('99');
  });
});

describe('stringToDate', () => {
  describe('basic parsing', () => {
    it('should parse yyyyMMdd', () => {
      const d = stringToDate('20240102');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy-MM-dd', () => {
      const d = stringToDate('2024-01-02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy_MM_dd', () => {
      const d = stringToDate('2024_01_02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy/MM/dd', () => {
      const d = stringToDate('2024/01/02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy MM dd', () => {
      const d = stringToDate('2024 01 02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyyMMdd_HHmmss', () => {
      const d = stringToDate('20240102_102030');
      expect(d).toEqual(new Date(2024, 0, 2, 10, 20, 30));
    });

    it('should parse "yyyy-MM-dd HH:mm:ss"', () => {
      const d = stringToDate('2024-01-02 10:20:30');
      expect(d).toEqual(new Date(2024, 0, 2, 10, 20, 30));
    });
  });

  describe('timezone handling', () => {
    it('should handle UTC timezone', () => {
      const d = stringToDate('20240102_102030', { tz: 0 });
      expect(d?.toISOString()).toBe('2024-01-02T10:20:30.000Z');
    });

    it('should handle positive timezone offset', () => {
      // GMT+1
      const d = stringToDate('20240102_102030', { tz: 60 });
      expect(d?.toISOString()).toBe('2024-01-02T09:20:30.000Z');
    });

    it('should handle negative timezone offset', () => {
      // GMT-6 (CST)
      Deno.env.set('TZ', 'America/Chicago');
      const d = stringToDate('20240102_102030', { tz: -360 });
      expect(d?.toISOString()).toBe('2024-01-02T16:20:30.000Z');
    });
  });

  describe('invalid dates', () => {
    it('should return undefined for invalid date string', () => {
      expect(stringToDate('not a date')).toBeUndefined();
    });

    it('should return undefined for invalid month', () => {
      expect(stringToDate('20241301')).toBeUndefined();
    });

    it('should return undefined for invalid day', () => {
      expect(stringToDate('20240230')).toBeUndefined(); // Feb 30
    });
  });
});
