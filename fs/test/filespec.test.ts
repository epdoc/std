import { DigestAlgorithm, FileSpec, FolderSpec } from '$mod';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, it, test } from '@std/testing/bdd';
import { Buffer } from 'node:buffer';
import { promises as nfs } from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';
import { generateRobustPDF } from './pdfgen.ts';

describe('FileSpec', () => {
  let testDir: FolderSpec;
  let testFile: FileSpec;
  let testJson: FileSpec;
  let pdfFile: FileSpec;

  beforeAll(async () => {
    testDir = await FolderSpec.makeTemp({ prefix: 'filespec_test_' });
    testFile = new FileSpec(testDir, 'test.txt');
    testJson = new FileSpec(testDir, 'test.json');
    pdfFile = new FileSpec(testDir, 'test.pdf');

    await testFile.write('Hello, World!');
    await testFile.write(JSON.stringify({ key: 'value' }));

    // Generate PDF with specific date for testing
    const robustPDF = generateRobustPDF('20180201000000');
    await pdfFile.write(robustPDF);
  });

  afterAll(async () => {
    await testDir.remove({ recursive: true });
  });

  describe('Basic Properties', () => {
    test('filename getter returns correct filename', () => {
      expect(testFile.filename).toBe('test.txt');
    });

    test('dirname getter returns correct directory', () => {
      expect(testFile.dirname).toBe(testDir.path);
    });

    test('extname getter returns correct extension', () => {
      expect(testFile.extname).toBe('.txt');
    });

    test('basename getter returns correct basename', () => {
      expect(testFile.basename).toBe('test');
    });
  });

  describe('Path Manipulation', () => {
    test('setExt() changes file extension', () => {
      const file = testFile.copy();
      file.setExt('.md');
      expect(file.extname).toBe('.md');
      expect(file.path).toBe(path.join(testDir.path, 'test.md'));
    });

    test('setBasename() changes file basename', () => {
      const file = testFile.copy();
      file.setBasename('newtest');
      expect(file.basename).toBe('newtest');
      expect(file.path).toBe(path.join(testDir.path, 'newtest.txt'));
    });

    test('add() correctly joins paths', async () => {
      const file = new FileSpec(testDir).add('subdir', 'file.txt');
      expect(file.path).toBe(path.join(testDir.path, 'subdir', 'file.txt'));
      const isFile = await file.isFile();
      expect(isFile).toBe(false);
    });
  });

  describe('File Operations', () => {
    test('getExists() returns true for existing file', async () => {
      expect(await testFile.exists()).toBe(true);
    });

    test('isFile() returns true for file', async () => {
      expect(await testFile.isFile()).toBe(true);
    });

    test('readJson() reads and parses JSON correctly', async () => {
      await testJson.writeJson({ key: 'value' });
      const content = await testJson.readJson();
      expect(content).toEqual({ key: 'value' });
    });

    test('writeJson() writes JSON to file correctly', async () => {
      const file = new FileSpec(testDir, 'new.json');
      await file.writeJson({ newKey: 'newValue' });
      const content = await file.readAsString();
      expect(JSON.parse(content)).toEqual({ newKey: 'newValue' });
    });

    test('write() returns self', async () => {
      const file = new FileSpec(testDir, 'write-self.txt');
      const result = await file.write('test');
      expect(result).toBe(file);
    });

    test('writeJson() returns self', async () => {
      const file = new FileSpec(testDir, 'write-json-self.json');
      const result = await file.writeJson({ test: 'test' });
      expect(result).toBe(file);
    });

    test('moveTo() moves the file and returns the new FileSpec', async () => {
      const srcFile = new FileSpec(testDir, 'move-src.txt');
      await srcFile.write('move test');
      const destFile = new FileSpec(testDir, 'move-dest.txt');

      const newFile = await srcFile.moveTo(destFile);

      expect(newFile).toBeInstanceOf(FileSpec);
      expect(newFile.path).toBe(destFile.path);

      const destExists = await destFile.exists();
      expect(destExists).toBe(true);

      const srcExists = await srcFile.exists();
      expect(srcExists).toBe(false);
    });

    test('moveTo() moves the file', async () => {
      const srcFile = new FileSpec(testDir, 'move-src2.txt');
      await srcFile.write('move test');
      const destFile = new FileSpec(testDir, 'move-dest2.txt');

      await srcFile.moveTo(destFile);

      const destExists = await destFile.exists(true);
      expect(destExists).toBe(true);

      const srcExists = await srcFile.exists(true);
      expect(srcExists).toBe(false);
    });
  });

  describe('File Hashing', () => {
    test('digest() returns SHA1 hash', async () => {
      const hash = await testFile.digest();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(40); // SHA1 is 40 chars
    });

    test('digest() returns SHA256 hash', async () => {
      const hash = await testFile.digest(DigestAlgorithm.sha256);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 is 64 chars
    });
  });

  describe('PDF Operations', () => {
    test('getPdfDate() returns creation date from PDF metadata', async () => {
      const date = await pdfFile.getPdfDate();
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

describe('FileSystem Simulation for deno.json write', () => {
  it('should read, modify, and write deno.json with 2-space indentation', async () => {
    const fsTempDir = await FolderSpec.makeTemp();
    const originalCwd = FolderSpec.cwd();
    fsTempDir.chdir();

    try {
      const denoJsonFile = new FileSpec('deno.json');
      // Simulate initial state: deno.json exists with version 1.0.0
      await denoJsonFile.writeJson({ version: '1.0.0' });

      // --- Simulate the file system operations of AppMain.run ---

      // 1. Read deno.json content
      const config = await denoJsonFile.readJson<{ version: string }>();

      // 2. Modify the version in the in-memory config object
      config.version = '1.0.1'; // Simulating the version bump logic

      // 3. Write the modified config back to deno.json with 2-space indentation
      await denoJsonFile.writeJson(config, null, 2);

      // --- End simulation ---

      // Verify the content of the written file
      const content = await denoJsonFile.readAsString();
      const expectedContent = JSON.stringify({ version: '1.0.1' }, null, 2);
      expect(content).toBe(expectedContent);
    } finally {
      originalCwd.chdir();
      await fsTempDir.remove({ recursive: true });
    }
  });
});
