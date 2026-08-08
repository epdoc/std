import type * as FS from '@epdoc/fs/fs';
import { _ } from '@epdoc/type';
import { assert, assertEquals } from '@std/assert';
import { File } from '../src/mod.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

function jpgMeta(partial: Record<string, unknown> = {}) {
  return {
    SourceFile: sourceFile('/photos/beach.jpg'),
    ExifToolVersion: 12.0,
    FileName: 'beach.jpg',
    Directory: '/photos',
    MIMEType: 'image/jpeg',
    FileType: 'JPEG',
    FileTypeExtension: 'jpg',
    ImageWidth: 6000,
    ImageHeight: 4000,
    FileSize: '8.2 MB',
    ...partial,
  };
}

function videoMeta(partial: Record<string, unknown> = {}) {
  return {
    SourceFile: sourceFile('/videos/clip.mp4'),
    ExifToolVersion: 12.0,
    FileName: 'clip.mp4',
    Directory: '/videos',
    MIMEType: 'video/mp4',
    FileType: 'MP4',
    FileTypeExtension: 'mp4',
    ImageWidth: 3840,
    ImageHeight: 2160,
    Duration: '1:02:03',
    ...partial,
  };
}

function audioMeta(partial: Record<string, unknown> = {}) {
  return {
    SourceFile: sourceFile('/audio/song.mp3'),
    ExifToolVersion: 12.0,
    FileName: 'song.mp3',
    Directory: '/audio',
    MIMEType: 'audio/mpeg',
    FileType: 'MP3',
    FileTypeExtension: 'mp3',
    Duration: '3:45',
    ...partial,
  };
}

function pdfMeta(partial: Record<string, unknown> = {}) {
  return {
    SourceFile: sourceFile('/docs/report.pdf'),
    ExifToolVersion: 12.0,
    FileName: 'report.pdf',
    Directory: '/docs',
    MIMEType: 'application/pdf',
    FileType: 'PDF',
    FileTypeExtension: 'pdf',
    Title: 'Annual Report',
    Author: 'Jane Doe',
    Subject: 'Financial Summary',
    Keywords: ['report', 'annual', 'finance'],
    PageCount: 42,
    Producer: 'Adobe PDF Library 15.0',
    ...partial,
  };
}

// --- file getter ---

Deno.test('File.file section', async (t) => {
  await t.step('returns filesystem-level info', () => {
    const exifFile = File.fromMetadata(jpgMeta());
    const file = exifFile.file();
    assertEquals(file.path, '/photos/beach.jpg');
    assertEquals(file.filename, 'beach.jpg');
    assertEquals(file.ext, 'jpg');
    assertEquals(file.mimeType, 'image/jpeg');
    assertEquals(file.type, 'image');
  });
});

// --- image getter ---

Deno.test('File.image section', async (t) => {
  await t.step('returns image metadata', () => {
    const file = File.fromMetadata(jpgMeta({
      ExifImageWidth: 6000,
      ExifImageHeight: 4000,
      EncodingProcess: 'Baseline DCT',
      ColorSpace: 'sRGB',
      FNumber: 2.8,
      ExposureTime: '1/250',
      ISO: 100,
      FocalLength: '50 mm',
      FocalLengthIn35mmFormat: '50 mm',
      Megapixels: 24.0,
      FileSize: '8.2 MB',
    }));
    const img = file.image();
    assert(img);
    assertEquals(img.width, 6000);
    assertEquals(img.height, 4000);
    assertEquals(img.encoding, 'Baseline DCT');
    assertEquals(img.colorSpace, 'sRGB');
    assertEquals(img.fNumber, 2.8);
    assertEquals(img.iso, 100);
    assertEquals(img.focalLength, 50);
    assertEquals(img.focalLength35mm, 50);
    assertEquals(img.megapixels, 24.0);
    assertEquals(img.fileSize, '8.2 MB');
  });

  await t.step('exposureTime is normalized to seconds', () => {
    const file = File.fromMetadata(jpgMeta({ ExposureTime: '1/250' }));
    const img = file.image();
    assert(img);
    assertEquals(img.exposureTime, 1 / 250);
  });

  await t.step('focalLength is normalized from strings', () => {
    const file = File.fromMetadata(jpgMeta({
      FocalLength: '50 mm',
      FocalLengthIn35mmFormat: '50 mm',
    }));
    const img = file.image();
    assert(img);
    assertEquals(img.focalLength, 50);
    assertEquals(img.focalLength35mm, 50);
  });

  await t.step('omits undefined fields', () => {
    const file = File.fromMetadata(jpgMeta());
    const img = file.image();
    assert(img);
    assertEquals(img.iso, undefined);
    assertEquals(img.fNumber, undefined);
  });
});

// --- video getter ---

