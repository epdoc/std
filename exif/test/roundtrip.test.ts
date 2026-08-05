import { assertAlmostEquals, assertEquals } from '@std/assert';
import * as FS from '@epdoc/fs/fs';
import { File } from '../src/mod.ts';

const EXIFTOOL_AVAILABLE = exiftoolAvailable();

function exiftoolAvailable(): boolean {
  try {
    const cmd = new Deno.Command('exiftool', { args: ['-ver'], stdout: 'piped', stderr: 'piped' });
    return cmd.outputSync().success;
  } catch {
    return false;
  }
}

function assetFile(): FS.File {
  return new FS.File(`${import.meta.dirname}/readonly/1x1.jpg`);
}

async function copyAsset(tmpDir: string, name: string): Promise<FS.File> {
  const work = new FS.File(`${tmpDir}/${name}`);
  await assetFile().safeCopy(work);
  return work;
}

Deno.test({
  name: 'File exiftool round trip (requires exiftool)',
  ignore: !EXIFTOOL_AVAILABLE,
  fn: async (t) => {
    const tmpDir = await Deno.makeTempDir({ prefix: 'exif-roundtrip-' });
    try {
      await t.step('writes GPS tags and reads them back as decimal coordinates', async () => {
        const work = await copyAsset(tmpDir, 'gps.jpg');
        const file = new File(work.path);
        file.setGPS({ lat: 51.5072222, lng: -0.1278, alt: 12.5 });
        assertEquals(file.dirty, true);
        await file.write();

        await file.getMetadata();
        const gps = file.gps;
        assertAlmostEquals(gps?.lat!, 51.5072222, 0.001);
        assertAlmostEquals(gps?.lng!, -0.1278, 0.001);
        assertEquals(gps?.alt, 12.5);
      });

      await t.step('round-trips southern/western coordinates and below-sea-level altitude', async () => {
        const work = await copyAsset(tmpDir, 'below.jpg');
        const file = new File(work.path);
        file.setGPS({ lat: -33.8688, lng: 151.2093, alt: -10 });
        await file.write();

        await file.getMetadata();
        const gps = file.gps;
        assertAlmostEquals(gps?.lat!, -33.8688, 0.001);
        assertAlmostEquals(gps?.lng!, 151.2093, 0.001);
        assertEquals(gps?.alt, 10);
      });

      await t.step('sets camera tags and reads them back', async () => {
        const work = await copyAsset(tmpDir, 'camera.jpg');
        const file = new File(work.path);
        file.cameraInfo = { make: 'Canon', model: 'EOS R5', lensModel: 'RF 50mm F1.2L' };
        await file.write();

        await file.getMetadata();
        assertEquals(file.cameraInfo.make, 'Canon');
        assertEquals(file.cameraInfo.model, 'EOS R5');
        assertEquals(file.cameraInfo.lensModel, 'RF 50mm F1.2L');
      });
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
});
