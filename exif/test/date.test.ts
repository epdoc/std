import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import { Meta } from '../src/date/meta.ts';
import * as Parse from '../src/date/parse.ts';
import * as Util from '../src/date/utils.ts';
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

Deno.test('Date.Parse.dateString', async (t) => {
  await t.step('parses the canonical exiftool format', () => {
    assertEquals(Parse.dateString('2026:07:31 18:00:00'), {
      year: 2026,
      month: 7,
      day: 31,
      hour: 18,
      minute: 0,
      second: 0,
    });
  });

  await t.step('parses fractional seconds and timezone', () => {
    const parts = Parse.dateString('2026:07:31 18:00:00.500-06:00');
    assertEquals(parts?.millisecond, 500);
    assertEquals(parts?.tzOffset, '-06:00');
  });

  await t.step('parses timezone without colon', () => {
    const parts = Parse.dateString('2026:07:31 18:00:00+0530');
    assertEquals(parts?.tzOffset, '+05:30');
  });

  await t.step('normalizes Z to +00:00', () => {
    assertEquals(Parse.dateString('2026:07:31 18:00:00Z')?.tzOffset, '+00:00');
  });

  await t.step('parses fractional seconds with Z', () => {
    const parts = Parse.dateString('2026:07:31 18:00:00.123Z');
    assertEquals(parts?.millisecond, 123);
    assertEquals(parts?.tzOffset, '+00:00');
  });

  await t.step('rejects zero months and days', () => {
    assertEquals(Parse.dateString('2024:00:00 00:00:00'), undefined);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Parse.dateString(undefined), undefined);
    assertEquals(Parse.dateString('n/a'), undefined);
  });
});

Deno.test('Date.Parse.milliseconds', async (t) => {
  await t.step('normalizes variable-length sub-seconds', () => {
    assertEquals(Parse.milliseconds('500'), 500);
    assertEquals(Parse.milliseconds('5'), 500);
    assertEquals(Parse.milliseconds('50'), 500);
    assertEquals(Parse.milliseconds(123), 123);
    assertEquals(Parse.milliseconds(undefined), undefined);
  });
});

Deno.test('Date.Util.build', async (t) => {
  await t.step('builds a DateTime from a base tag', () => {
    const result = Util.build('2026:07:31 18:00:00');
    assertEquals(result?.toString().startsWith('2026-07-31T18:00:00'), true);
  });

  await t.step('builds a DateTime with timezone', () => {
    const result = Util.build('2026:07:31 18:00:00-06:00');
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '-06:00');
  });

  await t.step('falls back to a separate sub-second tag', () => {
    const result = Util.build('2026:07:31 18:00:00', '5');
    assertEquals(result?.millisecond, 500);
  });

  await t.step('returns undefined without a date', () => {
    assertEquals(Util.build(undefined), undefined);
  });
});

Deno.test('Date.Util.formatDateTime', async (t) => {
  await t.step('formats a ZonedDateTime to exiftool form', () => {
    const dt = DateTime.from('2026-07-31T18:00:05-06:00');
    assertEquals(Util.formatDateTime(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats an Instant as UTC', () => {
    const dt = DateTime.from('2026-07-31T18:00:05Z');
    assertEquals(Util.formatDateTime(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats a PlainDateTime', () => {
    const dt = DateTime.fromComponents(2026, 7, 31, 18, 0, 5);
    assertEquals(Util.formatDateTime(dt), '2026:07:31 18:00:05');
  });
});

Deno.test('Date.Meta.original', async (t) => {
  await t.step('prefers DateTimeOriginal', () => {
    const result = Meta.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).original();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('applies a separate timezone offset tag', () => {
    const result = Meta.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      OffsetTimeOriginal: '+02:00',
    })).original();
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '+02:00');
  });

  await t.step('falls back to QuickTime CreationDate', () => {
    const result = Meta.from(videoMeta({ CreationDate: '2026:07:30 10:00:00' })).original();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to XMP/IPTC DateCreated', () => {
    const result = Meta.from(videoMeta({ DateCreated: '2026:07:29 10:00:00' })).original();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('falls back to GPSDateTime', () => {
    const result = Meta.from(videoMeta({ GPSDateTime: '2026:07:28 10:00:00Z' })).original();
    assertEquals(result?.toString().startsWith('2026-07-28'), true);
  });

  await t.step('returns undefined when no original date exists', () => {
    assertEquals(Meta.from(videoMeta({})).original(), undefined);
  });
});

Deno.test('Date.Meta.created', async (t) => {
  await t.step('prefers the original date', () => {
    const result = Meta.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).created();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('falls back to the digitized date', () => {
    const result = Meta.from(videoMeta({ CreateDate: '2026:07:30 10:00:00' })).created();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('returns undefined when no date exists', () => {
    assertEquals(Meta.from(videoMeta({})).created(), undefined);
  });
});

Deno.test('Date.Meta.digitized', async (t) => {
  await t.step('uses CreateDate', () => {
    const result = Meta.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).digitized();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to XMP/IPTC digitized tags', () => {
    const result = Meta.from(videoMeta({ DateCreated: '2026:07:29 10:00:00' })).digitized();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('falls back to the original date', () => {
    const result = Meta.from(videoMeta({ DateTimeOriginal: '2026:07:31 18:00:00' })).digitized();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });
});

Deno.test('Date.Meta.modified', async (t) => {
  await t.step('uses ModifyDate', () => {
    const result = Meta.from(videoMeta({ ModifyDate: '2026:07:31 12:00:00' })).modified();
    assertEquals(result?.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('falls back to QuickTime track modification dates', () => {
    const result = Meta.from(videoMeta({ TrackModifyDate: '2026:07:30 10:00:00' })).modified();
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to MetadataDate', () => {
    const result = Meta.from(videoMeta({ MetadataDate: '2026:07:29 10:00:00' })).modified();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('does not include filesystem dates', () => {
    const result = Meta.from(videoMeta({
      FileModifyDate: '2026:07:31 10:00:00',
      FileInodeChangeDate: '2026:07:31 09:00:00',
      FileAccessDate: '2026:07:28 10:00:00',
    })).modified();
    assertEquals(result, undefined);
  });
});

Deno.test('Date.Meta.primary', async (t) => {
  await t.step('prefers the created date', () => {
    const result = Meta.from(videoMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    })).primary();
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
    assertEquals(result?.hasTimezone(), false);
  });

  await t.step('falls back to the modified date', () => {
    const result = Meta.from(videoMeta({ ModifyDate: '2026:07:29 10:00:00' })).primary();
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });
});
