import * as FS from '@epdoc/fs/fs';
import { assertEquals } from '@std/assert';
import { File, type Metadata, type MetaModHistory } from '../src/mod.ts';

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

/** Collapse the mod-history array returned by {@link File.repair} into a tag→value map. */
function toMap(changes: MetaModHistory[]): Record<string, string | number | undefined> {
  const map: Record<string, string | number | undefined> = {};
  for (const c of changes) map[c.tag] = c.value;
  return map;
}

Deno.test('File.repair', async (t) => {
  const tmpDir = await Deno.makeTempDir({ prefix: 'exif-repair-' });
  try {
    const work = new FS.File(`${tmpDir}/IMG-20260406-WA0005.jpg`);
    await work.write('dummy content');

    await t.step('repairs a whatsapp file with no embedded dates', async () => {
      const file = File.fromMetadata(repairMeta(work.path), { dryRun: true });
      const changes = toMap(await file.repair());
      assertEquals(Object.keys(changes).length, 10);
      assertEquals(changes['Software'], 'WhatsApp');
      assertEquals(changes['DateTimeOriginal'], '2026:04:06 00:00:00');
      assertEquals(changes['CreateDate'] !== undefined, true);
      assertEquals(changes['ModifyDate'] !== undefined, true);
    });

    await t.step('repairs a tiktok file with no embedded dates', async () => {
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
      const changes = toMap(await file.repair());
      assertEquals(Object.keys(changes).length, 11);
      assertEquals(changes['Software'], 'TikTok');
      assertEquals(changes['DateTimeOriginal'], undefined);
      assertEquals(changes['TrackCreateDate'] !== undefined, true);
      assertEquals(changes['MediaCreateDate'] !== undefined, true);
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
      const changes = toMap(await file.repair());
      assertEquals(Object.keys(changes).length, 0);
    });

    await t.step('does not repair when a valid embedded date exists', async () => {
      const file = File.fromMetadata(
        repairMeta(work.path, {
          DateTimeOriginal: '2026:04:06 21:42:47',
        }),
        { dryRun: true },
      );
      const changes = toMap(await file.repair());
      assertEquals(Object.keys(changes).length, 0);
    });

    await t.step('returns an empty changeset when the file does not exist on disk', async () => {
      const missing = new FS.File(`${tmpDir}/missing/IMG-20260406-WA0005.jpg`);
      const file = File.fromMetadata(repairMeta(missing.path), { dryRun: true });

      const changes = toMap(await file.repair());
      assertEquals(Object.keys(changes).length, 0);
    });
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
