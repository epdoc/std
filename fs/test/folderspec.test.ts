import type * as FS from '$mod';
import { FileSpec, FolderSpec } from '$mod';
import { assert, assertEquals, assertInstanceOf, assertMatch, assertStringIncludes } from '@std/assert';
import * as fs from 'node:fs/promises';
import nodeOs from 'node:os';
import * as path from 'node:path';

Deno.test('FolderSpec', async (t) => {
  const testDir: string = await Deno.makeTempDir({ prefix: 'folderspec_test_' });
  const subDir: string = path.join(testDir, 'subdir');

  await fs.mkdir(subDir, { recursive: true });
  await fs.writeFile(path.join(testDir, 'file1.txt'), 'File 1');
  await fs.writeFile(path.join(testDir, 'file2.json'), '{"test": true}');
  await fs.writeFile(path.join(subDir, 'nested.txt'), 'Nested file');

  try {
    await t.step('Basic Operations', async (t) => {
      await t.step('getExists() returns true for existing folder', async () => {
        const folder = new FolderSpec(testDir);
        assert(await folder.exists());
      });

      await t.step('isFolder() returns true for folder', async () => {
        const folder = new FolderSpec(testDir);
        assert(await folder.isFolder());
      });

      await t.step('dirname getter returns correct parent directory', () => {
        const folder = new FolderSpec(subDir);
        assertEquals(folder.dirname, testDir);
      });

      await t.step('relativeTo() returns correct relative path', () => {
        const root = new FolderSpec(testDir);
        const nested = new FolderSpec(subDir);
        const relPath = nested.relativeTo(root);
        assertEquals(relPath, 'subdir');
      });

      await t.step('depth() returns 0 for same folder', () => {
        const folder = new FolderSpec(testDir);
        assertEquals(folder.depth(folder), 0);
      });

      await t.step('depth() returns 1 for direct child folder', () => {
        const root = new FolderSpec(testDir);
        const child = new FolderSpec(subDir);
        assertEquals(child.depth(root), 1);
      });

      await t.step('depth() returns correct depth for deeply nested folder', () => {
        const root = new FolderSpec(testDir);
        const deepFolder = new FolderSpec(testDir, 'a', 'b', 'c');
        assertEquals(deepFolder.depth(root), 3);
      });

      await t.step('depth() returns -1 when folder is not an ancestor', () => {
        const otherRoot = new FolderSpec('/completely/different/path');
        const folder = new FolderSpec(subDir);
        assertEquals(folder.depth(otherRoot), -1);
      });

      await t.step('homeRelativePath() returns tilde path for folder in home directory', () => {
        const homeDir = new FolderSpec(Deno.env.get('HOME') || nodeOs.homedir());
        const folder = new FolderSpec(homeDir, 'projects', 'myapp');
        const homeRelPath = folder.homeRelativePath;
        assertMatch(homeRelPath, /^~\//);
        assertStringIncludes(homeRelPath, 'projects/myapp');
      });

      await t.step('homeRelativePath() returns absolute path for folder outside home directory', () => {
        const folder = new FolderSpec('/var', 'log');
        const homeRelPath = folder.homeRelativePath;
        assertEquals(homeRelPath, '/var/log');
        assertEquals(/^~/.test(homeRelPath), false);
      });

      await t.step('toFileUrl() returns valid file URL', () => {
        const folder = new FolderSpec(testDir);
        const fileUrl = folder.toFileUrl();
        assertMatch(fileUrl, /^file:\/\/\//);
        assertStringIncludes(fileUrl, 'folderspec_test_');
      });
    });

    await t.step('Content Enumeration', async (t) => {
      await t.step('getFiles() returns list of files', async () => {
        const folder = new FolderSpec(testDir);
        const files = await folder.getFiles();
        assertEquals(files.length, 2);
        assert(files.every((f) => f instanceof FileSpec));

        const filenames = files.map((f) => f.filename).sort();
        assertEquals(filenames, ['file1.txt', 'file2.json']);
      });

      await t.step('getFolders() returns list of folders', async () => {
        const folder = new FolderSpec(testDir);
        const folders = await folder.getFolders();
        assertEquals(folders.length, 1);
        assertEquals(folders[0].folderName, 'subdir');
      });

      await t.step('getChildren() returns files and folders', async () => {
        const folder = new FolderSpec(testDir);
        await folder.getChildren();
        assertEquals(folder.files.length, 2);
        assertEquals(folder.folders.length, 1);
      });

      await t.step('haveReadFolderContents() tracks read state', async () => {
        const folder = new FolderSpec(testDir);
        assertEquals(folder.haveReadFolderContents(), false);
        await folder.getChildren();
        assert(folder.haveReadFolderContents());
      });
    });

    await t.step('Filtering', async (t) => {
      await t.step('getFolders() with regex filter', async () => {
        const folder = new FolderSpec(testDir);
        const filtered = await folder.getFolders(/^sub/);
        assertEquals(filtered.length, 1);
        assertEquals(filtered[0].folderName, 'subdir');
      });
    });

    await t.step('Sorting', async (t) => {
      await t.step('sortChildren() sorts alphabetically', async () => {
        const folder = new FolderSpec(testDir);
        await folder.getChildren();
        folder.sortChildren({ type: 'alphabetical' });

        const filenames = folder.files.map((f) => f.filename);
        assertEquals(filenames, ['file1.txt', 'file2.json']);
      });

      await t.step('sortByFilename() static method sorts files', async () => {
        const folder = new FolderSpec(testDir);
        const files = await folder.getFiles();
        const sorted = FolderSpec.sortByFilename(files);

        const filenames = sorted.map((f) => f.name);
        assertEquals(filenames, ['file1.txt', 'file2.json']);
      });
    });

    await t.step('Walk Operations', async (t) => {
      await t.step('walk() returns all files and directories', async () => {
        const folder = new FolderSpec(testDir);
        const results = await folder.walk({});
        assertEquals(results.length, 5); // Adjusted based on actual structure
      });

      await t.step('walk() respects maxDepth option', async () => {
        const folder = new FolderSpec(testDir);
        const results = await folder.walk({ maxDepth: 1 });
        assertEquals(results.length, 4); // Adjusted based on actual structure
      });

      await t.step('walk() respects match and skip options', async () => {
        const folder = new FolderSpec(testDir);
        const results = await folder.walk({
          match: [/\.txt$/],
          skip: [/nested/],
        });
        assertEquals(results.length, 1); // Only file1.txt
      });
    });

    await t.step('expandGlob', async (t) => {
      await t.step('expands basic globs', async () => {
        const folder = new FolderSpec(testDir);
        const results = await folder.expandGlob(['**/*.txt']);
        assertEquals(results.length, 2);
        const paths = results.map((r) => r.name).sort();
        assertEquals(paths, ['file1.txt', 'nested.txt']);
      });

      await t.step('respects exclude globs (! prefix)', async () => {
        const folder = new FolderSpec(testDir);
        const results = await folder.expandGlob(['**/*.txt', '!**/nested.txt']);
        assertEquals(results.length, 1);
        assertEquals(results[0].name, 'file1.txt');
      });

      await t.step('respects includeDirs option', async () => {
        const folder = new FolderSpec(testDir);
        // match everything in root
        const withDirs = await folder.expandGlob(['*']);
        assert(withDirs.some((r) => r instanceof FolderSpec));

        const withoutDirs = await folder.expandGlob(['*'], { includeDirs: false });
        assertEquals(withoutDirs.some((r) => r instanceof FolderSpec), false);
      });
    });

    await t.step('cwd', async (t) => {
      await t.step('FolderSpec.cwd() returns a FolderSpec for the current working directory', () => {
        const cwdSpec = FolderSpec.cwd();
        const actualCwd = Deno.cwd();
        assertInstanceOf(cwdSpec, FolderSpec);
        assertEquals(cwdSpec.path, actualCwd);
      });
    });

    await t.step('config', async (t) => {
      await t.step('FolderSpec.config() returns a FolderSpec for the config directory', () => {
        const configSpec = FolderSpec.config();
        assertInstanceOf(configSpec, FolderSpec);
        // Config path should end with .config (or use XDG_CONFIG_HOME)
        assertMatch(configSpec.path, /\.config$/);
      });

      await t.step('FolderSpec.config() with subpath returns correct path', () => {
        const configSpec = FolderSpec.config('myapp', 'settings');
        assertInstanceOf(configSpec, FolderSpec);
        assertMatch(configSpec.path, /\.config.*myapp.*settings$/);
      });
    });

    await t.step('Permission Operations', async (t) => {
      await t.step('chown() changes folder ownership', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalUid = stats?.uid;
        const originalGid = stats?.gid;

        // Test with same uid/gid (should not fail)
        if (originalUid !== null && originalGid !== null) {
          await folder.chown(originalUid as FS.UID, originalGid as FS.GID);
        }
      });

      await t.step('chown() with recursive option', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalUid = stats?.uid;
        const originalGid = stats?.gid;

        // Test with same uid/gid recursively (should not fail)
        if (originalUid !== null && originalGid !== null) {
          await folder.chown(originalUid as FS.UID, originalGid as FS.GID, true);
        }
      });

      await t.step('chgrp() changes folder group', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalGid = stats?.gid;

        // Test with same gid (should not fail)
        if (originalGid !== null) {
          await folder.chgrp(originalGid as FS.GID);
        }
      });

      await t.step('chgrp() with recursive option', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalGid = stats?.gid;

        // Test with same gid recursively (should not fail)
        if (originalGid !== null) {
          await folder.chgrp(originalGid as FS.GID, true);
        }
      });

      await t.step('chmod() changes folder permissions', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalMode = stats?.mode;

        // Test with same mode (should not fail)
        if (originalMode !== null) {
          await folder.chmod(originalMode as FS.Mode);
        }
      });

      await t.step('chmod() with recursive option', async () => {
        const folder = new FolderSpec(testDir);
        const stats = await folder.stats();
        const originalMode = stats?.mode;

        // Test with same mode recursively (should not fail)
        if (originalMode !== null) {
          await folder.chmod(originalMode as FS.Mode, true);
        }
      });
    });

    await t.step('contains()', async (t) => {
      await t.step('returns true for a file directly inside the folder', () => {
        const folder = new FolderSpec('/my/path');
        assert(folder.contains(new FileSpec('/my/path/x.jpg')));
      });

      await t.step('returns true for a file in a subdirectory', () => {
        const folder = new FolderSpec('/my');
        assert(folder.contains(new FileSpec('/my/path/x.jpg')));
      });

      await t.step('returns true for a subfolder', () => {
        const folder = new FolderSpec('/my');
        assert(folder.contains(new FolderSpec('/my/path')));
      });

      await t.step('returns false for a path outside the folder', () => {
        const folder = new FolderSpec('/my/path');
        assertEquals(folder.contains(new FolderSpec('/my')), false);
      });

      await t.step('returns false for the folder itself', () => {
        const folder = new FolderSpec('/my/path');
        assertEquals(folder.contains(new FolderSpec('/my/path')), false);
      });

      await t.step('accepts a plain string path', () => {
        const folder = new FolderSpec('/my/path');
        assert(folder.contains('/my/path/x.jpg'));
        assertEquals(folder.contains('/other/path/x.jpg'), false);
      });
    });

    await t.step('Constructor Variants', async (t) => {
      await t.step('creates FolderSpec from URL and relative path', () => {
        const folder = new FolderSpec(import.meta.url, './test-folder');
        assertInstanceOf(folder, FolderSpec);
        assertEquals(folder.folderName, 'test-folder');
      });
    });
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});
