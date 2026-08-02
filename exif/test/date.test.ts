import { assertEquals } from '@std/assert';
import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import * as Date from '../src/date.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

Deno.test('Date.parse', async (t) => {
  await t.step('parses the canonical exiftool format', () => {
    assertEquals(Date.parse('2026:07:31 18:00:00'), {
      year: 2026,
      month: 7,
      day: 31,
      hour: 18,
      minute: 0,
      second: 0,
    });
  });

  await t.step('parses fractional seconds and timezone', () => {
    const parts = Date.parse('2026:07:31 18:00:00.500-06:00');
    assertEquals(parts?.millisecond, 500);
    assertEquals(parts?.tzOffset, '-06:00');
  });

  await t.step('parses timezone without colon', () => {
    const parts = Date.parse('2026:07:31 18:00:00+0530');
    assertEquals(parts?.tzOffset, '+05:30');
  });

  await t.step('normalizes Z to +00:00', () => {
    assertEquals(Date.parse('2026:07:31 18:00:00Z')?.tzOffset, '+00:00');
  });

  await t.step('parses fractional seconds with Z', () => {
    const parts = Date.parse('2026:07:31 18:00:00.123Z');
    assertEquals(parts?.millisecond, 123);
    assertEquals(parts?.tzOffset, '+00:00');
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(Date.parse(undefined), undefined);
    assertEquals(Date.parse('n/a'), undefined);
  });
});

Deno.test('Date.parseTzOffset', async (t) => {
  await t.step('converts offset strings to intuitive signed minutes', () => {
    assertEquals(Date.parseTzOffset('+01:00'), 60);
    assertEquals(Date.parseTzOffset('-06:00'), -360);
    assertEquals(Date.parseTzOffset('+00:00'), 0);
  });
});

Deno.test('Date.parseMilliseconds', async (t) => {
  await t.step('normalizes variable-length sub-seconds', () => {
    assertEquals(Date.parseMilliseconds('500'), 500);
    assertEquals(Date.parseMilliseconds('5'), 500);
    assertEquals(Date.parseMilliseconds('50'), 500);
    assertEquals(Date.parseMilliseconds(123), 123);
    assertEquals(Date.parseMilliseconds(undefined), undefined);
  });
});

Deno.test('Date.format', async (t) => {
  await t.step('formats components to the exiftool form', () => {
    assertEquals(
      Date.format({ year: 2026, month: 7, day: 31, hour: 18, minute: 0, second: 5 }),
      '2026:07:31 18:00:05',
    );
  });
});

Deno.test('Date.formatDateTime', async (t) => {
  await t.step('formats a ZonedDateTime to exiftool form', () => {
    const dt = DateTime.from('2026-07-31T18:00:05-06:00');
    assertEquals(Date.formatDateTime(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats an Instant as UTC', () => {
    const dt = DateTime.from('2026-07-31T18:00:05Z');
    assertEquals(Date.formatDateTime(dt), '2026:07:31 18:00:05');
  });

  await t.step('formats a PlainDateTime', () => {
    const dt = DateTime.fromComponents(2026, 7, 31, 18, 0, 5);
    assertEquals(Date.formatDateTime(dt), '2026:07:31 18:00:05');
  });
});

Deno.test('Date.build', async (t) => {
  await t.step('builds a DateTime from a base tag', () => {
    const result = Date.build('2026:07:31 18:00:00');
    assertEquals(result?.toString().startsWith('2026-07-31T18:00:00'), true);
  });

  await t.step('builds a DateTime with timezone', () => {
    const result = Date.build('2026:07:31 18:00:00-06:00');
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '-06:00');
  });

  await t.step('falls back to a separate sub-second tag', () => {
    const result = Date.build('2026:07:31 18:00:00', '5');
    assertEquals(result?.millisecond, 500);
  });

  await t.step('returns undefined without a date', () => {
    assertEquals(Date.build(undefined), undefined);
  });
});

Deno.test('Date.getCreated', async (t) => {
  await t.step('prefers DateTimeOriginal over CreateDate', () => {
    const result = Date.getCreated({
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
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('falls back to CreateDate', () => {
    const result = Date.getCreated({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to DateCreated', () => {
    const result = Date.getCreated({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateCreated: '2026:07:29 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });
});

Deno.test('Date.getDigitized', async (t) => {
  await t.step('uses CreateDate', () => {
    const result = Date.getDigitized({
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
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to DateCreated', () => {
    const result = Date.getDigitized({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateCreated: '2026:07:29 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });
});

Deno.test('Date.getModified', async (t) => {
  await t.step('uses ModifyDate', () => {
    const result = Date.getModified({
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
    assertEquals(result?.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('falls back to FileModifyDate', () => {
    const result = Date.getModified({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      FileModifyDate: '2026:07:31 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-31T10:00:00'), true);
  });

  await t.step('falls back to FileInodeChangeDate then FileAccessDate', () => {
    const result = Date.getModified({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      FileAccessDate: '2026:07:28 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-28T10:00:00'), true);
  });
});

Deno.test('Date.getPrimary', async (t) => {
  await t.step('prefers DateTimeOriginal', () => {
    const result = Date.getPrimary({
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
    assertEquals(result?.toString().startsWith('2026-07-31'), true);
    assertEquals(result?.hasTimezone(), false);
  });

  await t.step('falls back to CreateDate', () => {
    const result = Date.getPrimary({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      CreateDate: '2026:07:30 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('falls back to ModifyDate', () => {
    const result = Date.getPrimary({
      SourceFile: sourceFile('/tmp/a.mp4'),
      ExifToolVersion: 10.98,
      FileName: 'a.mp4',
      Directory: '/tmp',
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      ModifyDate: '2026:07:29 10:00:00',
    });
    assertEquals(result?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('detects timezone from OffsetTimeOriginal', () => {
    const result = Date.getPrimary({
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
    assertEquals(result?.hasTimezone(), true);
    assertEquals(result?.getTzString(), '+02:00');
  });
});
