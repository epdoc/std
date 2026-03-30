import { DateTime, type IANATZ, type ISOTZ, type TzMinutes, util } from '@epdoc/datetime';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

// TODO: remove skip when deno date is fixed

describe('date-util', () => {
  // Set timezone for all tests (CST = UTC-6)
  Deno.env.set('TZ', 'America/Costa_Rica');

  describe('tz statics', () => {
    it('parse', () => {
      expect(util.parseISOTZ('-06:00' as ISOTZ)).toEqual(360);
      expect(util.parseISOTZ('+06:00' as ISOTZ)).toEqual(-360);
      expect(util.parseISOTZ('-02:30' as ISOTZ)).toEqual(150);
      expect(util.parseISOTZ('+01:00' as ISOTZ)).toEqual(-60);
      expect(util.parseISOTZ('+00:00' as ISOTZ)).toEqual(0);
      expect(util.parseISOTZ('-00:00' as ISOTZ)).toEqual(0);
      expect(util.parseISOTZ('Z' as ISOTZ)).toEqual(0);
    });
    it('format', () => {
      expect(util.formatTzAsISOTZ(-360 as TzMinutes)).toEqual('+06:00');
      expect(util.formatTzAsISOTZ(360 as TzMinutes)).toEqual('-06:00');
      expect(util.formatTzAsISOTZ(-390 as TzMinutes)).toEqual('+06:30');
      expect(util.formatTzAsISOTZ(150 as TzMinutes)).toEqual('-02:30');
      expect(util.formatTzAsISOTZ(0 as TzMinutes)).toEqual('Z');
    });
  });
  describe('tz offset', () => {
    it.skip('240', () => {
      Deno.env.set('TZ', 'America/Nassau');
      expect(Deno.env.get('TZ')).toEqual('America/Nassau');
      // process.env.TZ = 'CST';
      const tz = new Date().getTimezoneOffset();
      expect(tz).toEqual(240);
    });
    it('120', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      // process.env.TZ = 'CST';
      expect(Deno.env.get('TZ')).toEqual('America/Costa_Rica');
      const tz = new Date().getTimezoneOffset();
      expect(tz).toEqual(360);
    });
    it('-02:00', () => {
      const tz = util.formatTzAsISOTZ(120 as TzMinutes);
      expect(tz).toEqual('-02:00');
    });
    it('360', () => {
      const tz = util.formatTzAsISOTZ(360 as TzMinutes);
      expect(tz).toEqual('-06:00');
    });
    it('-360', () => {
      const tz = util.formatTzAsISOTZ(-360 as TzMinutes);
      expect(tz).toEqual('+06:00');
    });
  });
  describe('tz set offset', () => {
    it('should set and get timezone offsets', () => {
      const d = DateTime.from();
      // Test with hourly offset (Eastern Time is UTC-5, so 300 minutes)
      d.setTz(300 as TzMinutes);
      expect(d.getTz()).toEqual(300);
      // Test with ISOTZ string
      d.setTz('-05:00' as ISOTZ);
      expect(d.getTz()).toEqual(300);
    });
  });
  describe('tz half-hour offsets', () => {
    it('should handle Newfoundland (America/St_Johns) UTC-3:30', () => {
      const d = DateTime.from('2024-01-15T12:00:00Z');
      d.setTz('America/St_Johns' as IANATZ);
      // Newfoundland is UTC-3:30 (210 minutes) in winter
      expect(d.getTz()).toEqual(210);
      expect(d.getTzString()).toEqual('-03:30');
    });
    it('should handle Adelaide (Australia/Adelaide) with half-hour offset', () => {
      const d = DateTime.from('2024-06-15T12:00:00Z');
      d.setTz('Australia/Adelaide' as IANATZ);
      // Adelaide is UTC+9:30 (-570 minutes) in June (winter, no DST)
      expect(d.getTz()).toEqual(-570);
      expect(d.getTzString()).toEqual('+09:30');
    });
  });
  describe('withTz', () => {
    it('local', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      const d: DateTime = DateTime.from(2024, 0, 1, 11, 59, 59, 456).withTz();
      expect(d.toISOLocalString()).toEqual('2024-01-01T11:59:59.456-06:00');
    });
  });
  describe('toISOLocaleString', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    Deno.env.set('TZ', 'CST');
    it('default', () => {
      expect(d.getTimezoneOffset()).toEqual(360);
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(new DateTime(d).toISOLocalString()).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('show milliseconds', () => {
      expect(new DateTime(d).toISOLocalString(true)).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('hide milliseconds', () => {
      expect(new DateTime(d).toISOLocalString(false)).toEqual('1997-11-25T06:13:14-06:00');
    });
  });
  describe('toISOLocaleString tz -06:00', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = new DateTime(d).setTz('-06:00' as ISOTZ);
    it('default', () => {
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(du.toISOLocalString()).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('show milliseconds', () => {
      expect(du.toISOLocalString(true)).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('hide milliseconds', () => {
      expect(du.toISOLocalString(false)).toEqual('1997-11-25T06:13:14-06:00');
    });
  });

  describe('toISOLocaleString tz 0', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = new DateTime(d).setTz(0 as TzMinutes);
    it('default', () => {
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(du.toISOLocalString()).toEqual('1997-11-25T12:13:14.456Z');
    });
    it('show milliseconds', () => {
      expect(du.toISOLocalString(true)).toEqual('1997-11-25T12:13:14.456Z');
    });
    it('hide milliseconds', () => {
      expect(du.toISOLocalString(false)).toEqual('1997-11-25T12:13:14Z');
    });
  });
  it('formatLocale', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateTime(d).format('yyyy-MM-dd')).toEqual('1997-11-25');
    expect(new DateTime(d).format('yyyyMMdd')).toEqual('19971125');
    expect(new DateTime(d).format('yyyyMMdd_HHmmss')).toEqual('19971125_061314');
    expect(new DateTime(d).formatUTC('yyyyMMdd_HHmmss')).toEqual('19971125_121314');
  });
  describe('format with month names', () => {
    const d = new Date('2024-01-15T12:30:45.123Z');
    it('MMMM (full month name)', () => {
      expect(new DateTime(d).formatUTC('MMMM yyyy')).toEqual('January 2024');
    });
    it('MMM (abbreviated month name)', () => {
      expect(new DateTime(d).formatUTC('MMM dd, yyyy')).toEqual('Jan 15, 2024');
    });
    it('MM (zero-padded month number)', () => {
      expect(new DateTime(d).formatUTC('yyyy-MM-dd')).toEqual('2024-01-15');
    });
    it('M (month number without padding)', () => {
      expect(new DateTime(d).formatUTC('M/dd/yyyy')).toEqual('1/15/2024');
    });
    it('combined format', () => {
      expect(new DateTime(d).formatUTC('dd MMM yyyy HH:mm:ss')).toEqual('15 Jan 2024 12:30:45');
    });
    it('full format with milliseconds', () => {
      expect(new DateTime(d).formatUTC('MMMM dd, yyyy HH:mm:ss.SSS')).toEqual('January 15, 2024 12:30:45.123');
    });
    it('December test', () => {
      const dDec = new Date('2024-12-25T00:00:00Z');
      expect(new DateTime(dDec).formatUTC('MMMM dd, yyyy')).toEqual('December 25, 2024');
      expect(new DateTime(dDec).formatUTC('MMM dd')).toEqual('Dec 25');
    });
  });
  describe('format with unpadded day and hour', () => {
    it('d (day without padding)', () => {
      const d1 = new Date('2024-01-05T00:00:00Z');
      expect(new DateTime(d1).formatUTC('M/d/yyyy')).toEqual('1/5/2024');
      const d15 = new Date('2024-01-15T00:00:00Z');
      expect(new DateTime(d15).formatUTC('M/d/yyyy')).toEqual('1/15/2024');
    });
    it('dd (day with padding)', () => {
      const d = new Date('2024-01-05T00:00:00Z');
      expect(new DateTime(d).formatUTC('MM/dd/yyyy')).toEqual('01/05/2024');
    });
    it('H (hour without padding)', () => {
      const d1 = new Date('2024-01-15T03:30:45Z');
      expect(new DateTime(d1).formatUTC('H:mm:ss')).toEqual('3:30:45');
      const d12 = new Date('2024-01-15T12:30:45Z');
      expect(new DateTime(d12).formatUTC('H:mm:ss')).toEqual('12:30:45');
      const d0 = new Date('2024-01-15T00:30:45Z');
      expect(new DateTime(d0).formatUTC('H:mm:ss')).toEqual('0:30:45');
    });
    it('HH (hour with padding)', () => {
      const d = new Date('2024-01-15T03:30:45Z');
      expect(new DateTime(d).formatUTC('HH:mm:ss')).toEqual('03:30:45');
    });
    it('combined d and H', () => {
      const d = new Date('2024-01-05T03:30:45Z');
      expect(new DateTime(d).formatUTC('M/d/yyyy H:mm:ss')).toEqual('1/5/2024 3:30:45');
    });
  });
  describe('format with weekday names', () => {
    const d = new Date('2024-01-15T12:30:45.123Z'); // This is a Monday
    it('EEEE (full weekday name)', () => {
      expect(new DateTime(d).formatUTC('EEEE, MMMM dd, yyyy')).toEqual('Monday, January 15, 2024');
    });
    it('EEE (abbreviated weekday name)', () => {
      expect(new DateTime(d).formatUTC('EEE, MMM dd, yyyy')).toEqual('Mon, Jan 15, 2024');
    });
    it('EE (short weekday name)', () => {
      const d = new DateTime(new Date('2024-01-15T12:30:45.123Z'));
      const s = d.formatUTC('EE, M/dd/yyyy');
      expect(s).toEqual('M, 1/15/2024');
    });
  });
  it('julianDate', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateTime(d).julianDate()).toBeCloseTo(2450778.0091950926, 6);
    const d1 = new Date('2024-12-30T12:00:00Z');
    expect(new DateTime(d1).julianDate()).toEqual(2460675);
  });
  describe('googleSheetsDate', () => {
    it('should convert a UTC date to a Google Sheets serial number', () => {
      // 2024-01-01 12:00:00 UTC
      const d = new Date('2024-01-01T12:00:00Z');
      const serial = new DateTime(d).googleSheetsDate();
      expect(serial).toEqual(45292.25);
    });

    it('should convert a date with timezone offset to the correct serial number', () => {
      // This test demonstrates that the input Date's offset is handled correctly,
      // as Date.getTime() is always UTC.
      // This is 2024-01-01 12:00:00 in a -06:00 timezone, which is 2024-01-01 18:00:00 UTC.
      const d = new DateTime('2024-01-01T12:00:00-06:00');
      const serial = d.googleSheetsDate();
      // (new Date('2024-01-01T18:00:00Z').getTime() / 86400000) + 25569 = 45291.75
      // The offset is 360 minutes. 360 / 1440 = 0.25
      // So the corrected serial should be 45291.75 - 0.25 = 45291.5
      expect(serial).toEqual(45292.5);
    });

    it('should produce the correct serial number for a specific timezone', () => {
      const d = new DateTime('2024-01-01T12:00:00Z');
      d.setTz('America/New_York' as IANATZ); // UTC-5, so offset is 300
      const serial = d.googleSheetsDate();
      console.log(serial);
      // raw serial is 45292.25
      expect(serial).toEqual(45292.25);
    });
  });
  describe('fromGoogleSheetsDate', () => {
    it('should convert a Google Sheets serial number to a UTC date', () => {
      const serial = util.asGoogleSheetsDate(45291.5); // Represents 2024-01-01 12:00:00 UTC
      const d = DateTime.fromGoogleSheetsDate(serial, 'Europe/London' as IANATZ);
      expect(d).toBeDefined();
      if (d) {
        expect(d.date.toISOString()).toEqual('2023-12-31T12:00:00.000Z');
      }
    });

    it('should return a Date object that can be formatted to a local time string', () => {
      const serial = util.asGoogleSheetsDate(45292.75); // Represents 2024-01-01 18:00:00 UTC
      const d = DateTime.fromGoogleSheetsDate(serial, 'America/Costa_Rica' as IANATZ);
      expect(d).toBeDefined();
      if (d) {
        // We expect the UTC date to be correct.
        expect(d.date.toISOString()).toEqual('2024-01-02T00:00:00.000Z');
        // Now, if we want to display this in a specific timezone, we can use toISOLocalString
        // This should be 12:00:00 in a -06:00 timezone.
        d.setTz('-06:00' as ISOTZ);
        expect(d.toISOLocalString(false)).toEqual('2024-01-01T18:00:00-06:00');
      }
    });
  });
  describe('ianaTzParse', () => {
    it('should parse America/New_York', () => {
      // This may be -300 or -240 depending on DST
      const d = new DateTime();
      const offset = d.ianaTzParse('America/New_York' as IANATZ);
      expect(offset).toBeDefined();
      expect(offset === 300 || offset === 240).toBe(true);
    });

    it('should parse Europe/London', () => {
      // This may be 0 or -60 depending on DST
      const d = new DateTime();
      const offset = d.ianaTzParse('Europe/London' as IANATZ);
      expect(offset).toBeDefined();
      expect(offset === 0 || offset === -60).toBe(true);
    });

    it('should parse Asia/Tokyo', () => {
      const d = new DateTime();
      const offset = d.ianaTzParse('Asia/Tokyo' as IANATZ);
      expect(offset).toBe(-540);
    });

    it('should parse Asia/Kolkata', () => {
      const d = new DateTime();
      const offset = d.ianaTzParse('Asia/Kolkata' as IANATZ);
      expect(offset).toBe(-330);
    });

    it('should parse America/Costa_Rica', () => {
      const d = new DateTime();
      const offset = d.ianaTzParse('America/Costa_Rica' as IANATZ);
      expect(offset).toBe(360);
    });

    it('should return undefined for an invalid timezone', () => {
      const d = new DateTime();
      const offset = d.ianaTzParse('Invalid/Timezone' as IANATZ);
      expect(offset).toBeUndefined();
    });
  });

  describe('fromPdfDate', () => {
    it.skip('CST1', () => {
      Deno.env.set('TZ', 'CST');
      const d = DateTime.fromPdfDate('D:20240101120000-0600');
      expect(d).toBeDefined();
      if (d instanceof DateTime) {
        expect(d.date.toISOString()).toBe('2024-01-01T18:00:00.000Z');
      }
    });
    it.skip('CST2', () => {
      Deno.env.set('TZ', 'CST');
      const d = DateTime.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateTime) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.toISOLocalString(false)).toBe('2024-01-01T06:00:00-06:00');
        d.setTz(-60 as TzMinutes).toISOLocalString(false);
        expect(d.toISOLocalString(false)).toBe('2024-01-01T13:00:00+01:00');
      }
    });
    it('AST +03:00', () => {
      Deno.env.set('TZ', 'AST');
      const d = DateTime.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateTime) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.setTz('+03:00' as ISOTZ).toISOLocalString(false)).toBe('2024-01-01T15:00:00+03:00');
      }
    });
  });

  describe('comparison methods', () => {
    describe('isValid', () => {
      it('should return true for valid date strings', () => {
        expect(DateTime.isValid('2024-03-15')).toBe(true);
        expect(DateTime.isValid('2024-03-15T10:30:00Z')).toBe(true);
      });

      it('should return true for timestamps', () => {
        expect(DateTime.isValid(1709913600000)).toBe(true);
      });

      it('should return true for Date objects', () => {
        expect(DateTime.isValid(new Date())).toBe(true);
      });

      it('should return true for Temporal objects', () => {
        expect(DateTime.isValid(Temporal.Now.instant())).toBe(true);
      });

      it('should return false for invalid values', () => {
        expect(DateTime.isValid('invalid')).toBe(false);
        expect(DateTime.isValid(null)).toBe(false);
        expect(DateTime.isValid(undefined)).toBe(false);
        expect(DateTime.isValid({})).toBe(false);
        expect(DateTime.isValid(123)).toBe(true); // numbers are valid (epoch ms)
      });
    });

    describe('equals', () => {
      it('should return true for same instant', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.equals(d2)).toBe(true);
      });

      it('should return true for same instant with different timezone representations', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T05:30:00-05:00');
        expect(d1.equals(d2)).toBe(true);
      });

      it('should return false for different instants', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:31:00Z');
        expect(d1.equals(d2)).toBe(false);
      });

      it('should throw for PlainDateTime', () => {
        const d1 = new DateTime(2024, 2, 15, 10, 30); // PlainDateTime
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(() => d1.equals(d2)).toThrow();
      });
    });

    describe('compare', () => {
      it('should return -1 when a < b', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        expect(DateTime.compare(d1, d2)).toBe(-1);
      });

      it('should return 1 when a > b', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(DateTime.compare(d1, d2)).toBe(1);
      });

      it('should return 0 when a === b', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(DateTime.compare(d1, d2)).toBe(0);
      });

      it('should work with Array.sort', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-17T10:30:00Z');
        const d3 = DateTime.from('2024-03-16T10:30:00Z');
        const dates = [d2, d1, d3];
        dates.sort(DateTime.compare);
        expect(dates[0].equals(d1)).toBe(true);
        expect(dates[1].equals(d3)).toBe(true);
        expect(dates[2].equals(d2)).toBe(true);
      });
    });

    describe('compareTo', () => {
      it('should delegate to compare', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        expect(d1.compareTo(d2)).toBe(-1);
        expect(d2.compareTo(d1)).toBe(1);
        expect(d1.compareTo(d1)).toBe(0);
      });
    });

    describe('isBefore', () => {
      it('should return true when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        expect(d1.isBefore(d2)).toBe(true);
        expect(d2.isBefore(d1)).toBe(false);
      });

      it('should return false when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isBefore(d2)).toBe(false);
      });
    });

    describe('isAfter', () => {
      it('should return true when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isAfter(d2)).toBe(true);
        expect(d2.isAfter(d1)).toBe(false);
      });

      it('should return false when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isAfter(d2)).toBe(false);
      });
    });

    describe('isSameOrBefore', () => {
      it('should return true when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        expect(d1.isSameOrBefore(d2)).toBe(true);
      });

      it('should return true when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isSameOrBefore(d2)).toBe(true);
      });

      it('should return false when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isSameOrBefore(d2)).toBe(false);
      });
    });

    describe('isSameOrAfter', () => {
      it('should return true when this is after other', () => {
        const d1 = DateTime.from('2024-03-16T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isSameOrAfter(d2)).toBe(true);
      });

      it('should return true when equal', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-15T10:30:00Z');
        expect(d1.isSameOrAfter(d2)).toBe(true);
      });

      it('should return false when this is before other', () => {
        const d1 = DateTime.from('2024-03-15T10:30:00Z');
        const d2 = DateTime.from('2024-03-16T10:30:00Z');
        expect(d1.isSameOrAfter(d2)).toBe(false);
      });
    });
  });
});
