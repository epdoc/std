import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import { Meta } from '../src/mod.ts';
import type { Metadata } from '../src/meta-types.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

function videoMeta(partial: Record<string, unknown>): Metadata {
  return {
    SourceFile: sourceFile('/tmp/a.mp4'),
    ExifToolVersion: 10.98,
    FileName: 'a.mp4',
    Directory: '/tmp',
    MIMEType: 'video/mp4',
    FileType: 'MP4',
    FileTypeExtension: 'mp4',
    ...partial,
  };
}

Deno.test('Meta.Parse.dateString', async (t) => {
  await t.step('parses the canonical exiftool format', () => {
    assertEquals(Meta.Parse.dateString('2026:07:31 18:00:00'), {
      year: 2026,
      month: 7,
      day: 31,
      hour: 18,
      minute: 0,
      second: 0,
    });
  });

  await t.step('parses fractional seconds and timezone', () => {
    const parts = Meta.Parse.dateString('2026:07:31 18:00:00.500-06:00');
    assertEquals(parts?.millisecond, 500);
    assertEquals(parts?.tzOffset, '-06:00');
  });

  await t.step('parses timezone without colon', () => {
    const parts = Meta.Parse.dateString('2026:07:31 18:00:00+0530');
    assertEquals(parts?.tzOffset, '+05:30');
  });

  await t.step('normalizes Z to +00:00', () => {
    assertEquals(Meta.Parse.dateString('2026:07:31 18:00:00Z')?.tzOffset, '+00:00');
  });

  await t.step('parses fractional seconds with Z', () => {
    const parts = Meta.Parse.dateString('2026:07:31 18:00:00.123Z');
    assertEquals(parts?.millisecond, 123);
    assertEquals(parts?.tzOffset, '+00:00');
  });

  await t.step('rejects zero months and days', () => {
    assertEquals(Meta.Parse.dateString('2024:00:00 00:00:00'), undefined);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Meta.Parse.dateString(undefined), undefined);
    assertEquals(Meta.Parse.dateString('n/a'), undefined);
  });
});

Deno.test('Meta.Parse.milliseconds', async (t) => {
  await t.step('normalizes variable-length sub-seconds', () => {
    assertEquals(Meta.Parse.milliseconds('500'), 500);
    assertEquals(Meta.Parse.milliseconds('5'), 500);
    assertEquals(Meta.Parse.milliseconds('50'), 500);
    assertEquals(Meta.Parse.milliseconds(123), 123);
    assertEquals(Meta.Parse.milliseconds(undefined), undefined);
  });
});

Deno.test('Resolver.buildDateTime', async (t) => {
  await t.step('builds a DateTime from a base tag', () => {
    const result = Meta.Resolver.buildDateTime('2026:07:31 18:00:00');
    assertEquals(result?.toString().startsWith('2026-07-31T18:00:00'), true);
  });

  await t.step('builds a DateTime with timezone', () => {
    const result = Meta.Resolver.buildDateTime('2026:07:31 18:00:00-06:00');
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '-06:00');
  });

  await t.step('falls back to a separate sub-second tag', () => {
    const result = Meta.Resolver.buildDateTime('2026:07:31 18:00:00', '5');
    assertEquals(result?.millisecond, 500);
  });

  await t.step('returns undefined without a date', () => {
    assertEquals(Meta.Resolver.buildDateTime(undefined), undefined);
  });
});

Deno.test('Resolver.toExifDateTimeString', async (t) => {
  await t.step('formats a ZonedDateTime to exiftool form', () => {
    const dt = DateTime.from('2026-07-31T18:00:05-06:00');
    assertEquals(Meta.Resolver.toExifDateTimeString(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats an Instant as UTC', () => {
    const dt = DateTime.from('2026-07-31T18:00:05Z');
    assertEquals(Meta.Resolver.toExifDateTimeString(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats a PlainDateTime', () => {
    const dt = DateTime.fromComponents(2026, 7, 31, 18, 0, 5);
    assertEquals(Meta.Resolver.toExifDateTimeString(dt), '2026:07:31 18:00:05');
  });
});

Deno.test('Resolver.originatedAt', async (t) => {
  await t.step('prefers DateTimeOriginal', () => {
    const result = Meta.Resolver.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).originatedAt();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('applies a separate timezone offset tag', () => {
    const result = Meta.Resolver.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      OffsetTimeOriginal: '+02:00',
    })).originatedAt();
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '+02:00');
  });

  await t.step('falls back to QuickTime CreationDate', () => {
    const result = Meta.Resolver.from(videoMeta({ CreationDate: '2026:07:30 10:00:00' })).originatedAt();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to XMP/IPTC DateCreated', () => {
    const result = Meta.Resolver.from(videoMeta({ DateCreated: '2026:07:29 10:00:00' })).originatedAt();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('falls back to GPSDateTime', () => {
    const result = Meta.Resolver.from(videoMeta({ GPSDateTime: '2026:07:28 10:00:00Z' })).originatedAt();
    assertEquals(result?.toString().startsWith('2026-07-28'), true);
  });

  await t.step('returns undefined when no original date exists', () => {
    assertEquals(Meta.Resolver.from(videoMeta({})).originatedAt(), undefined);
  });
});

Deno.test('Resolver.createdAt', async (t) => {
  await t.step('prefers the original date', () => {
    const result = Meta.Resolver.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).createdAt();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('falls back to the digitized date', () => {
    const result = Meta.Resolver.from(videoMeta({ CreateDate: '2026:07:30 10:00:00' })).createdAt();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('returns undefined when no date exists', () => {
    assertEquals(Meta.Resolver.from(videoMeta({})).createdAt(), undefined);
  });
});

Deno.test('Resolver.digitizedAt', async (t) => {
  await t.step('uses CreateDate', () => {
    const result = Meta.Resolver.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).digitizedAt();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to XMP/IPTC digitized tags', () => {
    const result = Meta.Resolver.from(videoMeta({ DateCreated: '2026:07:29 10:00:00' })).digitizedAt();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('falls back to the original date', () => {
    const result = Meta.Resolver.from(videoMeta({ DateTimeOriginal: '2026:07:31 18:00:00' })).digitizedAt();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });
});

Deno.test('Resolver.modifiedAt', async (t) => {
  await t.step('uses ModifyDate', () => {
    const result = Meta.Resolver.from(videoMeta({ ModifyDate: '2026:07:31 12:00:00' })).modifiedAt();
    assertEquals(result?.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('falls back to QuickTime track modification dates', () => {
    const result = Meta.Resolver.from(videoMeta({ TrackModifyDate: '2026:07:30 10:00:00' })).modifiedAt();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to MetadataDate', () => {
    const result = Meta.Resolver.from(videoMeta({ MetadataDate: '2026:07:29 10:00:00' })).modifiedAt();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('does not include filesystem dates', () => {
    const result = Meta.Resolver.from(videoMeta({
      FileModifyDate: '2026:07:31 10:00:00',
      FileInodeChangeDate: '2026:07:31 09:00:00',
      FileAccessDate: '2026:07:28 10:00:00',
    })).modifiedAt();
    assertEquals(result, undefined);
  });
});

Deno.test('Resolver.primary', async (t) => {
  await t.step('prefers the created date', () => {
    const result = Meta.Resolver.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).primary();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
    assertEquals(result?.hasTimezone(), false);
  });

  await t.step('falls back to the modified date', () => {
    const result = Meta.Resolver.from(videoMeta({ ModifyDate: '2026:07:29 10:00:00' })).primary();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });
});
