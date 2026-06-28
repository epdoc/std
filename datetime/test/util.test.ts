import { assert, assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import { util } from '../src/mod.ts';

Deno.test('util', async (t) => {
  await t.step('stringToDate', async (t) => {
    await t.step('basic parsing', async (t) => {
      await t.step('should parse yyyyMMdd', () => {
        const d = util.stringToDate('20240102');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 0, 0, 0);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse yyyy-MM-dd', () => {
        const d = util.stringToDate('2024-01-02');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 0, 0, 0);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse yyyy_MM_dd', () => {
        const d = util.stringToDate('2024_01_02');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 0, 0, 0);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse yyyy/MM/dd', () => {
        const d = util.stringToDate('2024/01/02');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 0, 0, 0);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse yyyy MM dd', () => {
        const d = util.stringToDate('2024 01 02');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 0, 0, 0);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse yyyyMMdd_HHmmss', () => {
        const d = util.stringToDate('20240102_102030');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 10, 20, 30);
        assertEquals(d.temporal, d1);
      });

      await t.step('should parse "yyyy-MM-dd HH:mm:ss"', () => {
        const d = util.stringToDate('2024-01-02 10:20:30');
        assert(d);
        assertInstanceOf(d.temporal, Temporal.PlainDateTime);
        const d1 = new Temporal.PlainDateTime(2024, 1, 2, 10, 20, 30);
        assertEquals(d.temporal, d1);
      });
    });

    await t.step('timezone handling', async (t) => {
      await t.step('should handle UTC timezone', () => {
        const d = util.stringToDate('20240102_102030', { tz: 0 });
        assertEquals(d?.toISOString({ fractionalSecondDigits: 0 }), '2024-01-02T10:20:30+00:00');
      });

      await t.step('should handle positive timezone offset', () => {
        const d = util.stringToDate('20240102_102030', { tz: 60 });
        assertEquals(d?.toISOString(), '2024-01-02T10:20:30+01:00');
      });

      await t.step('should handle negative timezone offset', () => {
        Deno.env.set('TZ', 'America/Chicago'); // this does nothing
        const d = util.stringToDate('20240102_102030', { tz: -360 });
        assertEquals(d?.toISOString({ fractionalSecondDigits: 0 }), '2024-01-02T10:20:30-06:00');
      });
    });

    await t.step('invalid dates', async (t) => {
      await t.step('should return undefined for invalid date string', () => {
        assertEquals(util.stringToDate('not a date'), undefined);
      });

      await t.step('should return undefined for invalid month', () => {
        assertEquals(util.stringToDate('20241301'), undefined);
      });

      await t.step('should throw for invalid day', () => {
        assertThrows(() => {
          return util.stringToDate('20240230');
        });
      });
    });
  });
  await t.step('isISODate', async (t) => {
    await t.step('should return true for valid ISO date strings', () => {
      assertEquals(util.isISODate('2025-10-05T10:20:30Z'), true);
      assertEquals(util.isISODate('2025-10-05T10:20:30.123Z'), true);
      assertEquals(util.isISODate('2025-10-05T10:20:30+05:30'), true);
      assertEquals(util.isISODate('2025-10-05T10:20:30.456-07:00'), true);
      assertEquals(util.isISODate('2025-10-05T10:20:30'), true);
      assertEquals(util.isISODate('2025-10-05T10:20:30.123'), true);
    });

    await t.step('should return false for invalid ISO date strings', () => {
      assertEquals(util.isISODate('2025-10-05'), false);
      assertEquals(util.isISODate('10:20:30'), false);
      assertEquals(util.isISODate('2025-10-05 10:20:30'), false);
      assertEquals(util.isISODate('2025/10/05T10:20:30Z'), false);
      assertEquals(util.isISODate('2025-10-05T10:20:30+0530'), false);
      assertEquals(util.isISODate('2025-10-05T10:20:30,123Z'), false);
      assertEquals(util.isISODate('2025-10-05t10:20:30Z'), false);
    });
  });

  await t.step('isISOTZ', async (t) => {
    await t.step('should return true for valid ISO timezone strings', () => {
      assertEquals(util.isISOTZ('-06:00'), true);
      assertEquals(util.isISOTZ('+06:00'), true);
      assertEquals(util.isISOTZ('Z'), true);
    });

    await t.step('should return false for invalid ISO timezone strings', () => {
      assertEquals(util.isISOTZ('-0600'), false);
      assertEquals(util.isISOTZ('GMT-06:00'), false);
    });
  });

  await t.step('isGMTTZ', async (t) => {
    await t.step('should return true for valid GMT timezone strings', () => {
      assertEquals(util.isGMTTZ('GMT-06:00'), true);
      assertEquals(util.isGMTTZ('GMT+06:00'), true);
      assertEquals(util.isGMTTZ('GMT-6'), true);
    });

    await t.step('should return false for invalid GMT timezone strings', () => {
      assertEquals(util.isGMTTZ('-06:00'), false);
      assertEquals(util.isGMTTZ('Z'), false);
    });
  });

  await t.step('isPDFTZ', async (t) => {
    await t.step('should return true for valid PDF timezone strings', () => {
      assertEquals(util.isPDFTZ('-0600'), true);
      assertEquals(util.isPDFTZ('+0600'), true);
      assertEquals(util.isPDFTZ('-06'), true);
      assertEquals(util.isPDFTZ('Z'), true);
    });

    await t.step('should return false for invalid PDF timezone strings', () => {
      assertEquals(util.isPDFTZ('-06:00'), false);
      assertEquals(util.isPDFTZ('GMT-06:00'), false);
    });
  });

  await t.step('isIANATZ', async (t) => {
    await t.step('should return true for valid IANA timezone strings', () => {
      assertEquals(util.isIANATZ('America/New_York'), true);
      assertEquals(util.isIANATZ('Europe/London'), true);
      assertEquals(util.isIANATZ('Asia/Tokyo'), true);
    });

    await t.step('should return false for invalid IANA timezone strings', () => {
      assertEquals(util.isIANATZ('America/New York'), false);
      assertEquals(util.isIANATZ('invalid-timezone'), false);
    });
  });

  await t.step('parseTzString', async (t) => {
    await t.step('numeric offset formats', async (t) => {
      await t.step('should parse -6h as -360', () => {
        assertEquals(util.parseTzString('-6h'), -360);
      });

      await t.step('should parse -06:00 as -360', () => {
        assertEquals(util.parseTzString('-06:00'), -360);
      });

      await t.step('should parse -6h30 as -390', () => {
        assertEquals(util.parseTzString('-6h30'), -390);
      });

      await t.step('should parse +6h as 360', () => {
        assertEquals(util.parseTzString('+6h'), 360);
      });

      await t.step('should parse 6 as 360 (defaults to plus)', () => {
        assertEquals(util.parseTzString('6'), 360);
      });

      await t.step('should parse 6h as 360 (defaults to plus)', () => {
        assertEquals(util.parseTzString('6h'), 360);
      });

      await t.step('should parse +06:00 as 360', () => {
        assertEquals(util.parseTzString('+06:00'), 360);
      });

      await t.step('should parse 0 as 0 (UTC)', () => {
        assertEquals(util.parseTzString('0'), 0);
      });

      await t.step('should parse Z as 0 (UTC)', () => {
        assertEquals(util.parseTzString('Z'), 0);
      });
    });

    await t.step('IANA timezone resolution', async (t) => {
      await t.step('should resolve America/Chicago to a valid offset', () => {
        const result = util.parseTzString('America/Chicago');
        assert(typeof result === 'number');
        assert(Number.isInteger(result));
      });

      await t.step('should resolve partial IANA name', () => {
        const result = util.parseTzString('chicago');
        assert(typeof result === 'number');
        assert(Number.isInteger(result));
      });
    });

    await t.step('invalid inputs', async (t) => {
      await t.step('should return undefined for empty string', () => {
        assertEquals(util.parseTzString(''), undefined);
      });

      await t.step('should return undefined for gibberish', () => {
        assertEquals(util.parseTzString('not-a-tz'), undefined);
      });

      await t.step('should return undefined for hours > 24', () => {
        assertEquals(util.parseTzString('25h'), undefined);
      });

      await t.step('should return undefined for minutes > 59', () => {
        assertEquals(util.parseTzString('6h70'), undefined);
      });
    });
  });

  await t.step('resolveIANATZ', async (t) => {
    await t.step('should resolve full IANA name', () => {
      assertEquals(util.resolveIANATZ('America/Chicago'), 'America/Chicago');
    });

    await t.step('should resolve case-insensitive IANA name', () => {
      assertEquals(util.resolveIANATZ('america/chicago'), 'America/Chicago');
    });

    await t.step('should resolve partial match', () => {
      assertEquals(util.resolveIANATZ('chicago'), 'America/Chicago');
    });

    await t.step('should return undefined for no match', () => {
      assertEquals(util.resolveIANATZ('nonexistent/zone'), undefined);
    });

    await t.step('should return undefined for ambiguous partial match', () => {
      // 'europe' should match only Europe/...
      const result = util.resolveIANATZ('europe');
      // There should be many matches for 'europe', so undefined
      assertEquals(result, undefined);
    });
  });
});
