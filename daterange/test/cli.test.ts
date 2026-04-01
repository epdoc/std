import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { dateRangeOptions, isDateRangeOptionDef } from '../src/cli.ts';
import { DateRange, DateRanges } from '../src/mod.ts';

describe('dateRangeOptions', () => {
  describe('range', () => {
    test('should create option with default flags', () => {
      const opt = dateRangeOptions.range();
      expect(opt.name).toBe('date');
      expect(opt.short).toBe('d');
      expect(opt.params).toBe('[dates]');
      expect(opt.description).toContain('Date range');
      expect(typeof opt.argParser).toBe('function');
    });

    test('should create option with custom flags', () => {
      const opt = dateRangeOptions.range('-d, --date <date>');
      expect(opt.name).toBe('date');
      expect(opt.short).toBe('d');
      expect(opt.params).toBe('<date>');
    });

    test('should parse valid date range', () => {
      const opt = dateRangeOptions.range();
      const result = opt.argParser!('20250101-20250131') as DateRange;
      expect(result).toBeInstanceOf(DateRange);
    });

    test('should parse relative time range', () => {
      const opt = dateRangeOptions.range();
      const result = opt.argParser!('1d-now') as DateRange;
      expect(result).toBeInstanceOf(DateRange);
    });

    test('should throw for multiple ranges', () => {
      const opt = dateRangeOptions.range();
      expect(() => opt.argParser!('20250101-20250131,20250201-20250228')).toThrow();
    });
  });

  describe('ranges', () => {
    test('should create option with default flags', () => {
      const opt = dateRangeOptions.ranges();
      expect(opt.name).toBe('ranges');
      expect(opt.short).toBe('R');
      expect(opt.params).toBe('<ranges>');
    });

    test('should parse multiple ranges', () => {
      const opt = dateRangeOptions.ranges();
      const result = opt.argParser!('20250101-20250131,20250201-20250228') as DateRanges;
      expect(result).toBeInstanceOf(DateRanges);
      expect(result.ranges.length).toBe(2);
    });

    test('should parse single range', () => {
      const opt = dateRangeOptions.ranges();
      const result = opt.argParser!('1d-now') as DateRanges;
      expect(result).toBeInstanceOf(DateRanges);
      expect(result.ranges.length).toBe(1);
    });
  });

  describe('since', () => {
    test('should create option with default flags', () => {
      const opt = dateRangeOptions.since();
      expect(opt.name).toBe('since');
      expect(opt.short).toBe('s');
      expect(opt.params).toBe('<since>');
    });

    test('should parse relative time', () => {
      const opt = dateRangeOptions.since();
      const result = opt.argParser!('1d') as Temporal.Instant;
      expect(result).toBeInstanceOf(Temporal.Instant);
    });

    test('should parse ISO date', () => {
      const opt = dateRangeOptions.since();
      const result = opt.argParser!('2025-01-01T00:00:00Z') as Temporal.Instant;
      expect(result).toBeInstanceOf(Temporal.Instant);
      expect(result.toString()).toBe('2025-01-01T00:00:00Z');
    });

    test('should parse compact date', () => {
      const opt = dateRangeOptions.since();
      const result = opt.argParser!('20250101') as Temporal.Instant;
      expect(result).toBeInstanceOf(Temporal.Instant);
    });

    test('should throw for invalid date', () => {
      const opt = dateRangeOptions.since();
      expect(() => opt.argParser!('not-a-date')).toThrow();
    });
  });

  describe('until', () => {
    test('should create option with default flags', () => {
      const opt = dateRangeOptions.until();
      expect(opt.name).toBe('until');
      expect(opt.short).toBe('e');
      expect(opt.defVal).toBe('now');
    });

    test('should parse relative time', () => {
      const opt = dateRangeOptions.until();
      const result = opt.argParser!('-1h') as Temporal.Instant;
      expect(result).toBeInstanceOf(Temporal.Instant);
    });

    test('should parse "now" keyword', () => {
      const opt = dateRangeOptions.until();
      const result = opt.argParser!('now') as Temporal.Instant;
      expect(result).toBeInstanceOf(Temporal.Instant);
    });
  });

  describe('window', () => {
    test('should create option with default flags', () => {
      const opt = dateRangeOptions.window();
      expect(opt.name).toBe('window');
      expect(opt.short).toBe('w');
    });

    test('should parse time window', () => {
      const opt = dateRangeOptions.window();
      const result = opt.argParser!('24h') as DateRange;
      expect(result).toBeInstanceOf(DateRange);
    });

    test('should create range from now', () => {
      const opt = dateRangeOptions.window();
      const before = Temporal.Now.instant();
      const result = opt.argParser!('1h') as DateRange;
      const after = Temporal.Now.instant();

      // Range should be approximately 1 hour ago to now
      expect(result.after.epochMilliseconds).toBeLessThan(after.epochMilliseconds);
      expect(result.after.epochMilliseconds).toBeGreaterThan(before.epochMilliseconds - 3600000 - 1000);
      expect(result.before.epochMilliseconds).toBeLessThan(after.epochMilliseconds + 1000);
    });
  });

  describe('isDateRangeOptionDef', () => {
    test('should return true for valid option def', () => {
      const opt = dateRangeOptions.range();
      expect(isDateRangeOptionDef(opt)).toBe(true);
    });

    test('should return false for invalid object', () => {
      expect(isDateRangeOptionDef(null)).toBe(false);
      expect(isDateRangeOptionDef(undefined)).toBe(false);
      expect(isDateRangeOptionDef({})).toBe(false);
      expect(isDateRangeOptionDef({ name: 'test' })).toBe(false);
      expect(isDateRangeOptionDef({ description: 'test' })).toBe(false);
    });
  });

  describe('integration examples', () => {
    test('common use case: since + until', () => {
      // Simulate command: mycmd --since 1d --until now
      const sinceOpt = dateRangeOptions.since();
      const untilOpt = dateRangeOptions.until();

      const after = sinceOpt.argParser!('1d') as Temporal.Instant;
      const before = untilOpt.argParser!('now') as Temporal.Instant;

      const range = new DateRange(after, before);
      // Range should be approximately 24 hours
      const duration = range.duration();
      expect(duration).toBeGreaterThanOrEqual(86400000 - 5000);
      expect(duration).toBeLessThanOrEqual(86400000 + 5000);
    });

    test('common use case: window', () => {
      // Simulate command: mycmd --window 24h
      const windowOpt = dateRangeOptions.window();
      const range = windowOpt.argParser!('24h') as DateRange;

      // Range should end at approximately "now"
      const now = Temporal.Now.instant();
      const beforeDiff = Math.abs(now.epochMilliseconds - range.before.epochMilliseconds);
      expect(beforeDiff).toBeLessThanOrEqual(1000);

      // Duration should be approximately 24 hours
      expect(range.duration()).toBeGreaterThanOrEqual(86400000 - 1000);
      expect(range.duration()).toBeLessThanOrEqual(86400000 + 1000);
    });

    test('common use case: date range', () => {
      // Simulate command: mycmd --range 20250101-20250131
      const rangeOpt = dateRangeOptions.range();
      const range = rangeOpt.argParser!('20250101-20250131') as DateRange;

      expectInstant(range.after, { year: 2025, month: 1, day: 1 });
      expectInstant(range.before, { year: 2025, month: 1, day: 31 });
    });
  });
});

function expectInstant(
  instant: Temporal.Instant,
  expected: {
    year: number;
    month: number;
    day: number;
  },
) {
  const localTz = Temporal.Now.timeZoneId();
  const zdt = instant.toZonedDateTimeISO(localTz);
  expect(zdt.year).toBe(expected.year);
  expect(zdt.month).toBe(expected.month);
  expect(zdt.day).toBe(expected.day);
}
