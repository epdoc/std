import { assertEquals } from '@std/assert';
import { util } from '../src/mod.ts';

Deno.test('stringToDate', async (t) => {
  await t.step('basic parsing', async (t) => {
    await t.step('should parse yyyyMMdd', () => {
      const d = util.stringToDate('20240102');
      assertEquals(d, new Date(2024, 0, 2, 0, 0, 0));
    });

    await t.step('should parse yyyy-MM-dd', () => {
      const d = util.stringToDate('2024-01-02');
      assertEquals(d, new Date(2024, 0, 2, 0, 0, 0));
    });

    await t.step('should parse yyyy_MM_dd', () => {
      const d = util.stringToDate('2024_01_02');
      assertEquals(d, new Date(2024, 0, 2, 0, 0, 0));
    });

    await t.step('should parse yyyy/MM/dd', () => {
      const d = util.stringToDate('2024/01/02');
      assertEquals(d, new Date(2024, 0, 2, 0, 0, 0));
    });

    await t.step('should parse yyyy MM dd', () => {
      const d = util.stringToDate('2024 01 02');
      assertEquals(d, new Date(2024, 0, 2, 0, 0, 0));
    });

    await t.step('should parse yyyyMMdd_HHmmss', () => {
      const d = util.stringToDate('20240102_102030');
      assertEquals(d, new Date(2024, 0, 2, 10, 20, 30));
    });

    await t.step('should parse "yyyy-MM-dd HH:mm:ss"', () => {
      const d = util.stringToDate('2024-01-02 10:20:30');
      assertEquals(d, new Date(2024, 0, 2, 10, 20, 30));
    });
  });

  await t.step('timezone handling', async (t) => {
    await t.step('should handle UTC timezone', () => {
      const d = util.stringToDate('20240102_102030', { tz: 0 });
      assertEquals(d?.toISOString(), '2024-01-02T10:20:30.000Z');
    });

    await t.step('should handle positive timezone offset', () => {
      const d = util.stringToDate('20240102_102030', { tz: 60 });
      assertEquals(d?.toISOString(), '2024-01-02T09:20:30.000Z');
    });

    await t.step('should handle negative timezone offset', () => {
      Deno.env.set('TZ', 'America/Chicago');
      const d = util.stringToDate('20240102_102030', { tz: -360 });
      assertEquals(d?.toISOString(), '2024-01-02T16:20:30.000Z');
    });
  });

  await t.step('invalid dates', async (t) => {
    await t.step('should return undefined for invalid date string', () => {
      assertEquals(util.stringToDate('not a date'), undefined);
    });

    await t.step('should return undefined for invalid month', () => {
      assertEquals(util.stringToDate('20241301'), undefined);
    });

    await t.step('should return undefined for invalid day', () => {
      assertEquals(util.stringToDate('20240230'), undefined);
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
});
