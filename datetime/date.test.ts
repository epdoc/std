import { describe, it } from 'jsr:@std/testing/bdd';
import process from 'node:process';
import { DateEx, dateEx } from './date.ts';
import { expect } from 'jsr:@std/expect@^1.0.15';

// TODO: remove skip when deno date is fixed

describe('date-util', () => {
  // Test is using CST
  describe('tz statics', () => {
    it('parse', () => {
      expect(DateEx.tzParse('-06:00')).toEqual(360);
      expect(DateEx.tzParse('+06:00')).toEqual(-360);
      expect(DateEx.tzParse('-02:30')).toEqual(150);
      expect(DateEx.tzParse('+01:00')).toEqual(-60);
      expect(DateEx.tzParse('+00:00')).toEqual(0);
      expect(DateEx.tzParse('-00:00')).toEqual(0);
      expect(DateEx.tzParse('Z')).toEqual(0);
    });
    it('format', () => {
      expect(DateEx.tzFormat(-360)).toEqual('+06:00');
      expect(DateEx.tzFormat(360)).toEqual('-06:00');
      expect(DateEx.tzFormat(-390)).toEqual('+06:30');
      expect(DateEx.tzFormat(+150)).toEqual('-02:30');
      expect(DateEx.tzFormat(0)).toEqual('Z');
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
      const tz = DateEx.tzFormat(120);
      expect(tz).toEqual('-02:00');
    });
    it('360', () => {
      const tz = DateEx.tzFormat(360);
      expect(tz).toEqual('-06:00');
    });
    it('-360', () => {
      const tz = DateEx.tzFormat(-360);
      expect(tz).toEqual('+06:00');
    });
  });
  describe('tz set offset', () => {
    it('30', () => {
      const d = dateEx();
      d.tz(-30);
      expect(d.getTz()).toEqual(-30);
      d.tz('-05:00');
      expect(d.getTz()).toEqual(300);
    });
  });
  describe('withTz', () => {
    it('local', () => {
      process.env.TZ = 'America/Costa_Rica';
      const d: DateEx = dateEx(2024, 0, 1, 11, 59, 59, 456).withTz();
      expect(d.toISOLocalString()).toEqual('2024-01-01T11:59:59.456-06:00');
    });
  });
  describe('toISOLocaleString', () => {
    const d = new Date('1997-11-25T12:13:14.456Z');
    process.env.TZ = 'CST';
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
    const du = new DateEx(d).tz('-06:00');
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
    const du = new DateEx(d).tz(-150);
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
    const du = new DateEx(d).tz(0);
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
  it('googleSheetsDate', () => {
    const d = new Date('1997-11-25T12:13:14Z');
    expect(new DateEx(d).googleSheetsDate()).toEqual(35759.25918981482);
  });
  describe('fromPdfDate', () => {
    it.skip('CST1', () => {
      process.env.TZ = 'CST';
      const d = DateEx.fromPdfDate('D:20240101120000-0600');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T18:00:00.000Z');
      }
    });
    it.skip('CST2', () => {
      process.env.TZ = 'CST';
      const d = DateEx.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.toISOLocalString(false)).toBe('2024-01-01T06:00:00-06:00');
        expect(d.tz(-60).toISOLocalString(false)).toBe('2024-01-01T13:00:00+01:00');
      }
    });
    it('AST +03:00', () => {
      process.env.TZ = 'AST';
      const d = DateEx.fromPdfDate('D:20240101120000Z');
      expect(d).toBeDefined();
      if (d instanceof DateEx) {
        expect(d.date.toISOString()).toBe('2024-01-01T12:00:00.000Z');
        expect(d.tz('+03:00').toISOLocalString(false)).toBe('2024-01-01T15:00:00+03:00');
      }
    });
  });
});
