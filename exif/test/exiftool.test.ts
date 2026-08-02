import { assertEquals, assertThrows } from '@std/assert';
import type * as FS from '@epdoc/fs/fs';
import { parseExifJson } from '../src/mod.ts';

function sourceFile(path: string): FS.FilePath {
  return path as FS.FilePath;
}

const SINGLE = {
  SourceFile: sourceFile('/tmp/a.mp4'),
  ExifToolVersion: 10.98,
  FileName: 'a.mp4',
  Directory: '/tmp',
  MIMEType: 'video/mp4',
  FileType: 'MP4',
  FileTypeExtension: 'mp4',
  ImageWidth: 320,
  ImageHeight: 240,
  Duration: '2.00 s',
};

Deno.test('parseExifJson', async (t) => {
  await t.step('parses a JSON array', () => {
    const out = parseExifJson(JSON.stringify([SINGLE, { ...SINGLE, FileName: 'b.mp4' }]));
    assertEquals(out.length, 2);
    assertEquals(out[0].FileName, 'a.mp4');
    assertEquals(out[1].FileName, 'b.mp4');
  });

  await t.step('wraps a single object into an array', () => {
    const out = parseExifJson(JSON.stringify(SINGLE));
    assertEquals(out.length, 1);
    assertEquals(out[0].ImageWidth, 320);
  });

  await t.step('returns an empty array for empty output', () => {
    assertEquals(parseExifJson(''), []);
    assertEquals(parseExifJson('   \n'), []);
  });

  await t.step('throws on invalid JSON', () => {
    assertThrows(() => parseExifJson('not json'));
  });
});
