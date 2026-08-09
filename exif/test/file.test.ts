import { DateTime } from '@epdoc/datetime';
import * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import { File, Meta, type Metadata } from '../src/mod.ts';

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
    const created = file.resolver.createdAt;
    assertEquals(created?.toString().startsWith('2026-07-31T18:00:00'), true);
    assertEquals(created?.hasTimezone(), false);
  });

  await t.step('createdAt detects timezone from OffsetTimeOriginal', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      OffsetTimeOriginal: '+02:00',
    }));
    assertEquals(file.resolver.hasTimezone, true);
    assertEquals(file.resolver.tzOffset, '+02:00');
  });

  await t.step('hasTimezone is false when no creation date exists', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.resolver.hasTimezone, false);
    assertEquals(file.resolver.tzOffset, undefined);
  });

  await t.step('modifiedAt uses ModifyDate', () => {
    const file = File.fromMetadata(meta({
      ModifyDate: '2026:07:31 12:00:00',
      FileModifyDate: '2026:07:31 10:00:00',
    }));
    const modified = file.resolver.modifiedAt;
    assertEquals(modified?.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('duration parses video duration strings', () => {
    const file = File.fromMetadata(meta({ Duration: '2.00 s' }));
    assertEquals(file.resolver.duration, 2);
  });

  await t.step('duration parses H:MM:SS strings', () => {
    const file = File.fromMetadata(meta({ Duration: '1:02:03' }));
    assertEquals(file.resolver.duration, 3723);
  });

  await t.step('duration returns undefined when missing', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.resolver.duration, undefined);
  });
});

Deno.test('File setters and dirty flag', async (t) => {
  await t.step('setOriginatedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setOriginatedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0)));
    assertEquals(file.dirty, true);
  });

  await t.step('setModifiedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setModifiedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0)));
    assertEquals(file.dirty, true);
  });

  await t.step('setDigitizedAt marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setDigitizedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0)));
    assertEquals(file.dirty, true);
  });

  await t.step('setAllDates marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setAllDates(DateTime.fromComponents(2026, 7, 31, 18, 0, 0)));
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset marks file dirty', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setTimezoneOffset('+02:00'));
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset normalizes Z', () => {
    const file = File.fromMetadata(meta({}));
    file.applyTags(file.resolver.setTimezoneOffset('Z'));
    assertEquals(file.dirty, true);
  });

  await t.step('setTimezoneOffset rejects invalid input', () => {
    let threw = false;
    try {
      Meta.Resolver.from(meta({})).setTimezoneOffset('not-an-offset');
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

Deno.test('File resolution: prefers EXIF dates over filesystem dates', async (t) => {
  await t.step('originatedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.resolver.originatedAt, undefined);
  });

  await t.step('createdAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.resolver.createdAt, undefined);
  });

  await t.step('modifiedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.resolver.modifiedAt, undefined);
  });

  await t.step('digitizedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.resolver.digitizedAt, undefined);
  });

  await t.step('prefers EXIF dates over filesystem dates when both are present', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
      ModifyDate: '2026:07:29 14:00:00',
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.resolver.originatedAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(file.resolver.createdAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(file.resolver.digitizedAt?.toString().startsWith('2026-07-30'), true);
    assertEquals(file.resolver.modifiedAt?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('image section dates ignore filesystem dates', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.image?.originatedAt, undefined);
    assertEquals(file.image?.digitizedAt, undefined);
    assertEquals(file.image?.modifiedAt, undefined);
  });

  await t.step('video section dates ignore filesystem dates', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.video?.originatedAt, undefined);
    assertEquals(file.video?.digitizedAt, undefined);
    assertEquals(file.video?.modifiedAt, undefined);
  });

  await t.step('audio section dates ignore filesystem dates', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'audio/mpeg',
      FileType: 'MP3',
      FileTypeExtension: 'mp3',
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.audio?.originatedAt, undefined);
    assertEquals(file.audio?.digitizedAt, undefined);
    assertEquals(file.audio?.modifiedAt, undefined);
  });

  await t.step('document section dates ignore filesystem dates', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'application/pdf',
      FileType: 'PDF',
      FileTypeExtension: 'pdf',
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.doc, undefined);
  });
});

Deno.test('File.write in dry-run mode', async (t) => {
  await t.step('clears the dirty flag without invoking exiftool', async () => {
    const file = File.fromMetadata(meta({}), { dryRun: true });
    file.applyTags(file.resolver.setOriginatedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0)));
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

// --- repair() ---

function repairMeta(sourcePath: FS.FilePath, partial: Record<string, unknown> = {}): Metadata {
  return {
    SourceFile: sourcePath,
    ExifToolVersion: 12.0,
    FileName: 'IMG-20260406-WA0005.jpg',
    Directory: '/tmp',
    MIMEType: 'image/jpeg',
    FileType: 'JPEG',
    FileTypeExtension: 'jpg',
    ...partial,
  };
}

Deno.test('File.repair', async (t) => {
  const tmpDir = await Deno.makeTempDir({ prefix: 'exif-repair-' });
  try {
    const work = new FS.File(`${tmpDir}/IMG-20260406-WA0005.jpg`);
    await work.write('dummy content');

    await t.step('returns true and repairs a whatsapp file with no embedded dates', async () => {
      const file = File.fromMetadata(repairMeta(work.path), { dryRun: true });
      assertEquals(await file.repair(), true);
      assertEquals(file.pending.get('Software'), 'WhatsApp');
      assertEquals(file.pending.get('DateTimeOriginal'), '2026:04:06 00:00:00');
      assertEquals(file.pending.get('CreateDate') !== undefined, true);
      assertEquals(file.pending.get('ModifyDate') !== undefined, true);
    });

    await t.step('returns true and repairs a tiktok file with no embedded dates', async () => {
      const file = File.fromMetadata(
        repairMeta(work.path, {
          FileName: 'tiktok-video.mp4',
          MIMEType: 'video/mp4',
          FileType: 'MP4',
          FileTypeExtension: 'mp4',
          Comment: 'vid:v15044gf0000d9n1eifog65t4dv1v2u0',
        }),
        { dryRun: true },
      );
      assertEquals(await file.repair(), true);
      assertEquals(file.pending.get('Software'), 'TikTok');
      assertEquals(file.pending.get('DateTimeOriginal'), undefined);
      assertEquals(file.pending.get('TrackCreateDate') !== undefined, true);
      assertEquals(file.pending.get('MediaCreateDate') !== undefined, true);
    });

    await t.step('does not repair a camera file', async () => {
      const file = File.fromMetadata(
        repairMeta(work.path, {
          FileName: 'a.jpg',
          Make: 'Google',
          Model: 'Pixel 7',
        }),
        { dryRun: true },
      );
      assertEquals(await file.repair(), false);
      assertEquals(file.pending.size, 0);
    });

    await t.step('does not repair when a valid embedded date exists', async () => {
      const file = File.fromMetadata(
        repairMeta(work.path, {
          DateTimeOriginal: '2026:04:06 21:42:47',
        }),
        { dryRun: true },
      );
      assertEquals(await file.repair(), false);
      assertEquals(file.pending.size, 0);
    });

    await t.step('returns false when the file does not exist on disk', async () => {
      const missing = new FS.File(`${tmpDir}/missing/IMG-20260406-WA0005.jpg`);
      const file = File.fromMetadata(repairMeta(missing.path), { dryRun: true });
      assertEquals(await file.repair(), false);
      assertEquals(file.pending.size, 0);
    });
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
