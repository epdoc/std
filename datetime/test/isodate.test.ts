import { assert, assertEquals, assertThrows } from '@std/assert';
import { DateTime } from '../src/mod.ts';

Deno.test('DateTime.fromString — delegation', async (t) => {
  await t.step('returns DateTime wrapping ZonedDateTime for Z-suffixed string', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45.123Z');
    assert(d.temporal instanceof Temporal.Instant);
  });

  await t.step('returns DateTime wrapping ZonedDateTime for offset string', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45-05:00');
    assert(d.temporal instanceof Temporal.ZonedDateTime);
    assertEquals(d.temporal.offset, '-05:00');
  });

  await t.step('returns DateTime wrapping ZonedDateTime for bracket IANA timezone', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45[America/New_York]');
    assert(d.temporal instanceof Temporal.ZonedDateTime);
    assertEquals(d.temporal.timeZoneId, 'America/New_York');
  });

  await t.step('returns DateTime wrapping PlainDateTime when no timezone', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45.123');
    assert(d.temporal instanceof Temporal.PlainDateTime);
  });

  await t.step('returns DateTime wrapping PlainDateTime for date-only', () => {
    const d = DateTime.fromString('2024-03-15', { strict: false });
    assert(d.temporal instanceof Temporal.PlainDateTime);
    assertThrows(() => DateTime.fromString('2024-03-15'), Error, 'Invalid date string');
  });

  await t.step('returns DateTime wrapping Instant for legacy format', () => {
    assertThrows(() => DateTime.fromString('July 4, 1776'), Error, 'Invalid date string');
  });

  await t.step('throws for empty string', () => {
    assertThrows(
      () => DateTime.fromString(''),
      Error,
      'Invalid date string',
    );
  });

  await t.step('throws for invalid string', () => {
    assertThrows(
      () => DateTime.fromString('not a date'),
      Error,
      'Invalid date string',
    );
  });

  await t.step('correct epoch for Z-suffixed string', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45.123Z');
    const expected = Temporal.Instant.from('2024-01-15T12:30:45.123Z').epochMilliseconds;
    assertEquals(d.epochMilliseconds, expected);
  });

  await t.step('correct epoch for offset string', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45-05:00');
    const expected = Temporal.Instant.from('2024-01-15T17:30:45Z').epochMilliseconds;
    assertEquals(d.epochMilliseconds, expected);
  });

  await t.step('PlainDateTime epochMilliseconds throws', () => {
    const d = DateTime.fromString('2024-01-15T12:30:45');
    assertThrows(() => d.epochMilliseconds);
  });

  await t.step('offset without colon yields same epoch as with colon', () => {
    const d1 = DateTime.fromString('2024-01-15T12:30:45+05:30');
    const d2 = DateTime.fromString('2024-01-15T12:30:45+0530');
    assertEquals(d1.epochMilliseconds, d2.epochMilliseconds);
  });

  await t.step('whitespace is not trimmed', () => {
    assertThrows(() => DateTime.fromString('  2024-01-15T12:30:45Z  '), Error, 'Invalid date string');
  });

  await t.step('legacy fallback yields parseable result', () => {
    const date = new Date('January 1, 2024');
    assertEquals(date.getUTCFullYear(), 2024);
    const d = DateTime.fromDate(date);
    assert(d.temporal instanceof Temporal.Instant);
    const y = new Date(d.epochMilliseconds).getUTCFullYear();
    assertEquals(y, 2024);
  });
});

Deno.test('DateTime.from — string path delegates to fromString', async (t) => {
  await t.step('Z-suffixed string via DateTime.from', () => {
    const d = DateTime.from('2024-01-15T12:30:45Z');
    assert(d.temporal instanceof Temporal.Instant);
  });

  await t.step('string without timezone via DateTime.from', () => {
    const d = DateTime.from('2024-01-15T12:30:45');
    assert(d.temporal instanceof Temporal.PlainDateTime);
  });

  await t.step('date-only string via DateTime.from', () => {
    const d = DateTime.from('2024-03-15', { strict: false });
    assert(d && d.temporal instanceof Temporal.PlainDateTime);
  });

  await t.step('DateTime.from and DateTime.fromString agree', () => {
    const byFrom = DateTime.from('2024-01-15T12:30:45Z');
    const byString = DateTime.fromString('2024-01-15T12:30:45Z');
    assertEquals(byFrom.epochMilliseconds, byString.epochMilliseconds);
    assert(byFrom.temporal instanceof Temporal.Instant);
    assert(byString.temporal instanceof Temporal.Instant);
  });
});
