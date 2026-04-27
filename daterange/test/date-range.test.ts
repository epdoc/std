// deno-lint-ignore-file no-explicit-any
import { DateTime, type ISODate } from '@epdoc/datetime';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import {
  dateList,
  DateRange,
  type DateRangeDef,
  DateRanges,
  dateRanges,
  dateStringToInstant,
  parseRelativeTime,
} from '../src/mod.ts';

function expectDateTime(
  dt: DateTime | undefined,
  expected: {
    year: number;
    month: number; // 1-indexed
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
) {
  expect(dt).toBeInstanceOf(DateTime as any);
  if (dt) {
    const zdt = dt.withTz('local').temporal as Temporal.ZonedDateTime;
    expect(zdt.year).toBe(expected.year);
    expect(zdt.month).toBe(expected.month);
    expect(zdt.day).toBe(expected.day);
    expect(zdt.hour).toBe(expected.hour ?? 0);
    expect(zdt.minute).toBe(expected.minute ?? 0);
    expect(zdt.second).toBe(expected.second ?? 0);
  }
}

describe('daterange', () => {
  describe('parseRelativeTime', () => {
    test('should parse single units', () => {
      const now = DateTime.now();
      const oneDay = parseRelativeTime('1d');
      expect(oneDay).toBeInstanceOf(DateTime as any);
      const diffMs = now.epochMilliseconds - oneDay!.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(86400000 - 1000);
      expect(diffMs).toBeLessThanOrEqual(86400000 + 1000);
    });

    test('should parse combined units', () => {
      const now = DateTime.now();
      const oneDayTwelveHours = parseRelativeTime('1d12h');
      expect(oneDayTwelveHours).toBeInstanceOf(DateTime as any);
      const diffMs = now.epochMilliseconds - oneDayTwelveHours!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000;
      expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 1000);
      expect(diffMs).toBeLessThanOrEqual(expectedMs + 1000);
    });

    test('should parse negative (future) values', () => {
      const now = DateTime.now();
      const oneHourFuture = parseRelativeTime('-1h');
      expect(oneHourFuture).toBeInstanceOf(DateTime as any);
      const diffMs = oneHourFuture!.epochMilliseconds - now.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(3600000 - 1000);
      expect(diffMs).toBeLessThanOrEqual(3600000 + 1000);
    });

    test('should parse keywords', () => {
      const now = parseRelativeTime('now');
      expect(now).toBeInstanceOf(DateTime as any);

      const today = parseRelativeTime('today');
      expect(today).toBeInstanceOf(DateTime as any);
      const zdt = today!.withTz('local').temporal as Temporal.ZonedDateTime;
      expect(zdt.hour).toBe(0);
      expect(zdt.minute).toBe(0);
      expect(zdt.second).toBe(0);
    });
  });

  describe('dateStringToInstant', () => {
    test('YYYYMMDD', () => {
      const dt = dateStringToInstant('20241123');
      expectDateTime(dt, { year: 2024, month: 11, day: 23 });
    });

    test('YYYYMMDDhhmm', () => {
      const dt = dateStringToInstant('202411231213');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 12, minute: 13 });
    });

    test('YYYY', () => {
      const dt = dateStringToInstant('2025');
      expectDateTime(dt, { year: 2025, month: 1, day: 1 });
    });

    test('YYYYMM', () => {
      const dt = dateStringToInstant('202503');
      expectDateTime(dt, { year: 2025, month: 3, day: 1 });
    });

    test('YYYYMMDDhh', () => {
      const dt = dateStringToInstant('2024112310');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 10 });
    });

    test('YYYYMMDDhhmmss', () => {
      const dt = dateStringToInstant('20241123103045');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
    });

    test('Invalid date string length', () => {
      expect(() => dateStringToInstant('202')).toThrow('Invalid date string length: 202');
    });

    test('Invalid month value', () => {
      expect(() => dateStringToInstant('20241301')).toThrow('Invalid month value: 13');
    });

    test('Invalid day value', () => {
      expect(() => dateStringToInstant('20240230')).toThrow('Invalid day value: 30 for month 2');
    });
  });

  describe('dateList', () => {
    test('YYYYMMDD-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('20241123-20241124');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23 });
      expectDateTime(d[0].before, { year: 2024, month: 11, day: 24, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMMDDhh-YYYYMMDDhh', () => {
      const d: DateRangeDef[] = dateList('2024112312-2024112415');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23, hour: 12 });
      expectDateTime(d[0].before, { year: 2024, month: 11, day: 24, hour: 15 });
    });

    test('YYYY (single year)', () => {
      const d: DateRangeDef[] = dateList('2025');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMM (single month)', () => {
      const d: DateRangeDef[] = dateList('202502');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 2, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMMDDhhmmss (single precise timestamp)', () => {
      const d: DateRangeDef[] = dateList('20241123103045');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
      expect(d[0].before?.epochMilliseconds).toBe(d[0].after?.epochMilliseconds);
    });

    test('YYYY-YYYY range', () => {
      const d: DateRangeDef[] = dateList('2025-2026');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMM-YYYYMM range', () => {
      const d: DateRangeDef[] = dateList('202501-202503');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 3, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('Mixed precision range: YYYYMMDDhh-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('2025011513-20250116');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 15, hour: 13 });
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 16, hour: 23, minute: 59, second: 59 });
    });

    test('Open-ended range (after)', () => {
      const d: DateRangeDef[] = dateList('20250115-');
      expect(d.length).toBe(1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 15 });
      expect(d[0].before).toBeUndefined();
    });

    test('Open-ended range (before)', () => {
      const d: DateRangeDef[] = dateList('-20250115');
      expect(d.length).toBe(1);
      expect(d[0].after).toBeUndefined();
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 15, hour: 23, minute: 59, second: 59 });
    });

    test('Comma-separated list of days', () => {
      const d: DateRangeDef[] = dateList('20250101,20250102');
      expect(d.length).toBe(2);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 1, hour: 23, minute: 59, second: 59 });
      expectDateTime(d[1].after, { year: 2025, month: 1, day: 2 });
      expectDateTime(d[1].before, { year: 2025, month: 1, day: 2, hour: 23, minute: 59, second: 59 });
    });

    test('Comma-separated list of ranges', () => {
      const d: DateRangeDef[] = dateList('202501-202502,2026');
      expect(d.length).toBe(2);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
      expectDateTime(d[1].after, { year: 2026, month: 1, day: 1 });
      expectDateTime(d[1].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('Relative time: 1d-now', () => {
      const d: DateRangeDef[] = dateList('1d-now');
      expect(d.length).toBe(1);
      expect(d[0].after).toBeInstanceOf(DateTime as any);
      expect(d[0].before).toBeInstanceOf(DateTime as any);

      const now = DateTime.now();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(86400000 - 5000);
      expect(diffMs).toBeLessThanOrEqual(86400000 + 5000);
    });

    test('Relative time with combined units: 1d12h', () => {
      const d: DateRangeDef[] = dateList('1d12h', { inclusiveEnd: false });
      expect(d.length).toBe(1);

      const now = DateTime.now();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000;
      expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 5000);
      expect(diffMs).toBeLessThanOrEqual(expectedMs + 5000);
    });
  });

  describe('dateRanges', () => {
    test('should return a DateRanges object', () => {
      const dr = dateRanges('2025');
      expect(dr).toBeInstanceOf(DateRanges as any);
    });

    test('should contain the correct ranges for a complex string', () => {
      const dr = dateRanges('202501-202502,2026');
      const ranges = dr.ranges;
      expect(ranges).toBeInstanceOf(Array);
      expect(ranges.length).toBe(2);

      expect(ranges[0]).toBeInstanceOf(DateRange as any);
      expectDateTime(ranges[0].after, { year: 2025, month: 1, day: 1 });

      expect(ranges[1]).toBeInstanceOf(DateRange as any);
      expectDateTime(ranges[1].after, { year: 2026, month: 1, day: 1 });
    });

    test('should handle empty string input', () => {
      const dr = dateRanges('');
      expect(dr).toBeInstanceOf(DateRanges as any);
      expect(dr.ranges.length).toBe(0);
    });
  });

  describe('DateRanges', () => {
    test('constructor should accept single DateRangeDef', () => {
      const dt = dateStringToInstant('20250101');
      const def: DateRangeDef = { after: dt };
      const dr = DateRanges.fromDef(def);
      expect(dr.ranges.length).toBe(1);
      expectDateTime(dr.ranges[0].after, { year: 2025, month: 1, day: 1 });
    });

    test('constructor should accept array of DateRangeDef', () => {
      const defs: DateRangeDef[] = [
        { after: dateStringToInstant('20250101') },
        { after: dateStringToInstant('20250201') },
      ];
      const dr = DateRanges.fromDef(defs);
      expect(dr.ranges.length).toBe(2);
    });

    test('init should accept single DateRangeDef', () => {
      const dr = DateRanges.from('20250301');
      expect(dr.ranges.length).toBe(1);
      expectDateTime(dr.ranges[0].after, { year: 2025, month: 3, day: 1 });
    });

    test('init should accept array of DateRangeDef', () => {
      const defs: DateRangeDef[] = [
        { after: dateStringToInstant('20250101') },
        { after: dateStringToInstant('20250201') },
      ];
      const dr = DateRanges.fromDef(defs);
      expect(dr.ranges.length).toBe(2);
    });

    test('should be iterable with for...of', () => {
      const dr = dateRanges('20250101-20250115,20250201-20250215');
      const collected: DateRange[] = [];
      for (const range of dr) {
        collected.push(range);
      }
      expect(collected.length).toBe(2);
      expect(collected[0]).toBeInstanceOf(DateRange as any);
      expect(collected[1]).toBeInstanceOf(DateRange as any);
    });

    test('should be iterable with spread operator', () => {
      const dr = dateRanges('20250101-20250115,20250201-20250215');
      const arr = [...dr];
      expect(arr.length).toBe(2);
      expect(arr[0]).toBeInstanceOf(DateRange as any);
      expect(arr[1]).toBeInstanceOf(DateRange as any);
    });

    test('should be iterable with Array.from', () => {
      const dr = dateRanges('20250101-20250115');
      const arr = Array.from(dr);
      expect(arr.length).toBe(1);
      expect(arr[0]).toBeInstanceOf(DateRange as any);
    });

    test('contains should work with DateTime, Date, Temporal.Instant, and string', () => {
      const dr = dateRanges('20250101-20250131');

      const dt = DateTime.from('2025-01-15T12:00:00Z');
      expect(dr.contains(dt)).toBe(true);

      const instant = Temporal.Instant.from('2025-01-15T12:00:00Z');
      expect(dr.contains(instant)).toBe(true);

      const date = new Date('2025-01-15T12:00:00Z');
      expect(dr.contains(date)).toBe(true);

      expect(dr.contains('2025-01-15T12:00:00Z')).toBe(true);
      expect(dr.contains('2025-02-15T12:00:00Z')).toBe(false);
      expect(dr.contains('2024-12-15T12:00:00Z')).toBe(false);
    });

    test('merge should combine overlapping ranges', () => {
      const dr = DateRanges.from('20250101-20250115,20250110-20250131');
      expect(dr.ranges.length).toBe(2);
      const dr2 = dr.merge();
      expect(dr2.ranges.length).toBe(1);
    });

    test('add should add new ranges', () => {
      const dr = DateRanges.from([]);
      const dr2 = dr.add({ after: DateTime.from('2025-01-01T00:00:00Z') });
      expect(dr2.ranges.length).toBe(1);
    });
  });

  describe('DateRange', () => {
    test('should create from DateTime values', () => {
      const after = DateTime.from('2025-01-01T00:00:00Z');
      const before = DateTime.from('2025-01-31T23:59:59Z');
      const range = DateRange.from(after, before);

      expect(range.after).toBe(after);
      expect(range.before).toBe(before);
    });

    test('should create from relative strings', () => {
      const range = DateRange.fromRelative('1d', 'now');
      expect(range).toBeDefined();
    });

    test('contains should be inclusive', () => {
      const range = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-31T23:59:59Z'),
      );

      expect(range.contains('2025-01-01T00:00:00Z')).toBe(true);
      expect(range.contains('2025-01-31T23:59:59Z')).toBe(true);
      expect(range.contains('2025-01-15T12:00:00Z')).toBe(true);
    });

    test('overlaps should detect overlapping ranges', () => {
      const r1 = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-15T00:00:00Z'),
      );
      const r2 = DateRange.from(
        DateTime.from('2025-01-10T00:00:00Z'),
        DateTime.from('2025-01-20T00:00:00Z'),
      );
      expect(r1.overlaps(r2)).toBe(true);
    });

    test('intersect should return overlapping portion', () => {
      const r1 = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-15T00:00:00Z'),
      );
      const r2 = DateRange.from(
        DateTime.from('2025-01-10T00:00:00Z'),
        DateTime.from('2025-01-20T00:00:00Z'),
      );

      const intersection = r1.intersect(r2);
      expect(intersection).toBeInstanceOf(DateRange as any);
      expect(intersection!.after.toISOString()).toMatch(/^2025-01-10T00:00:00(Z|\+00:00)$/);
      expect(intersection!.before.toISOString()).toMatch(/^2025-01-15T00:00:00(Z|\+00:00)$/);
    });

    test('duration should return milliseconds', () => {
      const range = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-02T00:00:00Z'),
      );
      expect(range.duration()).toBe(86400000);
    });

    test('after/before should be DateTime', () => {
      const after = DateTime.from('2025-01-01T00:00:00Z');
      const before = DateTime.from('2025-01-31T23:59:59Z');
      const range = DateRange.from(after, before);

      expect(range.after).toBeInstanceOf(DateTime as any);
      expect(range.before).toBeInstanceOf(DateTime as any);
    });

    test('default after/before should be min/max', () => {
      const range = DateRange.from(undefined, undefined);
      console.log(range);
      expect(range.after.isNearMin()).toBe(true);
      expect(range.before.isNearMax()).toBe(true);
    });
  });

  describe('toJSON', () => {
    test('should correctly serialize a single range', () => {
      const dr = dateRanges('20250115-20250116');
      const json = dr.toJSON();
      expect(json.length).toBe(1);
      expect(json[0].after).toBeDefined();
      expect(json[0].before).toBeDefined();
      expect(json[0].after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(json[0].before).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize a range with only an after date', () => {
      const dr = DateRanges.fromCliString('20250115-');
      const json = dr.toJSON();
      expect(json[0].after).toBeDefined();
      expect(json[0].before).toBeUndefined();
      expect(json[0].after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize a range with only a before date', () => {
      const dr = DateRanges.fromCliString('-20250116');
      const json = dr.toJSON();
      expect(json[0].after).toBeUndefined();
      expect(json[0].before).toBeDefined();
      expect(json[0].before).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize multiple ranges', () => {
      const dr = DateRanges.fromCliString('202501-202502,2026');
      const json = dr.toJSON();
      expect(json.length).toBe(2);
    });

    test('should return an empty array for an empty DateRanges object', () => {
      const dr = DateRanges.fromCliString('');
      const json = dr.toJSON();
      expect(json).toEqual([]);
    });
  });

  describe('fromJSON', () => {
    test('should correctly deserialize a single range', () => {
      const s = '20250115-20250116';
      const dr1 = DateRanges.fromCliString(s);
      const json = dr1.toJSON();
      const dr2 = DateRanges.fromJSON(json);
      expect(dr2).toBeInstanceOf(DateRanges as any);
      expect(dr2!.toCompactString()).toBe(dr1.toCompactString());
    });

    test('should correctly deserialize multiple ranges', () => {
      const s = '202501-202502,2026';
      const dr1 = DateRanges.from(s);
      const json = dr1.toJSON();
      const dr2 = DateRanges.fromJSON(json);
      expect(dr2).toBeInstanceOf(DateRanges as any);
      expect(dr2!.toCompactString()).toBe(dr1.toCompactString());
    });

    test('should handle an empty array', () => {
      const dr = DateRanges.fromJSON([]);
      expect(dr).toBeDefined();
      expect(dr.ranges.length).toBe(0);
    });

    test('should handle invalid date strings gracefully', () => {
      const dr = DateRanges.fromJSON([{ after: 'invalid date' as unknown as ISODate }]);
      expect(dr).toBeDefined();
      expect(dr.ranges.length).toBe(0);
    });
  });

  describe('toCompactString', () => {
    test('should correctly serialize a single range', () => {
      const dr = DateRanges.from('20250115-20250116');
      expect(dr.toCompactString()).toBe('20250115-20250116');
    });

    test('should correctly serialize a range with only an after date', () => {
      const dr = DateRanges.from('20250115-');
      expect(dr.toCompactString()).toBe('20250115-');
    });

    test('should correctly serialize a range with only a before date', () => {
      const dr = DateRanges.from('-20250116');
      expect(dr.toCompactString()).toBe('-20250116');
    });

    test('should correctly serialize multiple ranges', () => {
      const dr = DateRanges.from('202501-202502,2026');
      expect(dr.toCompactString()).toContain('20250101-20250228');
      expect(dr.toCompactString()).toContain('20260101-20261231');
    });

    test('should return an empty string for an empty DateRanges object', () => {
      const dr = DateRanges.from('');
      expect(dr.toCompactString()).toBe('');
    });
  });

  describe('init and clear', () => {
    test('should initialize with ranges', () => {
      const dr = DateRanges.from(dateList('2024-2025'));
      expect(dr.ranges.length).toBe(1);
    });

    test('should not merge ranges', () => {
      const dr0 = DateRanges.from('202301-202311');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      expect(dr2.ranges.length).toBe(2);
      expect(dr3.ranges.length).toBe(2);
    });
    test('should merge ranges', () => {
      const dr0 = DateRanges.from('2023-202401');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      expect(dr2.ranges.length).toBe(2);
      expect(dr3.ranges.length).toBe(1);
    });
    test('should merge ranges', () => {
      const dr0 = DateRanges.from('2023');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      expect(dr2.ranges.length).toBe(2);
      expect(dr3.ranges.length).toBe(1);
      console.log(dr3.toCompactString());
    });
  });
});
