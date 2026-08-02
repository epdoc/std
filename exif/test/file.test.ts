import { assertEquals } from '@std/assert';
import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { File } from '../src/mod.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

function meta(partial: Record<string, unknown>) {
  return {
    SourceFile: sourceFile('/tmp/a.jpg'),
    ExifToolVersion: 12.0,
    FileName: 'a.jpg',
    Directory: '/tmp',
    MIMEType: 'image/jpeg',
    FileType: 'JPEG',
    FileTypeExtension: 'jpg',
    ...partial,
  };
}

Deno.test('File.fromMetadata', async (t) => {
  await t.step('wraps metadata and exposes path', () => {
    const file = File.fromMetadata(meta({ DateTimeOriginal: '2026:07:31 18:00:00' }));
    assertEquals(file.path, '/tmp/a.jpg');
    assertEquals(file.dirty, false);
  });

  await t.step('createdAt uses DateTimeOriginal', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    }));
    const created = file.createdAt;
    assertEquals(created?.dateTime.toString().startsWith('2026-07-31T18:00:00'), true);
    assertEquals(created?.hasTimezone, false);
  });

  await t.step('createdAt detects timezone from OffsetTimeOriginal', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      OffsetTimeOriginal: '+02:00',
    }));
    assertEquals(file.hasTimezone, true);
    assertEquals(file.tzOffset, '+02:00');
  });

  await t.step('hasTimezone is false when no creation date exists', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.hasTimezone, false);
    assertEquals(file.tzOffset, undefined);
  });

  await t.step('modifiedAt uses ModifyDate', () => {
    const file = File.fromMetadata(meta({
      ModifyDate: '2026:07:31 12:00:00',
      FileModifyDate: '2026:07:31 10:00:00',
    }));
    const modified = file.modifiedAt;
    assertEquals(modified?.dateTime.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('duration parses video duration strings', () => {
    const file = File.fromMetadata(meta({ Duration: '2.00 s' }));
    assertEquals(file.duration, 2);
  });

  await t.step('duration parses H:MM:SS strings', () => {
    const file = File.fromMetadata(meta({ Duration: '1:02:03' }));
    assertEquals(file.duration, 3723);
  });

  await t.step('duration returns undefined when missing', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.duration, undefined);
  });
});

Deno.test('File setters and dirty flag', async (t) => {
  await t.step('setCreatedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.setCreatedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
    assertEquals(file.dirty, true);
  });

  await t.step('setModifiedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.setModifiedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
    assertEquals(file.dirty, true);
  });

  await t.step('setDigitizedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.setDigitizedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
    assertEquals(file.dirty, true);
  });

  await t.step('setAllDates marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.setAllDates(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.setTimezoneOffset('+02:00');
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset normalizes Z', () => {
    const file = File.fromMetadata(meta({}));
    file.setTimezoneOffset('Z');
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset rejects invalid input', () => {
    const file = File.fromMetadata(meta({}));
    let threw = false;
    try {
      file.setTimezoneOffset('not-an-offset');
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  });

  await t.step('setTag queues arbitrary tag writes', () => {
    const file = File.fromMetadata(meta({}));
    file.setTag('Artist', 'Someone');
    assertEquals(file.dirty, true);
  });

  await t.step('setTag with undefined deletes a tag', () => {
    const file = File.fromMetadata(meta({}));
    file.setTag('Artist', undefined);
    assertEquals(file.dirty, true);
  });
});

Deno.test('File.write in dry-run mode', async (t) => {
  await t.step('clears the dirty flag without invoking exiftool', async () => {
    const file = File.fromMetadata(meta({}), { dryRun: true });
    file.setCreatedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
    assertEquals(file.dirty, true);
    await file.write();
    assertEquals(file.dirty, false);
  });

  await t.step('is a no-op when nothing is dirty', async () => {
    const file = File.fromMetadata(meta({}), { dryRun: true });
    assertEquals(file.dirty, false);
    await file.write();
    assertEquals(file.dirty, false);
  });
});