Deno.test('File.video section', async (t) => {
  await t.step('returns video resolution from normalize', () => {
    const file = File.fromMetadata(videoMeta({
      ImageWidth: 3840,
      ImageHeight: 2160,
    }));
    const vid = file.video();
    assert(vid);
    assertEquals(vid.width, 3840);
    assertEquals(vid.height, 2160);
    assertEquals(vid.tag, '4K');
  });

  await t.step('returns video duration', () => {
    const file = File.fromMetadata(videoMeta({ Duration: '1:02:03' }));
    const vid = file.video();
    assert(vid);
    assertEquals(vid.duration, 3723);
  });

  await t.step('returns codec when available', () => {
    const file = File.fromMetadata(videoMeta({
      CompressorID: 'avc1',
    }));
    const vid = file.video();
    assert(vid);
    assertEquals(typeof vid.codec, 'string');
  });

  await t.step('returns undefined for non-video metadata', () => {
    const file = File.fromMetadata(pdfMeta());
    assertEquals(file.video(), undefined);
  });
});

// --- audio getter ---

Deno.test('File.audio section', async (t) => {
  await t.step('returns audio metadata', () => {
    const file = File.fromMetadata(audioMeta({
      AudioFormat: 'MPEG Audio',
      AudioChannels: 2,
      AudioSampleRate: 44100,
      AudioBitsPerSample: 16,
      Duration: '3:45',
    }));
    const aud = file.audio();
    assert(aud);
    assertEquals(aud.format, 'MPEG Audio');
    assertEquals(aud.channels, 2);
    assertEquals(aud.sampleRate, 44100);
    assertEquals(aud.bitsPerSample, 16);
    assertEquals(aud.duration, 225);
  });
});

// --- camera getter ---

Deno.test('File.camera section', async (t) => {
  await t.step('returns camera metadata', () => {
    const file = File.fromMetadata(jpgMeta({
      Make: 'Nikon',
      Model: 'D7100',
      LensMake: 'Canon',
      LensModel: 'RF 50mm F1.2L USM',
      SerialNumber: '1234567890',
      MakerNote: '(binary data)',
      FocalLengthIn35mmFormat: '50 mm',
    }));
    const cam = file.camera();
    assert(cam);
    assertEquals(cam.make, 'Nikon');
    assertEquals(cam.model, 'D7100');
    assertEquals(cam.lensMake, 'Canon');
    assertEquals(cam.lensModel, 'RF 50mm F1.2L USM');
    assertEquals(cam.serialNumber, '1234567890');
    assertEquals(cam.makerNotes, '(binary data)');
    assertEquals(cam.focalLength35mm, 50);
    assertEquals(cam.name, 'Nikon D7100');
  });

  await t.step('omits undefined fields', () => {
    const file = File.fromMetadata(jpgMeta());
    const cam = file.camera();
    assert(!_.isDefined(cam));
  });
});

// --- camera setter ---

Deno.test('File.camera setter', async (t) => {
  await t.step('queues camera tag writes', () => {
    const file = File.fromMetadata(jpgMeta());
    file.setCamera({ make: 'Nikon', model: 'Z8', lensModel: 'NIKKOR Z 24-70mm' });
    assertEquals(file.dirty, true);
  });
});

// --- app getter ---

Deno.test('File.app section', async (t) => {
  await t.step('returns software/creator tool', () => {
    const file = File.fromMetadata(jpgMeta({ Software: 'Adobe Lightroom 7.0' }));
    assertEquals(file.app()!.application, 'Adobe Lightroom');
  });
});

// --- doc getter ---

Deno.test('File.doc section', async (t) => {
  await t.step('returns document metadata', () => {
    const file = File.fromMetadata(pdfMeta());
    assertEquals(file.doc()!.title, 'Annual Report');
    assertEquals(file.doc()!.author, 'Jane Doe');
    assertEquals(file.doc()!.subject, 'Financial Summary');
    assertEquals(file.doc()!.pageCount, 42);
    assertEquals(file.doc()!.producer, 'Adobe PDF Library 15.0');
  });

  await t.step('keywords are passed through as-is', () => {
    const file = File.fromMetadata(pdfMeta({ Keywords: ['report', 'finance'] }));
    assertEquals(file.doc()!.keywords, ['report', 'finance']);
  });

  await t.step('single keyword string works', () => {
    const file = File.fromMetadata(pdfMeta({ Keywords: 'report' }));
    assertEquals(file.doc()!.keywords, 'report');
  });
});

// --- gps getter ---

Deno.test('File.gps getter', async (t) => {
  await t.step('returns parsed GPS coordinates from DMS strings', () => {
    const file = File.fromMetadata(jpgMeta({
      GPSLatitude: '51 deg 30\' 26.00" N',
      GPSLatitudeRef: 'North',
      GPSLongitude: '0 deg 7\' 39.00" W',
      GPSLongitudeRef: 'West',
    }));
    const gps = file.gps();
    assert(gps);
    assertEquals(Math.abs(gps.lat - 51.5072) < 0.01, true);
    assertEquals(Math.abs(gps.lng - (-0.1275)) < 0.01, true);
  });

  await t.step('returns undefined when GPS data is missing', () => {
    const file = File.fromMetadata(jpgMeta());
    assertEquals(file.gps(), undefined);
  });

  await t.step('handles altitude', () => {
    const file = File.fromMetadata(jpgMeta({
      GPSLatitude: '51 deg 30\' 26.00" N',
      GPSLongitude: '0 deg 7\' 39.00" W',
      GPSAltitude: 12.5,
    }));
    assertEquals(file.gps()?.alt, 12.5);
  });
});

