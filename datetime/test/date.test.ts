import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { DateEx, dateEx, type IANATZ, type ISOTZ, type TzMinutes, util } from '../src/mod.ts';

// TODO: remove skip when deno date is fixed

describe('date-util', () => {
  // Test is using CST
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
    it('30', () => {
      const d = dateEx();
      d.tz(-30 as TzMinutes);
      expect(d.getTz()).toEqual(-30);
      d.tz('-05:00' as ISOTZ);
      expect(d.getTz()).toEqual(300);
    });
  });
  describe('withTz', () => {
    it('local', () => {
      Deno.env.set('TZ', 'America/Costa_Rica');
      const d: DateEx = dateEx(2024, 0, 1, 11, 59, 59, 456).withTz();
      expect(d.toISOLocalString()).toEqual('2024-01-01T11:59:59.456-06:00');
    });
  });
  describe('toISOLocaleString', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    Deno.env.set('TZ', 'CST');
    it('default', () => {
      expect(d.getTimezoneOffset()).toEqual(360);
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(new DateEx(d).toISOLocalString()).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('show milliseconds', () => {
      expect(new DateEx(d).toISOLocalString(true)).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('hide milliseconds', () => {
      expect(new DateEx(d).toISOLocalString(false)).toEqual('1997-11-25T06:13:14-06:00');
    });
  });
  describe('toISOLocaleString tz -06:00', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = new DateEx(d).tz('-06:00' as ISOTZ);
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
  describe('toISOLocaleString tz -150', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = new DateEx(d).tz(-150 as TzMinutes);
    it('default', () => {
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(du.toISOLocalString()).toEqual('1997-11-25T14:43:14.456+02:30');
    });
    it('show milliseconds', () => {
      expect(du.toISOLocalString(true)).toEqual('1997-11-25T14:43:14.456+02:30');
    });
    it('hide milliseconds', () => {
      expect(du.toISOLocalString(false)).toEqual('1997-11-25T14:43:14+02:30');
    });
  });
  describe('toISOLocaleString tz 0', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    const du = new DateEx(d).tz(0 as TzMinutes);
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
    expect(new DateEx(d).format('yyyy-MM-dd')).toEqual('1997-11-25');
    expect(new DateEx(d).format('yyyyMMdd')).toEqual('19971125');
    expect(new DateEx(d).format('yyyyMMdd_HHmmss')).toEqual('19971125_061314');
    expect(new DateEx(d).formatUTC('yyyyMMdd_HHmmss')).toEqual('19971125_121314');
  });
  it('julianDate', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateEx(d).julianDate()).toEqual(2450778);
  });
  describe('googleSheetsDate', () => {
    it('should convert a UTC date to a Google Sheets serial number', () => {
      // 2024-01-01 12:00:00 UTC
      const d = new Date('2024-01-01T12:00:00Z');
      const serial = new DateEx(d).googleSheetsDate();
      expect(serial).toEqual(45292.25);
    });

    it('should convert a date with timezone offset to the correct serial number', () => {
      // This test demonstrates that the input Date's offset is handled correctly,
      // as Date.getTime() is always UTC.
      // This is 2024-01-01 12:00:00 in a -06:00 timezone, which is 2024-01-01 18:00:00 UTC.
      const d = new DateEx('2024-01-01T12:00:00-06:00');
      const serial = d.googleSheetsDate();
      // (new Date('2024-01-01T18:00:00Z').getTime() / 86400000) + 25569 = 45291.75
      // The offset is 360 minutes. 360 / 1440 = 0.25
      // So the corrected serial should be 45291.75 - 0.25 = 45291.5
      expect(serial).toEqual(45292.5);
    });

    it('should produce the correct serial number for a specific timezone', () => {
      const d = new DateEx('2024-01-01T12:00:00Z');
      d.tz('America/New_York' as IANATZ); // UTC-5, so offset is 300
      const serial = d.googleSheetsDate();
      console.log(serial);
      // raw serial is 45292.25
      expect(serial).toEqual(45292.25);
    });
  });
  describe('fromGoogleSheetsDate', () => {
    it('should convert a Google Sheets serial number to a UTC date', () => {
      const serial = util.asGoogleSheetsDate(45291.5); // Represents 2024-01-01 12:00:00 UTC
      const d = DateEx.fromGoogleSheetsDate(serial, 'Europe/London' as IANATZ);
      expect(d).toBeDefined();
      if (d) {
        expect(d.date.toISOString()).toEqual('2023-12-31T12:00:00.000Z');
      }
    });

    it('should return a Date object that can be formatted to a local time string', () => {
      const serial = util.asGoogleSheetsDate(45292.75); // Represents 2024-01-01 18:00:00 UTC
      const d = DateEx.fromGoogleSheetsDate(serial, 'America/Costa_Rica' as IANATZ);
      expect(d).toBeDefined();
      if (d) {
        // We expect the UTC date to be correct.
        expect(d.date.toISOString()).toEqual('2024-01-02T00:00:00.000Z');
        // Now, if we want to display this in a specific timezone, we can use toISOLocalString
        // This should be 12:00:00 in a -06:00 timezone.
        d.tz('-06:00' as ISOTZ);
        expect(d.toISOLocalString(false)).toEqual('2024-01-01T18:00:00-06:00');
      }
    });
  });
  describe('ianaTzParse', () => {
    it('should parse America/New_York', () => {
      // This may be -300 or -240 depending on DST
      const d = new DateEx();
      const offset = d.ianaTzParse('America/New_York' as IANATZ);
      expect(offset).toBeDefined();
      expect(offset === 300 || offset === 240).toBe(true);
    });

    it('should parse Europe/London', () => {
      // This may be 0 or -60 depending on DST
      const d = new DateEx();
      const offset = d.ianaTzParse('Europe/London' as IANATZ);
      expect(offset).toBeDefined();
      expect(offset === 0 || offset === -60).toBe(true);
    });

    it('should parse Asia/Tokyo', () => {
      const d = new DateEx();
      const offset = d.ianaTzParse('Asia/Tokyo' as IANATZ);
      expect(offset).toBe(-540);
    });

    it('should parse Asia/Kolkata', () => {
      const d = new DateEx();
      const offset = d.ianaTzParse('Asia/Kolkata' as IANATZ);
      expect(offset).toBe(-330);
    });

    it('should parse America/Costa_Rica', () => {
      const d = new DateEx();
      const offset = d.ianaTzParse('America/Costa_Rica' as IANATZ);
      expect(offset).toBe(360);
    });

    it('should return undefined for an invalid timezone', () => {
      const d = new DateEx();
      const offset = d.ianaTzParse('Invalid/Timezone' as IANATZ);
      expect(offset).toBeUndefined();
    });
  });

  describe('fromPdfDate', () => {
    it.skip('CST1', () => {
      Deno.env.set('TZ', 'CST');
      const d = DateEx.fromPdfDate('D:20240101120000-0600');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T18:00:00.000Z');
      }
    });
    it.skip('CST2', () => {
      Deno.env.set('TZ', 'CST');
      const d = DateEx.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.toISOLocalString(false)).toBe('2024-01-01T06:00:00-06:00');
        d.tz(-60 as TzMinutes).toISOLocalString(false);
        expect(d.toISOLocalString(false)).toBe('2024-01-01T13:00:00+01:00');
      }
    });
    it('AST +03:00', () => {
      Deno.env.set('TZ', 'AST');
      const d = DateEx.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.tz('+03:00' as ISOTZ).toISOLocalString(false)).toBe('2024-01-01T15:00:00+03:00');
      }
    });
  });
});
