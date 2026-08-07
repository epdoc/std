import { assertEquals } from '@std/assert';
import { Meta } from '../src/mod.ts';

Deno.test('Meta.Parse.focalLength', async (t) => {
  await t.step('returns numeric value as-is for positive numbers', () => {
    assertEquals(Meta.Parse.focalLength(50), 50);
    assertEquals(Meta.Parse.focalLength(6.8), 6.8);
  });

  await t.step('rejects non-positive numbers', () => {
    assertEquals(Meta.Parse.focalLength(0), undefined);
    assertEquals(Meta.Parse.focalLength(-10), undefined);
    assertEquals(Meta.Parse.focalLength(NaN), undefined);
  });

  await t.step('parses "mm" suffix', () => {
    assertEquals(Meta.Parse.focalLength('50 mm'), 50);
    assertEquals(Meta.Parse.focalLength('24mm'), 24);
    assertEquals(Meta.Parse.focalLength('6.8 mm'), 6.8);
  });

  await t.step('parses bare number strings', () => {
    assertEquals(Meta.Parse.focalLength('50'), 50);
    assertEquals(Meta.Parse.focalLength('6.8'), 6.8);
  });

  await t.step('parses rational/fractional strings', () => {
    assertEquals(Meta.Parse.focalLength('50/1'), 50);
    assertEquals(Meta.Parse.focalLength('27/5'), 5.4);
  });

  await t.step('rejects zero denominator in fraction', () => {
    assertEquals(Meta.Parse.focalLength('50/0'), undefined);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.focalLength(undefined), undefined);
    assertEquals(Meta.Parse.focalLength('n/a'), undefined);
    assertEquals(Meta.Parse.focalLength(''), undefined);
    assertEquals(Meta.Parse.focalLength('  '), undefined);
  });
});

Deno.test('Meta.Parse.fNumber', async (t) => {
  await t.step('returns numeric value as-is for positive numbers', () => {
    assertEquals(Meta.Parse.fNumber(1.8), 1.8);
    assertEquals(Meta.Parse.fNumber(16), 16);
  });

  await t.step('rejects non-positive numbers', () => {
    assertEquals(Meta.Parse.fNumber(0), undefined);
    assertEquals(Meta.Parse.fNumber(-1), undefined);
    assertEquals(Meta.Parse.fNumber(NaN), undefined);
  });

  await t.step('parses bare number strings', () => {
    assertEquals(Meta.Parse.fNumber('1.9'), 1.9);
    assertEquals(Meta.Parse.fNumber('16'), 16);
  });

  await t.step('parses "f/" prefix case-insensitively', () => {
    assertEquals(Meta.Parse.fNumber('f/1.9'), 1.9);
    assertEquals(Meta.Parse.fNumber('F/2.8'), 2.8);
    assertEquals(Meta.Parse.fNumber('f/16'), 16);
  });

  await t.step('handles whitespace after f/ prefix', () => {
    assertEquals(Meta.Parse.fNumber('f/ 2.8'), 2.8);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.fNumber(undefined), undefined);
    assertEquals(Meta.Parse.fNumber('n/a'), undefined);
    assertEquals(Meta.Parse.fNumber(''), undefined);
  });
});

Deno.test('Meta.Parse.exposureTime', async (t) => {
  await t.step('returns numeric value as-is for non-negative numbers', () => {
    assertEquals(Meta.Parse.exposureTime(0.004), 0.004);
    assertEquals(Meta.Parse.exposureTime(1), 1);
    assertEquals(Meta.Parse.exposureTime(0), 0);
  });

  await t.step('rejects negative and NaN numbers', () => {
    assertEquals(Meta.Parse.exposureTime(-1), undefined);
    assertEquals(Meta.Parse.exposureTime(NaN), undefined);
  });

  await t.step('parses rational strings like "1/235"', () => {
    assertEquals(Meta.Parse.exposureTime('1/235'), 1 / 235);
    assertEquals(Meta.Parse.exposureTime('1/1000'), 0.001);
    assertEquals(Meta.Parse.exposureTime('2/1'), 2);
  });

  await t.step('parses rational strings with whitespace', () => {
    assertEquals(Meta.Parse.exposureTime('1 / 500'), 1 / 500);
  });

  await t.step('parses decimal strings', () => {
    assertEquals(Meta.Parse.exposureTime('0.004'), 0.004);
    assertEquals(Meta.Parse.exposureTime('30'), 30);
  });

  await t.step('rejects zero denominator', () => {
    assertEquals(Meta.Parse.exposureTime('1/0'), undefined);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.exposureTime(undefined), undefined);
    assertEquals(Meta.Parse.exposureTime('n/a'), undefined);
    assertEquals(Meta.Parse.exposureTime(''), undefined);
  });
});

