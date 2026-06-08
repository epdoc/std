import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import {
  asTemporal,
  isTemporal,
  isTemporalInstant,
  isTemporalPlainDateTime,
  isTemporalZonedDateTime,
} from '../src/mod.ts';

describe('asTemporal', () => {
  it('Z-suffixed UTC string returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45.123Z');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('+00:00');
  });

  it('positive offset returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45+05:00');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('+05:00');
  });

  it('negative offset returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('-05:00');
  });

  it('offset without colon returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45+0530');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('+05:30');
  });

  it('negative offset without colon returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-0530');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('-05:30');
  });

  it('bracket IANA timezone returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45[America/New_York]');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).timeZoneId).toBe('America/New_York');
  });

  it('offset with bracket IANA timezone returns ZonedDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00[America/New_York]');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).timeZoneId).toBe('America/New_York');
    expect((val as Temporal.ZonedDateTime).offset).toBe('-05:00');
  });

  it('string without timezone returns PlainDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45.123');
    expect(val).toBeInstanceOf(Temporal.PlainDateTime);
  });

  it('date-only string without timezone returns PlainDateTime', () => {
    const val = asTemporal('2024-03-15');
    expect(val).toBeInstanceOf(Temporal.PlainDateTime);
  });

  it('date-time string without timezone returns PlainDateTime', () => {
    const val = asTemporal('2024-01-15T12:30:45');
    expect(val).toBeInstanceOf(Temporal.PlainDateTime);
  });

  it('whitespace around Z-suffixed string is trimmed', () => {
    const val = asTemporal('  2024-01-15T12:30:45Z  ');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((val as Temporal.ZonedDateTime).offset).toBe('+00:00');
  });

  it('whitespace around plain string is trimmed', () => {
    const val = asTemporal('  2024-01-15T12:30:45  ');
    expect(val).toBeInstanceOf(Temporal.PlainDateTime);
  });

  it('legacy Date format "Month Day, Year" returns Instant', () => {
    const val = asTemporal('July 4, 1776');
    expect(val).toBeInstanceOf(Temporal.Instant);
  });

  it('legacy Date format "Month Day Year" returns Instant', () => {
    const val = asTemporal('July 4 2024');
    expect(val).toBeInstanceOf(Temporal.Instant);
  });

  it('legacy Date format "Mon DD YYYY" returns Instant', () => {
    const val = asTemporal('Jan 15 2024');
    expect(val).toBeInstanceOf(Temporal.Instant);
  });

  it('empty string returns undefined', () => {
    expect(asTemporal('')).toBe(undefined);
  });

  it('truly invalid string returns undefined', () => {
    expect(asTemporal('not a date')).toBe(undefined);
  });

  it('invalid month value returns undefined', () => {
    expect(asTemporal('2024-13-01')).toBe(undefined);
  });

  it('garbage with trailing Z returns undefined', () => {
    expect(asTemporal('garbageZ')).toBe(undefined);
  });

  it('number returns Instant from epoch milliseconds', () => {
    const val = asTemporal(1705321845000);
    expect(val).toBeInstanceOf(Temporal.Instant);
    expect((val as Temporal.Instant).epochMilliseconds).toBe(1705321845000);
  });

  it('Date returns Instant', () => {
    const d = new Date('2024-01-15T12:30:45Z');
    const val = asTemporal(d);
    expect(val).toBeInstanceOf(Temporal.Instant);
    expect((val as Temporal.Instant).epochMilliseconds).toBe(d.getTime());
  });

  it('invalid Date returns undefined', () => {
    expect(asTemporal(new Date('invalid'))).toBe(undefined);
  });

  it('property bag returns PlainDateTime', () => {
    const val = asTemporal({ year: 2024, month: 1, day: 15, hour: 10, minute: 30 });
    expect(val).toBeInstanceOf(Temporal.PlainDateTime);
    expect((val as Temporal.PlainDateTime).year).toBe(2024);
    expect((val as Temporal.PlainDateTime).month).toBe(1);
    expect((val as Temporal.PlainDateTime).day).toBe(15);
    expect((val as Temporal.PlainDateTime).hour).toBe(10);
    expect((val as Temporal.PlainDateTime).minute).toBe(30);
  });

  it('already a Temporal.Instant returns as-is', () => {
    const original = Temporal.Instant.from('2024-01-15T12:30:45Z');
    expect(asTemporal(original)).toBe(original);
  });

  it('already a Temporal.ZonedDateTime returns as-is', () => {
    const original = Temporal.ZonedDateTime.from('2024-01-15T12:30:45-05:00[America/New_York]');
    expect(asTemporal(original)).toBe(original);
  });

  it('already a Temporal.PlainDateTime returns as-is', () => {
    const original = Temporal.PlainDateTime.from('2024-01-15T12:30:45');
    expect(asTemporal(original)).toBe(original);
  });

  it('null returns undefined', () => {
    expect(asTemporal(null)).toBe(undefined);
  });

  it('undefined returns undefined', () => {
    expect(asTemporal(undefined)).toBe(undefined);
  });

  it('boolean returns undefined', () => {
    expect(asTemporal(true)).toBe(undefined);
  });

  it('correct epoch for Z-suffixed string', () => {
    const val = asTemporal('2024-01-15T12:30:45.123Z');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    const expected = Temporal.Instant.from('2024-01-15T12:30:45.123Z').epochMilliseconds;
    expect((val as Temporal.ZonedDateTime).epochMilliseconds).toBe(expected);
  });

  it('correct epoch for offset string', () => {
    const val = asTemporal('2024-01-15T12:30:45-05:00');
    expect(val).toBeInstanceOf(Temporal.ZonedDateTime);
    const expected = Temporal.Instant.from('2024-01-15T17:30:45Z').epochMilliseconds;
    expect((val as Temporal.ZonedDateTime).epochMilliseconds).toBe(expected);
  });

  it('offset with colon and without colon yield same epoch', () => {
    const v1 = asTemporal('2024-01-15T12:30:45+05:30');
    const v2 = asTemporal('2024-01-15T12:30:45+0530');
    expect(v1).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(v2).toBeInstanceOf(Temporal.ZonedDateTime);
    expect((v1 as Temporal.ZonedDateTime).epochMilliseconds).toBe(
      (v2 as Temporal.ZonedDateTime).epochMilliseconds,
    );
  });
});

