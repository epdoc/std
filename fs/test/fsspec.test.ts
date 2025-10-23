import * as FS from '$fs';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('FSSpec', () => {
  let testDir: string;
  let testFile: string;

  beforeAll(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'fsspec_test_' });
    testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Test content');
  });

  afterAll(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  describe('Type Resolution', () => {
    test('getResolvedType() returns FileSpec for file', async () => {
      const fsspec = new FS.Spec(testFile);
      const resolved = await fsspec.resolvedType();
      expect(resolved).toBeInstanceOf(FS.File);
    });

    test('getResolvedType() returns FolderSpec for folder', async () => {
      const fsspec = new FS.Spec(testDir);
      const resolved = await fsspec.resolvedType();
      expect(resolved).toBeInstanceOf(FS.Folder);
    });
  });

  describe('Path Utilities', () => {
    test('constructor resolves path parts', () => {
      const fsspec = new FS.Spec(testDir, 'subdir', 'file.txt');
      expect(fsspec.path).toBe(path.join(testDir, 'subdir', 'file.txt'));
    });
  });

  describe('Directory Operations', () => {
    test('ensureDir() creates directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new-directory');
      const folder = new FS.Folder(newDir);
      await folder.ensureDir();

      const exists = await folder.exists();
      expect(exists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('FSError can be instantiated with string', () => {
      const error = new FS.Err.Main('Test error message');
      expect(error).toBeInstanceOf(FS.Err.Main);
      expect(error.message).toBe('Test error message');
    });

    test('FSError can be instantiated with Error object', () => {
      const originalError = new FS.Err.Main('Original error');
      const fsError = new FS.Err.Main(originalError);
      expect(fsError).toBeInstanceOf(FS.Err.Main);
      expect(fsError.message).toBe('Original error');
    });

    test('NotFound preserves code and path', () => {
      const notFound = new FS.Err.NotFound('Not found', { code: 'ENOENT', path: '/tmp/missing' as FS.Path });
      expect(notFound).toBeInstanceOf(FS.Err.Main);
      expect(notFound).toBeInstanceOf(FS.Err.NotFound);
      expect(notFound.code).toBe('ENOENT');
      expect(notFound.path).toBe('/tmp/missing');
    });
  });
});
