import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import { DurationUtil, FormatMsOptions } from '../mod.ts';

describe('duration-util', () => {
  describe('significantDigits', () => {
    it('defaults', () => {
      expect(DurationUtil.significantMillisecondDigits(0)).toEqual(0);
      expect(DurationUtil.significantMillisecondDigits(1)).toEqual(3);
      expect(DurationUtil.significantMillisecondDigits(10)).toEqual(2);
      expect(DurationUtil.significantMillisecondDigits(100)).toEqual(1);
      expect(DurationUtil.significantMillisecondDigits(10.5)).toEqual(4);
      expect(DurationUtil.significantMillisecondDigits(100.2)).toEqual(4);
      expect(DurationUtil.significantMillisecondDigits(4)).toEqual(3);
      expect(DurationUtil.significantMillisecondDigits(345.6786)).toEqual(7);
      expect(DurationUtil.significantMillisecondDigits(100.000009)).toEqual(9);
    });
  });
  describe(':', () => {
    it('defaults', () => {
      expect(new DurationUtil(-4443454).format()).toEqual('1:14:03.454');
      expect(new DurationUtil(-4443454).options(':').format()).toEqual('1:14:03.454');
      expect(new DurationUtil(982440990, ':').format()).toEqual('11d08:54:00.990');
      expect(new DurationUtil(982440990).format()).toEqual('11d08:54:00.990');
      expect(new DurationUtil(982440990).options(':').format()).toEqual('11d08:54:00.990');
      expect(new DurationUtil(3454).format()).toEqual('0:03.454');
      expect(new DurationUtil(455).format()).toEqual('0:00.455');
      expect(new DurationUtil(1).format()).toEqual('0:00.001');
      expect(new DurationUtil(0).format()).toEqual('0:00.000');
    });
    it('overrides', () => {
      expect(new DurationUtil(982440990).options(':').options({ ms: false }).format()).toEqual('11d08:54:01');
      expect(new DurationUtil(3454).options({ decimal: ',' }).format()).toEqual('0:03,454');
    });
  });
  describe('hms', () => {
    it('defaults', () => {
      expect(new DurationUtil(-4443454).options('hms').format()).toEqual('1h14m03.454s');
      expect(new DurationUtil(982440990).format('hms')).toEqual('11d08h54m00.990s');
      expect(new DurationUtil(3454, 'hms').format()).toEqual('3.454s');
      expect(new DurationUtil(455).format('hms')).toEqual('0.455s');
      expect(new DurationUtil(1).options('hms').format()).toEqual('0.001s');
      expect(new DurationUtil(0).format('hms')).toEqual('0.000s');
    });
    it('overrides', () => {
      expect(new DurationUtil(982440990).options('hms').options({ ms: false }).format()).toEqual(
        '11d08h54m01s',
      );
      expect(new DurationUtil(3454, 'hms').options({ decimal: ',' }).format()).toEqual('3,454s');
    });
    it('millisecond precision', () => {
      expect(new DurationUtil(3454, 'hms').options({ ms: 3 }).format()).toEqual('3.454s');
      expect(new DurationUtil(3454, 'hms').options({ ms: 2 }).format()).toEqual('3.45s');
      expect(new DurationUtil(3454, 'hms').options({ ms: 1 }).format()).toEqual('3.5s');
      expect(new DurationUtil(3454, 'hms').options({ ms: 0 }).format()).toEqual('3s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '3' }).format()).toEqual('3.454s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '2' }).format()).toEqual('3.45s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '1' }).format()).toEqual('3.5s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '0' }).format()).toEqual('3s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '3?' }).format()).toEqual('3.454s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '2?' }).format()).toEqual('3.454s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '1?' }).format()).toEqual('3.454s');
      expect(new DurationUtil(3454, 'hms').options({ ms: '0?' }).format()).toEqual('3.454s');
      expect(new DurationUtil(3450, 'hms').options({ ms: '3?' }).format()).toEqual('3.450s');
      expect(new DurationUtil(3450, 'hms').options({ ms: '2?' }).format()).toEqual('3.45s');
      expect(new DurationUtil(3450, 'hms').options({ ms: '1?' }).format()).toEqual('3.45s');
      expect(new DurationUtil(3450, 'hms').options({ ms: '0?' }).format()).toEqual('3.45s');
      expect(new DurationUtil(3400, 'hms').options({ ms: '3?' }).format()).toEqual('3.400s');
      expect(new DurationUtil(3400, 'hms').options({ ms: '2?' }).format()).toEqual('3.40s');
      expect(new DurationUtil(3400, 'hms').options({ ms: '1?' }).format()).toEqual('3.4s');
      expect(new DurationUtil(3400, 'hms').options({ ms: '0?' }).format()).toEqual('3.4s');
      expect(new DurationUtil(3000, 'hms').options({ ms: '3?' }).format()).toEqual('3.000s');
      expect(new DurationUtil(3000, 'hms').options({ ms: '2?' }).format()).toEqual('3.00s');
      expect(new DurationUtil(3000, 'hms').options({ ms: '1?' }).format()).toEqual('3.0s');
      expect(new DurationUtil(3000, 'hms').options({ ms: '0?' }).format()).toEqual('3s');
    });
    it('hr milliseconds', () => {
      expect(new DurationUtil(3454.345898, 'hms').options({ ms: 6 }).format()).toEqual('3.454346s');
    });
    it('truncate', () => {
      const opts: FormatMsOptions = {
        d: 'd',
        h: 'h',
        m: 'm',
        s: 's',
        ms: true,
        compact: true,
        decimal: '.',
      };
      expect(new DurationUtil(567173456, opts).format()).toEqual('6d13h32m53.456s');
      expect(new DurationUtil(567123456, opts).options({ s: false }).format()).toEqual('6d13h32m');
      expect(new DurationUtil(567123456, opts).options({ s: 's', m: false }).format()).toEqual('6d13h');
    });
  });
  describe('long', () => {
    it('defaults', () => {
      expect(new DurationUtil(-4443454, 'long').format()).toEqual(
        '1 hour, 14 minutes, 3 seconds, 454 milliseconds',
      );
      expect(new DurationUtil(-4443454).options('long').format()).toEqual(
        '1 hour, 14 minutes, 3 seconds, 454 milliseconds',
      );
      expect(new DurationUtil(982440990).options('long').format()).toEqual(
        '11 days, 8 hours, 54 minutes, 990 milliseconds',
      );
    });
    it('overrides', () => {
      expect(new DurationUtil(982440990).options('long').options({ ms: false }).format()).toEqual(
        '11 days, 8 hours, 54 minutes, 1 second',
      );
      // Turn off display of ms and remove commas from long format output
      expect(new DurationUtil(982442990, 'long').options({ sep: ' ', ms: false }).format()).toEqual(
        '11 days 8 hours 54 minutes 3 seconds',
      );
      // Same as previous, but also turn off output of seconds
      expect(
        new DurationUtil(982442990, 'long')
          .options({
            sep: ' ',
            ms: false,
            s: false,
          })
          .format(),
      ).toEqual('11 days 8 hours 54 minutes');
      // Same as previous, but set ms and s to false to get them to not display
      expect(
        new DurationUtil(982442990, 'long')
          .options({
            sep: ' ',
            ms: false,
            s: false,
          })
          .format(),
      ).toEqual('11 days 8 hours 54 minutes');
    });
  });
  it('milliseconds', () => {
    expect(new DurationUtil(4443454).options('long').format({ ms: 'ms' })).toEqual(
      '1 hour, 14 minutes, 3 seconds, 454 ms',
    );
    expect(new DurationUtil(4443454).options('long').format({ ms: false })).toEqual(
      '1 hour, 14 minutes, 3 seconds',
    );
    expect(new DurationUtil(4443454).format()).toEqual('1:14:03.454');
    expect(new DurationUtil(4443454).options('hms').options({ ms: 1 }).format()).toEqual('1h14m03.5s');
    expect(new DurationUtil(4443454).options(':').options({ ms: 2 }).format()).toEqual('1:14:03.45');
    expect(new DurationUtil(4443454).options(':').options({ ms: 1 }).format()).toEqual('1:14:03.5');
    expect(new DurationUtil(4443454).options('hms').options({ ms: 3 }).format()).toEqual('1h14m03.454s');
    expect(new DurationUtil(4443454).options('hms').options({ ms: false }).format()).toEqual('1h14m03s');
    expect(new DurationUtil(4443454).options(':').options({ ms: false }).format()).toEqual('1:14:03');
  });
});
