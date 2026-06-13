import type { Dict, Integer } from '@epdoc/type';
import { assertEquals } from '@std/assert';
import { Duration, type Seconds } from '../src/mod.ts';

function assertRecord(actual: Duration.Record, expected: Record<string, unknown>) {
  const actualObj: Record<string, unknown> = {};
  for (const key of Object.keys(expected)) {
    actualObj[key] = (actual as unknown as Record<string, unknown>)[key];
  }
  assertEquals(actualObj, expected);
}

const zero: Record<string, number> = {
  _ms: 0,
  years: 0,
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
  years: Integer,
  days: Integer,
  hours: Integer,
  minutes: Integer,
  seconds: Seconds,
  milliseconds: Integer,
  microseconds: Integer,
  nanoseconds: Integer,
): Duration.Record => {
  const ms = (days * 24 * 3600 + hours * 3600 + minutes * 60 + seconds) * 1000 +
    milliseconds +
    microseconds / 1000 +
    nanoseconds / 1000000;
  const result = {
    _ms: ms,
    years: years,
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    milliseconds: milliseconds,
    microseconds: microseconds,
    nanoseconds: nanoseconds,
  };
  const record = new Duration.Record(ms);
  assertRecord(record, result);
  return record;
};

Deno.test('duration-record', async (t) => {
  await t.step('construct from ms', () => {
    assertRecord(new Duration.Record(0), zero);
    assertRecord(new Duration.Record(1), modZero({ _ms: 1, milliseconds: 1 }));
    assertRecord(new Duration.Record(2345), modZero({ _ms: 2345, seconds: 2, milliseconds: 345 }));
    assertRecord(new Duration.Record(2345), modZero({ _ms: 2345, seconds: 2, milliseconds: 345 }));
    constructorTest(0, 0, 0, 0, 2, 345, 0, 0);
    constructorTest(0, 0, 1, 1, 1, 1, 1, 0);
    constructorTest(0, 3, 23, 59, 59, 999, 999, 998);
    assertRecord(
      new Duration.Record(3454.345898),
      modZero({ _ms: 3454.345898, seconds: 3, milliseconds: 454, microseconds: 345, nanoseconds: 898 }),
    );
  });
  await t.step('prune', async (t) => {
    await t.step('should prune minimum fields correctly', () => {
      const record = new Duration.Record(10000);
      record.pruneMin('milliseconds');
      assertRecord(record, modZero({ _ms: 10000, seconds: 10 }));
      record.pruneMin('seconds');
      assertRecord(record, modZero({ _ms: 10000, seconds: 10 }));
    });
    await t.step('should prune minimum fields correctly', () => {
      const record = new Duration.Record(6000 + 4 * 60000);
      record.pruneMin('seconds');
      assertRecord(record, modZero({ _ms: 246000, minutes: 4, seconds: 6 }));
      record.pruneMin('minutes');
      assertRecord(record, modZero({ _ms: 246000, minutes: 4.1, seconds: 0 }));
    });

    await t.step('should prune maximum fields correctly', () => {
      const record = new Duration.Record(10000);
      record.pruneMax('seconds');
      assertRecord(record, modZero({ _ms: 10000, seconds: 10 }));
      record.pruneMax('milliseconds');
      assertRecord(record, modZero({ _ms: 10000, milliseconds: 10000 }));
    });
  });
});
