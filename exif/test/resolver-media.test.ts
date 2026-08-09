import { DateTime, type ISOTZ } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import type { Metadata } from '../src/meta-types.ts';
import { Meta } from '../src/mod.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

function imageMeta(partial: Record<string, unknown> = {}): Metadata {
  return {
    SourceFile: sourceFile('/tmp/a.jpg'),
    ExifToolVersion: 12.0,
    FileName: 'a.jpg',
    Directory: '/tmp',
    MIMEType: 'image/jpeg',
    FileType: 'JPEG',
    FileTypeExtension: 'jpg',
    ImageWidth: 1920,
    ImageHeight: 1080,
    ...partial,
  };
}

function videoMeta(partial: Record<string, unknown> = {}): Metadata {
  return {
    SourceFile: sourceFile('/tmp/b.mp4'),
    ExifToolVersion: 12.0,
    FileName: 'b.mp4',
    Directory: '/tmp',
    MIMEType: 'video/mp4',
    FileType: 'MP4',
    FileTypeExtension: 'mp4',
    ...partial,
  };
}

// --- type() ---

Deno.test('Resolver.type', async (t) => {
  await t.step('returns "image" for image/jpeg', () => {
    assertEquals(Meta.Resolver.from(imageMeta()).type, 'image');
  });

  await t.step('returns "video" for video/mp4', () => {
    assertEquals(Meta.Resolver.from(videoMeta()).type, 'video');
  });

  await t.step('returns "audio" for audio/mpeg', () => {
    assertEquals(Meta.Resolver.from(videoMeta({ MIMEType: 'audio/mpeg' })).type, 'audio');
  });

  await t.step('returns "application" for application/pdf', () => {
    assertEquals(Meta.Resolver.from(videoMeta({ MIMEType: 'application/pdf' })).type, 'pdf');
  });

  await t.step('returns "application" for application/octet-stream', () => {
    assertEquals(Meta.Resolver.from(videoMeta({ MIMEType: 'application/octet-stream' })).type, 'octet-stream');
  });

  await t.step('returns empty string when MIMEType is empty', () => {
    const meta: Metadata = { ...videoMeta(), MIMEType: '' };
    assertEquals(Meta.Resolver.from(meta).type, '');
  });

  await t.step('returns empty string when MIMEType is missing', () => {
    const meta: Metadata = { ...videoMeta(), MIMEType: undefined as unknown as string };
    assertEquals(Meta.Resolver.from(meta).type, 'unknown');
  });
});

// --- width() / height() ---

Deno.test('Resolver.width', async (t) => {
  await t.step('uses ImageWidth by default', () => {
    assertEquals(Meta.Resolver.from(imageMeta({ ImageWidth: 1920 })).width, 1920);
  });

  await t.step('falls back to SourceImageWidth', () => {
    const meta = imageMeta({ ImageWidth: undefined, SourceImageWidth: 3840 });
    assertEquals(Meta.Resolver.from(meta).width, 3840);
  });

  await t.step('prefers ExifImageWidth', () => {
    const meta = imageMeta({ ExifImageWidth: 6000, ImageWidth: 1920 });
    assertEquals(Meta.Resolver.from(meta).width, 6000);
  });

  await t.step('returns undefined when no dimensions exist', () => {
    const meta = imageMeta({ ImageWidth: undefined, SourceImageWidth: undefined });
    assertEquals(Meta.Resolver.from(meta).width, undefined);
  });
});

Deno.test('Resolver.height', async (t) => {
  await t.step('uses ImageHeight by default', () => {
    assertEquals(Meta.Resolver.from(imageMeta({ ImageHeight: 1080 })).height, 1080);
  });

  await t.step('falls back to SourceImageHeight', () => {
    const meta = imageMeta({ ImageHeight: undefined, SourceImageHeight: 2160 });
    assertEquals(Meta.Resolver.from(meta).height, 2160);
  });

  await t.step('prefers ExifImageHeight', () => {
    const meta = imageMeta({ ExifImageHeight: 4000, ImageHeight: 1080 });
    assertEquals(Meta.Resolver.from(meta).height, 4000);
  });

  await t.step('returns undefined when no dimensions exist', () => {
    const meta = imageMeta({ ImageHeight: undefined, SourceImageHeight: undefined });
    assertEquals(Meta.Resolver.from(meta).height, undefined);
  });
});

