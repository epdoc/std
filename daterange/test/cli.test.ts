import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { DateTime } from '@epdoc/datetime';
import {
  dateOptionDef,
  dateRangeOptionDefs,
  isDateRanges,
  rangeOptionDef,
  rangesOptionDef,
  sinceOptionDef,
  untilOptionDef,
  windowOptionDef,
} from '../src/cli.ts';
import { DateRange, DateRanges } from '../src/mod.ts';

describe('dateRangeOptionDefs', () => {
  test('contains all six keys', () => {
    expect(dateRangeOptionDefs.date).toBeDefined();
    expect(dateRangeOptionDefs.range).toBeDefined();
    expect(dateRangeOptionDefs.ranges).toBeDefined();
    expect(dateRangeOptionDefs.since).toBeDefined();
    expect(dateRangeOptionDefs.until).toBeDefined();
    expect(dateRangeOptionDefs.window).toBeDefined();
  });
});

describe('dateOptionDef', () => {
  const parse = dateOptionDef.argParser!;
  test('parses YYYYMMDD to DateRanges', () => {
    expect(parse('20250115')).toBeInstanceOf(DateRanges);
  });
  test('parses comma-separated ranges', () => {
    const result = parse('2024,2025') as DateRanges;
    expect(result.ranges.length).toBe(2);
  });
  test('parses relative 7d-now', () => {
    const result = parse('7d-now') as DateRanges;
    const diffMs = DateTime.now().epochMilliseconds - result.ranges[0].after.epochMilliseconds;
    expect(diffMs).toBeGreaterThanOrEqual(7 * 86400000 - 5000);
    expect(diffMs).toBeLessThanOrEqual(7 * 86400000 + 5000);
  });
});

describe('rangeOptionDef', () => {
  const parse = rangeOptionDef.argParser!;
  test('parses single range to DateRange', () => {
    expect(parse('20250101-20250131')).toBeInstanceOf(DateRange);
  });
  test('throws for multiple ranges', () => {
    expect(() => parse('2024,2025')).toThrow();
  });
});

describe('rangesOptionDef', () => {
  const parse = rangesOptionDef.argParser!;
  test('parses multiple ranges to DateRanges', () => {
    const result = parse('2024,2025') as DateRanges;
    expect(result).toBeInstanceOf(DateRanges);
    expect(result.ranges.length).toBe(2);
  });
});

describe('sinceOptionDef', () => {
  const parse = sinceOptionDef.argParser!;
  test('parses relative time to DateTime', () => {
    expect(parse('1d')).toBeInstanceOf(DateTime);
  });
  test('parses compact date to DateTime', () => {
    expect(parse('20250101')).toBeInstanceOf(DateTime);
  });
  test('parses ISO string to DateTime', () => {
    expect(parse('2025-01-01T00:00:00Z')).toBeInstanceOf(DateTime);
  });
  test('throws for invalid input', () => {
    expect(() => parse('not-a-date')).toThrow();
  });
});

describe('untilOptionDef', () => {
  const parse = untilOptionDef.argParser!;
  test('has defVal of now', () => {
    expect(untilOptionDef.defVal).toBe('now');
  });
  test('parses now to DateTime', () => {
    expect(parse('now')).toBeInstanceOf(DateTime);
  });
  test('parses future relative time to DateTime', () => {
    expect(parse('-1h')).toBeInstanceOf(DateTime);
  });
});

describe('windowOptionDef', () => {
  const parse = windowOptionDef.argParser!;
  test('parses duration to DateRange ending near now', () => {
    const result = parse('24h') as DateRange;
    expect(result).toBeInstanceOf(DateRange);
    expect(result.duration()).toBeGreaterThanOrEqual(86400000 - 1000);
    expect(result.duration()).toBeLessThanOrEqual(86400000 + 1000);
  });
  test('throws for invalid duration', () => {
    expect(() => parse('not-a-duration')).toThrow();
  });
});

describe('isDateRanges', () => {
  test('true for DateRanges', () => expect(isDateRanges(new DateRanges())).toBe(true));
  test('false for DateRange', () => expect(isDateRanges(new DateRange())).toBe(false));
  test('false for string', () => expect(isDateRanges('2025')).toBe(false));
});
