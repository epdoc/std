import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { util } from '../src/mod.ts';

describe('stringToDate', () => {
  describe('basic parsing', () => {
    it('should parse yyyyMMdd', () => {
      const d = util.stringToDate('20240102');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy-MM-dd', () => {
      const d = util.stringToDate('2024-01-02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy_MM_dd', () => {
      const d = util.stringToDate('2024_01_02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy/MM/dd', () => {
      const d = util.stringToDate('2024/01/02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyy MM dd', () => {
      const d = util.stringToDate('2024 01 02');
      expect(d).toEqual(new Date(2024, 0, 2, 0, 0, 0));
    });

    it('should parse yyyyMMdd_HHmmss', () => {
      const d = util.stringToDate('20240102_102030');
      expect(d).toEqual(new Date(2024, 0, 2, 10, 20, 30));
    });

    it('should parse "yyyy-MM-dd HH:mm:ss"', () => {
      const d = util.stringToDate('2024-01-02 10:20:30');
      expect(d).toEqual(new Date(2024, 0, 2, 10, 20, 30));
    });
  });

  describe('timezone handling', () => {
    it('should handle UTC timezone', () => {
      const d = util.stringToDate('20240102_102030', { tz: 0 });
      expect(d?.toISOString()).toBe('2024-01-02T10:20:30.000Z');
    });

    it('should handle positive timezone offset', () => {
      // GMT+1
      const d = util.stringToDate('20240102_102030', { tz: 60 });
      expect(d?.toISOString()).toBe('2024-01-02T09:20:30.000Z');
    });

    it('should handle negative timezone offset', () => {
      // GMT-6 (CST)
      Deno.env.set('TZ', 'America/Chicago');
      const d = util.stringToDate('20240102_102030', { tz: -360 });
      expect(d?.toISOString()).toBe('2024-01-02T16:20:30.000Z');
    });
  });

  describe('invalid dates', () => {
    it('should return undefined for invalid date string', () => {
      expect(util.stringToDate('not a date')).toBeUndefined();
    });

    it('should return undefined for invalid month', () => {
      expect(util.stringToDate('20241301')).toBeUndefined();
    });

    it('should return undefined for invalid day', () => {
      expect(util.stringToDate('20240230')).toBeUndefined(); // Feb 30
    });
  });
  describe('isISODate', () => {
    it('should return true for valid ISO date strings', () => {
      expect(util.isISODate('2025-10-05T10:20:30Z')).toBe(true);
      expect(util.isISODate('2025-10-05T10:20:30.123Z')).toBe(true);
      expect(util.isISODate('2025-10-05T10:20:30+05:30')).toBe(true);
      expect(util.isISODate('2025-10-05T10:20:30.456-07:00')).toBe(true);
      expect(util.isISODate('2025-10-05T10:20:30')).toBe(true);
      expect(util.isISODate('2025-10-05T10:20:30.123')).toBe(true);
    });

    it('should return false for invalid ISO date strings', () => {
      expect(util.isISODate('2025-10-05')).toBe(false);
      expect(util.isISODate('10:20:30')).toBe(false);
      expect(util.isISODate('2025-10-05 10:20:30')).toBe(false);
      expect(util.isISODate('2025/10/05T10:20:30Z')).toBe(false);
      expect(util.isISODate('2025-10-05T10:20:30+0530')).toBe(false);
      expect(util.isISODate('2025-10-05T10:20:30,123Z')).toBe(false);
      expect(util.isISODate('2025-10-05t10:20:30Z')).toBe(false);
    });
  });

  describe('isISOTZ', () => {
    it('should return true for valid ISO timezone strings', () => {
      expect(util.isISOTZ('-06:00')).toBe(true);
      expect(util.isISOTZ('+06:00')).toBe(true);
      expect(util.isISOTZ('Z')).toBe(true);
    });

    it('should return false for invalid ISO timezone strings', () => {
      expect(util.isISOTZ('-0600')).toBe(false);
      expect(util.isISOTZ('GMT-06:00')).toBe(false);
    });
  });

  describe('isGMTTZ', () => {
    it('should return true for valid GMT timezone strings', () => {
      expect(util.isGMTTZ('GMT-06:00')).toBe(true);
      expect(util.isGMTTZ('GMT+06:00')).toBe(true);
      expect(util.isGMTTZ('GMT-6')).toBe(true);
    });

    it('should return false for invalid GMT timezone strings', () => {
      expect(util.isGMTTZ('-06:00')).toBe(false);
      expect(util.isGMTTZ('Z')).toBe(false);
    });
  });

  describe('isPDFTZ', () => {
    it('should return true for valid PDF timezone strings', () => {
      expect(util.isPDFTZ('-0600')).toBe(true);
      expect(util.isPDFTZ('+0600')).toBe(true);
      expect(util.isPDFTZ('-06')).toBe(true);
      expect(util.isPDFTZ('Z')).toBe(true);
    });

    it('should return false for invalid PDF timezone strings', () => {
      expect(util.isPDFTZ('-06:00')).toBe(false);
      expect(util.isPDFTZ('GMT-06:00')).toBe(false);
    });
  });

  describe('isIANATZ', () => {
    it('should return true for valid IANA timezone strings', () => {
      expect(util.isIANATZ('America/New_York')).toBe(true);
      expect(util.isIANATZ('Europe/London')).toBe(true);
      expect(util.isIANATZ('Asia/Tokyo')).toBe(true);
    });

    it('should return false for invalid IANA timezone strings', () => {
      expect(util.isIANATZ('America/New York')).toBe(false);
      expect(util.isIANATZ('invalid-timezone')).toBe(false);
    });
  });
});
