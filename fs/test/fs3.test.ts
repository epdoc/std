import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSpec, fileSpec } from '../filespec.ts';
import { FolderSpec, folderSpec } from '../folderspec.ts';
import type { FSSortOpts } from '../mod.ts';

const READONLY = FolderSpec.fromMeta(import.meta.url, './readonly');

describe('FSSpec, FileSpec, FolderSpec', () => {
  const testDir = path.join(READONLY.path, 'test-fsitem');
  const testFile = path.join(testDir, 'test.txt');
  const testJson = path.join(testDir, 'test.json');
  const testSubDir = path.join(testDir, 'subdir');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testSubDir, { recursive: true });
    await fs.writeFile(testFile, 'Hello, World!');
    await fs.writeFile(testJson, JSON.stringify({ key: 'value' }));
    await fs.writeFile(path.join(testSubDir, 'file1.txt'), 'File 1');
    await fs.writeFile(path.join(testSubDir, 'file2.txt'), 'File 2');
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // ... (previous tests)

  test('haveReadFolderContents() returns true after reading folder contents', async () => {
    const item = folderSpec(testDir);
    expect(item.haveReadFolderContents()).toBe(false);
    await item.getChildren();
    expect(item.haveReadFolderContents()).toBe(true);
  });

  test('getChildren() returns correct files and folders', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    expect(item.files.length).toBe(2);
    expect(item.folders.length).toBe(1);
  });

  test('getFiles() returns correct files', async () => {
    const item = folderSpec(testDir);
    const files = await item.getFiles();
    expect(files.length).toBe(2);
    expect(files.some((f) => f.filename === 'test.txt')).toBe(true);
    expect(files.some((f) => f.filename === 'test.json')).toBe(true);
  });

  test('getFolders() returns correct folders', async () => {
    const item = folderSpec(testDir);
    const folders = await item.getFolders();
    expect(folders.length).toBe(1);
    expect(folders[0].filename).toBe('subdir');
  });

  test('sortChildren() sorts children alphabetically', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    const opts: FSSortOpts = { type: 'alphabetical' };
    item.sortChildren(opts);
    expect(item.files[0].filename).toBe('test.json');
    expect(item.files[1].filename).toBe('test.txt');
  });

  test('sortByFilename() sorts files alphabetically', async () => {
    const item = folderSpec(testDir);
    let files = await item.getFiles();
    files = FolderSpec.sortByFilename(files) as FileSpec[];
    expect(files[0].filename).toBe('test.json');
    expect(files[1].filename).toBe('test.txt');
  });

  test('sortByFilename() sorts folders alphabetically', async () => {
    const item = folderSpec(testSubDir);
    let files = await item.getFiles();
    files = FolderSpec.sortByFilename(files) as FileSpec[];
    expect(files[0].filename).toBe('file1.txt');
    expect(files[1].filename).toBe('file2.txt');
  });

  test('sortFilesBySize() sorts files by size', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    item.sortChildren({ type: 'size' });
    expect(item.files[0]).toBeInstanceOf(FileSpec);
    expect(item.files[1]).toBeInstanceOf(FileSpec);
    expect(item.files[0].filename).toBe('test.json');
    expect(item.files[1].filename).toBe('test.txt');
  });

  test('checksum() calculates file checksum', async () => {
    const item = fileSpec(testFile);
    const checksum = await item.checksum();
    expect(checksum).toBeTruthy();
    expect(typeof checksum).toBe('string');
  });

  test('backup() creates a backup of a file', async () => {
    const item = fileSpec(testFile);
    const backupPath = await item.backup();
    expect(typeof backupPath).toBe('string');
    const backupExists = await fs
      .stat(backupPath as string)
      .then(() => true)
      .catch(() => false);
    expect(backupExists).toBe(true);
  });

  test('findAvailableIndexFilename() finds an available indexed filename', async () => {
    const item = fileSpec(testFile);
    const newFilename = await item.findAvailableIndexFilename();
    expect(newFilename).toBeTruthy();
    expect(newFilename).not.toBe(testFile);
  });

  // test('safeCopy copies file safely', async () => {
  //   const sourceItem = fsitem(testFile);
  //   const destPath = path.join(testDir, 'safe-copy.txt');
  //   const result = await sourceItem.safeCopy(destPath);
  //   expect(result).toBe(true);
  //   const destExists = await fs
  //     .stat(destPath)
  //     .then(() => true)
  //     .catch(() => false);
  //   expect(destExists).toBe(true);
  // });

  // test('readBytes reads specified number of bytes', async () => {
  //   const item = fsitem(testFile);
  //   const buffer = await item.readBytes(5);
  //   expect(buffer.toString()).toBe('Hello');
  // });

  // test('readAsBuffer reads file as buffer', async () => {
  //   const item = fsitem(testFile);
  //   const buffer = await item.readAsBuffer();
  //   expect(buffer).toBeInstanceOf(Buffer);
  //   expect(buffer.toString()).toBe('Hello, World!');
  // });

  test('writeBase64() writes base64 encoded data', async () => {
    const newFile = path.join(testDir, 'base64.txt');
    const item = fileSpec(newFile);
    const base64Data = Buffer.from('Hello, Base64!').toString('base64');
    await item.writeBase64(base64Data);
    const content = await fs.readFile(newFile, 'utf8');
    expect(content).toBe('U0dWc2JHOHNJRUpoYzJVMk5DRT0=');
  });

  describe('walk()', () => {
    test('should return all files and directories', async () => {
      const item = folderSpec(testDir);
      const results = await item.walk({});
      expect(results.length).toBe(7);
    });

    test('should respect maxDepth option', async () => {
      const item = folderSpec(testDir);
      const results = await item.walk({ maxDepth: 1 });
      expect(results.length).toBe(5);
    });

    test('should respect match and skip options', async () => {
      const item = folderSpec(testDir);
      const results = await item.walk({
        match: [/\.txt$/],
        skip: [/file1/],
      });
      expect(results.length).toBe(2);
    });
  });

  // ...existing code...

  describe('FileSpec.fromMeta', () => {
    test('creates a FileSpec from a file URL and relative path', () => {
      const metaUrl = import.meta.url;
      const relPath = './test.txt';
      const file = FileSpec.fromMeta(metaUrl, relPath);
      expect(file).toBeInstanceOf(FileSpec);
      expect(file.filename).toBe('test.txt');
      expect(file.path.endsWith('test.txt')).toBe(true);
    });

    test('creates a FileSpec from a file URL and absolute path', () => {
      const metaUrl = import.meta.url;
      const absPath = path.resolve('somefile.json');
      const file = FileSpec.fromMeta(metaUrl, absPath);
      expect(file).toBeInstanceOf(FileSpec);
      expect(file.path.endsWith('somefile.json')).toBe(true);
    });

    test('throws if metaUrl is not a file URL', () => {
      expect(() => {
        FileSpec.fromMeta('http://example.com', './foo.txt');
      }).toThrow();
    });

    test('returns correct dirname and filename', () => {
      const metaUrl = import.meta.url;
      const relPath = './test.txt';
      const file = FileSpec.fromMeta(metaUrl, relPath);
      expect(typeof file.dirname).toBe('string');
      expect(file.filename).toBe('test.txt');
    });
  });

  // ...existing
});
