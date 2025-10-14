import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSpec, FolderSpec, FSError, FSSpec } from '../src/mod.ts';

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
      const fsspec = new FSSpec(testFile);
      const resolved = await fsspec.getResolvedType();
      expect(resolved).toBeInstanceOf(FileSpec);
    });

    test('getResolvedType() returns FolderSpec for folder', async () => {
      const fsspec = new FSSpec(testDir);
      const resolved = await fsspec.getResolvedType();
      expect(resolved).toBeInstanceOf(FolderSpec);
    });
  });

  describe('Path Utilities', () => {
    test('constructor resolves path parts', () => {
      const fsspec = new FSSpec(testDir, 'subdir', 'file.txt');
      expect(fsspec.path).toBe(path.join(testDir, 'subdir', 'file.txt'));
    });
  });

  describe('Directory Operations', () => {
    test('ensureDir() creates directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new-directory');
      const folder = new FolderSpec(newDir);
      await folder.ensureDir();

      const exists = await folder.getExists();
      expect(exists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('FSError can be instantiated with string', () => {
      const error = new FSError('Test error message');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
    });

    test('FSError can be instantiated with Error object', () => {
      const originalError = new Error('Original error');
      const fsError = new FSError(originalError);
      expect(fsError).toBeInstanceOf(Error);
      expect(fsError.message).toBe('Original error');
    });
  });
});
