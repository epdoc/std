import { DateUtil } from './../src';

describe('date-util', () => {
  // Test is using CST
  describe('tz offset', () => {
    it('120', () => {
      process.env.TZ = 'CST';
      const tz = new Date().getTimezoneOffset();
      expect(tz).toEqual(300);
    });
    it('120', () => {
      const tz = DateUtil .tz(120);
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
  it('julianDate', () => {
    var d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateUtil(d).julianDate()).toEqual(2450778);
  });
  it('googleSheetsDate', () => {
    var d = new Date('1997-11-25T12:13:14Z');
    expect(new DateUtil(d).googleSheetsDate()).toEqual(35759.25918981482);
  });
});