// --- hasGps() ---

Deno.test('File.hasGps', async (t) => {
  await t.step('returns true when GPS coordinates exist', () => {
    const file = File.fromMetadata(jpgMeta({
      GPSLatitude: '51 deg 30\' 26.00" N',
      GPSLongitude: '0 deg 7\' 39.00" W',
    }));
    assertEquals(file.hasGps(), true);
  });

  await t.step('returns false when GPS coordinates are missing', () => {
    const file = File.fromMetadata(jpgMeta());
    assertEquals(file.hasGps(), false);
  });
});

// --- id getter ---

Deno.test('File.id getter', async (t) => {
  await t.step('returns document/instance IDs when present', () => {
    const file = File.fromMetadata(pdfMeta({
      DocumentID: 'xmp.did:abc123',
      InstanceID: 'xmp.iid:def456',
    }));
    assertEquals(file.id()!.documentId, 'xmp.did:abc123');
    assertEquals(file.id()!.instanceId, 'xmp.iid:def456');
  });

  await t.step('returns undefined when IDs are missing', () => {
    const file = File.fromMetadata(jpgMeta());
    assertEquals(file.id(), undefined);
  });
});

// --- makerNotes getter ---

Deno.test('File.makerNotes', async (t) => {
  await t.step('returns MakerNote binary when present', () => {
    const file = File.fromMetadata(jpgMeta({ MakerNote: '(binary)' }));
    assertEquals(file.makerNotes, '(binary)');
  });

  await t.step('returns undefined when MakerNote is missing', () => {
    const file = File.fromMetadata(jpgMeta());
    assertEquals(file.makerNotes, undefined);
  });
});

// --- info() ---

Deno.test('File.info', async (t) => {
  await t.step('returns structured info for image files', () => {
    const file = File.fromMetadata(jpgMeta({
      DateTimeOriginal: '2026:07:31 18:00:00',
      ImageWidth: 6000,
      ImageHeight: 4000,
      Make: 'Canon',
      Model: 'EOS R5',
    }));
    const info = file.info();
    assertEquals(typeof info.file, 'object');
    assertEquals(info.file.type, 'image');
    assertEquals(typeof info.image, 'object');
    assertEquals(typeof info.camera, 'object');
    assertEquals(info.video, undefined);
    assertEquals(info.audio, undefined);
    assertEquals(info.doc, undefined);
  });

  await t.step('returns structured info for video files', () => {
    const file = File.fromMetadata(videoMeta({
      Duration: '2.00 s',
      ImageWidth: 1920,
      ImageHeight: 1080,
    }));
    const info = file.info();
    assertEquals(info.file.type, 'video');
    assertEquals(typeof info.video, 'object');
    assertEquals(info.image, undefined);
  });

  await t.step('returns structured info for audio files', () => {
    const file = File.fromMetadata(audioMeta());
    const info = file.info();
    assertEquals(info.file.type, 'audio');
    assertEquals(typeof info.audio, 'object');
    assertEquals(info.image, undefined);
    assertEquals(info.video, undefined);
  });

  await t.step('returns structured info for documents', () => {
    const file = File.fromMetadata(pdfMeta());
    const info = file.info();
    assertEquals(info.file.type, 'application');
    assertEquals(typeof info.pdf, 'object');
    assertEquals(info.image, undefined);
    assertEquals(info.video, undefined);
    assertEquals(info.audio, undefined);
  });

  await t.step('includes metadata when requested', () => {
    const file = File.fromMetadata(jpgMeta());
    const info = file.info({ metadata: true });
    assertEquals(typeof info.metadata, 'object');
    assertEquals(info.metadata?.FileName, 'beach.jpg');
  });

  await t.step('excludes metadata by default', () => {
    const file = File.fromMetadata(jpgMeta());
    const info = file.info();
    assertEquals(info.metadata, undefined);
  });
});

// --- toJSON() ---

Deno.test('File.toJSON', async (t) => {
  await t.step('returns same shape as info()', () => {
    const file = File.fromMetadata(jpgMeta({
      ImageWidth: 6000,
      ImageHeight: 4000,
    }));
    const json = file.toJSON({ metadata: false });
    assertEquals(json.file.type, 'image');
    assertEquals(typeof json.image, 'object');
  });

  await t.step('includes metadata when requested', () => {
    const file = File.fromMetadata(jpgMeta());
    const json = file.toJSON({ metadata: true });
    assertEquals(typeof json.metadata, 'object');
  });
});