// --- duration() ---

Deno.test('Resolver.duration', async (t) => {
  await t.step('parses Duration tag', () => {
    const meta = videoMeta({ Duration: '2.00 s' });
    assertEquals(Meta.Resolver.from(meta).duration, 2);
  });

  await t.step('falls back to MediaDuration', () => {
    const meta = videoMeta({ MediaDuration: '1:30:00' });
    assertEquals(Meta.Resolver.from(meta).duration, 5400);
  });

  await t.step('falls back to AudioDuration', () => {
    const meta = videoMeta({ AudioDuration: '3.5' });
    assertEquals(Meta.Resolver.from(meta).duration, 3.5);
  });

  await t.step('falls back to TrackDuration', () => {
    const meta = videoMeta({ TrackDuration: '0:05:30' });
    assertEquals(Meta.Resolver.from(meta).duration, 330);
  });

  await t.step('returns undefined when no duration tags exist', () => {
    assertEquals(Meta.Resolver.from(videoMeta()).duration, undefined);
  });
});

// --- codec() ---

Deno.test('Resolver.codec for images', async (t) => {
  await t.step('returns the encoding process for JPEG images', () => {
    const meta = imageMeta({ EncodingProcess: 'Baseline DCT, Huffman coding' });
    assertEquals(Meta.Resolver.from(meta).codec, 'Baseline DCT, Huffman coding');
  });

  await t.step('returns undefined when no encoding process is set', () => {
    assertEquals(Meta.Resolver.from(imageMeta()).codec, undefined);
  });
});

Deno.test('Resolver.codec for audio', async (t) => {
  await t.step('returns the audio codec for audio files', () => {
    const meta = videoMeta({
      MIMEType: 'audio/mpeg',
      AudioFormat: 'MPEG Audio',
    });
    const codec = Meta.Resolver.from(meta).codec;
    assertEquals(typeof codec, 'string');
    assertEquals(codec!.length > 0, true);
  });
});

// --- source() ---

Deno.test('Resolver.source', async (t) => {
  await t.step('detects camera from Make tag', () => {
    const meta = imageMeta({ Make: 'Google', Model: 'Pixel 7' });
    assertEquals(Meta.Resolver.from(meta).source, 'camera');
  });

  await t.step('detects camera from Model tag only', () => {
    const meta = imageMeta({ Model: 'D7100' });
    assertEquals(Meta.Resolver.from(meta).source, 'camera');
  });

  await t.step('detects tiktok from vid: comment', () => {
    const meta = videoMeta({ Comment: 'vid:v15044gf0000d9n1eifog65t4dv1v2u0' });
    assertEquals(Meta.Resolver.from(meta).source, 'tiktok');
  });

  await t.step('detects tiktok from Aigc_info tag', () => {
    const meta = videoMeta({ Aigc_info: '{"aigc_label_type":0}' });
    assertEquals(Meta.Resolver.from(meta).source, 'tiktok');
  });

  await t.step('detects whatsapp from IMG filename pattern', () => {
    const meta = videoMeta({
      FileName: 'IMG-20260406-WA0005.jpg',
      SourceFile: sourceFile('/tmp/IMG-20260406-WA0005.jpg'),
    });
    assertEquals(Meta.Resolver.from(meta).source, 'whatsapp');
  });

  await t.step('detects whatsapp from VID filename pattern', () => {
    const meta = videoMeta({
      FileName: 'VID-20260519-WA0014.mp4',
      SourceFile: sourceFile('/tmp/VID-20260519-WA0014.mp4'),
    });
    assertEquals(Meta.Resolver.from(meta).source, 'whatsapp');
  });

  await t.step('detects whatsapp from macOS desktop filename pattern', () => {
    const meta = imageMeta({
      FileName: 'WhatsApp Image 2026-06-29 at 17.20.56.jpeg',
      SourceFile: sourceFile('/tmp/WhatsApp Image 2026-06-29 at 17.20.56.jpeg'),
    });
    assertEquals(Meta.Resolver.from(meta).source, 'whatsapp');
  });

  await t.step('returns undefined when no source clues exist', () => {
    assertEquals(Meta.Resolver.from(videoMeta()).source, undefined);
  });
});

