import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, it, test } from '@std/testing/bdd';
import { Buffer } from 'node:buffer';
import { promises as nfs } from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import * as path from 'node:path';
import { DigestAlgorithm, FileSpec } from '../src/mod.ts';
import { generateRobustPDF } from './pdfgen.ts';

describe('FileSpec', () => {
  let testDir: string;
  let testFile: string;
  let testJson: string;
  let pdfFile: string;

  beforeAll(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'filespec_test_' });
    testFile = path.join(testDir, 'test.txt');
    testJson = path.join(testDir, 'test.json');
    pdfFile = path.join(testDir, 'test.pdf');

    await fs.writeFile(testFile, 'Hello, World!');
    await fs.writeFile(testJson, JSON.stringify({ key: 'value' }));

    // Generate PDF with specific date for testing
    const robustPDF = generateRobustPDF('20180201000000');
    await Deno.writeTextFile(pdfFile, robustPDF);
  });

  afterAll(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  describe('Basic Properties', () => {
    test('filename getter returns correct filename', () => {
      const file = new FileSpec(testFile);
      expect(file.filename).toBe('test.txt');
    });

    test('dirname getter returns correct directory', () => {
      const file = new FileSpec(testFile);
      expect(file.dirname).toBe(testDir);
    });

    test('extname getter returns correct extension', () => {
      const file = new FileSpec(testFile);
      expect(file.extname).toBe('.txt');
    });

    test('basename getter returns correct basename', () => {
      const file = new FileSpec(testFile);
      expect(file.basename).toBe('test');
    });
  });

  describe('Path Manipulation', () => {
    test('setExt() changes file extension', () => {
      const file = new FileSpec(testFile);
      file.setExt('.md');
      expect(file.extname).toBe('.md');
      expect(file.path).toBe(path.join(testDir, 'test.md'));
    });

    test('setBasename() changes file basename', () => {
      const file = new FileSpec(testFile);
      file.setBasename('newtest');
      expect(file.basename).toBe('newtest');
      expect(file.path).toBe(path.join(testDir, 'newtest.txt'));
    });

    test('add() correctly joins paths', async () => {
      const file = new FileSpec(testDir).add('subdir', 'file.txt');
      expect(file.path).toBe(path.join(testDir, 'subdir', 'file.txt'));
      const isFile = await file.isFile();
      expect(isFile).toBe(false);
    });
  });

  describe('File Operations', () => {
    test('getExists() returns true for existing file', async () => {
      const file = new FileSpec(testFile);
      expect(await file.exists()).toBe(true);
    });

    test('isFile() returns true for file', async () => {
      const file = new FileSpec(testFile);
      expect(await file.isFile()).toBe(true);
    });

    test('readJson() reads and parses JSON correctly', async () => {
      const file = new FileSpec(testJson);
      const content = await file.readJson();
      expect(content).toEqual({ key: 'value' });
    });

    test('writeJson() writes JSON to file correctly', async () => {
      const newFile = path.join(testDir, 'new.json');
      const file = new FileSpec(newFile);
      await file.writeJson({ newKey: 'newValue' });
      const content = await fs.readFile(newFile, 'utf8');
      expect(JSON.parse(content)).toEqual({ newKey: 'newValue' });
    });
  });

  describe('File Hashing', () => {
    test('digest() returns SHA1 hash', async () => {
      const file = new FileSpec(testFile);
      const hash = await file.digest();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(40); // SHA1 is 40 chars
    });

    test('digest() returns SHA256 hash', async () => {
      const file = new FileSpec(testFile);
      const hash = await file.digest(DigestAlgorithm.sha256);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 is 64 chars
    });
  });

  describe('PDF Operations', () => {
    test('getPdfDate() returns creation date from PDF metadata', async () => {
      const file = new FileSpec(pdfFile);
      const date = await file.getPdfDate();
      expect(date).toBeInstanceOf(Date);
      if (date) {
        expect(date.toISOString()).toBe('2018-02-01T00:00:00.000Z');
      }
    });
  });

  describe('Constructor Variants', () => {
    test('creates FileSpec from URL and relative path', () => {
      const file = new FileSpec(import.meta.url, './test.txt');
      expect(file).toBeInstanceOf(FileSpec);
      expect(file.filename).toBe('test.txt');
    });

    test('creates FileSpec from URL and absolute path', () => {
      const absPath = path.resolve('somefile.json');
      const file = new FileSpec(import.meta.url, absPath);
      expect(file).toBeInstanceOf(FileSpec);
      expect(file.path.endsWith('somefile.json')).toBe(true);
    });
  });
});

describe('FileSpec read/write helpers', () => {
  let tmpDir: string;
  beforeAll(async () => {
    tmpDir = await nfs.mkdtemp(path.join(os.tmpdir(), 'fsspec-read-'));
  });

  afterAll(async () => {
    await nfs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writeJson() then readAsString() returns the exact JSON text', async () => {
    const filePath = path.join(tmpDir, 'data.json');
    const f = new FileSpec(filePath);
    const obj = { version: '1.0.0' };
    await f.writeJson(obj);
    const txt = await f.readAsString();
    expect(txt).toBe(JSON.stringify(obj));
  });

  it('readAsBytes() returns the written bytes', async () => {
    const filePath = path.join(tmpDir, 'bytes.json');
    const f = new FileSpec(filePath);
    const obj = { a: 1, b: 'x' };
    await f.writeJson(obj);
    const bytes = await f.readAsBytes();
    const expected = Buffer.from(JSON.stringify(obj), 'utf8');
    expect(Buffer.from(bytes)).toEqual(expected);
  });

  it('readJson() parses JSON written by writeJson()', async () => {
    const filePath = path.join(tmpDir, 'parsed.json');
    const f = new FileSpec(filePath);
    const obj = { name: 'test', n: 2 };
    await f.writeJson(obj, null, 2);
    const parsed = await f.readJson<typeof obj>();
    expect(parsed).toEqual(obj);
  });

  it('writeBase64/readAsString(base64) encode and decode correctly', async () => {
    const filePath = path.join(tmpDir, 'b64.txt');
    const f = new FileSpec(filePath);
    await f.writeBase64('Hello');
    const decoded = await f.readAsString('base64');
    expect(decoded).toBe('Hello');
  });

  it('readAsLines() returns lines split correctly', async () => {
    const filePath = path.join(tmpDir, 'lines.txt');
    const f = new FileSpec(filePath);
    await f.write(['one', 'two', 'three']);
    const lines = await f.readAsLines();
    expect(lines).toEqual(['one', 'two', 'three']);
  });
});
