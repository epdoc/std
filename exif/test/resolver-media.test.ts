import type { ISOTZ } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import { Meta } from '../src/mod.ts';
import type { Metadata } from '../src/meta-types.ts';

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
    assertEquals(Meta.Resolver.from(imageMeta()).type(), 'image');
  });

  await t.step('returns "video" for video/mp4', () => {
    assertEquals(Meta.Resolver.from(videoMeta()).type(), 'video');
  });

  await t.step('returns "audio" for audio/mpeg', () => {
    assertEquals(Meta.Resolver.from(videoMeta({ MIMEType: 'audio/mpeg' })).type(), 'audio');
  });

  await t.step('returns "application" for application/pdf', () => {
    assertEquals(Meta.Resolver.from(videoMeta({ MIMEType: 'application/pdf' })).type(), 'application');
  });

  await t.step('returns empty string when MIMEType is empty', () => {
    const meta: Metadata = { ...videoMeta(), MIMEType: '' };
    assertEquals(Meta.Resolver.from(meta).type(), '');
  });
});

// --- width() / height() ---

Deno.test('Resolver.width', async (t) => {
  await t.step('uses ImageWidth by default', () => {
    assertEquals(Meta.Resolver.from(imageMeta({ ImageWidth: 1920 })).width(), 1920);
  });

  await t.step('falls back to SourceImageWidth', () => {
    const meta = imageMeta({ ImageWidth: undefined, SourceImageWidth: 3840 });
    assertEquals(Meta.Resolver.from(meta).width(), 3840);
  });

  await t.step('prefers ExifImageWidth', () => {
    const meta = imageMeta({ ExifImageWidth: 6000, ImageWidth: 1920 });
    assertEquals(Meta.Resolver.from(meta).width(), 6000);
  });

  await t.step('returns undefined when no dimensions exist', () => {
    const meta = imageMeta({ ImageWidth: undefined, SourceImageWidth: undefined });
    assertEquals(Meta.Resolver.from(meta).width(), undefined);
  });
});

Deno.test('Resolver.height', async (t) => {
  await t.step('uses ImageHeight by default', () => {
    assertEquals(Meta.Resolver.from(imageMeta({ ImageHeight: 1080 })).height(), 1080);
  });

  await t.step('falls back to SourceImageHeight', () => {
    const meta = imageMeta({ ImageHeight: undefined, SourceImageHeight: 2160 });
    assertEquals(Meta.Resolver.from(meta).height(), 2160);
  });

  await t.step('prefers ExifImageHeight', () => {
    const meta = imageMeta({ ExifImageHeight: 4000, ImageHeight: 1080 });
    assertEquals(Meta.Resolver.from(meta).height(), 4000);
  });

  await t.step('returns undefined when no dimensions exist', () => {
    const meta = imageMeta({ ImageHeight: undefined, SourceImageHeight: undefined });
    assertEquals(Meta.Resolver.from(meta).height(), undefined);
  });
});

// --- duration() ---

Deno.test('Resolver.duration', async (t) => {
  await t.step('parses Duration tag', () => {
    const meta = videoMeta({ Duration: '2.00 s' });
    assertEquals(Meta.Resolver.from(meta).duration(), 2);
  });

  await t.step('falls back to MediaDuration', () => {
    const meta = videoMeta({ MediaDuration: '1:30:00' });
    assertEquals(Meta.Resolver.from(meta).duration(), 5400);
  });

  await t.step('falls back to AudioDuration', () => {
    const meta = videoMeta({ AudioDuration: '3.5' });
    assertEquals(Meta.Resolver.from(meta).duration(), 3.5);
  });

  await t.step('falls back to TrackDuration', () => {
    const meta = videoMeta({ TrackDuration: '0:05:30' });
    assertEquals(Meta.Resolver.from(meta).duration(), 330);
  });

  await t.step('returns undefined when no duration tags exist', () => {
    assertEquals(Meta.Resolver.from(videoMeta()).duration(), undefined);
  });
});

// --- codec() ---

Deno.test('Resolver.codec for images', async (t) => {
  await t.step('returns the encoding process for JPEG images', () => {
    const meta = imageMeta({ EncodingProcess: 'Baseline DCT, Huffman coding' });
    assertEquals(Meta.Resolver.from(meta).codec(), 'Baseline DCT, Huffman coding');
  });

  await t.step('returns undefined when no encoding process is set', () => {
    assertEquals(Meta.Resolver.from(imageMeta()).codec(), undefined);
  });
});

Deno.test('Resolver.codec for audio', async (t) => {
  await t.step('returns the audio codec for audio files', () => {
    const meta = videoMeta({
      MIMEType: 'audio/mpeg',
      AudioFormat: 'MPEG Audio',
    });
    const codec = Meta.Resolver.from(meta).codec();
    assertEquals(typeof codec, 'string');
    assertEquals(codec!.length > 0, true);
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
    assertEquals('CreateDate' in changes, false);
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
