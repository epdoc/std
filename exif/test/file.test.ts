import { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';
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
    assertEquals(created?.toString().startsWith('2026-07-31T18:00:00'), true);
    assertEquals(created?.hasTimezone(), false);
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
    assertEquals(modified?.toString().startsWith('2026-07-31T12:00:00'), true);
  });

  await t.step('duration parses video duration strings', () => {
    const file = File.fromMetadata(meta({ Duration: '2.00 s' }));
    assertEquals(file.video.duration, 2);
  });

  await t.step('duration parses H:MM:SS strings', () => {
    const file = File.fromMetadata(meta({ Duration: '1:02:03' }));
    assertEquals(file.video.duration, 3723);
  });

  await t.step('duration returns undefined when missing', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.video.duration, undefined);
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

Deno.test('File.cameraInfo', async (t) => {
  await t.step('reads camera metadata', () => {
    const file = File.fromMetadata(meta({
      Make: 'Apple',
      Model: 'iPhone 15 Pro',
      LensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
      Software: '17.5',
      CreatorTool: 'Adobe Lightroom',
      SerialNumber: 'ABC123',
      MakerNote: 'binary-makernote-data',
    }));
    assertEquals(file.camera, {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      lensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
      serialNumber: 'ABC123',
      makerNotes: 'binary-makernote-data',
    });
    assertEquals(file.makerNotes, 'binary-makernote-data');
  });

  await t.step('returns undefined fields when metadata is sparse', () => {
    const file = File.fromMetadata(meta({ Make: 'Canon' }));
    assertEquals(file.camera, {
      make: 'Canon',
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

  await t.step('setter queues MakerNote write', () => {
    const file = File.fromMetadata(meta({}));
    file.camera = { makerNotes: 'binary-data' };
    assertEquals(file.dirty, true);
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
    const file = File.fromMetadata(meta({
      GPSLatitude: 51.5,
      GPSLongitude: -0.1,
      GPSAltitude: '12.5 m',
    }));
    assertEquals(file.gps?.alt, 12.5);
  });

  await t.step('parses negative string altitude', () => {
    const file = File.fromMetadata(meta({
      GPSLatitude: 51.5,
      GPSLongitude: -0.1,
      GPSAltitude: '-10 m',
    }));
    assertEquals(file.gps?.alt, -10);
  });

  await t.step('returns undefined when GPS tags are missing', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.gps, undefined);
  });

  await t.step('returns undefined when only latitude is present', () => {
    const file = File.fromMetadata(meta({ GPSLatitude: 51.5 }));
    assertEquals(file.gps, undefined);
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

  await t.step('throws when lat or lng is missing', () => {
    const file = File.fromMetadata(meta({}));
    assertThrows(() => file.setGPS({ lat: undefined, lng: -0.1278 } as unknown as { lat: number; lng: number }));
    assertThrows(() => file.setGPS({ lat: 51.5, lng: undefined } as unknown as { lat: number; lng: number }));
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

Deno.test('File.image dates', async (t) => {
  await t.step('originatedAt uses DateTimeOriginal, not the filesystem time', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '1925:06:15 14:30:00',
      CreateDate: '2024:03:01 10:00:00',
      ModifyDate: '2024:03:02 11:00:00',
    }));
    assertEquals(file.image.originatedAt?.toString().startsWith('1925-06-15'), true);
  });

  await t.step('digitizedAt uses CreateDate', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '1925:06:15 14:30:00',
      CreateDate: '2024:03:01 10:00:00',
    }));
    assertEquals(file.image.digitizedAt?.toString().startsWith('2024-03-01'), true);
  });

  await t.step('modifiedAt uses ModifyDate', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '1925:06:15 14:30:00',
      CreateDate: '2024:03:01 10:00:00',
      ModifyDate: '2024:03:02 11:00:00',
    }));
    assertEquals(file.image.modifiedAt?.toString().startsWith('2024-03-02'), true);
  });

  await t.step('omits date fields when no metadata dates exist', () => {
    const file = File.fromMetadata(meta({}));
    assertEquals(file.image.originatedAt, undefined);
    assertEquals(file.image.digitizedAt, undefined);
    assertEquals(file.image.modifiedAt, undefined);
  });
});

Deno.test('File.video dates', async (t) => {
  await t.step('originatedAt uses DateTimeOriginal', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
      CreateDate: '2026:07:30 10:00:00',
    }));
    assertEquals(file.video.originatedAt?.toString().startsWith('2026-07-31'), true);
  });

  await t.step('digitizedAt falls back to QuickTime CreationDate', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      CreationDate: '2026:07:30 10:00:00',
    }));
    assertEquals(file.video.digitizedAt?.toString().startsWith('2026-07-30'), true);
  });

  await t.step('modifiedAt uses ModifyDate', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      ModifyDate: '2026:07:31 12:00:00',
    }));
    assertEquals(file.video.modifiedAt?.toString().startsWith('2026-07-31T12:00:00'), true);
  });
});

