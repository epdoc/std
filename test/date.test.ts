import { DateUtil } from '../src/date-util';

describe('date-util', () => {
  // Test is using CST
  describe('tz offset', () => {
    it('120', () => {
      process.env.TZ = 'CST';
      const tz = new Date().getTimezoneOffset();
      expect(tz).toEqual(360);
    });
    it('120', () => {
      const tz = DateUtil.tz(120);
      expect(tz).toEqual('-02:00');
    });
    it('360', () => {
      const tz = DateUtil.tz(360);
      expect(tz).toEqual('-06:00');
    });
    it('-360', () => {
      const tz = DateUtil.tz(-360);
      expect(tz).toEqual('+06:00');
    });
  });
  describe('toISOLocaleString', () => {
    var d = new Date('1997-11-25T12:13:14.456Z');
    process.env.TZ = 'CST';
    it('default', () => {
      expect(d.toISOString()).toEqual('1997-11-25T12:13:14.456Z');
      expect(new DateUtil(d).toISOLocaleString()).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('show milliseconds', () => {
      expect(new DateUtil(d).toISOLocaleString(true)).toEqual('1997-11-25T06:13:14.456-06:00');
    });
    it('hide milliseconds', () => {
      expect(new DateUtil(d).toISOLocaleString(false)).toEqual('1997-11-25T06:13:14-06:00');
    });
  });
  it('formatLocale', () => {
    var d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateUtil(d).format('YYYY-MM-DD')).toEqual('1997-11-25');
    expect(new DateUtil(d).format('YYYYMMDD')).toEqual('19971125');
    expect(new DateUtil(d).format('YYYYMMDD_HHmmss')).toEqual('19971125_061314');
    expect(new DateUtil(d).formatUTC('YYYYMMDD_HHmmss')).toEqual('19971125_121314');
  });
  it('julianDate', () => {
    var d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateUtil(d).julianDate()).toEqual(2450778);
  });
  it('googleSheetsDate', () => {
    var d = new Date('1997-11-25T12:13:14Z');
    expect(new DateUtil(d).googleSheetsDate()).toEqual(35759.25918981482);
  });
  describe('fromPdfDate', () => {
    it('CST1', () => {
      process.env.TZ = 'CST';
      let d = DateUtil.fromPdfDate('D:20240101120000-0600');
      expect(d).toBeDefined();
      if (DateUtil.isInstance(d)) {
        expect(d.date.toISOString()).toBe('2024-01-01T18:00:00.000Z');
      }
    });
    it('CST2', () => {
      process.env.TZ = 'CST';
      let d = DateUtil.fromPdfDate('D:20240101000000Z');
      expect(d).toBeDefined();
      if (DateUtil.isInstance(d)) {
        expect(d.date.toISOString()).toBe('2024-01-01T06:00:00.000Z');
      }
    });
  });
});
