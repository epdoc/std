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

function expectInstant(
  instant: Temporal.Instant | undefined,
  expected: {
    year: number;
    month: number; // 1-indexed
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
) {
  expect(instant).toBeInstanceOf(Temporal.Instant);
  if (instant) {
    const localTz = Temporal.Now.timeZoneId();
    const zdt = instant.toZonedDateTimeISO(localTz);
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
      const now = Temporal.Now.instant();

      const oneDay = parseRelativeTime('1d');
      expect(oneDay).toBeDefined();
      const diffMs = now.epochMilliseconds - oneDay!.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(86400000 - 1000); // Allow 1s tolerance
      expect(diffMs).toBeLessThanOrEqual(86400000 + 1000);
    });

    test('should parse combined units', () => {
      const now = Temporal.Now.instant();

      const oneDayTwelveHours = parseRelativeTime('1d12h');
      expect(oneDayTwelveHours).toBeDefined();
      const diffMs = now.epochMilliseconds - oneDayTwelveHours!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000; // 1 day + 12 hours
      expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 1000);
      expect(diffMs).toBeLessThanOrEqual(expectedMs + 1000);
    });

    test('should parse negative (future) values', () => {
      const now = Temporal.Now.instant();

      const oneHourFuture = parseRelativeTime('-1h');
      expect(oneHourFuture).toBeDefined();
      const diffMs = oneHourFuture!.epochMilliseconds - now.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(3600000 - 1000);
      expect(diffMs).toBeLessThanOrEqual(3600000 + 1000);
    });

    test('should parse keywords', () => {
      const now = parseRelativeTime('now');
      expect(now).toBeDefined();

      const today = parseRelativeTime('today');
      expect(today).toBeDefined();
      const localTz = Temporal.Now.timeZoneId();
      const todayZdt = today!.toZonedDateTimeISO(localTz);
      expect(todayZdt.hour).toBe(0);
      expect(todayZdt.minute).toBe(0);
      expect(todayZdt.second).toBe(0);
    });
  });

  describe('dateStringToInstant', () => {
    test('YYYYMMDD', () => {
      const instant = dateStringToInstant('20241123');
      expectInstant(instant, { year: 2024, month: 11, day: 23 });
    });

    test('YYYYMMDDhhmm', () => {
      const instant = dateStringToInstant('202411231213');
      expectInstant(instant, { year: 2024, month: 11, day: 23, hour: 12, minute: 13 });
    });

    test('YYYY', () => {
      const instant = dateStringToInstant('2025');
      expectInstant(instant, { year: 2025, month: 1, day: 1 });
    });

    test('YYYYMM', () => {
      const instant = dateStringToInstant('202503');
      expectInstant(instant, { year: 2025, month: 3, day: 1 });
    });

    test('YYYYMMDDhh', () => {
      const instant = dateStringToInstant('2024112310');
      expectInstant(instant, { year: 2024, month: 11, day: 23, hour: 10 });
    });

    test('YYYYMMDDhhmmss', () => {
      const instant = dateStringToInstant('20241123103045');
      expectInstant(instant, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
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
      expectInstant(d[0].after, { year: 2024, month: 11, day: 23 });
      // End of day for 20241124 is 23:59:59
      expectInstant(d[0].before, { year: 2024, month: 11, day: 24, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMMDDhh-YYYYMMDDhh', () => {
      const d: DateRangeDef[] = dateList('2024112312-2024112415');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2024, month: 11, day: 23, hour: 12 });
      expectInstant(d[0].before, { year: 2024, month: 11, day: 24, hour: 15 });
    });

    test('YYYY (single year)', () => {
      const d: DateRangeDef[] = dateList('2025');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 1 });
      expectInstant(d[0].before, { year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMM (single month)', () => {
      const d: DateRangeDef[] = dateList('202502');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 2, day: 1 });
      expectInstant(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMMDDhhmmss (single precise timestamp)', () => {
      const d: DateRangeDef[] = dateList('20241123103045');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
      // For a precise timestamp, 'before' should be the same as 'after'
      expect(d[0].before?.epochMilliseconds).toBe(d[0].after?.epochMilliseconds);
    });

    test('YYYY-YYYY range', () => {
      const d: DateRangeDef[] = dateList('2025-2026');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 1 });
      expectInstant(d[0].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('YYYYMM-YYYYMM range', () => {
      const d: DateRangeDef[] = dateList('202501-202503');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 1 });
      expectInstant(d[0].before, { year: 2025, month: 3, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('Mixed precision range: YYYYMMDDhh-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('2025011513-20250116');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 15, hour: 13 });
      expectInstant(d[0].before, { year: 2025, month: 1, day: 16, hour: 23, minute: 59, second: 59 });
    });

    test('Open-ended range (after)', () => {
      const d: DateRangeDef[] = dateList('20250115-');
      expect(d.length).toBe(1);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 15 });
      expect(d[0].before).toBeUndefined();
    });

    test('Open-ended range (before)', () => {
      const d: DateRangeDef[] = dateList('-20250115');
      expect(d.length).toBe(1);
      expect(d[0].after).toBeUndefined();
      expectInstant(d[0].before, { year: 2025, month: 1, day: 15, hour: 23, minute: 59, second: 59 });
    });

    test('Comma-separated list of days', () => {
      const d: DateRangeDef[] = dateList('20250101,20250102');
      expect(d.length).toBe(2);
      expectInstant(d[0].after, { year: 2025, month: 1, day: 1 });
      expectInstant(d[0].before, { year: 2025, month: 1, day: 1, hour: 23, minute: 59, second: 59 });
      expectInstant(d[1].after, { year: 2025, month: 1, day: 2 });
      expectInstant(d[1].before, { year: 2025, month: 1, day: 2, hour: 23, minute: 59, second: 59 });
    });

    test('Comma-separated list of ranges', () => {
      const d: DateRangeDef[] = dateList('202501-202502,2026');
      expect(d.length).toBe(2);
      // First range: Jan-Feb 2025
      expectInstant(d[0].after, { year: 2025, month: 1, day: 1 });
      expectInstant(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
      // Second range: all of 2026
      expectInstant(d[1].after, { year: 2026, month: 1, day: 1 });
      expectInstant(d[1].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    test('Relative time: 1d-now', () => {
      const d: DateRangeDef[] = dateList('1d-now');
      expect(d.length).toBe(1);
      expect(d[0].after).toBeDefined();
      expect(d[0].before).toBeDefined();

      // after should be about 24 hours ago
      const now = Temporal.Now.instant();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      expect(diffMs).toBeGreaterThanOrEqual(86400000 - 5000);
      expect(diffMs).toBeLessThanOrEqual(86400000 + 5000);
    });

    test('Relative time with combined units: 1d12h', () => {
      const d: DateRangeDef[] = dateList('1d12h', { inclusiveEnd: false });
      expect(d.length).toBe(1);

      const now = Temporal.Now.instant();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000; // 1d + 12h
      expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 5000);
      expect(diffMs).toBeLessThanOrEqual(expectedMs + 5000);
    });
  });

  describe('dateRanges', () => {
    test('should return a DateRanges object', () => {
      const dr = dateRanges('2025');
      expect(dr).toBeInstanceOf(DateRanges);
    });

    test('should contain the correct ranges for a complex string', () => {
      const dr = dateRanges('202501-202502,2026');
      const ranges = dr.ranges;
      expect(ranges).toBeInstanceOf(Array);
      expect(ranges.length).toBe(2);

      // First range: Jan-Feb 2025
      expect(ranges[0]).toBeInstanceOf(DateRange);
      expectInstant(ranges[0].after, { year: 2025, month: 1, day: 1 });

      // Second range: all of 2026
      expect(ranges[1]).toBeInstanceOf(DateRange);
      expectInstant(ranges[1].after, { year: 2026, month: 1, day: 1 });
    });

    test('should handle empty string input', () => {
      const dr = dateRanges('');
      expect(dr).toBeInstanceOf(DateRanges);
      expect(dr.ranges.length).toBe(0);
    });
  });

  describe('DateRanges', () => {
    test('contains should work with Date, Temporal.Instant, and string', () => {
      const dr = dateRanges('20250101-20250131');

      // Create instants that are definitely within the local date range
      // Using noon UTC which should be within Jan 1-31 in most timezones
      const instant = Temporal.Instant.from('2025-01-15T12:00:00Z');
      expect(dr.contains(instant)).toBe(true);

      // Check with Date (converted to instant)
      const date = new Date('2025-01-15T12:00:00Z');
      expect(dr.contains(date)).toBe(true);

      // Check with string
      expect(dr.contains('2025-01-15T12:00:00Z')).toBe(true);

      // Should be false for outside range
      expect(dr.contains('2025-02-15T12:00:00Z')).toBe(false);
      expect(dr.contains('2024-12-15T12:00:00Z')).toBe(false);
    });

    test('merge should combine overlapping ranges', () => {
      const dr = dateRanges('20250101-20250115,20250110-20250131');
      expect(dr.ranges.length).toBe(2);

      dr.merge();
      expect(dr.ranges.length).toBe(1);
    });

    test('add should add new ranges', () => {
      const dr = new DateRanges();
      dr.add({ after: Temporal.Instant.from('2025-01-01T00:00:00Z') });
      expect(dr.ranges.length).toBe(1);
    });
  });

  describe('DateRange', () => {
    test('should create from instants', () => {
      const after = Temporal.Instant.from('2025-01-01T00:00:00Z');
      const before = Temporal.Instant.from('2025-01-31T23:59:59Z');
      const range = new DateRange(after, before);

      expect(range.after).toBe(after);
      expect(range.before).toBe(before);
    });

    test('should create from relative strings', () => {
      const range = DateRange.fromRelative('1d', 'now');
      expect(range).toBeDefined();
    });

    test('contains should be inclusive', () => {
      const range = new DateRange(
        Temporal.Instant.from('2025-01-01T00:00:00Z'),
        Temporal.Instant.from('2025-01-31T23:59:59Z'),
      );

      expect(range.contains('2025-01-01T00:00:00Z')).toBe(true); // Start boundary
      expect(range.contains('2025-01-31T23:59:59Z')).toBe(true); // End boundary
      expect(range.contains('2025-01-15T12:00:00Z')).toBe(true); // Middle
    });

    test('overlaps should detect overlapping ranges', () => {
      const r1 = new DateRange(
        Temporal.Instant.from('2025-01-01T00:00:00Z'),
        Temporal.Instant.from('2025-01-15T00:00:00Z'),
      );
      const r2 = new DateRange(
        Temporal.Instant.from('2025-01-10T00:00:00Z'),
        Temporal.Instant.from('2025-01-20T00:00:00Z'),
      );

      expect(r1.overlaps(r2)).toBe(true);
    });

    test('intersect should return overlapping portion', () => {
      const r1 = new DateRange(
        Temporal.Instant.from('2025-01-01T00:00:00Z'),
        Temporal.Instant.from('2025-01-15T00:00:00Z'),
      );
      const r2 = new DateRange(
        Temporal.Instant.from('2025-01-10T00:00:00Z'),
        Temporal.Instant.from('2025-01-20T00:00:00Z'),
      );

      const intersection = r1.intersect(r2);
      expect(intersection).toBeInstanceOf(DateRange);
      expect(intersection!.after.toString()).toBe('2025-01-10T00:00:00Z');
      expect(intersection!.before.toString()).toBe('2025-01-15T00:00:00Z');
    });

    test('duration should return milliseconds', () => {
      const range = new DateRange(
        Temporal.Instant.from('2025-01-01T00:00:00Z'),
        Temporal.Instant.from('2025-01-02T00:00:00Z'),
      );

      expect(range.duration()).toBe(86400000);
    });
  });

  describe('toJSON', () => {
    test('should correctly serialize a single range', () => {
      const dr = dateRanges('20250115-20250116');
      const json = dr.toJSON();
      expect(json.length).toBe(1);
      expect(json[0].after).toBeDefined();
      expect(json[0].before).toBeDefined();
      // Should be ISO 8601 format
      expect(json[0].after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(json[0].before).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize a range with only an after date', () => {
      const dr = dateRanges('20250115-');
      const json = dr.toJSON();
      expect(json[0].after).toBeDefined();
      expect(json[0].before).toBeUndefined();
      expect(json[0].after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize a range with only a before date', () => {
      const dr = dateRanges('-20250116');
      const json = dr.toJSON();
      expect(json[0].after).toBeUndefined();
      expect(json[0].before).toBeDefined();
      expect(json[0].before).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should correctly serialize multiple ranges', () => {
      const dr = dateRanges('202501-202502,2026');
      const json = dr.toJSON();
      expect(json.length).toBe(2);
    });

    test('should return an empty array for an empty DateRanges object', () => {
      const dr = dateRanges('');
      const json = dr.toJSON();
      expect(json).toEqual([]);
    });
  });

  describe('fromJSON', () => {
    test('should correctly deserialize a single range', () => {
      const s = '20250115-20250116';
      const dr1 = dateRanges(s);
      const json = dr1.toJSON();
      const dr2 = new DateRanges();
      dr2.fromJSON(json);
      expect(dr2.toCompactString()).toBe(dr1.toCompactString());
    });

    test('should correctly deserialize multiple ranges', () => {
      const s = '202501-202502,2026';
      const dr1 = dateRanges(s);
      const json = dr1.toJSON();
      const dr2 = new DateRanges();
      dr2.fromJSON(json);
      expect(dr2.toCompactString()).toBe(dr1.toCompactString());
    });

    test('should handle an empty array', () => {
      const dr = new DateRanges();
      dr.fromJSON([]);
      expect(dr.ranges.length).toBe(0);
    });

    test('should handle invalid date strings', () => {
      const dr = new DateRanges();
      dr.fromJSON([{ after: 'invalid date' }]);
      expect(dr.ranges.length).toBe(1);
      // Invalid dates should result in undefined
      expect(dr.ranges[0].after.epochMilliseconds).toBeLessThan(0); // INSTANT_MIN
    });
  });

  describe('toCompactString', () => {
    test('should correctly serialize a single range', () => {
      const dr = dateRanges('20250115-20250116');
      expect(dr.toCompactString()).toBe('20250115-20250116');
    });

    test('should correctly serialize a range with only an after date', () => {
      const dr = dateRanges('20250115-');
      expect(dr.toCompactString()).toBe('20250115-');
    });

    test('should correctly serialize a range with only a before date', () => {
      const dr = dateRanges('-20250116');
      expect(dr.toCompactString()).toBe('-20250116');
    });

    test('should correctly serialize multiple ranges', () => {
      const dr = dateRanges('202501-202502,2026');
      expect(dr.toCompactString()).toContain('20250101-20250228');
      expect(dr.toCompactString()).toContain('20260101-20261231');
    });

    test('should return an empty string for an empty DateRanges object', () => {
      const dr = dateRanges('');
      expect(dr.toCompactString()).toBe('');
    });
  });

  describe('init and clear', () => {
    test('should initialize with ranges', () => {
      const dr = new DateRanges();
      const ranges = dateList('2024-2025');
      dr.init(ranges);
      expect(dr.ranges.length).toBe(1);
    });

    test('should clear existing ranges on init', () => {
      const dr = dateRanges('2023');
      const ranges = dateList('2024-2025');
      dr.init(ranges);
      expect(dr.ranges.length).toBe(1);
    });

    test('should clear ranges with no arguments', () => {
      const dr = dateRanges('2023');
      dr.init();
      expect(dr.hasRanges()).toBe(false);
    });

    test('should clear ranges with clear()', () => {
      const dr = dateRanges('2023');
      dr.clear();
      expect(dr.hasRanges()).toBe(false);
    });
  });
});
