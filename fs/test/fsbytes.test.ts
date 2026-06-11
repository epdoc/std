import { FSBytes } from '$mod';
import { assertEquals, assertThrows } from '@std/assert';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateRobustPDF } from './pdfgen.ts';

Deno.test('FSBytes - File Type Detection', async (t) => {
  const testDir = await Deno.makeTempDir({ prefix: 'fsbytes_test_' });

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
    ]),
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
    ]),
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
    ]),
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
      0x00,
    ]),
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
    ]),
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
    ]),
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
    ]),
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
    ]),
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
    ]),
  };

  for (const [filename, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(testDir, filename), data);
  }

  const robustPDF = generateRobustPDF();
  await Deno.writeTextFile(path.join(testDir, 'sample.pdf'), robustPDF);

  try {
    await t.step('Document Types', async (t) => {
      await t.step('detects sample.pdf as pdf/document', () => {
        const filePath = path.join(testDir, 'sample.pdf');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'pdf');
        assertEquals(fsBytes.getCategory(), 'document');
      });
    });

    await t.step('Image Types', async (t) => {
      await t.step('detects image.jpg as jpeg type', () => {
        const filePath = path.join(testDir, 'image.jpg');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'jpeg');
      });
      await t.step('detects image.gif as gif/image', () => {
        const filePath = path.join(testDir, 'image.gif');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'gif');
        assertEquals(fsBytes.getCategory(), 'image');
      });
      await t.step('detects image2.gif as gif/image', () => {
        const filePath = path.join(testDir, 'image2.gif');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'gif');
        assertEquals(fsBytes.getCategory(), 'image');
      });
      await t.step('detects balloon.jp2 as jp2/image', () => {
        const filePath = path.join(testDir, 'balloon.jp2');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'jp2');
        assertEquals(fsBytes.getCategory(), 'image');
      });
      await t.step('detects balloon.jpf as jpf/image', () => {
        const filePath = path.join(testDir, 'balloon.jpf');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'jpf');
        assertEquals(fsBytes.getCategory(), 'image');
      });
      await t.step('detects balloon.jpm as jpm/image', () => {
        const filePath = path.join(testDir, 'balloon.jpm');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'jpm');
        assertEquals(fsBytes.getCategory(), 'image');
      });
    });

    await t.step('Audio Types', async (t) => {
      await t.step('detects audio.mp3 as mp3/audio', () => {
        const filePath = path.join(testDir, 'audio.mp3');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'mp3');
        assertEquals(fsBytes.getCategory(), 'audio');
      });
    });

    await t.step('Archive Types', async (t) => {
      await t.step('detects archive.zip as zip/archive', () => {
        const filePath = path.join(testDir, 'archive.zip');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'zip');
        assertEquals(fsBytes.getCategory(), 'archive');
      });
    });

    await t.step('Font Types', async (t) => {
      await t.step('detects font.ttf as ttf/font', () => {
        const filePath = path.join(testDir, 'font.ttf');
        const buffer = fs.readFileSync(filePath);
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), 'ttf');
        assertEquals(fsBytes.getCategory(), 'font');
      });
    });

    await t.step('Error Handling', async (t) => {
      await t.step('throws error for buffer smaller than 24 bytes', () => {
        const buffer = Buffer.from('too small');
        assertThrows(
          () => new FSBytes(buffer as Uint8Array),
          Error,
          'Buffer must contain at least 24 bytes',
        );
      });

      await t.step('handles unknown file types', () => {
        const buffer = Buffer.alloc(24).fill('unknown content');
        const fsBytes = new FSBytes(buffer as Uint8Array);
        assertEquals(fsBytes.getType(), null);
        assertEquals(fsBytes.getCategory(), null);
      });
    });
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});