Deno.test('Meta.Parse.subjectDistance', async (t) => {
  await t.step('returns numeric value as-is for non-negative numbers', () => {
    assertEquals(Meta.Parse.subjectDistance(0.28), 0.28);
    assertEquals(Meta.Parse.subjectDistance(5), 5);
    assertEquals(Meta.Parse.subjectDistance(0), 0);
  });

  await t.step('rejects negative and NaN numbers', () => {
    assertEquals(Meta.Parse.subjectDistance(-1), undefined);
    assertEquals(Meta.Parse.subjectDistance(NaN), undefined);
  });

  await t.step('parses strings with "m" suffix', () => {
    assertEquals(Meta.Parse.subjectDistance('0.28 m'), 0.28);
    assertEquals(Meta.Parse.subjectDistance('5 m'), 5);
  });

  await t.step('parses bare number strings', () => {
    assertEquals(Meta.Parse.subjectDistance('0.28'), 0.28);
    assertEquals(Meta.Parse.subjectDistance('5'), 5);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.subjectDistance(undefined), undefined);
    assertEquals(Meta.Parse.subjectDistance('n/a'), undefined);
    assertEquals(Meta.Parse.subjectDistance(''), undefined);
  });
});

Deno.test('Meta.Parse.fileSize', async (t) => {
  await t.step('returns numeric value as-is for non-negative numbers', () => {
    assertEquals(Meta.Parse.fileSize(1024), 1024);
    assertEquals(Meta.Parse.fileSize(0), 0);
  });

  await t.step('rejects negative and NaN numbers', () => {
    assertEquals(Meta.Parse.fileSize(-1), undefined);
    assertEquals(Meta.Parse.fileSize(NaN), undefined);
  });

  await t.step('parses unit suffixes case-insensitively', () => {
    assertEquals(Meta.Parse.fileSize('2.8 MB'), 2_800_000);
    assertEquals(Meta.Parse.fileSize('452 kB'), 452_000);
    assertEquals(Meta.Parse.fileSize('1.5 GB'), 1_500_000_000);
    assertEquals(Meta.Parse.fileSize('500 TB'), 500_000_000_000_000);
    assertEquals(Meta.Parse.fileSize('100 B'), 100);
  });

  await t.step('parses bare number strings as bytes', () => {
    assertEquals(Meta.Parse.fileSize('2048'), 2048);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.fileSize(undefined), undefined);
    assertEquals(Meta.Parse.fileSize('n/a'), undefined);
    assertEquals(Meta.Parse.fileSize(''), undefined);
  });
});

Deno.test('Meta.Parse.bitrate', async (t) => {
  await t.step('returns numeric value as-is for non-negative numbers', () => {
    assertEquals(Meta.Parse.bitrate(1_000_000), 1_000_000);
    assertEquals(Meta.Parse.bitrate(0), 0);
  });

  await t.step('rejects negative and NaN numbers', () => {
    assertEquals(Meta.Parse.bitrate(-1), undefined);
    assertEquals(Meta.Parse.bitrate(NaN), undefined);
  });

  await t.step('parses unit suffixes case-insensitively', () => {
    assertEquals(Meta.Parse.bitrate('631 kbps'), 631_000);
    assertEquals(Meta.Parse.bitrate('43.5 Mbps'), 43_500_000);
    assertEquals(Meta.Parse.bitrate('1.2 Gbps'), 1_200_000_000);
    assertEquals(Meta.Parse.bitrate('800 kbps'), 800_000);
  });

  await t.step('parses bare number strings as bps', () => {
    assertEquals(Meta.Parse.bitrate('5000'), 5000);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.bitrate(undefined), undefined);
    assertEquals(Meta.Parse.bitrate('n/a'), undefined);
    assertEquals(Meta.Parse.bitrate(''), undefined);
  });
});
