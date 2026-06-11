import { DateTime, type ISODateInstant } from '@epdoc/datetime';
import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
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
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
) {
  assert(dt instanceof DateTime);
  if (dt) {
    const zdt = dt.withTz('local').temporal as Temporal.ZonedDateTime;
    assertEquals(zdt.year, expected.year);
    assertEquals(zdt.month, expected.month);
    assertEquals(zdt.day, expected.day);
    assertEquals(zdt.hour, expected.hour ?? 0);
    assertEquals(zdt.minute, expected.minute ?? 0);
    assertEquals(zdt.second, expected.second ?? 0);
  }
}

Deno.test('daterange', async (t) => {
  await t.step('parseRelativeTime', async (t) => {
    await t.step('should parse single units', () => {
      const now = DateTime.now();
      const oneDay = parseRelativeTime('1d');
      assert(oneDay instanceof DateTime);
      const diffMs = now.epochMilliseconds - oneDay!.epochMilliseconds;
      assert(diffMs >= 86400000 - 1000);
      assert(diffMs <= 86400000 + 1000);
    });

    await t.step('should parse combined units', () => {
      const now = DateTime.now();
      const oneDayTwelveHours = parseRelativeTime('1d12h');
      assert(oneDayTwelveHours instanceof DateTime);
      const diffMs = now.epochMilliseconds - oneDayTwelveHours!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000;
      assert(diffMs >= expectedMs - 1000);
      assert(diffMs <= expectedMs + 1000);
    });

    await t.step('should parse negative (future) values', () => {
      const now = DateTime.now();
      const oneHourFuture = parseRelativeTime('-1h');
      assert(oneHourFuture instanceof DateTime);
      const diffMs = oneHourFuture!.epochMilliseconds - now.epochMilliseconds;
      assert(diffMs >= 3600000 - 1000);
      assert(diffMs <= 3600000 + 1000);
    });

    await t.step('should parse keywords', () => {
      const now = parseRelativeTime('now');
      assert(now instanceof DateTime);

      const today = parseRelativeTime('today');
      assert(today instanceof DateTime);
      const zdt = today!.withTz('local').temporal as Temporal.ZonedDateTime;
      assertEquals(zdt.hour, 0);
      assertEquals(zdt.minute, 0);
      assertEquals(zdt.second, 0);
    });
  });

  await t.step('dateStringToInstant', async (t) => {
    await t.step('YYYYMMDD', () => {
      const dt = dateStringToInstant('20241123');
      expectDateTime(dt, { year: 2024, month: 11, day: 23 });
    });

    await t.step('YYYYMMDDhhmm', () => {
      const dt = dateStringToInstant('202411231213');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 12, minute: 13 });
    });

    await t.step('YYYY', () => {
      const dt = dateStringToInstant('2025');
      expectDateTime(dt, { year: 2025, month: 1, day: 1 });
    });

    await t.step('YYYYMM', () => {
      const dt = dateStringToInstant('202503');
      expectDateTime(dt, { year: 2025, month: 3, day: 1 });
    });

    await t.step('YYYYMMDDhh', () => {
      const dt = dateStringToInstant('2024112310');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 10 });
    });

    await t.step('YYYYMMDDhhmmss', () => {
      const dt = dateStringToInstant('20241123103045');
      expectDateTime(dt, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
    });

    await t.step('Invalid date string length', () => {
      assertThrows(() => dateStringToInstant('202'), Error, 'Invalid date string length: 202');
    });

    await t.step('Invalid month value', () => {
      assertThrows(() => dateStringToInstant('20241301'), Error, 'Invalid month value: 13');
    });

    await t.step('Invalid day value', () => {
      assertThrows(() => dateStringToInstant('20240230'), Error, 'Invalid day value: 30 for month 2');
    });
  });

  await t.step('dateList', async (t) => {
    await t.step('YYYYMMDD-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('20241123-20241124');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23 });
      expectDateTime(d[0].before, { year: 2024, month: 11, day: 24, hour: 23, minute: 59, second: 59 });
    });

    await t.step('YYYYMMDDhh-YYYYMMDDhh', () => {
      const d: DateRangeDef[] = dateList('2024112312-2024112415');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23, hour: 12 });
      expectDateTime(d[0].before, { year: 2024, month: 11, day: 24, hour: 15 });
    });

    await t.step('YYYY (single year)', () => {
      const d: DateRangeDef[] = dateList('2025');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    await t.step('YYYYMM (single month)', () => {
      const d: DateRangeDef[] = dateList('202502');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 2, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
    });

    await t.step('YYYYMMDDhhmmss (single precise timestamp)', () => {
      const d: DateRangeDef[] = dateList('20241123103045');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2024, month: 11, day: 23, hour: 10, minute: 30, second: 45 });
      assertEquals(d[0].before?.epochMilliseconds, d[0].after?.epochMilliseconds);
    });

    await t.step('YYYY-YYYY range', () => {
      const d: DateRangeDef[] = dateList('2025-2026');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    await t.step('YYYYMM-YYYYMM range', () => {
      const d: DateRangeDef[] = dateList('202501-202503');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 3, day: 31, hour: 23, minute: 59, second: 59 });
    });

    await t.step('Mixed precision range: YYYYMMDDhh-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('2025011513-20250116');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 15, hour: 13 });
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 16, hour: 23, minute: 59, second: 59 });
    });

    await t.step('Open-ended range (after)', () => {
      const d: DateRangeDef[] = dateList('20250115-');
      assertEquals(d.length, 1);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 15 });
      assertEquals(d[0].before, undefined);
    });

    await t.step('Open-ended range (before)', () => {
      const d: DateRangeDef[] = dateList('-20250115');
      assertEquals(d.length, 1);
      assertEquals(d[0].after, undefined);
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 15, hour: 23, minute: 59, second: 59 });
    });

    await t.step('Comma-separated list of days', () => {
      const d: DateRangeDef[] = dateList('20250101,20250102');
      assertEquals(d.length, 2);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 1, day: 1, hour: 23, minute: 59, second: 59 });
      expectDateTime(d[1].after, { year: 2025, month: 1, day: 2 });
      expectDateTime(d[1].before, { year: 2025, month: 1, day: 2, hour: 23, minute: 59, second: 59 });
    });

    await t.step('Comma-separated list of ranges', () => {
      const d: DateRangeDef[] = dateList('202501-202502,2026');
      assertEquals(d.length, 2);
      expectDateTime(d[0].after, { year: 2025, month: 1, day: 1 });
      expectDateTime(d[0].before, { year: 2025, month: 2, day: 28, hour: 23, minute: 59, second: 59 });
      expectDateTime(d[1].after, { year: 2026, month: 1, day: 1 });
      expectDateTime(d[1].before, { year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 });
    });

    await t.step('Relative time: 1d-now', () => {
      const d: DateRangeDef[] = dateList('1d-now');
      assertEquals(d.length, 1);
      assert(d[0].after instanceof DateTime);
      assert(d[0].before instanceof DateTime);

      const now = DateTime.now();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      assert(diffMs >= 86400000 - 5000);
      assert(diffMs <= 86400000 + 5000);
    });

    await t.step('Relative time with combined units: 1d12h', () => {
      const d: DateRangeDef[] = dateList('1d12h', { inclusiveEnd: false });
      assertEquals(d.length, 1);

      const now = DateTime.now();
      const diffMs = now.epochMilliseconds - d[0].after!.epochMilliseconds;
      const expectedMs = 86400000 + 43200000;
      assert(diffMs >= expectedMs - 5000);
      assert(diffMs <= expectedMs + 5000);
    });
  });

  await t.step('dateRanges', async (t) => {
    await t.step('should return a DateRanges object', () => {
      const dr = dateRanges('2025');
      assert(dr instanceof DateRanges);
    });

    await t.step('should contain the correct ranges for a complex string', () => {
      const dr = dateRanges('202501-202502,2026');
      const ranges = dr.ranges;
      assert(ranges instanceof Array);
      assertEquals(ranges.length, 2);

      assert(ranges[0] instanceof DateRange);
      expectDateTime(ranges[0].after, { year: 2025, month: 1, day: 1 });

      assert(ranges[1] instanceof DateRange);
      expectDateTime(ranges[1].after, { year: 2026, month: 1, day: 1 });
    });

    await t.step('should handle empty string input', () => {
      const dr = dateRanges('');
      assert(dr instanceof DateRanges);
      assertEquals(dr.ranges.length, 0);
    });
  });

  await t.step('DateRanges', async (t) => {
    await t.step('constructor should accept single DateRangeDef', () => {
      const dt = dateStringToInstant('20250101');
      const def: DateRangeDef = { after: dt };
      const dr = DateRanges.fromDef(def);
      assertEquals(dr.ranges.length, 1);
      expectDateTime(dr.ranges[0].after, { year: 2025, month: 1, day: 1 });
    });

    await t.step('constructor should accept array of DateRangeDef', () => {
      const defs: DateRangeDef[] = [
        { after: dateStringToInstant('20250101') },
        { after: dateStringToInstant('20250201') },
      ];
      const dr = DateRanges.fromDef(defs);
      assertEquals(dr.ranges.length, 2);
    });

    await t.step('init should accept single DateRangeDef', () => {
      const dr = DateRanges.from('20250301');
      assertEquals(dr.ranges.length, 1);
      expectDateTime(dr.ranges[0].after, { year: 2025, month: 3, day: 1 });
    });

    await t.step('init should accept array of DateRangeDef', () => {
      const defs: DateRangeDef[] = [
        { after: dateStringToInstant('20250101') },
        { after: dateStringToInstant('20250201') },
      ];
      const dr = DateRanges.fromDef(defs);
      assertEquals(dr.ranges.length, 2);
    });

    await t.step('should be iterable with for...of', () => {
      const dr = dateRanges('20250101-20250115,20250201-20250215');
      const collected: DateRange[] = [];
      for (const range of dr) {
        collected.push(range);
      }
      assertEquals(collected.length, 2);
      assert(collected[0] instanceof DateRange);
      assert(collected[1] instanceof DateRange);
    });

    await t.step('should be iterable with spread operator', () => {
      const dr = dateRanges('20250101-20250115,20250201-20250215');
      const arr = [...dr];
      assertEquals(arr.length, 2);
      assert(arr[0] instanceof DateRange);
      assert(arr[1] instanceof DateRange);
    });

    await t.step('should be iterable with Array.from', () => {
      const dr = dateRanges('20250101-20250115');
      const arr = Array.from(dr);
      assertEquals(arr.length, 1);
      assert(arr[0] instanceof DateRange);
    });

    await t.step('contains should work with DateTime, Date, Temporal.Instant, and string', () => {
      const dr = dateRanges('20250101-20250131');

      const dt = DateTime.from('2025-01-15T12:00:00Z');
      assert(dr.contains(dt));

      const instant = Temporal.Instant.from('2025-01-15T12:00:00Z');
      assert(dr.contains(instant));

      const date = new Date('2025-01-15T12:00:00Z');
      assert(dr.contains(date));

      assert(dr.contains('2025-01-15T12:00:00Z'));
      assertEquals(dr.contains('2025-02-15T12:00:00Z'), false);
      assertEquals(dr.contains('2024-12-15T12:00:00Z'), false);
    });

    await t.step('merge should combine overlapping ranges', () => {
      const dr = DateRanges.from('20250101-20250115,20250110-20250131');
      assertEquals(dr.ranges.length, 2);
      const dr2 = dr.merge();
      assertEquals(dr2.ranges.length, 1);
    });

    await t.step('add should add new ranges', () => {
      const dr = DateRanges.from([]);
      const dr2 = dr.add({ after: DateTime.from('2025-01-01T00:00:00Z') });
      assertEquals(dr2.ranges.length, 1);
    });
  });

  await t.step('DateRange', async (t) => {
    await t.step('should create from DateTime values', () => {
      const after = DateTime.from('2025-01-01T00:00:00Z');
      const before = DateTime.from('2025-01-31T23:59:59Z');
      const range = DateRange.from(after, before);

      assertEquals(range.after, after);
      assertEquals(range.before, before);
    });

    await t.step('should create from relative strings', () => {
      const range = DateRange.fromRelative('1d', 'now');
      assert(range);
    });

    await t.step('contains should be inclusive', () => {
      const range = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-31T23:59:59Z'),
      );

      assert(range.contains('2025-01-01T00:00:00Z'));
      assert(range.contains('2025-01-31T23:59:59Z'));
      assert(range.contains('2025-01-15T12:00:00Z'));
    });

    await t.step('overlaps should detect overlapping ranges', () => {
      const r1 = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-15T00:00:00Z'),
      );
      const r2 = DateRange.from(
        DateTime.from('2025-01-10T00:00:00Z'),
        DateTime.from('2025-01-20T00:00:00Z'),
      );
      assert(r1.overlaps(r2));
    });

    await t.step('intersect should return overlapping portion', () => {
      const r1 = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-15T00:00:00Z'),
      );
      const r2 = DateRange.from(
        DateTime.from('2025-01-10T00:00:00Z'),
        DateTime.from('2025-01-20T00:00:00Z'),
      );

      const intersection = r1.intersect(r2);
      assert(intersection instanceof DateRange);
      assert(/^2025-01-10T00:00:00(Z|\+00:00)$/.test(intersection!.after.toISOString()));
      assert(/^2025-01-15T00:00:00(Z|\+00:00)$/.test(intersection!.before.toISOString()));
    });

    await t.step('duration should return milliseconds', () => {
      const range = DateRange.from(
        DateTime.from('2025-01-01T00:00:00Z'),
        DateTime.from('2025-01-02T00:00:00Z'),
      );
      assertEquals(range.duration(), 86400000);
    });

    await t.step('after/before should be DateTime', () => {
      const after = DateTime.from('2025-01-01T00:00:00Z');
      const before = DateTime.from('2025-01-31T23:59:59Z');
      const range = DateRange.from(after, before);

      assert(range.after instanceof DateTime);
      assert(range.before instanceof DateTime);
    });

    await t.step('default after/before should be min/max', () => {
      const range = DateRange.from(undefined, undefined);
      console.log(range);
      assert(range.after.isNearMin());
      assert(range.before.isNearMax());
    });
  });

  await t.step('toJSON', async (t) => {
    await t.step('should correctly serialize a single range', () => {
      const dr = dateRanges('20250115-20250116');
      const json = dr.toJSON();
      assertEquals(json.length, 1);
      assert(json[0].after);
      assert(json[0].before);
      assert(/^\d{4}-\d{2}-\d{2}T/.test(json[0].after));
      assert(/^\d{4}-\d{2}-\d{2}T/.test(json[0].before));
    });

    await t.step('should correctly serialize a range with only an after date', () => {
      const dr = DateRanges.fromCliString('20250115-');
      const json = dr.toJSON();
      assert(json[0].after);
      assertEquals(json[0].before, undefined);
      assert(/^\d{4}-\d{2}-\d{2}T/.test(json[0].after));
    });

    await t.step('should correctly serialize a range with only a before date', () => {
      const dr = DateRanges.fromCliString('-20250116');
      const json = dr.toJSON();
      assertEquals(json[0].after, undefined);
      assert(json[0].before);
      assert(/^\d{4}-\d{2}-\d{2}T/.test(json[0].before));
    });

    await t.step('should correctly serialize multiple ranges', () => {
      const dr = DateRanges.fromCliString('202501-202502,2026');
      const json = dr.toJSON();
      assertEquals(json.length, 2);
    });

    await t.step('should return an empty array for an empty DateRanges object', () => {
      const dr = DateRanges.fromCliString('');
      const json = dr.toJSON();
      assertEquals(json, []);
    });
  });

  await t.step('fromJSON', async (t) => {
    await t.step('should correctly deserialize a single range', () => {
      const s = '20250115-20250116';
      const dr1 = DateRanges.fromCliString(s);
      const json = dr1.toJSON();
      const dr2 = DateRanges.fromJSON(json);
      assert(dr2 instanceof DateRanges);
      assertEquals(dr2!.toCompactString(), dr1.toCompactString());
    });

    await t.step('should correctly deserialize multiple ranges', () => {
      const s = '202501-202502,2026';
      const dr1 = DateRanges.from(s);
      const json = dr1.toJSON();
      const dr2 = DateRanges.fromJSON(json);
      assert(dr2 instanceof DateRanges);
      assertEquals(dr2!.toCompactString(), dr1.toCompactString());
    });

    await t.step('should handle an empty array', () => {
      const dr = DateRanges.fromJSON([]);
      assert(dr);
      assertEquals(dr.ranges.length, 0);
    });

    await t.step('should handle invalid date strings gracefully', () => {
      const dr = DateRanges.fromJSON([{ after: 'invalid date' as unknown as ISODateInstant }]);
      assert(dr);
      assertEquals(dr.ranges.length, 0);
    });
  });

  await t.step('toCompactString', async (t) => {
    await t.step('should correctly serialize a single range', () => {
      const dr = DateRanges.from('20250115-20250116');
      assertEquals(dr.toCompactString(), '20250115-20250116');
    });

    await t.step('should correctly serialize a range with only an after date', () => {
      const dr = DateRanges.from('20250115-');
      assertEquals(dr.toCompactString(), '20250115-');
    });

    await t.step('should correctly serialize a range with only a before date', () => {
      const dr = DateRanges.from('-20250116');
      assertEquals(dr.toCompactString(), '-20250116');
    });

    await t.step('should correctly serialize multiple ranges', () => {
      const dr = DateRanges.from('202501-202502,2026');
      assertStringIncludes(dr.toCompactString(), '20250101-20250228');
      assertStringIncludes(dr.toCompactString(), '20260101-20261231');
    });

    await t.step('should return an empty string for an empty DateRanges object', () => {
      const dr = DateRanges.from('');
      assertEquals(dr.toCompactString(), '');
    });
  });

  await t.step('init and clear', async (t) => {
    await t.step('should initialize with ranges', () => {
      const dr = DateRanges.from(dateList('2024-2025'));
      assertEquals(dr.ranges.length, 1);
    });

    await t.step('should not merge ranges', () => {
      const dr0 = DateRanges.from('202301-202311');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      assertEquals(dr2.ranges.length, 2);
      assertEquals(dr3.ranges.length, 2);
    });
    await t.step('should merge ranges', () => {
      const dr0 = DateRanges.from('2023-202401');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      assertEquals(dr2.ranges.length, 2);
      assertEquals(dr3.ranges.length, 1);
    });
    await t.step('should merge ranges', () => {
      const dr0 = DateRanges.from('2023');
      const dr1 = DateRanges.from('2024-2025');
      const dr2 = dr0.add(dr1);
      const dr3 = dr2.merge();
      assertEquals(dr2.ranges.length, 2);
      assertEquals(dr3.ranges.length, 1);
      console.log(dr3.toCompactString());
    });
  });
});
