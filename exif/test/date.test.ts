import { assertEquals } from '@std/assert';
import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import {
  buildExifDateTime,
  formatDateTimeToExif,
  formatExifDateTime,
  getCreatedDateTime,
  getDigitizedDateTime,
  getMetaDateTime,
  getModifiedDateTime,
  parseExifDateTime,
  parseExifTzOffset,
} from '../src/mod.ts';
import { parseExifMilliseconds } from '../src/utils.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

Deno.test('parseExifDateTime', async (t) => {
  await t.step('parses the canonical exiftool format', () => {
    assertEquals(parseExifDateTime('2026:07:31 18:00:00'), {
      year: 2026,
      month: 7,
      day: 31,
      hour: 18,
      minute: 0,
      second: 0,
    });
  });

  await t.step('parses fractional seconds and timezone', () => {
    const parts = parseExifDateTime('2026:07:31 18:00:00.500-06:00');
    assertEquals(parts?.millisecond, 500);
    assertEquals(parts?.tzOffset, '-06:00');
  });

  await t.step('parses timezone without colon', () => {
    const parts = parseExifDateTime('2026:07:31 18:00:00+0530');
    assertEquals(parts?.tzOffset, '+05:30');
  });

  await t.step('normalizes Z to +00:00', () => {
    assertEquals(parseExifDateTime('2026:07:31 18:00:00Z')?.tzOffset, '+00:00');
  });

  await t.step('parses fractional seconds with Z', () => {
    const parts = parseExifDateTime('2026:07:31 18:00:00.123Z');
    assertEquals(parts?.millisecond, 123);
    assertEquals(parts?.tzOffset, '+00:00');
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(parseExifDateTime(undefined), undefined);
    assertEquals(parseExifDateTime('n/a'), undefined);
  });
});

Deno.test('parseExifTzOffset', async (t) => {
  await t.step('converts offset strings to intuitive signed minutes', () => {
    assertEquals(parseExifTzOffset('+01:00'), 60);
    assertEquals(parseExifTzOffset('-06:00'), -360);
    assertEquals(parseExifTzOffset('+00:00'), 0);
  });
});

Deno.test('parseExifMilliseconds', async (t) => {
  await t.step('normalizes variable-length sub-seconds', () => {
    assertEquals(parseExifMilliseconds('500'), 500);
    assertEquals(parseExifMilliseconds('5'), 500);
    assertEquals(parseExifMilliseconds('50'), 500);
    assertEquals(parseExifMilliseconds(123), 123);
    assertEquals(parseExifMilliseconds(undefined), undefined);
  });
});

Deno.test('formatExifDateTime', async (t) => {
  await t.step('formats components to the exiftool form', () => {
    assertEquals(
      formatExifDateTime({ year: 2026, month: 7, day: 31, hour: 18, minute: 0, second: 5 }),
      '2026:07:31 18:00:05',
    );
  });
});

Deno.test('formatDateTimeToExif', async (t) => {
  await t.step('formats a ZonedDateTime to exiftool form', () => {
    const dt = DateTime.from('2026-07-31T18:00:05-06:00');
    assertEquals(formatDateTimeToExif(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats an Instant as UTC', () => {
    const dt = DateTime.from('2026-07-31T18:00:05Z');
    assertEquals(formatDateTimeToExif(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats a PlainDateTime', () => {
    const dt = DateTime.fromComponents(2026, 7, 31, 18, 0, 5);
    assertEquals(formatDateTimeToExif(dt), '2026:07:31 18:00:05');
  });
});

Deno.test('buildExifDateTime', async (t) => {
  await t.step('builds a DateTime from a base tag', () => {
    const result = buildExifDateTime('2026:07:31 18:00:00');
    assertEquals(result?.dateTime.toString().startsWith('2026-07-31T18:00:00'), true);
    assertEquals(result?.hasTimezone, false);
  });

  await t.step('builds a DateTime with timezone', () => {
    const result = buildExifDateTime('2026:07:31 18:00:00-06:00');
    assertEquals(result?.hasTimezone, true);
    assertEquals(result?.tzOffset, '-06:00');
    assertEquals(result?.dateTime.hasTimezone(), true);
  });

  await t.step('falls back to a separate sub-second tag', () => {
    const result = buildExifDateTime('2026:07:31 18:00:00', '5');
    assertEquals(result?.milliseconds, 500);
  });

  await t.step('returns undefined without a date', () => {
    assertEquals(buildExifDateTime(undefined), undefined);
  });
});

Deno.test('getCreatedDateTime', async (t) => {
  await t.step('prefers DateTimeOriginal over CreateDate', () => {
    const result = getCreatedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-31'), true);
  });

  await t.step('falls back to CreateDate', () => {
    const result = getCreatedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to DateCreated', () => {
    const result = getCreatedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateCreated: '2026:07:29 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-29'), true);
  });
});

Deno.test('getDigitizedDateTime', async (t) => {
  await t.step('uses CreateDate', () => {
    const result = getDigitizedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to DateCreated', () => {
    const result = getDigitizedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateCreated: '2026:07:29 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-29'), true);
  });
});

Deno.test('getModifiedDateTime', async (t) => {
  await t.step('uses ModifyDate', () => {
    const result = getModifiedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      ModifyDate: '2026:07:31 12:00:00',
      FileModifyDate: '2026:07:31 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('falls back to FileModifyDate', () => {
    const result = getModifiedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      FileModifyDate: '2026:07:31 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-31T10:00:00'), true);
  });

  await t.step('falls back to FileInodeChangeDate then FileAccessDate', () => {
    const result = getModifiedDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      FileAccessDate: '2026:07:28 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-28T10:00:00'), true);
  });
});

Deno.test('getMetaDateTime', async (t) => {
  await t.step('prefers DateTimeOriginal', () => {
    const result = getMetaDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-31'), true);
    assertEquals(result?.hasTimezone, false);
  });

  await t.step('falls back to CreateDate', () => {
    const result = getMetaDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to ModifyDate', () => {
    const result = getMetaDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      ModifyDate: '2026:07:29 10:00:00',
    });
    assertEquals(result?.dateTime.toString().startsWith('2026-07-29'), true);
  });

  await t.step('detects timezone from OffsetTimeOriginal', () => {
    const result = getMetaDateTime({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
      OffsetTimeOriginal: '+02:00',
    });
    assertEquals(result?.hasTimezone, true);
    assertEquals(result?.tzOffset, '+02:00');
  });
});