// --- repairDates() ---

Deno.test('Resolver.repairDates', async (t) => {
  await t.step('repairs whatsapp files using the filename date for DateTimeOriginal', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'IMG-20260406-WA0005.jpg',
      SourceFile: sourceFile('/tmp/IMG-20260406-WA0005.jpg'),
    }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(changes['DateTimeOriginal'], '2026:04:06 00:00:00');
    assertEquals(changes['CreateDate'], '2026:04:06 21:42:47');
    assertEquals(changes['ModifyDate'], '2026:04:06 21:42:47');
    assertEquals(/^[+-]\d{2}:\d{2}$/.test(String(changes['OffsetTimeOriginal'] ?? '')), true);
  });

  await t.step('repairs macOS whatsapp downloads using the full filename datetime', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'WhatsApp Image 2026-06-29 at 17.20.56.jpeg',
      SourceFile: sourceFile('/tmp/WhatsApp Image 2026-06-29 at 17.20.56.jpeg'),
    }));
    const changes = resolver.repairDates(DateTime.from('2026-08-09T10:23:31-06:00'));
    assertEquals(changes['DateTimeOriginal'], '2026:06:29 17:20:56');
    assertEquals(changes['CreateDate'], '2026:08:09 10:23:31');
    assertEquals(changes['ModifyDate'], '2026:08:09 10:23:31');
    assertEquals(changes['OffsetTimeDigitized'], '-06:00');
  });

  await t.step('repairs tiktok videos without setting DateTimeOriginal', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'tiktok-video.mp4',
      Comment: 'vid:v15044gf0000d9n1eifog65t4dv1v2u0',
    }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(changes['DateTimeOriginal'], undefined);
    assertEquals(changes['CreateDate'], '2026:04:06 21:42:47');
    assertEquals(changes['ModifyDate'], '2026:04:06 21:42:47');
    assertEquals(changes['TrackCreateDate'], '2026:04:06 21:42:47');
    assertEquals(changes['MediaCreateDate'], '2026:04:06 21:42:47');
    assertEquals(changes['TrackModifyDate'], '2026:04:06 21:42:47');
    assertEquals(changes['MediaModifyDate'], '2026:04:06 21:42:47');
  });

  await t.step('does not repair camera files', () => {
    const resolver = Meta.Resolver.from(imageMeta({ Make: 'Google', Model: 'Pixel 7' }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(Object.keys(changes).length, 0);
  });

  await t.step('does not repair whatsapp when a valid embedded date exists', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'IMG-20260406-WA0005.jpg',
      SourceFile: sourceFile('/tmp/IMG-20260406-WA0005.jpg'),
      DateTimeOriginal: '2026:04:06 21:42:47',
    }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(Object.keys(changes).length, 0);
  });

  await t.step('does not repair tiktok when a created date exists', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'tiktok-video.mp4',
      Comment: 'vid:v15044gf0000d9n1eifog65t4dv1v2u0',
      CreateDate: '2026:04:06 21:42:47',
    }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(Object.keys(changes).length, 0);
  });

  await t.step('does not repair tiktok when only an original date exists', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'tiktok-video.mp4',
      Comment: 'vid:v15044gf0000d9n1eifog65t4dv1v2u0',
      DateTimeOriginal: '2026:04:06 21:42:47',
    }));
    const changes = resolver.repairDates(DateTime.from('2026-04-06T21:42:47'));
    assertEquals(Object.keys(changes).length, 0);
  });

  await t.step('returns empty changes without a fallback date', () => {
    const resolver = Meta.Resolver.from(videoMeta({
      FileName: 'IMG-20260406-WA0005.jpg',
      SourceFile: sourceFile('/tmp/IMG-20260406-WA0005.jpg'),
    }));
    assertEquals(Object.keys(resolver.repairDates(undefined)).length, 0);
  });
});

