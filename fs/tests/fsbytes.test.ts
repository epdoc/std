import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { type FileCategory, type FileType, FolderSpec, FSBytes } from '../mod.ts';

const READONLY = FolderSpec.fromMeta(import.meta.url, './readonly');

describe('FSBytes', () => {
  const testFilesDir = path.join(READONLY.path, 'test-files');

  const testFile = (filename: string, expectedType: FileType, expectedCategory: FileCategory) => {
    test(`getType() and getCategory() detect ${filename} correctly`, () => {
      const filePath = path.join(testFilesDir, filename);
      const buffer = fs.readFileSync(filePath);
      const fsBytes = new FSBytes(buffer as Uint8Array);

      expect(fsBytes.getType()).toBe(expectedType);
      expect(fsBytes.getCategory()).toBe(expectedCategory);
    });
  };

  testFile('sample.pdf', 'pdf', 'document');
  testFile('image.jpg', 'jpg', 'image');
  testFile('image.gif', 'gif', 'image');
  testFile('image2.gif', 'gif', 'image');
  testFile('audio.mp3', 'mp3', 'audio');
  // testFile('video.mp4', 'mp4', 'video');
  testFile('archive.zip', 'zip', 'archive');
  testFile('font.ttf', 'ttf', 'font');
  // testFile('balloon.j2c', 'j2c', 'image');
  testFile('balloon.jp2', 'jp2', 'image');
  testFile('balloon.jpf', 'jpf', 'image');
  testFile('balloon.jpm', 'jpm', 'image');
  // testFile('Speedway.mj2', 'mj2', 'image');

  test('constructor throws error for buffer smaller than 24 bytes', () => {
    const buffer = Buffer.from('too small');
    expect(() => new FSBytes(buffer as Uint8Array)).toThrow('Buffer must contain at least 24 bytes');
  });

  test('getType() and getCategory() handle unknown file types', () => {
    const buffer = Buffer.alloc(24).fill('unknown content');
    const fsBytes = new FSBytes(buffer as Uint8Array);
    expect(fsBytes.getType()).toBeNull();
    expect(fsBytes.getCategory()).toBeNull();
  });
});