Deno.test('File.audio dates', async (t) => {
  await t.step('reads EXIF-like dates from standalone audio files', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'audio/mpeg',
      FileType: 'MP3',
      FileTypeExtension: 'mp3',
      DateTimeOriginal: '1985:11:20 09:00:00',
      CreateDate: '2001:06:01 12:00:00',
      ModifyDate: '2001:06:02 13:00:00',
    }));
    assertEquals(file.audio.originatedAt?.toString().startsWith('1985-11-20'), true);
    assertEquals(file.audio.digitizedAt?.toString().startsWith('2001-06-01'), true);
    assertEquals(file.audio.modifiedAt?.toString().startsWith('2001-06-02'), true);
  });
});

Deno.test('File.doc', async (t) => {
  await t.step('reads PDF metadata', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'application/pdf',
      FileType: 'PDF',
      FileTypeExtension: 'pdf',
      Title: 'Annual Report 2025',
      Author: 'Jane Doe',
      Subject: 'Financial summary',
      Keywords: ['finance', 'report'],
      Producer: 'Adobe PDF Library 17.0',
      PDFVersion: '1.7',
      PageCount: 42,
      CreateDate: '2025:01:15 09:30:00',
      ModifyDate: '2025:01:20 16:45:00',
    }));
    assertEquals(file.doc.title, 'Annual Report 2025');
    assertEquals(file.doc.author, 'Jane Doe');
    assertEquals(file.doc.subject, 'Financial summary');
    assertEquals(file.doc.keywords, ['finance', 'report']);
    assertEquals(file.doc.producer, 'Adobe PDF Library 17.0');
    assertEquals(file.doc.pageCount, 42);
    assertEquals(file.doc.digitizedAt?.toString().startsWith('2025-01-15'), true);
    assertEquals(file.doc.modifiedAt?.toString().startsWith('2025-01-20'), true);
  });

  await t.step('uses the Pages tag for Office documents', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      FileType: 'DOCX',
      FileTypeExtension: 'docx',
      Title: 'Proposal',
      Author: 'Bob Smith',
      Pages: 17,
      CreateDate: '2026:02:10 08:00:00',
    }));
    assertEquals(file.doc.title, 'Proposal');
    assertEquals(file.doc.author, 'Bob Smith');
    assertEquals(file.doc.pageCount, 17);
  });

  await t.step('omits fields when document metadata is missing', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'application/pdf',
      FileType: 'PDF',
      FileTypeExtension: 'pdf',
    }));
    assertEquals(file.doc, {});
  });
});

Deno.test('File.info dispatch', async (t) => {
  await t.step('includes the image section for images', () => {
    const file = File.fromMetadata(meta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      ExifImageWidth: 3000,
      ExifImageHeight: 2000,
    }));
    const info = file.info();
    assertEquals(info.file.type, 'image');
    assertEquals(info.image?.originatedAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(info.image?.width, 3000);
    assertEquals(info.doc, undefined);
  });

  await t.step('includes the video section for videos', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'video/mp4',
      FileType: 'MP4',
      FileTypeExtension: 'mp4',
      DateTimeOriginal: '2026:07:31 18:00:00',
    }));
    const info = file.info();
    assertEquals(info.file.type, 'video');
    assertEquals(info.video?.originatedAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(info.image, undefined);
  });

  await t.step('includes the doc section for documents', () => {
    const file = File.fromMetadata(meta({
      MIMEType: 'application/pdf',
      FileType: 'PDF',
      FileTypeExtension: 'pdf',
      Title: 'Report',
      PageCount: 5,
    }));
    const info = file.info();
    assertEquals(info.file.type, 'application');
    assertEquals(info.doc?.title, 'Report');
    assertEquals(info.doc?.pageCount, 5);
    assertEquals(info.image, undefined);
    assertEquals(info.video, undefined);
  });
});

Deno.test('File.*At getters ignore filesystem dates from exiftool', async (t) => {
  await t.step('originatedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.originatedAt, undefined);
  });

  await t.step('createdAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.createdAt, undefined);
  });

  await t.step('modifiedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.modifiedAt, undefined);
  });

  await t.step('digitizedAt returns undefined when only filesystem dates exist', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.digitizedAt, undefined);
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
    assertEquals(file.originatedAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(file.createdAt?.toString().startsWith('2026-07-31'), true);
    assertEquals(file.digitizedAt?.toString().startsWith('2026-07-30'), true);
    assertEquals(file.modifiedAt?.toString().startsWith('2026-07-29'), true);
  });

  await t.step('image section dates ignore filesystem dates', () => {
    const file = File.fromMetadata(meta({
      FileModifyDate: '2026:08:01 12:00:00',
      FileAccessDate: '2026:08:01 13:00:00',
      FileInodeChangeDate: '2026:08:01 14:00:00',
      FileCreateDate: '2026:08:01 15:00:00',
    }));
    assertEquals(file.image.originatedAt, undefined);
    assertEquals(file.image.digitizedAt, undefined);
    assertEquals(file.image.modifiedAt, undefined);
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
    assertEquals(file.video.originatedAt, undefined);
    assertEquals(file.video.digitizedAt, undefined);
    assertEquals(file.video.modifiedAt, undefined);
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
    assertEquals(file.audio.originatedAt, undefined);
    assertEquals(file.audio.digitizedAt, undefined);
    assertEquals(file.audio.modifiedAt, undefined);
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
    assertEquals(file.doc.originatedAt, undefined);
    assertEquals(file.doc.digitizedAt, undefined);
    assertEquals(file.doc.modifiedAt, undefined);
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
