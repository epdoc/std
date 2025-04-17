import type { Dict, Integer } from './dep.ts';
import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import type { Seconds } from './mod.ts';
import { DurationRecord } from './record.ts';

const zero = {
  _ms: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  microseconds: 0,
  nanoseconds: 0,
};
const modZero = (mod: Dict) => {
  return Object.assign({}, zero, mod);
};

const constructorTest = (
  days: Integer,
  hours: Integer,
  minutes: Integer,
  seconds: Seconds,
  milliseconds: Integer,
  microseconds: Integer,
  nanoseconds: Integer,
): DurationRecord => {
  const ms = (days * 24 * 3600 + hours * 3600 + minutes * 60 + seconds) * 1000 +
    milliseconds +
    microseconds / 1000 +
    nanoseconds / 1000000;
  const result = {
    _ms: ms,
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    milliseconds: milliseconds,
    microseconds: microseconds,
    nanoseconds: nanoseconds,
  };
  const record = new DurationRecord(ms);
  expect(record).toEqual(result);
  return record;
};

describe('duration-record', () => {
  it('construct from ms', () => {
    expect(new DurationRecord(0)).toEqual(zero);
    expect(new DurationRecord(1)).toEqual(modZero({ _ms: 1, milliseconds: 1 }));
    expect(new DurationRecord(2345)).toEqual(modZero({ _ms: 2345, seconds: 2, milliseconds: 345 }));
    expect(new DurationRecord(2345)).toEqual(modZero({ _ms: 2345, seconds: 2, milliseconds: 345 }));
    constructorTest(0, 0, 0, 2, 345, 0, 0);
    constructorTest(0, 1, 1, 1, 1, 1, 1);
    constructorTest(3, 23, 59, 59, 999, 999, 999);
    expect(new DurationRecord(3454.345898)).toEqual(
      modZero({ _ms: 3454.345898, seconds: 3, milliseconds: 454, microseconds: 345, nanoseconds: 898 }),
    );
  });
  describe('prune', () => {
    it('should prune minimum fields correctly', () => {
      const record = new DurationRecord(10000); // 10 seconds
      record.pruneMin('milliseconds');
      expect(record).toEqual(modZero({ _ms: 10000, seconds: 10 })); // Should retain milliseconds
      record.pruneMin('seconds');
      expect(record).toEqual(modZero({ _ms: 10000, seconds: 10 })); // Should retain seconds
    });
    it('should prune minimum fields correctly', () => {
      const record = new DurationRecord(6000 + 4 * 60000); // 4 minutes 10 seconds
      record.pruneMin('seconds');
      expect(record).toEqual(modZero({ _ms: 246000, minutes: 4, seconds: 6 })); // Should retain milliseconds
      record.pruneMin('minutes');
      expect(record).toEqual(modZero({ _ms: 246000, minutes: 4.1, seconds: 0 })); // Should retain seconds
    });

    it('should prune maximum fields correctly', () => {
      const record = new DurationRecord(10000); // 10 seconds
      record.pruneMax('seconds');
      expect(record).toEqual(modZero({ _ms: 10000, seconds: 10 })); // Should retain seconds
      record.pruneMax('milliseconds');
      expect(record).toEqual(modZero({ _ms: 10000, milliseconds: 10000 })); // Should retain milliseconds
    });
  });
});
