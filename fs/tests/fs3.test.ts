import { expect } from 'jsr:@std/expect';
import { afterAll, beforeAll, describe, test } from 'jsr:@std/testing/bdd';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSpec, fileSpec } from '../filespec.ts';
import { FolderSpec, folderSpec } from '../folderspec.ts';
import type { FSSortOpts } from '../mod.ts';

const pwd: string = import.meta.dirname as string;

describe('FSSpec Tests Part 3', () => {
  const testDir = path.join(pwd, 'data', 'test-fsitem');
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

  test('haveReadFolderContents returns correct value', async () => {
    const item = folderSpec(testDir);
    expect(item.haveReadFolderContents()).toBe(false);
    await item.getChildren();
    expect(item.haveReadFolderContents()).toBe(true);
  });

  test('getChildren returns correct children', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    expect(item.files.length).toBe(2);
    expect(item.folders.length).toBe(1);
  });

  test('getFiles returns correct files', async () => {
    const item = folderSpec(testDir);
    const files = await item.getFiles();
    expect(files.length).toBe(2);
    expect(files.some((f) => f.filename === 'test.txt')).toBe(true);
    expect(files.some((f) => f.filename === 'test.json')).toBe(true);
  });

  test('getFolders returns correct folders', async () => {
    const item = folderSpec(testDir);
    const folders = await item.getFolders();
    expect(folders.length).toBe(1);
    expect(folders[0].filename).toBe('subdir');
  });

  test('sortChildren sorts children correctly', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    const opts: FSSortOpts = { type: 'alphabetical' };
    item.sortChildren(opts);
    expect(item.files[0].filename).toBe('test.json');
    expect(item.files[1].filename).toBe('test.txt');
  });

  test('sortFiles sorts files correctly', async () => {
    const item = folderSpec(testDir);
    let files = await item.getFiles();
    files = FolderSpec.sortByFilename(files) as FileSpec[];
    expect(files[0].filename).toBe('test.json');
    expect(files[1].filename).toBe('test.txt');
  });

  test('sortFolders sorts folders correctly', async () => {
    const item = folderSpec(testSubDir);
    let files = await item.getFiles();
    files = FolderSpec.sortByFilename(files) as FileSpec[];
    expect(files[0].filename).toBe('file1.txt');
    expect(files[1].filename).toBe('file2.txt');
  });

  test('sortFilesBySize sorts files by size', async () => {
    const item = folderSpec(testDir);
    await item.getChildren();
    item.sortChildren({ type: 'size' });
    expect(item.files[0]).toBeInstanceOf(FileSpec);
    expect(item.files[1]).toBeInstanceOf(FileSpec);
    expect(item.files[0].filename).toBe('test.json');
    expect(item.files[1].filename).toBe('test.txt');
  });

  test('checksum calculates file checksum', async () => {
    const item = fileSpec(testFile);
    const checksum = await item.checksum();
    expect(checksum).toBeTruthy();
    expect(typeof checksum).toBe('string');
  });

  test('backup creates a backup of the file', async () => {
    const item = fileSpec(testFile);
    const backupPath = await item.backup();
    expect(typeof backupPath).toBe('string');
    const backupExists = await fs
      .stat(backupPath as string)
      .then(() => true)
      .catch(() => false);
    expect(backupExists).toBe(true);
  });

  test('findAvailableIndexFilename finds available filename', async () => {
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

  test('writeBase64 writes base64 encoded data', async () => {
    const newFile = path.join(testDir, 'base64.txt');
    const item = fileSpec(newFile);
    const base64Data = Buffer.from('Hello, Base64!').toString('base64');
    await item.writeBase64(base64Data);
    const content = await fs.readFile(newFile, 'utf8');
    expect(content).toBe('Hello, Base64!');
  });
});
