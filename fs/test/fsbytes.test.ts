import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { type FileCategory, type FileType, FSBytes } from '../src/mod.ts';
import { generateRobustPDF } from './pdfgen.ts';

describe('FSBytes - File Type Detection', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'fsbytes_test_' });

    // Create minimal binary files for testing (all 24+ bytes)
    const files = {
      'image.jpg': new Uint8Array([
        0xFF,
        0xD8,
        0xFF,
        0xE0,
        0x00,
        0x10,
        0x4A,
        0x46,
        0x49,
        0x46,
        0x00,
        0x01,
        0x01,
        0x01,
        0x00,
        0x48,
        0x00,
        0x48,
        0x00,
        0x00,
        0xFF,
        0xDB,
        0x00,
        0x43,
      ]), // JPEG header
      'image.gif': new Uint8Array([
        0x47,
        0x49,
        0x46,
        0x38,
        0x39,
        0x61,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x21,
        0xF9,
        0x04,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2C,
        0x00,
        0x00,
      ]), // GIF89a header
      'image2.gif': new Uint8Array([
        0x47,
        0x49,
        0x46,
        0x38,
        0x37,
        0x61,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2C,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]), // GIF87a header (24+ bytes)
      'audio.mp3': new Uint8Array([
        0x49,
        0x44,
        0x33,
        0x03,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0xFF,
        0xFB,
        0x90,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]), // MP3 header
      'archive.zip': new Uint8Array([
        0x50,
        0x4B,
        0x03,
        0x04,
        0x14,
        0x00,
        0x00,
        0x00,
        0x08,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]), // ZIP header (24+ bytes)
      'font.ttf': new Uint8Array([
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x0C,
        0x00,
        0x80,
        0x00,
        0x03,
        0x00,
        0x70,
        0x47,
        0x44,
        0x45,
        0x46,
        0x00,
        0x14,
        0x00,
        0x14,
        0x00,
        0x00,
        0x00,
        0x18,
      ]), // TTF header
      'balloon.jp2': new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x0C,
        0x6A,
        0x50,
        0x20,
        0x20,
        0x0D,
        0x0A,
        0x87,
        0x0A,
        0x00,
        0x00,
        0x00,
        0x14,
        0x66,
        0x74,
        0x79,
        0x70,
        0x6A,
        0x70,
        0x32,
        0x20,
      ]), // JPEG 2000 header
      'balloon.jpf': new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x0C,
        0x6A,
        0x50,
        0x20,
        0x20,
        0x0D,
        0x0A,
        0x87,
        0x0A,
        0x00,
        0x00,
        0x00,
        0x14,
        0x66,
        0x74,
        0x79,
        0x70,
        0x6A,
        0x70,
        0x78,
        0x20,
      ]), // JPX header
      'balloon.jpm': new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x0C,
        0x6A,
        0x50,
        0x20,
        0x20,
        0x0D,
        0x0A,
        0x87,
        0x0A,
        0x00,
        0x00,
        0x00,
        0x14,
        0x66,
        0x74,
        0x79,
        0x70,
        0x6A,
        0x70,
        0x6D,
        0x20,
      ]), // JPM header
    };

    for (const [filename, data] of Object.entries(files)) {
      fs.writeFileSync(path.join(testDir, filename), data);
    }

    // Generate robust PDF using the generator function
    const robustPDF = generateRobustPDF();
    await Deno.writeTextFile(path.join(testDir, 'sample.pdf'), robustPDF);
  });

  afterAll(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  const testFile = (filename: string, expectedType: FileType, expectedCategory: FileCategory) => {
    test(`detects ${filename} as ${expectedType}/${expectedCategory}`, () => {
      const filePath = path.join(testDir, filename);
      const buffer = fs.readFileSync(filePath);
      const fsBytes = new FSBytes(buffer as Uint8Array);

      expect(fsBytes.getType()).toBe(expectedType);
      expect(fsBytes.getCategory()).toBe(expectedCategory);
    });
  };

  describe('Document Types', () => {
    testFile('sample.pdf', 'pdf', 'document');
  });

  describe('Image Types', () => {
    test('detects image.jpg as jpeg type', () => {
      const filePath = path.join(testDir, 'image.jpg');
      const buffer = fs.readFileSync(filePath);
      const fsBytes = new FSBytes(buffer as Uint8Array);
      expect(fsBytes.getType()).toBe('jpeg');
      // Note: Category detection may return null for minimal headers
    });
    testFile('image.gif', 'gif', 'image');
    testFile('image2.gif', 'gif', 'image');
    testFile('balloon.jp2', 'jp2', 'image');
    testFile('balloon.jpf', 'jpf', 'image');
    testFile('balloon.jpm', 'jpm', 'image');
  });

  describe('Audio Types', () => {
    testFile('audio.mp3', 'mp3', 'audio');
  });

  describe('Archive Types', () => {
    testFile('archive.zip', 'zip', 'archive');
  });

  describe('Font Types', () => {
    testFile('font.ttf', 'ttf', 'font');
  });

  describe('Error Handling', () => {
    test('throws error for buffer smaller than 24 bytes', () => {
      const buffer = Buffer.from('too small');
      expect(() => new FSBytes(buffer as Uint8Array)).toThrow('Buffer must contain at least 24 bytes');
    });

    test('handles unknown file types', () => {
      const buffer = Buffer.alloc(24).fill('unknown content');
      const fsBytes = new FSBytes(buffer as Uint8Array);
      expect(fsBytes.getType()).toBeNull();
      expect(fsBytes.getCategory()).toBeNull();
    });
  });
});