describe('isTemporal type guards', () => {
  const instant = Temporal.Instant.from('2024-01-15T12:30:45Z');
  const zdt = Temporal.ZonedDateTime.from('2024-01-15T12:30:45-05:00[America/New_York]');
  const pdt = Temporal.PlainDateTime.from('2024-01-15T12:30:45');

  it('isTemporalInstant', () => {
    expect(isTemporalInstant(instant)).toBe(true);
    expect(isTemporalInstant(zdt)).toBe(false);
    expect(isTemporalInstant(pdt)).toBe(false);
    expect(isTemporalInstant('string')).toBe(false);
  });

  it('isTemporalZonedDateTime', () => {
    expect(isTemporalZonedDateTime(zdt)).toBe(true);
    expect(isTemporalZonedDateTime(instant)).toBe(false);
    expect(isTemporalZonedDateTime(pdt)).toBe(false);
  });

  it('isTemporalPlainDateTime', () => {
    expect(isTemporalPlainDateTime(pdt)).toBe(true);
    expect(isTemporalPlainDateTime(instant)).toBe(false);
    expect(isTemporalPlainDateTime(zdt)).toBe(false);
  });

  it('isTemporal', () => {
    expect(isTemporal(instant)).toBe(true);
    expect(isTemporal(zdt)).toBe(true);
    expect(isTemporal(pdt)).toBe(true);
    expect(isTemporal('string')).toBe(false);
    expect(isTemporal(null)).toBe(false);
    expect(isTemporal(123)).toBe(false);
  });
});
