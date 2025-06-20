import { dateEx } from '@epdoc/datetime';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { dateList, type DateRangeDef, dateStringToDate } from './mod.ts';

function expectDate(
  date: Date | undefined,
  expected: {
    year: number;
    month: number; // 0-indexed
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
) {
  expect(date).toBeInstanceOf(Date);
  if (date) {
    expect(date.getFullYear()).toBe(expected.year);
    expect(date.getMonth()).toBe(expected.month);
    expect(date.getDate()).toBe(expected.day);
    expect(date.getHours()).toBe(expected.hour ?? 0);
    expect(date.getMinutes()).toBe(expected.minute ?? 0);
    expect(date.getSeconds()).toBe(expected.second ?? 0);
  }
}

describe('date-range', () => {
  describe('dateStringToDate', () => {
    test('YYYYMMDD', () => {
      const d = dateStringToDate('20241123');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBe(23);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T00:00:00');
    });
    test('YYYYMMDDhhmm', () => {
      const d = dateStringToDate('202411231213');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBe(23);
      expect(d.getHours()).toBe(12);
      expect(d.getMinutes()).toBe(13);
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T12:13:00');
    });

    test('YYYY', () => {
      const d = dateStringToDate('2025');
      expectDate(d, { year: 2025, month: 0, day: 1 });
      expect(dateEx(d).toISOLocalString()).toContain('2025-01-01T00:00:00');
    });

    test('YYYYMM', () => {
      const d = dateStringToDate('202503');
      expectDate(d, { year: 2025, month: 2, day: 1 });
      expect(dateEx(d).toISOLocalString()).toContain('2025-03-01T00:00:00');
    });

    test('YYYYMMDDhh', () => {
      const d = dateStringToDate('2024112310');
      expectDate(d, { year: 2024, month: 10, day: 23, hour: 10 });
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T10:00:00');
    });

    test('YYYYMMDDhhmmss', () => {
      const d = dateStringToDate('20241123103045');
      expectDate(d, { year: 2024, month: 10, day: 23, hour: 10, minute: 30, second: 45 });
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T10:30:45');
    });

    test('Invalid date string length', () => {
      expect(() => dateStringToDate('202')).toThrow('Invalid date string length: 202');
    });

    test('Invalid month value', () => {
      expect(() => dateStringToDate('20241301')).toThrow('Invalid month value: 13');
    });

    test('Invalid day value', () => {
      expect(() => dateStringToDate('20240230')).toThrow('Invalid day value: 30 for month 2');
    });
  });
  describe('dateList', () => {
    test('YYYYMMDD-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('20241123-20241124');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2024, month: 10, day: 23 });
      expectDate(d[0].before, { year: 2024, month: 10, day: 25 });
    });
    test('YYYYMMDDhh-YYYYMMDDhh', () => {
      const d: DateRangeDef[] = dateList('2024112312-2024112415');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2024, month: 10, day: 23, hour: 12 });
      expectDate(d[0].before, { year: 2024, month: 10, day: 24, hour: 15 });
    });

    test('YYYY (single year)', () => {
      const d: DateRangeDef[] = dateList('2025');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 0, day: 1 });
      expectDate(d[0].before, { year: 2026, month: 0, day: 1 });
    });

    test('YYYYMM (single month)', () => {
      const d: DateRangeDef[] = dateList('202502');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDate(d[0].before, { year: 2025, month: 2, day: 1 });
    });

    test('YYYYMMDDhhmmss (single precise timestamp)', () => {
      const d: DateRangeDef[] = dateList('20241123103045');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2024, month: 10, day: 23, hour: 10, minute: 30, second: 45 });
      // For a precise timestamp, 'before' should be the same as 'after'
      expect(d[0].before?.getTime()).toBe(d[0].after?.getTime());
    });

    test('YYYY-YYYY range', () => {
      const d: DateRangeDef[] = dateList('2025-2026');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 0, day: 1 });
      expectDate(d[0].before, { year: 2027, month: 0, day: 1 }); // End of 2026
    });

    test('YYYYMM-YYYYMM range', () => {
      const d: DateRangeDef[] = dateList('202501-202503');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 0, day: 1 });
      expectDate(d[0].before, { year: 2025, month: 3, day: 1 }); // End of March is start of April
    });

    test('Mixed precision range: YYYYMMDDhh-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('2025011513-20250116');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 0, day: 15, hour: 13 });
      expectDate(d[0].before, { year: 2025, month: 0, day: 17 }); // End of Jan 16th
    });

    test('Open-ended range (after)', () => {
      const d: DateRangeDef[] = dateList('20250115-');
      expect(d.length).toBe(1);
      expectDate(d[0].after, { year: 2025, month: 0, day: 15 });
      expect(d[0].before).toBeUndefined();
    });

    test('Open-ended range (before)', () => {
      const d: DateRangeDef[] = dateList('-20250115');
      expect(d.length).toBe(1);
      expect(d[0].after).toBeUndefined();
      expectDate(d[0].before, { year: 2025, month: 0, day: 16 }); // End of Jan 15th
    });

    test('Comma-separated list of days', () => {
      const d: DateRangeDef[] = dateList('20250101,20250102');
      expect(d.length).toBe(2);
      expectDate(d[0].after, { year: 2025, month: 0, day: 1 });
      expectDate(d[0].before, { year: 2025, month: 0, day: 2 });
      expectDate(d[1].after, { year: 2025, month: 0, day: 2 });
      expectDate(d[1].before, { year: 2025, month: 0, day: 3 });
    });

    test('Comma-separated list of ranges', () => {
      const d: DateRangeDef[] = dateList('202501-202502,2026');
      expect(d.length).toBe(2);
      // First range: Jan-Feb 2025
      expectDate(d[0].after, { year: 2025, month: 0, day: 1 });
      expectDate(d[0].before, { year: 2025, month: 2, day: 1 });
      // Second range: all of 2026
      expectDate(d[1].after, { year: 2026, month: 0, day: 1 });
      expectDate(d[1].before, { year: 2027, month: 0, day: 1 });
    });
  });
});
