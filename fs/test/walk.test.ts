import * as FS from '$mod';
import { walk } from '$walk';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { promises as nfs } from 'node:fs';
import path from 'node:path';

Deno.test('walk', async (t) => {
  let tmpDirSpec: FS.FolderSpec = await FS.FolderSpec.makeTemp({ prefix: 'walk-test-' });
  const realPath = await tmpDirSpec.realPath();
  tmpDirSpec = new FS.FolderSpec(realPath);

  const testDirSpec = await tmpDirSpec.mkdir('test_dir' as FS.Name);
  await new FS.FileSpec(testDirSpec, 'file1.txt').write('content');

  await testDirSpec.mkdir('subdir1' as FS.Name);
  await new FS.FileSpec(testDirSpec, 'subdir1', 'file2.js').write('content');

  await testDirSpec.mkdir('subdir2' as FS.Name);
  await new FS.FileSpec(testDirSpec, 'subdir2', 'file3.ts').write('content');

  const nodeModulesDir = await testDirSpec.mkdir('node_modules' as FS.Name);
  await new FS.FileSpec(nodeModulesDir, 'package.json').write('{}');
  await nodeModulesDir.mkdir('some-package' as FS.Name);
  await new FS.FileSpec(nodeModulesDir, 'some-package', 'index.js').write('// code');

  const gitDir = await testDirSpec.mkdir('.git' as FS.Name);
  await new FS.FileSpec(gitDir, 'config').write('[core]');

  let deepDirSpec: FS.FolderSpec | null = null;
  deepDirSpec = await testDirSpec.mkdir('deep' as FS.Name);
  const nestedNodeModules = await deepDirSpec.mkdir('node_modules' as FS.Name);
  await new FS.FileSpec(nestedNodeModules, 'deep-package.js').write('// code');

  await nfs.symlink(path.join(testDirSpec.path, 'file1.txt'), path.join(testDirSpec.path, 'symlink_to_file.txt'));
  await nfs.symlink(path.join(testDirSpec.path, 'subdir1'), path.join(testDirSpec.path, 'symlink_to_dir'));

  try {
    await t.step('should walk all files and directories by default', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec)) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          '',
          '.git',
          '.git/config',
          'deep',
          'deep/node_modules',
          'deep/node_modules/deep-package.js',
          'file1.txt',
          'node_modules',
          'node_modules/package.json',
          'node_modules/some-package',
          'node_modules/some-package/index.js',
          'subdir1',
          'subdir1/file2.js',
          'subdir2',
          'subdir2/file3.ts',
          'symlink_to_dir',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('should respect maxDepth option', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { maxDepth: 0 })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(paths, [
        '',
      ]);

      const entries2: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { maxDepth: 1 })) {
        entries2.push(entry);
      }
      const paths2 = entries2.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths2,
        [
          '',
          '.git',
          'deep',
          'file1.txt',
          'node_modules',
          'subdir1',
          'subdir2',
          'symlink_to_dir',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('should include only files when includeDirs is false', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { includeDirs: false, includeSymlinks: false })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          '.git/config',
          'deep/node_modules/deep-package.js',
          'file1.txt',
          'node_modules/package.json',
          'node_modules/some-package/index.js',
          'subdir1/file2.js',
          'subdir2/file3.ts',
        ].sort(),
      );
    });

    await t.step('should include only directories when includeFiles is false', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { includeFiles: false, includeSymlinks: false })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          '',
          '.git',
          'deep',
          'deep/node_modules',
          'node_modules',
          'node_modules/some-package',
          'subdir1',
          'subdir2',
        ].sort(),
      );
    });

    await t.step('should filter by exts option', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { exts: ['.txt', '.js'] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          'deep/node_modules/deep-package.js',
          'file1.txt',
          'node_modules/some-package/index.js',
          'subdir1/file2.js',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('should filter by match option', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { match: [/file/] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          'file1.txt',
          'subdir1/file2.js',
          'subdir2/file3.ts',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('exclude option', async (t) => {
      await t.step('should exclude directories from traversal (pruning)', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (const entry of walk(testDirSpec, { exclude: [/node_modules/, /\.git/] })) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assertEquals(
          paths,
          [
            '',
            'deep',
            'file1.txt',
            'subdir1',
            'subdir1/file2.js',
            'subdir2',
            'subdir2/file3.ts',
            'symlink_to_dir',
            'symlink_to_file.txt',
          ].sort(),
        );
      });

      await t.step('should exclude specific files', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (const entry of walk(testDirSpec, { exclude: [/file1\.txt/, /file2\.js/] })) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assertEquals(
          paths,
          [
            '',
            '.git',
            '.git/config',
            'deep',
            'deep/node_modules',
            'deep/node_modules/deep-package.js',
            'node_modules',
            'node_modules/package.json',
            'node_modules/some-package',
            'node_modules/some-package/index.js',
            'subdir1',
            'subdir2',
            'subdir2/file3.ts',
            'symlink_to_dir',
            'symlink_to_file.txt',
          ].sort(),
        );
      });

      await t.step('should work with exts and exclude together', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (
          const entry of walk(testDirSpec, {
            exts: ['.js', '.ts'],
            exclude: [/node_modules/],
          })
        ) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assertEquals(
          paths,
          [
            'subdir1/file2.js',
            'subdir2/file3.ts',
          ].sort(),
        );
      });

      await t.step('should work with match and exclude together', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (
          const entry of walk(testDirSpec, {
            match: [/file/],
            exclude: [/node_modules/, /file1\.txt/, /symlink/],
          })
        ) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assertEquals(
          paths,
          [
            'subdir1/file2.js',
            'subdir2/file3.ts',
          ].sort(),
        );
      });

      await t.step('should exclude directories at any depth', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (const entry of walk(testDirSpec, { exclude: [/node_modules/, /\.git/] })) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assert(!paths.includes('node_modules'));
        assert(!paths.includes('node_modules/package.json'));
        assert(!paths.includes('node_modules/some-package'));
        assert(!paths.includes('node_modules/some-package/index.js'));
        assert(!paths.includes('deep/node_modules'));
        assert(!paths.includes('deep/node_modules/deep-package.js'));
        assert(paths.includes('deep'));
      });
    });

    await t.step('deprecated skip option', async (t) => {
      await t.step('should still work with skip for backward compatibility', async () => {
        const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
        for await (const entry of walk(testDirSpec, { skip: [/node_modules/, /\.git/] })) {
          entries.push(entry);
        }
        const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
        assertEquals(
          paths,
          [
            '',
            'deep',
            'file1.txt',
            'subdir1',
            'subdir1/file2.js',
            'subdir2',
            'subdir2/file3.ts',
            'symlink_to_dir',
            'symlink_to_file.txt',
          ].sort(),
        );
      });

      await t.step('should throw error if both skip and exclude are provided', async () => {
        const walkPromise = (async () => {
          const results: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
          for await (
            const entry of walk(testDirSpec, {
              skip: [/node_modules/],
              exclude: [/\.git/],
            })
          ) {
            results.push(entry);
          }
          return results;
        })();

        await assertRejects(
          () => walkPromise,
          Error,
          'Cannot use both `skip` and `exclude` options',
        );
      });
    });

    await t.step('should follow symlinks when followSymlinks is true', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { followSymlinks: true })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          '',
          '.git',
          '.git/config',
          'deep',
          'deep/node_modules',
          'deep/node_modules/deep-package.js',
          'file1.txt',
          'node_modules',
          'node_modules/package.json',
          'node_modules/some-package',
          'node_modules/some-package/index.js',
          'subdir1',
          'subdir1/file2.js',
          'subdir2',
          'subdir2/file3.ts',
        ].sort(),
      );
    });

    await t.step('should not follow symlinks by default', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec)) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          '',
          '.git',
          '.git/config',
          'deep',
          'deep/node_modules',
          'deep/node_modules/deep-package.js',
          'file1.txt',
          'node_modules',
          'node_modules/package.json',
          'node_modules/some-package',
          'node_modules/some-package/index.js',
          'subdir1',
          'subdir1/file2.js',
          'subdir2',
          'subdir2/file3.ts',
          'symlink_to_dir',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('should include symlinks when includeSymlinks is true', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { includeSymlinks: true, includeFiles: false, includeDirs: false })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(
        paths,
        [
          'symlink_to_dir',
          'symlink_to_file.txt',
        ].sort(),
      );
    });

    await t.step('should not include symlinks when includeSymlinks is false', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (
        const entry of walk(testDirSpec, { includeSymlinks: false, includeFiles: false, includeDirs: false })
      ) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assertEquals(paths, []);
    });

    await t.step('should exclude symlink targets when followSymlinks is true and exclude matches', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (
        const entry of walk(testDirSpec, {
          followSymlinks: true,
          exclude: [/subdir1/],
        })
      ) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      assert(!paths.includes('subdir1'));
      assert(!paths.includes('subdir1/file2.js'));
      assert(paths.includes('file1.txt'));
    });
  } finally {
    await nfs.rm(tmpDirSpec.path, { recursive: true, force: true });
  }
});
