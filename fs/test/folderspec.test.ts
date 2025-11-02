import { FileSpec, FolderSpec } from '$mod';
import type * as FS from '$mod';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('FolderSpec', () => {
  let testDir: string;
  let subDir: string;

  beforeAll(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'folderspec_test_' });
    subDir = path.join(testDir, 'subdir');

    await fs.mkdir(subDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'file1.txt'), 'File 1');
    await fs.writeFile(path.join(testDir, 'file2.json'), '{"test": true}');
    await fs.writeFile(path.join(subDir, 'nested.txt'), 'Nested file');
  });

  afterAll(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  describe('Basic Operations', () => {
    test('getExists() returns true for existing folder', async () => {
      const folder = new FolderSpec(testDir);
      expect(await folder.exists()).toBe(true);
    });

    test('isFolder() returns true for folder', async () => {
      const folder = new FolderSpec(testDir);
      expect(await folder.isFolder()).toBe(true);
    });

    test('dirname getter returns correct parent directory', () => {
      const folder = new FolderSpec(subDir);
      expect(folder.dirname).toBe(testDir);
    });
  });

  describe('Content Enumeration', () => {
    test('getFiles() returns list of files', async () => {
      const folder = new FolderSpec(testDir);
      const files = await folder.getFiles();
      expect(files.length).toBe(2);
      expect(files.every((f) => f instanceof FileSpec)).toBe(true);

      const filenames = files.map((f) => f.filename).sort();
      expect(filenames).toEqual(['file1.txt', 'file2.json']);
    });

    test('getFolders() returns list of folders', async () => {
      const folder = new FolderSpec(testDir);
      const folders = await folder.getFolders();
      expect(folders.length).toBe(1);
      expect(folders[0].filename).toBe('subdir');
    });

    test('getChildren() returns files and folders', async () => {
      const folder = new FolderSpec(testDir);
      await folder.getChildren();
      expect(folder.files.length).toBe(2);
      expect(folder.folders.length).toBe(1);
    });

    test('haveReadFolderContents() tracks read state', async () => {
      const folder = new FolderSpec(testDir);
      expect(folder.haveReadFolderContents()).toBe(false);
      await folder.getChildren();
      expect(folder.haveReadFolderContents()).toBe(true);
    });
  });

  describe('Filtering', () => {
    test('getFolders() with regex filter', async () => {
      const folder = new FolderSpec(testDir);
      const filtered = await folder.getFolders(/^sub/);
      expect(filtered.length).toBe(1);
      expect(filtered[0].filename).toBe('subdir');
    });
  });

  describe('Sorting', () => {
    test('sortChildren() sorts alphabetically', async () => {
      const folder = new FolderSpec(testDir);
      await folder.getChildren();
      folder.sortChildren({ type: 'alphabetical' });

      const filenames = folder.files.map((f) => f.filename);
      expect(filenames).toEqual(['file1.txt', 'file2.json']);
    });

    test('sortByFilename() static method sorts files', async () => {
      const folder = new FolderSpec(testDir);
      const files = await folder.getFiles();
      const sorted = FolderSpec.sortByFilename(files);

      const filenames = sorted.map((f) => f.filename);
      expect(filenames).toEqual(['file1.txt', 'file2.json']);
    });
  });

  describe('Walk Operations', () => {
    test('walk() returns all files and directories', async () => {
      const folder = new FolderSpec(testDir);
      const results = await folder.walk({});
      expect(results.length).toBe(5); // Adjusted based on actual structure
    });

    test('walk() respects maxDepth option', async () => {
      const folder = new FolderSpec(testDir);
      const results = await folder.walk({ maxDepth: 1 });
      expect(results.length).toBe(4); // Adjusted based on actual structure
    });

    test('walk() respects match and skip options', async () => {
      const folder = new FolderSpec(testDir);
      const results = await folder.walk({
        match: [/\.txt$/],
        skip: [/nested/],
      });
      expect(results.length).toBe(1); // Only file1.txt
    });
  });

  describe('cwd', () => {
    test('FolderSpec.cwd() returns a FolderSpec for the current working directory', () => {
      const cwdSpec = FolderSpec.cwd();
      const actualCwd = Deno.cwd();
      expect(cwdSpec).toBeInstanceOf(FolderSpec);
      expect(cwdSpec.path).toEqual(actualCwd);
    });
  });

  describe('Permission Operations', () => {
    test('chown() changes folder ownership', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalUid = stats?.uid;
      const originalGid = stats?.gid;

      // Test with same uid/gid (should not fail)
      if (originalUid !== null && originalGid !== null) {
        await expect(folder.chown(originalUid as FS.UID, originalGid as FS.GID)).resolves.not.toThrow();
      }
    });

    test('chown() with recursive option', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalUid = stats?.uid;
      const originalGid = stats?.gid;

      // Test with same uid/gid recursively (should not fail)
      if (originalUid !== null && originalGid !== null) {
        await expect(folder.chown(originalUid as FS.UID, originalGid as FS.GID, true)).resolves.not.toThrow();
      }
    });

    test('chgrp() changes folder group', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalGid = stats?.gid;

      // Test with same gid (should not fail)
      if (originalGid !== null) {
        await expect(folder.chgrp(originalGid as FS.GID)).resolves.not.toThrow();
      }
    });

    test('chgrp() with recursive option', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalGid = stats?.gid;

      // Test with same gid recursively (should not fail)
      if (originalGid !== null) {
        await expect(folder.chgrp(originalGid as FS.GID, true)).resolves.not.toThrow();
      }
    });

    test('chmod() changes folder permissions', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalMode = stats?.mode;

      // Test with same mode (should not fail)
      if (originalMode !== null) {
        await expect(folder.chmod(originalMode as FS.Mode)).resolves.not.toThrow();
      }
    });

    test('chmod() with recursive option', async () => {
      const folder = new FolderSpec(testDir);
      const stats = await folder.stats();
      const originalMode = stats?.mode;

      // Test with same mode recursively (should not fail)
      if (originalMode !== null) {
        await expect(folder.chmod(originalMode as FS.Mode, true)).resolves.not.toThrow();
      }
    });
  });

  describe('Constructor Variants', () => {
    test('creates FolderSpec from URL and relative path', () => {
      const folder = new FolderSpec(import.meta.url, './test-folder');
      expect(folder).toBeInstanceOf(FolderSpec);
      expect(folder.filename).toBe('test-folder');
    });
  });
});
