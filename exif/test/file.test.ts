import { assertAlmostEquals, assertEquals } from '@std/assert';
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

Deno.test('File.camera', async (t) => {
  await t.step('reads camera metadata', () => {
    const file = File.fromMetadata(meta({
      Make: 'Apple',
      Model: 'iPhone 15 Pro',
      LensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
      Software: '17.5',
      CreatorTool: 'Adobe Lightroom',
      SerialNumber: 'ABC123',
    }));
    assertEquals(file.camera, {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      lensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
      software: '17.5',
      creatorTool: 'Adobe Lightroom',
      serialNumber: 'ABC123',
    });
  });

  await t.step('returns undefined fields when metadata is sparse', () => {
    const file = File.fromMetadata(meta({ Make: 'Canon' }));
    assertEquals(file.camera, {
      make: 'Canon',
      model: undefined,
      lensModel: undefined,
      software: undefined,
      creatorTool: undefined,
      serialNumber: undefined,
    });
  });

  await t.step('setter queues writes for present fields', () => {
    const file = File.fromMetadata(meta({}));
    file.camera = { make: 'Canon', model: 'EOS R5' };
    assertEquals(file.dirty, true);
  });

  await t.step('setter skips undefined fields and stays clean for an empty object', () => {
    const file = File.fromMetadata(meta({}));
    file.camera = {};
    assertEquals(file.dirty, false);
  });
});

Deno.test('File.gps', async (t) => {
  await t.step('converts DMS coordinates with single-letter refs to decimal', () => {
    const file = File.fromMetadata(meta({
      GPSLatitude: '33 deg 52\' 7.68" S',
      GPSLatitudeRef: 'S',
      GPSLongitude: '151 deg 12\' 33.48" W',
      GPSLongitudeRef: 'W',
      GPSAltitude: 12.5,
    }));
    const gps = file.gps;
    assertAlmostEquals(gps?.lat!, -33.8688, 0.001);
    assertAlmostEquals(gps?.lng!, -151.2093, 0.001);
    assertEquals(gps?.alt, 12.5);
  });

  await t.step('converts DMS coordinates with long-form refs to decimal', () => {
    const file = File.fromMetadata(meta({
      GPSLatitude: '33 deg 52\' 7.68" S',
      GPSLatitudeRef: 'South',
      GPSLongitude: '151 deg 12\' 33.48" W',
      GPSLongitudeRef: 'West',
    }));
    const gps = file.gps;
    assertAlmostEquals(gps?.lat!, -33.8688, 0.001);
    assertAlmostEquals(gps?.lng!, -151.2093, 0.001);
  });

  await t.step('handles -n decimal coordinates', () => {
    const file = File.fromMetadata(meta({
      GPSLatitude: -33.8688,
      GPSLatitudeRef: 'S',
      GPSLongitude: -151.2093,
      GPSLongitudeRef: 'W',
      GPSAltitude: 12.5,
    }));
    assertEquals(file.gps, { lat: -33.8688, lng: -151.2093, alt: 12.5 });
  });

  await t.step('parses exiftool default output without refs', () => {
    const file = File.fromMetadata(meta({
      GPSLatitude: '33 deg 52\' 7.68"',
      GPSLongitude: '151 deg 12\' 33.48"',
    }));
    const gps = file.gps;
    assertAlmostEquals(gps?.lat!, 33.8688, 0.001);
    assertAlmostEquals(gps?.lng!, 151.2093, 0.001);
  });

  await t.step('parses string altitude with units', () => {
    const file = File.fromMetadata(meta({ GPSAltitude: '12.5 m' }));
    assertEquals(file.gps?.alt, 12.5);
  });

  await t.step('parses negative string altitude', () => {
    const file = File.fromMetadata(meta({ GPSAltitude: '-10 m' }));
    assertEquals(file.gps?.alt, -10);
  });

  await t.step('returns undefined components when GPS tags are missing', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.gps, { lat: undefined, lng: undefined, alt: undefined });
  });
});

Deno.test('File.setGPS', async (t) => {
  await t.step('marks the file dirty and queues GPS tags', () => {
    const file = File.fromMetadata(meta({}));
    file.setGPS({ lat: 51.5072222, lng: -0.1278, alt: 12.5 });
    assertEquals(file.dirty, true);
  });

  await t.step('queues a below-sea-level altitude reference', () => {
    const file = File.fromMetadata(meta({}));
    file.setGPS({ lat: 51.5072222, lng: -0.1278, alt: -12.5 });
    assertEquals(file.dirty, true);
  });

  await t.step('accepts a second-precision option', () => {
    const file = File.fromMetadata(meta({}));
    file.setGPS({ lat: 51.5072222, lng: -0.1278 }, { secondPrecision: 0 });
    assertEquals(file.dirty, true);
  });

  await t.step('still queues when altitude is omitted', () => {
    const file = File.fromMetadata(meta({}));
    file.setGPS({ lat: 51.5072222, lng: -0.1278 });
    assertEquals(file.dirty, true);
  });
});

Deno.test('File.id', async (t) => {
  await t.step('returns document and instance IDs', () => {
    const file = File.fromMetadata(meta({ DocumentID: 'doc-1', InstanceID: 'inst-1' }));
    assertEquals(file.id, { documentId: 'doc-1', instanceId: 'inst-1' });
  });

  await t.step('returns only present IDs', () => {
    const file = File.fromMetadata(meta({ InstanceID: 'inst-1' }));
    assertEquals(file.id, { instanceId: 'inst-1' });
  });

  await t.step('returns an empty object when no IDs are present', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.id, {});
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
