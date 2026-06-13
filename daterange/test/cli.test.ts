import { assert, assertEquals, assertThrows } from '@std/assert';
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

Deno.test('dateRangeOptionDefs', async (t) => {
  await t.step('contains all six keys', () => {
    assert(dateRangeOptionDefs.date);
    assert(dateRangeOptionDefs.range);
    assert(dateRangeOptionDefs.ranges);
    assert(dateRangeOptionDefs.since);
    assert(dateRangeOptionDefs.until);
    assert(dateRangeOptionDefs.window);
  });
});

Deno.test('dateOptionDef', async (t) => {
  const parse = dateOptionDef.argParser!;
  await t.step('parses YYYYMMDD to DateRanges', () => {
    assert(parse('20250115') instanceof DateRanges);
  });
  await t.step('parses comma-separated ranges', () => {
    const result = parse('2024,2025') as DateRanges;
    assertEquals(result.ranges.length, 2);
  });
  await t.step('parses relative 7d-now', () => {
    const result = parse('7d-now') as DateRanges;
    const diffMs = DateTime.now().epochMilliseconds - result.ranges[0].after.epochMilliseconds;
    assert(diffMs >= 7 * 86400000 - 5000);
    assert(diffMs <= 7 * 86400000 + 5000);
  });
});

Deno.test('rangeOptionDef', async (t) => {
  const parse = rangeOptionDef.argParser!;
  await t.step('parses single range to DateRange', () => {
    assert(parse('20250101-20250131') instanceof DateRange);
  });
  await t.step('throws for multiple ranges', () => {
    assertThrows(() => parse('2024,2025'));
  });
});

Deno.test('rangesOptionDef', async (t) => {
  const parse = rangesOptionDef.argParser!;
  await t.step('parses multiple ranges to DateRanges', () => {
    const result = parse('2024,2025') as DateRanges;
    assert(result instanceof DateRanges);
    assertEquals(result.ranges.length, 2);
  });
});

Deno.test('sinceOptionDef', async (t) => {
  const parse = sinceOptionDef.argParser!;
  await t.step('parses relative time to DateTime', () => {
    assert(parse('1d') instanceof DateTime);
  });
  await t.step('parses compact date to DateTime', () => {
    assert(parse('20250101') instanceof DateTime);
  });
  await t.step('parses ISO string to DateTime', () => {
    assert(parse('2025-01-01T00:00:00Z') instanceof DateTime);
  });
  await t.step('throws for invalid input', () => {
    assertThrows(() => parse('not-a-date'));
  });
});

Deno.test('untilOptionDef', async (t) => {
  const parse = untilOptionDef.argParser!;
  await t.step('has defVal of now', () => {
    assertEquals(untilOptionDef.defVal, 'now');
  });
  await t.step('parses now to DateTime', () => {
    assert(parse('now') instanceof DateTime);
  });
  await t.step('parses future relative time to DateTime', () => {
    assert(parse('-1h') instanceof DateTime);
  });
});

Deno.test('windowOptionDef', async (t) => {
  const parse = windowOptionDef.argParser!;
  await t.step('parses duration to DateRange ending near now', () => {
    const result = parse('24h') as DateRange;
    assert(result instanceof DateRange);
    assert(result.duration() >= 86400000 - 1000);
    assert(result.duration() <= 86400000 + 1000);
  });
  await t.step('throws for invalid duration', () => {
    assertThrows(() => parse('not-a-duration'));
  });
});

Deno.test('isDateRanges', async (t) => {
  await t.step('true for DateRanges', () => assert(isDateRanges(DateRanges.from([]))));
  await t.step('false for DateRange', () => assertEquals(isDateRanges(DateRange.from()), false));
  await t.step('false for string', () => assertEquals(isDateRanges('2025'), false));
});
