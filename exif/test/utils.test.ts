import { assertEquals, assertThrows } from '@std/assert';
import type * as FS from '@epdoc/fs/fs';
import { parseDuration, parseJson } from '../src/mod.ts';

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

Deno.test('parseJson', async (t) => {
  await t.step('parses a JSON array', () => {
    const out = parseJson(JSON.stringify([SINGLE, { ...SINGLE, FileName: 'b.mp4' }]));
    assertEquals(out.length, 2);
    assertEquals(out[0].FileName, 'a.mp4');
    assertEquals(out[1].FileName, 'b.mp4');
  });

  await t.step('wraps a single object into an array', () => {
    const out = parseJson(JSON.stringify(SINGLE));
    assertEquals(out.length, 1);
    assertEquals(out[0].ImageWidth, 320);
  });

  await t.step('returns an empty array for empty output', () => {
    assertEquals(parseJson(''), []);
    assertEquals(parseJson('   \n'), []);
  });

  await t.step('throws on invalid JSON', () => {
    assertThrows(() => parseJson('not json'));
  });
});

Deno.test('parseDuration', async (t) => {
  await t.step('parses seconds-with-units format', () => {
    assertEquals(parseDuration('2.00 s'), 2);
  });

  await t.step('parses H:MM:SS format', () => {
    assertEquals(parseDuration('1:02:03'), 3723);
  });

  await t.step('parses a number', () => {
    assertEquals(parseDuration(120), 120);
  });

  await t.step('parses a numeric string', () => {
    assertEquals(parseDuration('45.5'), 45.5);
  });

  await t.step('returns undefined for missing input', () => {
    assertEquals(parseDuration(undefined), undefined);
  });

  await t.step('returns undefined for unparseable input', () => {
    assertEquals(parseDuration('not a duration'), undefined);
  });
});
