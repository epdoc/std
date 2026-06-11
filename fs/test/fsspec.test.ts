import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as FS from '../src/fs.ts';

Deno.test('FSSpec', async (t) => {
  const testDir = await Deno.makeTempDir({ prefix: 'fsspec_test_' });
  const testFile = path.join(testDir, 'test.txt');
  await fs.writeFile(testFile, 'Test content');

  try {
    await t.step('Type Resolution', async (t) => {
      await t.step('getResolvedType() returns FileSpec for file', async () => {
        const fsspec = new FS.Spec(testFile);
        const resolved = await fsspec.resolvedType();
        assertInstanceOf(resolved, FS.File);
      });

      await t.step('getResolvedType() returns FolderSpec for folder', async () => {
        const fsspec = new FS.Spec(testDir);
        const resolved = await fsspec.resolvedType();
        assertInstanceOf(resolved, FS.Folder);
      });

      await t.step('getResolvedType() returns FolderSpec for non existant file', async () => {
        const fsspec = new FS.Spec('__xxx__');
        const resolved = await fsspec.resolvedType();
        assertEquals(resolved, undefined);
      });
    });

    await t.step('Path Utilities', async (t) => {
      await t.step('constructor resolves path parts', () => {
        const fsspec = new FS.Spec(testDir, 'subdir', 'file.txt');
        assertEquals(fsspec.path, path.join(testDir, 'subdir', 'file.txt'));
      });
    });

    await t.step('Directory Operations', async (t) => {
      await t.step('ensureDir() creates directory if it does not exist', async () => {
        const newDir = path.join(testDir, 'new-directory');
        const folder = new FS.Folder(newDir);
        await folder.ensureDir();
        const exists = await folder.exists();
        assert(exists);
      });
    });

    await t.step('Error Handling', async (t) => {
      await t.step('FSError can be instantiated with string', () => {
        const error = new FS.Err.Main('Test error message');
        assertInstanceOf(error, FS.Err.Main);
        assertEquals(error.message, 'Test error message');
      });

      await t.step('FSError can be instantiated with Error object', () => {
        const originalError = new FS.Err.Main('Original error');
        const fsError = new FS.Err.Main(originalError);
        assertInstanceOf(fsError, FS.Err.Main);
        assertEquals(fsError.message, 'Original error');
      });

      await t.step('NotFound preserves code and path', () => {
        const notFound = new FS.Err.NotFound('Not found', { code: 'ENOENT', path: '/tmp/missing' as FS.Path });
        assertInstanceOf(notFound, FS.Err.Main);
        assertInstanceOf(notFound, FS.Err.NotFound);
        assertEquals(notFound.code, 'ENOENT');
        assertEquals(notFound.path, '/tmp/missing');
      });
    });
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});