// --- adjustAllDates() ---

Deno.test('Resolver.adjustAllDates', async (t) => {
  await t.step('shifts all dates by a duration', () => {
    const resolver = Meta.Resolver.from(imageMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
      ModifyDate: '2026:07:29 14:00:00',
    }));
    const changes = resolver.adjustAllDates({ hours: 1 });
    assertEquals(Object.keys(changes).length > 0, true);
    // DateTimeOriginal should now be 19:00:00
    assertEquals(changes['DateTimeOriginal'], '2026:07:31 19:00:00');
  });

  await t.step('works with seconds-only duration', () => {
    const resolver = Meta.Resolver.from(imageMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
      ModifyDate: '2026:07:29 14:00:00',
    }));
    const changes = resolver.adjustAllDates({ seconds: 192 });
    assertEquals(Object.keys(changes).length > 0, true);
    assertEquals(changes['DateTimeOriginal'], '2026:07:31 18:03:12');
  });

  await t.step('returns empty changes when no dates exist', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.adjustAllDates({ hours: 1 });
    assertEquals(Object.keys(changes).length, 0);
  });

  await t.step('only adjusts dates that exist', () => {
    const resolver = Meta.Resolver.from(imageMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
    }));
    const changes = resolver.adjustAllDates({ hours: 1 });
    // We get DateTimeOriginal tags but not CreateDate or ModifyDate tags
    assertEquals(changes['DateTimeOriginal'], '2026:07:31 19:00:00');
    assertEquals('CreateDate' in changes, true);
    assertEquals('ModifyDate' in changes, false);
  });
});

// --- shiftTimezone() ---

Deno.test('Resolver.shiftTimezone', async (t) => {
  await t.step('re-bases timestamps to a new timezone', () => {
    const resolver = Meta.Resolver.from(imageMeta({
      DateTimeOriginal: '2026:07:31 18:00:00-05:00',
      CreateDate: '2026:07:30 10:00:00-05:00',
      ModifyDate: '2026:07:29 14:00:00-05:00',
    }));
    const changes = resolver.shiftTimezone('-07:00' as ISOTZ);
    assertEquals(Object.keys(changes).length > 0, true);
    // Offset tags should now read -07:00
    assertEquals(changes['OffsetTimeOriginal'], '-07:00');
  });

  await t.step('returns empty changes when no dates exist', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.shiftTimezone('-07:00' as ISOTZ);
    assertEquals(Object.keys(changes).length, 0);
  });
});

// --- setPartialDate() ---

Deno.test('Resolver.setPartialDate', async (t) => {
  await t.step('pads year-only date to January 1 midnight', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.setPartialDate({ year: 1975 });
    assertEquals(changes['DateTimeOriginal'], '1975:01:01 00:00:00');
    assertEquals(changes['XMP-dc:Date'], '1975');
    assertEquals(changes['XMP-photoshop:DateCreated'], '1975');
  });

  await t.step('pads year-month date to first of month', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.setPartialDate({ year: 1975, month: 6 });
    assertEquals(changes['DateTimeOriginal'], '1975:06:01 00:00:00');
    assertEquals(changes['XMP-dc:Date'], '1975-06');
    assertEquals(changes['XMP-photoshop:DateCreated'], '1975-06');
  });

  await t.step('writes full date for year-month-day', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.setPartialDate({ year: 1975, month: 6, day: 15 });
    assertEquals(changes['DateTimeOriginal'], '1975:06:15 00:00:00');
    assertEquals(changes['XMP-dc:Date'], '1975-06-15');
    assertEquals(changes['XMP-photoshop:DateCreated'], '1975-06-15');
  });

  await t.step('pads year to 4 digits', () => {
    const resolver = Meta.Resolver.from(imageMeta());
    const changes = resolver.setPartialDate({ year: 1925 });
    assertEquals(changes['DateTimeOriginal'], '1925:01:01 00:00:00');
    assertEquals(changes['XMP-dc:Date'], '1925');
  });
});
