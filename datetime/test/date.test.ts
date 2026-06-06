import { assert, assertAlmostEquals, assertEquals, assertExists, assertMatch, assertThrows } from '@std/assert';
import { DateTime, type IANATZ, type ISOTZ, type TzMinutes, util } from '../src/mod.ts';

Deno.test('date-util', async (t) => {
  Deno.env.set('TZ', 'America/Costa_Rica');

  await t.step('tz statics', async (t) => {
    await t.step('parse', () => {
      assertEquals(util.parseISOTZ('-06:00' as ISOTZ), 360);
      assertEquals(util.parseISOTZ('+06:00' as ISOTZ), -360);
      assertEquals(util.parseISOTZ('-02:30' as ISOTZ), 150);
      assertEquals(util.parseISOTZ('+01:00' as ISOTZ), -60);
      assertEquals(util.parseISOTZ('+00:00' as ISOTZ), 0);
      assertEquals(util.parseISOTZ('-00:00' as ISOTZ), 0);
      assertEquals(util.parseISOTZ('Z' as ISOTZ), 0);
    });

    await t.step('format', () => {
      assertEquals(util.formatTzAsISOTZ(-360 as TzMinutes), '+06:00');
      assertEquals(util.formatTzAsISOTZ(360 as TzMinutes), '-06:00');
      assertEquals(util.formatTzAsISOTZ(-390 as TzMinutes), '+06:30');
      assertEquals(util.formatTzAsISOTZ(150 as TzMinutes), '-02:30');
      assertEquals(util.formatTzAsISOTZ(0 as TzMinutes), 'Z');
    });
  });

  await t.step('tz offset', async (t) => {
    await t.step('120', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      assertEquals(Deno.env.get('TZ'), 'America/Costa_Rica');
      const tz = new Date().getTimezoneOffset();
      assertEquals(tz, 360);
    });

    await t.step('-02:00', () => {
      const tz = util.formatTzAsISOTZ(120 as TzMinutes);
      assertEquals(tz, '-02:00');
    });

    await t.step('360', () => {
      const tz = util.formatTzAsISOTZ(360 as TzMinutes);
      assertEquals(tz, '-06:00');
    });

    await t.step('-360', () => {
      const tz = util.formatTzAsISOTZ(-360 as TzMinutes);
      assertEquals(tz, '+06:00');
    });
  });

  await t.step('tz set deprecated offset', async (t) => {
    await t.step('should set and get timezone offsets', () => {
      const d = DateTime.from();
      d.setTz(-300 as TzMinutes);
      assertEquals(d.getTzOffset(), -300);
      d.setTz('-05:00' as ISOTZ);
      assertEquals(d.getTzOffset(), -300);
    });
  });

  await t.step('tz deprecated half-hour offsets', async (t) => {
    await t.step('should handle Newfoundland (America/St_Johns) UTC-3:30', () => {
      const d = DateTime.from('2024-01-15T12:00:00Z');
      d.setTz('America/St_Johns' as IANATZ);
      assertEquals(d.getTzOffset(), -210);
      assertEquals(d.getTzString(), '-03:30');
    });

    await t.step('should handle Adelaide (Australia/Adelaide) with half-hour offset', () => {
      const d = DateTime.from('2024-06-15T12:00:00Z');
      d.setTz('Australia/Adelaide' as IANATZ);
      assertEquals(d.getTzOffset(), 570);
      assertEquals(d.getTzString(), '+09:30');
    });
  });

  await t.step('withTz', async (t) => {
    await t.step('local', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      const d = DateTime.fromComponents(2024, 1, 1, 11, 59, 59, 456).withTz();
      assertEquals(d.toISOLocalString(), '2024-01-01T11:59:59.456-06:00');
    });
  });

  await t.step('toISOLocaleString', async (t) => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    Deno.env.set('TZ', 'America/Chicago');

    await t.step('default', () => {
      assertEquals(d.getTimezoneOffset(), 360);
      assertEquals(d.toISOString(), '1997-11-25T12:13:14.456Z');
      assertEquals(DateTime.fromDate(d).toISOLocalString(), '1997-11-25T06:13:14.456-06:00');
    });

    await t.step('show milliseconds', () => {
      assertEquals(DateTime.fromDate(d).toISOLocalString(true), '1997-11-25T06:13:14.456-06:00');
    });

    await t.step('hide milliseconds', () => {
      assertEquals(DateTime.fromDate(d).toISOLocalString(false), '1997-11-25T06:13:14-06:00');
    });
  });

  await t.step('toISOLocaleString tz -06:00', async (t) => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = DateTime.fromDate(d).setTz('-06:00' as ISOTZ);

    await t.step('default', () => {
      assertEquals(d.toISOString(), '1997-11-25T12:13:14.456Z');
      assertEquals(du.toISOLocalString(), '1997-11-25T06:13:14.456-06:00');
    });

    await t.step('show milliseconds', () => {
      assertEquals(du.toISOLocalString(true), '1997-11-25T06:13:14.456-06:00');
    });

    await t.step('hide milliseconds', () => {
      assertEquals(du.toISOLocalString(false), '1997-11-25T06:13:14-06:00');
    });
  });

  await t.step('toISOLocaleString tz 0', async (t) => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = DateTime.fromDate(d).setTz(0 as TzMinutes);

    await t.step('default', () => {
      assertEquals(d.toISOString(), '1997-11-25T12:13:14.456Z');
      assertEquals(du.toISOLocalString(), '1997-11-25T12:13:14.456+00:00');
    });

    await t.step('show milliseconds', () => {
      assertEquals(du.toISOLocalString(true), '1997-11-25T12:13:14.456+00:00');
    });

    await t.step('hide milliseconds', () => {
      assertEquals(du.toISOLocalString(false), '1997-11-25T12:13:14+00:00');
    });
  });

  await t.step('formatLocale', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    assertEquals(DateTime.fromDate(d).format('yyyy-MM-dd'), '1997-11-25');
    assertEquals(DateTime.fromDate(d).format('yyyyMMdd'), '19971125');
    assertEquals(DateTime.fromDate(d).format('yyyyMMdd_HHmmss'), '19971125_061314');
    assertEquals(DateTime.fromDate(d).formatUTC('yyyyMMdd_HHmmss'), '19971125_121314');
  });

  await t.step('format with month names', async (t) => {
    const d = new Date('2024-01-15T12:30:45.123Z');

    await t.step('MMMM (full month name)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('MMMM yyyy'), 'January 2024');
    });

    await t.step('MMM (abbreviated month name)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('MMM dd, yyyy'), 'Jan 15, 2024');
    });

    await t.step('MM (zero-padded month number)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('yyyy-MM-dd'), '2024-01-15');
    });

    await t.step('M (month number without padding)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('M/dd/yyyy'), '1/15/2024');
    });

    await t.step('combined format', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('dd MMM yyyy HH:mm:ss'), '15 Jan 2024 12:30:45');
    });

    await t.step('full format with milliseconds', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('MMMM dd, yyyy HH:mm:ss.SSS'), 'January 15, 2024 12:30:45.123');
    });

    await t.step('December test', () => {
      const dDec = new Date('2024-12-25T00:00:00Z');
      assertEquals(DateTime.fromDate(dDec).formatUTC('MMMM dd, yyyy'), 'December 25, 2024');
      assertEquals(DateTime.fromDate(dDec).formatUTC('MMM dd'), 'Dec 25');
    });
  });

  await t.step('format with unpadded day and hour', async (t) => {
    await t.step('d (day without padding)', () => {
      const d1 = new Date('2024-01-05T00:00:00Z');
      assertEquals(DateTime.fromDate(d1).formatUTC('M/d/yyyy'), '1/5/2024');
      const d15 = new Date('2024-01-15T00:00:00Z');
      assertEquals(DateTime.fromDate(d15).formatUTC('M/d/yyyy'), '1/15/2024');
    });

    await t.step('dd (day with padding)', () => {
      const d = new Date('2024-01-05T00:00:00Z');
      assertEquals(DateTime.fromDate(d).formatUTC('MM/dd/yyyy'), '01/05/2024');
    });

    await t.step('H (hour without padding)', () => {
      const d1 = new Date('2024-01-15T03:30:45Z');
      assertEquals(DateTime.fromDate(d1).formatUTC('H:mm:ss'), '3:30:45');
      const d12 = new Date('2024-01-15T12:30:45Z');
      assertEquals(DateTime.fromDate(d12).formatUTC('H:mm:ss'), '12:30:45');
      const d0 = new Date('2024-01-15T00:30:45Z');
      assertEquals(DateTime.fromDate(d0).formatUTC('H:mm:ss'), '0:30:45');
    });

    await t.step('HH (hour with padding)', () => {
      const d = new Date('2024-01-15T03:30:45Z');
      assertEquals(DateTime.fromDate(d).formatUTC('HH:mm:ss'), '03:30:45');
    });

    await t.step('combined d and H', () => {
      const d = new Date('2024-01-05T03:30:45Z');
      assertEquals(DateTime.fromDate(d).formatUTC('M/d/yyyy H:mm:ss'), '1/5/2024 3:30:45');
    });
  });

  await t.step('format with weekday names', async (t) => {
    const d = new Date('2024-01-15T12:30:45.123Z');

    await t.step('EEEE (full weekday name)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('EEEE, MMMM dd, yyyy'), 'Monday, January 15, 2024');
    });

    await t.step('EEE (abbreviated weekday name)', () => {
      assertEquals(DateTime.fromDate(d).formatUTC('EEE, MMM dd, yyyy'), 'Mon, Jan 15, 2024');
    });

    await t.step('EE (short weekday name)', () => {
      const d2 = DateTime.fromString('2024-01-15T12:30:45.123Z');
      const s = d2.formatUTC('EE, M/dd/yyyy');
      assertEquals(s, 'M, 1/15/2024');
    });
  });

  await t.step('julianDate', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    assertAlmostEquals(DateTime.fromDate(d).julianDate(), 2450778.0091950926);
    const d1 = new Date('2024-12-30T12:00:00Z');
    assertEquals(DateTime.fromDate(d1).julianDate(), 2460675);
  });

  await t.step('googleSheetsDate', async (t) => {
    await t.step('should convert a UTC date to a Google Sheets serial number', () => {
      const d = new Date('2024-01-01T12:00:00Z');
      const serial = DateTime.fromDate(d).googleSheetsDate();
      assertEquals(serial, 45292.25);
    });

    await t.step('should convert a date with timezone offset to the correct serial number', () => {
      const d = DateTime.fromString('2024-01-01T12:00:00-06:00');
      const serial = d.toGoogleSheetsDate();
      assertEquals(serial, 45292.5);
    });

    await t.step('should produce the correct serial number for a specific timezone', () => {
      const d = DateTime.fromString('2024-01-01T12:00:00Z');
      d.setTz('America/New_York' as IANATZ);
      const serial = d.toGoogleSheetsDate();
      assertAlmostEquals(serial, 45292.291666666664);
    });
  });

  await t.step('fromGoogleSheetsDate', async (t) => {
    await t.step('should convert a Google Sheets serial number to a UTC date', () => {
      const serial = util.asGoogleSheetsDate(45291.5);
      const d = DateTime.fromGoogleSheetsDate(serial, 'Europe/London' as IANATZ);
      assertExists(d);
      assertEquals(d.date.toISOString(), '2023-12-31T12:00:00.000Z');
    });

    await t.step('should return a Date object that can be formatted to a local time string', () => {
      const serial = util.asGoogleSheetsDate(45292.75);
      const d = DateTime.fromGoogleSheetsDate(serial, 'America/Costa_Rica' as IANATZ);
      assertExists(d);
      assertEquals(d.date.toISOString(), '2024-01-02T00:00:00.000Z');
      d.setTz('-06:00' as ISOTZ);
      assertEquals(d.toISOLocalString(false), '2024-01-01T18:00:00-06:00');
    });
  });

  await t.step('ianaTzParse', async (t) => {
    await t.step('should parse America/New_York EDT', () => {
      const d = DateTime.fromString('2026-01-15T12:00:00Z');
      const offset0 = d.getTzOffsetForIANA('America/New_York' as IANATZ);
      assertExists(offset0);
      assertEquals(offset0, -300);
    });

    await t.step('should parse America/New_York EST', () => {
      const d = DateTime.fromString('2026-07-15T12:00:00Z');
      const offset0 = d.getTzOffsetForIANA('America/New_York' as IANATZ);
      assertExists(offset0);
      assertEquals(offset0, -240);
    });

    await t.step('should parse Europe/London winter', () => {
      const d = DateTime.fromString('2026-01-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Europe/London' as IANATZ);
      assertExists(offset);
      assertEquals(offset, 0);
    });

    await t.step('should parse Europe/London summer', () => {
      const d = DateTime.fromString('2026-07-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Europe/London' as IANATZ);
      assertExists(offset);
      assertEquals(offset, 60);
    });

    await t.step('should parse Asia/Tokyo winter', () => {
      const d = DateTime.fromString('2026-01-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Asia/Tokyo' as IANATZ);
      assertEquals(offset, 540);
    });

    await t.step('should parse Asia/Tokyo summer', () => {
      const d = DateTime.fromString('2026-07-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Asia/Tokyo' as IANATZ);
      assertEquals(offset, 540);
    });

    await t.step('should parse Asia/Kolkata winter', () => {
      const d = DateTime.fromString('2026-01-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Asia/Kolkata' as IANATZ);
      assertEquals(offset, 330);
    });

    await t.step('should parse Asia/Kolkata summer', () => {
      const d = DateTime.fromString('2026-07-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('Asia/Kolkata' as IANATZ);
      assertEquals(offset, 330);
    });

    await t.step('should parse America/Costa_Rica winter', () => {
      const d = DateTime.fromString('2026-01-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('America/Costa_Rica' as IANATZ);
      assertEquals(offset, -360);
    });

    await t.step('should parse America/Costa_Rica summer', () => {
      const d = DateTime.fromString('2026-07-15T12:00:00Z');
      const offset = d.getTzOffsetForIANA('America/Costa_Rica' as IANATZ);
      assertEquals(offset, -360);
    });

    await t.step('should return undefined for an invalid timezone', () => {
      const d = DateTime.now();
      const offset = d.getTzOffsetForIANA('Invalid/Timezone' as IANATZ);
      assertEquals(offset, undefined);
    });
  });

  await t.step('fromPdfDate', async (t) => {
    await t.step('AST +03:00', () => {
      Deno.env.set('TZ', 'AST');
      const d = DateTime.fromPdfDate('D:20240101120000Z');
      assertExists(d);
      assertEquals(d.toISOString(), '2024-01-01T12:00:00+00:00');
      assertEquals(d.setTz('+03:00' as ISOTZ).toISOLocalString(false), '2024-01-01T15:00:00+03:00');
    });
  });

  await t.step('DateTime.now()', async (t) => {
    await t.step('should create a DateTime for the current time', () => {
      const before = Date.now();
      const now = DateTime.now();
      const after = Date.now();
      assert(now.epochMilliseconds >= before);
      assert(now.epochMilliseconds <= after);
    });

    await t.step('should return an Instant (can add timezone with withTz)', () => {
      const now = DateTime.now();
      const ny = now.withTz('America/New_York' as IANATZ);
      assertExists(ny.getTzOffset());
    });
  });

  await t.step('epochMilliseconds getter', async (t) => {
    await t.step('should return epoch milliseconds for Instant', () => {
      const d = DateTime.from('2024-03-15T10:30:00.000Z');
      assertEquals(typeof d.epochMilliseconds, 'number');
      assert(d.epochMilliseconds > 0);
    });

    await t.step('should return epoch milliseconds for ZonedDateTime', () => {
      const d = DateTime.from('2024-03-15T10:30:00.000Z').withTz('America/New_York' as IANATZ);
      assertEquals(typeof d.epochMilliseconds, 'number');
      assert(d.epochMilliseconds > 0);
    });

    await t.step('should throw for PlainDateTime', () => {
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      assertThrows(() => d.epochMilliseconds);
    });
  });

  await t.step('toEpochSeconds()', async (t) => {
    await t.step('should return epoch seconds for Instant', () => {
      const d = DateTime.from('2024-03-15T10:30:00.000Z');
      assertEquals(typeof d.toEpochSeconds(), 'number');
      assert(d.toEpochSeconds() > 0);
    });

    await t.step('should truncate milliseconds', () => {
      const d1 = DateTime.from('2024-03-15T10:30:00.000Z');
      const d2 = DateTime.from('2024-03-15T10:30:00.999Z');
      assertEquals(d1.toEpochSeconds(), d2.toEpochSeconds());
    });

    await t.step('should throw for PlainDateTime', () => {
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      assertThrows(() => d.toEpochSeconds());
    });
  });

  await t.step('toISOString()', async (t) => {
    await t.step('should return UTC string for Instant', () => {
      const d = DateTime.from('2024-03-15T10:30:00.000Z');
      const result = d.toISOString();
      assert(result === '2024-03-15T10:30:00Z' || result === '2024-03-15T10:30:00+00:00');
    });

    await t.step('should return string with offset for ZonedDateTime', () => {
      const d = DateTime.from('2024-03-15T10:30:00.000Z').withTz('America/New_York' as IANATZ);
      const result = d.toISOString();
      assert(result.startsWith('2024-03-15'));
      assert(result.match(/[+-]\d{2}:\d{2}$/) !== null);
    });

    await t.step('should throw for PlainDateTime', () => {
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      assertThrows(() => d.toISOString());
    });
  });

  await t.step('comparison methods', async (t) => {
    await t.step('isValid', async (t) => {
      await t.step('should return true for valid date strings', () => {
        assertEquals(DateTime.isValid('2024-03-15'), true);
        assertEquals(DateTime.isValid('2024-03-15T10:30:00Z'), true);
      });

      await t.step('should return true for timestamps', () => {
        assertEquals(DateTime.isValid(1709913600000), true);
      });

      await t.step('should return true for Date objects', () => {
        assertEquals(DateTime.isValid(new Date()), true);
      });

      await t.step('should return true for Temporal objects', () => {
        assertEquals(DateTime.isValid(Temporal.Now.instant()), true);
      });

      await t.step('should return false for invalid values', () => {
        assertEquals(DateTime.isValid('invalid'), false);
        assertEquals(DateTime.isValid(null), true);
        assertEquals(DateTime.isValid(undefined), true);
        assertEquals(DateTime.isValid({}), false);
        assertEquals(DateTime.isValid(123), true);
      });
    });

    await t.step('isDateLike', async (t) => {
      await t.step('should return true for Date objects', () => {
        assertEquals(DateTime.isDateLike(new Date()), true);
      });

      await t.step('should return true for DateTime objects', () => {
        assertEquals(DateTime.isDateLike(DateTime.from('2024-03-15')), true);
      });

      await t.step('should return true for Temporal.Instant', () => {
        assertEquals(DateTime.isDateLike(Temporal.Now.instant()), true);
      });

      await t.step('should return true for Temporal.ZonedDateTime', () => {
        assertEquals(DateTime.isDateLike(Temporal.Now.zonedDateTimeISO('UTC')), true);
      });

      await t.step('should return true for Temporal.PlainDateTime', () => {
        assertEquals(DateTime.isDateLike(Temporal.Now.plainDateTimeISO()), true);
      });

      await t.step('should return false for strings', () => {
        assertEquals(DateTime.isDateLike('2024-03-15'), false);
        assertEquals(DateTime.isDateLike('invalid'), false);
      });

      await t.step('should return false for numbers', () => {
        assertEquals(DateTime.isDateLike(1709913600000), false);
        assertEquals(DateTime.isDateLike(123), false);
      });

      await t.step('should return false for null and undefined', () => {
        assertEquals(DateTime.isDateLike(null), false);
        assertEquals(DateTime.isDateLike(undefined), false);
      });

      await t.step('should return false for plain objects', () => {
        assertEquals(DateTime.isDateLike({}), false);
        assertEquals(DateTime.isDateLike({ year: 2024, month: 3, day: 15 }), false);
      });
    });

    await t.step('equals', async (t) => {
      await t.step('should return true for same instant', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.equals(d2), true);
      });

      await t.step('should return true for same instant with different timezone representations', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T05:30:00-05:00');
        assertEquals(d1.equals(d2), true);
      });

      await t.step('should return false for different instants', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:31:00Z');
        assertEquals(d1.equals(d2), false);
      });

      await t.step('should throw for PlainDateTime', () => {
        const d1 = DateTime.fromComponents(2024, 2, 15, 10, 30);
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertThrows(() => d1.equals(d2));
      });
    });

    await t.step('compare', async (t) => {
      await t.step('should return -1 when a < b', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        assertEquals(DateTime.compare(d1, d2), -1);
      });

      await t.step('should return 1 when a > b', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(DateTime.compare(d1, d2), 1);
      });

      await t.step('should return 0 when a === b', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(DateTime.compare(d1, d2), 0);
      });

      await t.step('should work with Array.sort', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-17T10:30:00Z');
        const d3 = DateTime.from('2024-03-16T10:30:00Z');
        const dates = [d2, d1, d3];
        dates.sort(DateTime.compare);
        assertEquals(dates[0].equals(d1), true);
        assertEquals(dates[1].equals(d3), true);
        assertEquals(dates[2].equals(d2), true);
      });
    });

    await t.step('compareTo', async (t) => {
      await t.step('should delegate to compare', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        assertEquals(d1.compareTo(d2), -1);
        assertEquals(d2.compareTo(d1), 1);
        assertEquals(d1.compareTo(d1), 0);
      });
    });

    await t.step('isBefore', async (t) => {
      await t.step('should return true when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        assertEquals(d1.isBefore(d2), true);
        assertEquals(d2.isBefore(d1), false);
      });

      await t.step('should return false when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isBefore(d2), false);
      });
    });

    await t.step('isAfter', async (t) => {
      await t.step('should return true when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isAfter(d2), true);
        assertEquals(d2.isAfter(d1), false);
      });

      await t.step('should return false when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isAfter(d2), false);
      });
    });

    await t.step('isSameOrBefore', async (t) => {
      await t.step('should return true when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        assertEquals(d1.isSameOrBefore(d2), true);
      });

      await t.step('should return true when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isSameOrBefore(d2), true);
      });

      await t.step('should return false when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isSameOrBefore(d2), false);
      });
    });

    await t.step('isSameOrAfter', async (t) => {
      await t.step('should return true when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isSameOrAfter(d2), true);
      });

      await t.step('should return true when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d1.isSameOrAfter(d2), true);
      });

      await t.step('should return false when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        assertEquals(d1.isSameOrAfter(d2), false);
      });
    });
  });

  await t.step('min/max instant methods', async (t) => {
    await t.step('DateTime.min()', async (t) => {
      await t.step('should create a DateTime at INSTANT_MIN', () => {
        const min = DateTime.min();
        assertEquals(min.epochMilliseconds, -8640000000000000);
        assertEquals(min.isMin(), true);
        assertEquals(min.isMax(), false);
      });
    });

    await t.step('DateTime.max()', async (t) => {
      await t.step('should create a DateTime at INSTANT_MAX', () => {
        const max = DateTime.max();
        assertEquals(max.epochMilliseconds, 8640000000000000);
        assertEquals(max.isMax(), true);
        assertEquals(max.isMin(), false);
      });
    });

    await t.step('isMin()', async (t) => {
      await t.step('should return true for min instant', () => {
        const min = DateTime.min();
        assertEquals(min.isMin(), true);
      });

      await t.step('should return false for normal dates', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d.isMin(), false);
      });

      await t.step('should return false for max instant', () => {
        const max = DateTime.max();
        assertEquals(max.isMin(), false);
      });

      await t.step('should throw for PlainDateTime', () => {
        const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
        assertThrows(() => d.isMin());
      });
    });

    await t.step('isMax()', async (t) => {
      await t.step('should return true for max instant', () => {
        const max = DateTime.max();
        assertEquals(max.isMax(), true);
      });

      await t.step('should return false for normal dates', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d.isMax(), false);
      });

      await t.step('should return false for min instant', () => {
        const min = DateTime.min();
        assertEquals(min.isMax(), false);
      });

      await t.step('should throw for PlainDateTime', () => {
        const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
        assertThrows(() => d.isMax());
      });
    });

    await t.step('setMin()', async (t) => {
      await t.step('should set the DateTime to INSTANT_MIN', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        d.setMin();
        assertEquals(d.isMin(), true);
        assertEquals(d.epochMilliseconds, -8640000000000000);
      });

      await t.step('should return this for chaining', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        const result = d.setMin();
        assertEquals(result, d);
      });
    });

    await t.step('setMax()', async (t) => {
      await t.step('should set the DateTime to INSTANT_MAX', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        d.setMax();
        assertEquals(d.isMax(), true);
        assertEquals(d.epochMilliseconds, 8640000000000000);
      });

      await t.step('should return this for chaining', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        const result = d.setMax();
        assertEquals(result, d);
      });
    });

    await t.step('withMin()', async (t) => {
      await t.step('should return a new DateTime at INSTANT_MIN', () => {
        const original = DateTime.from('2024-03-15T10:30:00Z');
        const min = original.withMin();
        assertEquals(min.isMin(), true);
        assertEquals(original.isMin(), false);
      });
    });

    await t.step('withMax()', async (t) => {
      await t.step('should return a new DateTime at INSTANT_MAX', () => {
        const original = DateTime.from('2024-03-15T10:30:00Z');
        const max = original.withMax();
        assertEquals(max.isMax(), true);
        assertEquals(original.isMax(), false);
      });
    });

    await t.step('isNearMin()', async (t) => {
      await t.step('should return true for exact INSTANT_MIN', () => {
        const min = DateTime.min();
        assertEquals(min.isNearMin(), true);
      });

      await t.step('should return true for instant within 3 days of min', () => {
        const nearMin = DateTime.from(Temporal.Instant.fromEpochMilliseconds(-8640000000000000 + 86400000));
        assertEquals(nearMin.isNearMin(), true);
      });

      await t.step('should return false for instant outside default tolerance', () => {
        const notNearMin = DateTime.from(Temporal.Instant.fromEpochMilliseconds(-8640000000000000 + 604800000));
        assertEquals(notNearMin.isNearMin(), false);
      });

      await t.step('should return true when custom tolerance is provided', () => {
        const nearMin = DateTime.from(Temporal.Instant.fromEpochMilliseconds(-8640000000000000 + 604800000));
        assertEquals(nearMin.isNearMin(604800), true);
      });

      await t.step('should return false for normal dates', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d.isNearMin(), false);
      });

      await t.step('should throw for PlainDateTime', () => {
        const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
        assertThrows(() => d.isNearMin());
      });
    });

    await t.step('isNearMax()', async (t) => {
      await t.step('should return true for exact INSTANT_MAX', () => {
        const max = DateTime.max();
        assertEquals(max.isNearMax(), true);
      });

      await t.step('should return true for instant within 3 days of max', () => {
        const nearMax = DateTime.from(Temporal.Instant.fromEpochMilliseconds(8640000000000000 - 86400000));
        assertEquals(nearMax.isNearMax(), true);
      });

      await t.step('should return false for instant outside default tolerance', () => {
        const notNearMax = DateTime.from(Temporal.Instant.fromEpochMilliseconds(8640000000000000 - 604800000));
        assertEquals(notNearMax.isNearMax(), false);
      });

      await t.step('should return true when custom tolerance is provided', () => {
        const nearMax = DateTime.from(Temporal.Instant.fromEpochMilliseconds(8640000000000000 - 604800000));
        assertEquals(nearMax.isNearMax(604800), true);
      });

      await t.step('should return false for normal dates', () => {
        const d = DateTime.from('2024-03-15T10:30:00Z');
        assertEquals(d.isNearMax(), false);
      });

      await t.step('should throw for PlainDateTime', () => {
        const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
        assertThrows(() => d.isNearMax());
      });
    });
  });

  await t.step('isNow()', async (t) => {
    await t.step('should return true when tolerance is 10 ms', () => {
      const now = DateTime.now();
      assertEquals(now.isNow(0.01), true);
    });

    await t.step('should return true for recent time with positive tolerance', () => {
      const recent = DateTime.from(DateTime.now().subtract({ milliseconds: 30000 }));
      assertEquals(recent.isNow(60), true);
    });

    await t.step('should return false for old time even with positive tolerance', () => {
      const old = DateTime.from(Date.now().valueOf() - 120000);
      assertEquals(old.isNow(60), false);
    });

    await t.step('should return true for future time with negative tolerance', () => {
      const future = DateTime.from(DateTime.now().valueOf() + 30000);
      assertEquals(future.isNow(60), true);
    });

    await t.step('should return false for distant future with negative tolerance', () => {
      const future = DateTime.from(DateTime.now().valueOf() + 120000);
      assertEquals(future.isNow(60), false);
    });

    await t.step('should return false for future time with positive tolerance', () => {
      const future = DateTime.from(DateTime.now().valueOf() + 30000);
      assertEquals(future.isNow(60), true);
    });

    await t.step('should return false for past time with negative tolerance', () => {
      const past = DateTime.from(DateTime.now().valueOf() - 30000);
      assertEquals(past.isNow(15), false);
    });

    await t.step('should throw for PlainDateTime', () => {
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      assertThrows(() => d.isNow());
    });

    await t.step('should work with larger tolerances (days)', () => {
      const yesterday = DateTime.from(DateTime.now().valueOf() - 24 * 60 * 60 * 1000);
      assertEquals(yesterday.isNow(2 * 24 * 60 * 60), true);
    });
  });

  await t.step('add', async (t) => {
    await t.step('should add days to a date', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const future = d.add({ hours: 7 * 24 });
      assertMatch(future.toISOString(), /^2024-03-22T10:30:00(Z|\+00:00)$/);
    });

    await t.step('should add hours and minutes', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const future = d.add({ hours: 2, minutes: 30 });
      assertMatch(future.toISOString(), /^2024-03-15T13:00:00(Z|\+00:00)$/);
    });

    await t.step('should add months', () => {
      const d = DateTime.from('2024-01-15T10:30:00Z');
      const future = d.add({ months: 2 });
      assertMatch(future.toISOString(), /^2024-03-15T10:30:00(Z|\+00:00)$/);
    });

    await t.step('should not mutate the original', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const originalISO = d.toISOString();
      d.add({ days: 7 });
      assertEquals(d.toISOString(), originalISO);
    });

    await t.step('should work with ZonedDateTime', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z').withTz('America/New_York' as IANATZ);
      const future = d.add({ days: 1 });
      assert(future.toISOString().startsWith('2024-03-16'));
    });

    await t.step('should work with PlainDateTime', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      const future = d.add({ days: 1 });
      assertEquals(future.toString({ timeZoneName: 'never' }), '2024-02-16T10:30:00-06:00');
    });
  });

  await t.step('subtract', async (t) => {
    await t.step('should subtract days from a date', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const past = d.subtract({ days: 7 });
      assertMatch(past.toISOString(), /^2024-03-08T10:30:00(Z|\+00:00)$/);
    });

    await t.step('should subtract hours and minutes', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const past = d.subtract({ hours: 2, minutes: 30 });
      assertMatch(past.toISOString(), /^2024-03-15T08:00:00(Z|\+00:00)$/);
    });

    await t.step('should subtract months', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const past = d.subtract({ months: 2 });
      assertMatch(past.toISOString(), /^2024-01-15T10:30:00(Z|\+00:00)$/);
    });

    await t.step('should not mutate the original', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const originalISO = d.toISOString();
      d.subtract({ days: 7 });
      assertEquals(d.toISOString(), originalISO);
    });

    await t.step('should work with ZonedDateTime', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z').withTz('America/New_York' as IANATZ);
      const past = d.subtract({ days: 1 });
      assert(past.toISOString().startsWith('2024-03-14'));
    });

    await t.step('should work with PlainDateTime', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30);
      const past = d.subtract({ days: 1 });
      assertEquals(past.toString({ timeZoneName: 'never' }), '2024-02-14T10:30:00-06:00');
    });

    await t.step('add and subtract should be inverse operations', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      const result = d.add({ days: 7 }).subtract({ days: 7 });
      assertEquals(result.equals(d), true);
    });
  });

  await t.step('startOfDay / endOfDay', async (t) => {
    await t.step('startOfDay uses UTC offset for Z-suffixed string', () => {
      const d = DateTime.from('2024-03-15T10:30:45.123Z');
      assertEquals(d.startOfDay().toISOString(), '2024-03-15T00:00:00+00:00');
    });

    await t.step('startOfDay uses ZonedDateTime timezone', () => {
      const d = DateTime.from('2024-03-15T10:30:45.123Z').withTz('America/New_York' as IANATZ);
      assertEquals(d.startOfDay().toISOString(), '2024-03-15T00:00:00-04:00');
    });

    await t.step('endOfDay defaults to 23:59:59.999', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfDay().toISOString(), '2024-03-15T23:59:59.999+00:00');
    });

    await t.step('endOfDay with backoffMs=0 gives start of next day', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfDay(0).toISOString(), '2024-03-16T00:00:00+00:00');
    });

    await t.step('endOfDay with custom backoff', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfDay(1000).toISOString(), '2024-03-15T23:59:59+00:00');
    });
  });

  await t.step('startOfYear / endOfYear', async (t) => {
    await t.step('startOfYear returns Jan 1 00:00:00 UTC offset', () => {
      const d = DateTime.from('2024-07-15T10:30:00Z');
      assertEquals(d.startOfYear().toISOString(), '2024-01-01T00:00:00+00:00');
    });

    await t.step('endOfYear defaults to last ms of year', () => {
      const d = DateTime.from('2024-07-15T10:30:00Z');
      assertEquals(d.endOfYear().toISOString(), '2024-12-31T23:59:59.999+00:00');
    });

    await t.step('endOfYear with backoffMs=0 gives start of next year', () => {
      const d = DateTime.from('2024-07-15T10:30:00Z');
      assertEquals(d.endOfYear(0).toISOString(), '2025-01-01T00:00:00+00:00');
    });
  });

  await t.step('startOfMonth / endOfMonth', async (t) => {
    await t.step('startOfMonth returns 1st 00:00:00 UTC offset', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.startOfMonth().toISOString(), '2024-03-01T00:00:00+00:00');
    });

    await t.step('endOfMonth defaults to last ms of month', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfMonth().toISOString(), '2024-03-31T23:59:59.999+00:00');
    });

    await t.step('endOfMonth handles February in a leap year', () => {
      const d = DateTime.from('2024-02-15T10:30:00Z');
      assertEquals(d.endOfMonth().toISOString(), '2024-02-29T23:59:59.999+00:00');
    });

    await t.step('endOfMonth handles February in a non-leap year', () => {
      const d = DateTime.from('2023-02-15T10:30:00Z');
      assertEquals(d.endOfMonth().toISOString(), '2023-02-28T23:59:59.999+00:00');
    });
  });

  await t.step('startOfWeek / endOfWeek', async (t) => {
    await t.step('startOfWeek defaults to Monday', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.startOfWeek().toISOString(), '2024-03-11T00:00:00+00:00');
    });

    await t.step('startOfWeek stays on same day if already target day', () => {
      const d = DateTime.from('2024-03-11T10:30:00Z');
      assertEquals(d.startOfWeek().toISOString(), '2024-03-11T00:00:00+00:00');
    });

    await t.step('startOfWeek with Sunday as start', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.startOfWeek(7).toISOString(), '2024-03-10T00:00:00+00:00');
    });

    await t.step('startOfWeek with Friday as start', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.startOfWeek(5).toISOString(), '2024-03-15T00:00:00+00:00');
    });

    await t.step('endOfWeek defaults to Sunday 23:59:59.999', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfWeek().toISOString(), '2024-03-17T23:59:59.999+00:00');
    });

    await t.step('endOfWeek with Sunday start ends Saturday', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfWeek(7).toISOString(), '2024-03-16T23:59:59.999+00:00');
    });

    await t.step('endOfWeek with custom backoff', () => {
      const d = DateTime.from('2024-03-15T10:30:00Z');
      assertEquals(d.endOfWeek(1, 0).toISOString(), '2024-03-18T00:00:00+00:00');
    });
  });

  await t.step('with()', async (t) => {
    await t.step('should replace components on ZonedDateTime', () => {
      const d = DateTime.from('2024-03-15T10:30:45.123Z').withTz('utc');
      const floored = d.with({ minute: 0, second: 0, millisecond: 0 });
      assertEquals(floored.toISOString(), '2024-03-15T10:00:00+00:00');
    });

    await t.step('should replace components on PlainDateTime', () => {
      const d = DateTime.fromComponents(2024, 2, 15, 10, 30, 45, 123);
      const floored = d.with({ minute: 0, second: 0, millisecond: 0 });
      assertEquals(floored.toString(), '2024-02-15T10:00:00');
    });

    await t.step('should throw on Instant without timezone', () => {
      const d = DateTime.from(Temporal.Instant.from('2024-03-15T10:30:45.123Z'));
      assertThrows(() => d.with({ minute: 0 }), Error, 'use withTz() to set a timezone first');
    });

    await t.step('should not mutate the original', () => {
      const d = DateTime.from('2024-03-15T10:30:45.123Z').withTz('utc');
      const originalISO = d.toISOString();
      d.with({ hour: 0 });
      assertEquals(d.toISOString(), originalISO);
    });
  });
});
