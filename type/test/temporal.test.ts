import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import {
  asTemporal,
  isTemporal,
  isTemporalInstant,
  isTemporalPlainDateTime,
  isTemporalZonedDateTime,
} from '../src/mod.ts';

Deno.test('asTemporal', async (t) => {
  await t.step('Z-suffixed UTC string returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45.123Z');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).offset, '+00:00');
  });

  await t.step('positive offset returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45+05:00');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).offset, '+05:00');
  });

  await t.step('negative offset returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).offset, '-05:00');
  });

  await t.step('offset without colon returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45+0530');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).offset, '+05:30');
  });

  await t.step('negative offset without colon returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-0530');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).offset, '-05:30');
  });

  await t.step('bracket IANA timezone returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45[America/New_York]');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).timeZoneId, 'America/New_York');
  });

  await t.step('offset with bracket IANA timezone returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00[America/New_York]');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    assertEquals((val as Temporal.ZonedDateTime).timeZoneId, 'America/New_York');
    assertEquals((val as Temporal.ZonedDateTime).offset, '-05:00');
  });

  await t.step('string without timezone returns PlainDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45.123');
    assertInstanceOf(val, Temporal.PlainDateTime);
  });

  await t.step('date-only string without timezone returns undefined', () => {
    assertEquals(asTemporal('2024-03-15'), undefined);
  });

  await t.step('date-time string without timezone returns PlainDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45');
    assertInstanceOf(val, Temporal.PlainDateTime);
  });

  await t.step('whitespace around Z-suffixed string returns undefined', () => {
    assertEquals(asTemporal('  2024-01-15T12:30:45Z  '), undefined);
  });

  await t.step('whitespace around plain string returns undefined', () => {
    assertEquals(asTemporal('  2024-01-15T12:30:45  '), undefined);
  });

  await t.step('legacy Date format "Month Day, Year" returns undefined', () => {
    assertEquals(asTemporal('July 4, 1776'), undefined);
  });

  await t.step('legacy Date format "Month Day Year" returns undefined', () => {
    assertEquals(asTemporal('July 4 2024'), undefined);
  });

  await t.step('legacy Date format "Mon DD YYYY" returns undefined', () => {
    assertEquals(asTemporal('Jan 15 2024'), undefined);
  });

  await t.step('empty string returns undefined', () => {
    assertEquals(asTemporal(''), undefined);
  });

  await t.step('truly invalid string returns undefined', () => {
    assertEquals(asTemporal('not a date'), undefined);
  });

  await t.step('invalid month value returns undefined', () => {
    assertEquals(asTemporal('2024-13-01'), undefined);
  });

  await t.step('garbage with trailing Z returns undefined', () => {
    assertEquals(asTemporal('garbageZ'), undefined);
  });

  await t.step('number returns Instant from epoch milliseconds', () => {
    const val = asTemporal(1705321845000);
    assertInstanceOf(val, Temporal.Instant);
    assertEquals((val as Temporal.Instant).epochMilliseconds, 1705321845000);
  });

  await t.step('Date returns Instant', () => {
    const d = new Date('2024-01-15T12:30:45Z');
    const val = asTemporal(d);
    assertInstanceOf(val, Temporal.Instant);
    assertEquals((val as Temporal.Instant).epochMilliseconds, d.getTime());
  });

  await t.step('invalid Date returns undefined', () => {
    assertEquals(asTemporal(new Date('invalid')), undefined);
  });

  await t.step('property bag returns PlainDateTime', () => {
    const val = asTemporal({ year: 2024, month: 1, day: 15, hour: 10, minute: 30 });
    assertInstanceOf(val, Temporal.PlainDateTime);
    assertEquals((val as Temporal.PlainDateTime).year, 2024);
    assertEquals((val as Temporal.PlainDateTime).month, 1);
    assertEquals((val as Temporal.PlainDateTime).day, 15);
    assertEquals((val as Temporal.PlainDateTime).hour, 10);
    assertEquals((val as Temporal.PlainDateTime).minute, 30);
  });

  await t.step('already a Temporal.Instant returns as-is', () => {
    const original = Temporal.Instant.from('2024-01-15T12:30:45Z');
    assertEquals(asTemporal(original), original);
  });

  await t.step('already a Temporal.ZonedDateTime returns as-is', () => {
    const original = Temporal.ZonedDateTime.from('2024-01-15T12:30:45-05:00[America/New_York]');
    assertEquals(asTemporal(original), original);
  });

  await t.step('already a Temporal.PlainDateTime returns as-is', () => {
    const original = Temporal.PlainDateTime.from('2024-01-15T12:30:45');
    assertEquals(asTemporal(original), original);
  });

  await t.step('null returns undefined', () => {
    assertEquals(asTemporal(null), undefined);
  });

  await t.step('undefined returns undefined', () => {
    assertEquals(asTemporal(undefined), undefined);
  });

  await t.step('boolean returns undefined', () => {
    assertEquals(asTemporal(true), undefined);
  });

  await t.step('correct epoch for Z-suffixed string', () => {
    const val = asTemporal('2024-01-15T12:30:45.123Z');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    const expected = Temporal.Instant.from('2024-01-15T12:30:45.123Z').epochMilliseconds;
    assertEquals((val as Temporal.ZonedDateTime).epochMilliseconds, expected);
  });

  await t.step('correct epoch for offset string', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00');
    assertInstanceOf(val, Temporal.ZonedDateTime);
    const expected = Temporal.Instant.from('2024-01-15T17:30:45Z').epochMilliseconds;
    assertEquals((val as Temporal.ZonedDateTime).epochMilliseconds, expected);
  });

  await t.step('offset with colon and without colon yield same epoch', () => {
    const v1 = asTemporal('2024-01-15T12:30:45+05:30');
    const v2 = asTemporal('2024-01-15T12:30:45+0530');
    assertInstanceOf(v1, Temporal.ZonedDateTime);
    assertInstanceOf(v2, Temporal.ZonedDateTime);
    assertEquals((v1 as Temporal.ZonedDateTime).epochMilliseconds, (v2 as Temporal.ZonedDateTime).epochMilliseconds);
  });
});

Deno.test('isTemporal type guards', async (t) => {
  const instant = Temporal.Instant.from('2024-01-15T12:30:45Z');
  const zdt = Temporal.ZonedDateTime.from('2024-01-15T12:30:45-05:00[America/New_York]');
  const pdt = Temporal.PlainDateTime.from('2024-01-15T12:30:45');

  await t.step('isTemporalInstant', () => {
    assert(isTemporalInstant(instant));
    assertEquals(isTemporalInstant(zdt), false);
    assertEquals(isTemporalInstant(pdt), false);
    assertEquals(isTemporalInstant('string'), false);
  });

  await t.step('isTemporalZonedDateTime', () => {
    assert(isTemporalZonedDateTime(zdt));
    assertEquals(isTemporalZonedDateTime(instant), false);
    assertEquals(isTemporalZonedDateTime(pdt), false);
  });

  await t.step('isTemporalPlainDateTime', () => {
    assert(isTemporalPlainDateTime(pdt));
    assertEquals(isTemporalPlainDateTime(instant), false);
    assertEquals(isTemporalPlainDateTime(zdt), false);
  });

  await t.step('isTemporal', () => {
    assert(isTemporal(instant));
    assert(isTemporal(zdt));
    assert(isTemporal(pdt));
    assertEquals(isTemporal('string'), false);
    assertEquals(isTemporal(null), false);
    assertEquals(isTemporal(123), false);
  });
});
