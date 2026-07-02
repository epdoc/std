import { resolveFiles, resolveFolders } from '$util';
import { assert, assertEquals } from '@std/assert';
import { promises as nfs } from 'node:fs';
import path from 'node:path';
import * as FS from '$mod';

Deno.test('resolveFiles', async (t) => {
  const tmpDir = await FS.FolderSpec.makeTemp({ prefix: 'resolve-files-' });
  const rootDir = new FS.FolderSpec(await tmpDir.realPath());

  const file1 = new FS.FileSpec(rootDir, 'file1.txt' as FS.Name);
  await file1.write('content1');
  const file2 = new FS.FileSpec(rootDir, 'file2.txt' as FS.Name);
  await file2.write('content2');

  const subDir = await rootDir.mkdir('subdir' as FS.Name);
  const file3 = new FS.FileSpec(subDir, 'file3.txt' as FS.Name);
  await file3.write('content3');
  const file4 = new FS.FileSpec(subDir, 'file4.txt' as FS.Name);
  await file4.write('content4');

  const emptyDir = await rootDir.mkdir('emptydir' as FS.Name);

  const nonExistent = path.join(rootDir.path, 'nonexistent.txt');

  try {
    await t.step('empty args returns empty array', async () => {
      const result = await resolveFiles([]);
      assertEquals(result, []);
    });

    await t.step('single file path returns that file', async () => {
      const result = await resolveFiles([file1.path]);
      assertEquals(result.length, 1);
      assert(FS.FileSpec.is(result[0]));
      assertEquals(result[0].path, file1.path);
    });

    await t.step('multiple file paths returns all files', async () => {
      const result = await resolveFiles([file1.path, file2.path]);
      assertEquals(result.length, 2);
      const paths = result.map((f) => f.path).sort();
      assertEquals(paths, [file1.path, file2.path].sort());
    });

    await t.step('non-existent path is skipped', async () => {
      const result = await resolveFiles([file1.path, nonExistent]);
      assertEquals(result.length, 1);
      assertEquals(result[0].path, file1.path);
    });

    await t.step('folder without recursive returns empty', async () => {
      const result = await resolveFiles([subDir.path]);
      assertEquals(result, []);
    });

    await t.step('folder with recursive returns files in folder', async () => {
      const result = await resolveFiles([subDir.path], { recursive: true });
      assertEquals(result.length, 2);
      const paths = result.map((f) => f.path).sort();
      assertEquals(paths, [file3.path, file4.path].sort());
    });

    await t.step('folder with recursive returns files at all depths', async () => {
      const result = await resolveFiles([rootDir.path], { recursive: true });
      assertEquals(result.length, 4);
      const paths = result.map((f) => f.path).sort();
      assertEquals(paths, [file1.path, file2.path, file3.path, file4.path].sort());
    });

    await t.step('mixed files and folders with recursive returns all files', async () => {
      const result = await resolveFiles([file1.path, subDir.path], { recursive: true });
      assertEquals(result.length, 3);
      const paths = result.map((f) => f.path).sort();
      assertEquals(paths, [file1.path, file3.path, file4.path].sort());
    });

    await t.step('non-recursive with files and folder returns only direct files', async () => {
      const result = await resolveFiles([file1.path, subDir.path]);
      assertEquals(result.length, 1);
      assertEquals(result[0].path, file1.path);
    });

    await t.step('all non-existent paths returns empty', async () => {
      const result = await resolveFiles([nonExistent]);
      assertEquals(result, []);
    });

    await t.step('empty dir with recursive returns empty array', async () => {
      const result = await resolveFiles([emptyDir.path], { recursive: true });
      assertEquals(result, []);
    });
  } finally {
    await nfs.rm(rootDir.path, { recursive: true, force: true });
  }
});

Deno.test('resolveFolders', async (t) => {
  const tmpDir = await FS.FolderSpec.makeTemp({ prefix: 'resolve-folders-' });
  const rootDir = new FS.FolderSpec(await tmpDir.realPath());

  const subDir = await rootDir.mkdir('subdir' as FS.Name);
  const file1 = new FS.FileSpec(rootDir, 'file.txt' as FS.Name);
  await file1.write('content');
  const nonExistent = path.join(rootDir.path, 'nonexistent');

  try {
    await t.step('returns matching folders', async () => {
      const result = await resolveFolders([rootDir.path, subDir.path]);
      assertEquals(result.length, 2);
      assert(result[0] instanceof FS.FolderSpec);
      assert(result[1] instanceof FS.FolderSpec);
    });

    await t.step('non-folder paths are skipped', async () => {
      const result = await resolveFolders([file1.path, subDir.path]);
      assertEquals(result.length, 1);
      assertEquals(result[0].path, subDir.path);
    });

    await t.step('non-existent paths are skipped', async () => {
      const result = await resolveFolders([subDir.path, nonExistent]);
      assertEquals(result.length, 1);
      assertEquals(result[0].path, subDir.path);
    });

    await t.step('empty args returns empty array', async () => {
      const result = await resolveFolders([]);
      assertEquals(result, []);
    });
  } finally {
    await nfs.rm(rootDir.path, { recursive: true, force: true });
  }
});
