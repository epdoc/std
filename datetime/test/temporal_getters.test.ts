import { assertEquals } from '@std/assert';
import { DateTime } from '../src/mod.ts';

Deno.test('DateTime Temporal Getters', async (t) => {
  const zonedDateTime = Temporal.ZonedDateTime.from({
    year: 2026,
    month: 6,
    day: 6,
    hour: 12,
    minute: 30,
    second: 45,
    millisecond: 123,
    timeZone: 'America/Los_Angeles',
  });
  const instant = zonedDateTime.toInstant();

  await t.step('should return the correct year', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.year, 2026);
    assertEquals(dateExInstant.year, 2026);
  });

  await t.step('should return the correct month', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.month, 6);
    assertEquals(dateExInstant.month, 6);
  });

  await t.step('should return the correct day', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.day, 6);
    assertEquals(dateExInstant.day, 6);
  });

  await t.step('should return the correct hour', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.hour, 12);
    assertEquals(dateExInstant.hour, 19); // Instant converts to UTC, LA is UTC-7
  });

  await t.step('should return the correct minute', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.minute, 30);
    assertEquals(dateExInstant.minute, 30);
  });

  await t.step('should return the correct second', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.second, 45);
    assertEquals(dateExInstant.second, 45);
  });

  await t.step('should return the correct millisecond', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.millisecond, 123);
    assertEquals(dateExInstant.millisecond, 123);
  });

  await t.step('should return the correct monthCode', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.monthCode, 'M06');
    assertEquals(dateExInstant.monthCode, 'M06');
  });

  await t.step('should return the correct dayOfWeek', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.dayOfWeek, 6); // Saturday
    assertEquals(dateExInstant.dayOfWeek, 6); // Saturday
  });

  await t.step('should return the correct daysInMonth', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.daysInMonth, 30); // June has 30 days
    assertEquals(dateExInstant.daysInMonth, 30); // June has 30 days
  });

  await t.step('should return the correct daysInYear', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.daysInYear, 365); // 2026 is not a leap year
    assertEquals(dateExInstant.daysInYear, 365); // 2026 is not a leap year
  });

  await t.step('should return the correct inLeapYear', () => {
    const dateExZoned = DateTime.from(zonedDateTime);
    const dateExInstant = DateTime.from(instant);
    assertEquals(dateExZoned.inLeapYear, false);
    assertEquals(dateExInstant.inLeapYear, false);
  });
});
