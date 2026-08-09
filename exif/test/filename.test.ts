import type { DateTime } from '@epdoc/datetime';
import { assertEquals } from '@std/assert';
import { dateFromFilename, isWhatsAppFilename } from '../src/mod.ts';

function fmt(dt: DateTime | undefined): string | undefined {
  if (!dt) return undefined;
  if (dt.temporal instanceof Temporal.Instant) {
    return dt.withTz('utc').format('yyyy-MM-dd HH:mm:ss');
  }
  return dt.format('yyyy-MM-dd HH:mm:ss');
}

Deno.test('dateFromFilename', async (t) => {
  await t.step('parses WhatsApp mobile IMG pattern as a midnight date', () => {
    const dt = dateFromFilename('IMG-20260406-WA0005.jpg');
    assertEquals(fmt(dt), '2026-04-06 00:00:00');
    assertEquals(dt?.hasTimezone(), false);
  });

  await t.step('parses WhatsApp mobile VID pattern as a midnight date', () => {
    assertEquals(fmt(dateFromFilename('VID-20260519-WA0014.mp4')), '2026-05-19 00:00:00');
  });

  await t.step('parses macOS WhatsApp download with full datetime', () => {
    const dt = dateFromFilename('WhatsApp Image 2026-06-29 at 17.20.56.jpeg');
    assertEquals(fmt(dt), '2026-06-29 17:20:56');
  });

  await t.step('parses macOS WhatsApp video with full datetime', () => {
    assertEquals(
      fmt(dateFromFilename('WhatsApp Video 2026-08-04 at 09.10.11.mp4')),
      '2026-08-04 09:10:11',
    );
  });

  await t.step('parses Signal pattern with milliseconds', () => {
    assertEquals(
      fmt(dateFromFilename('signal-2026-06-29-17-20-56-123.png')),
      '2026-06-29 17:20:56',
    );
  });

  await t.step('parses epoch milliseconds as a UTC instant', () => {
    const ms = 1710523256000;
    const dt = dateFromFilename(`IMG_${ms}.jpg`);
    assertEquals(dt?.epochMilliseconds, ms);
    assertEquals(fmt(dt), '2024-03-15 17:20:56');
  });

  await t.step('parses a generic compact datetime', () => {
    assertEquals(fmt(dateFromFilename('IMG_20260406_172056.jpg')), '2026-04-06 17:20:56');
    assertEquals(fmt(dateFromFilename('photo-2026-06-29-17-20-56.jpeg')), '2026-06-29 17:20:56');
  });

  await t.step('returns undefined for empty or unmatched names', () => {
    assertEquals(dateFromFilename(undefined), undefined);
    assertEquals(dateFromFilename(''), undefined);
    assertEquals(dateFromFilename('random.jpeg'), undefined);
  });

  await t.step('returns undefined for invalid dates in a pattern', () => {
    assertEquals(dateFromFilename('IMG-20261345-WA0005.jpg'), undefined);
  });
});

Deno.test('isWhatsAppFilename', async (t) => {
  await t.step('detects both WhatsApp naming conventions', () => {
    assertEquals(isWhatsAppFilename('IMG-20260406-WA0005.jpg'), true);
    assertEquals(isWhatsAppFilename('VID-20260406-WA0005.mp4'), true);
    assertEquals(isWhatsAppFilename('WhatsApp Image 2026-06-29 at 17.20.56.jpeg'), true);
  });

  await t.step('rejects other filenames', () => {
    assertEquals(isWhatsAppFilename('a.jpg'), false);
    assertEquals(isWhatsAppFilename('tiktok-video.mp4'), false);
    assertEquals(isWhatsAppFilename(undefined), false);
  });
});
