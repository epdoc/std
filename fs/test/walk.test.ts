import * as FS from '$mod';
import { walk } from '$walk';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { promises as nfs } from 'node:fs';
import path from 'node:path';

describe('walk', () => {
  let tmpDirSpec: FS.FolderSpec;
  let testDirSpec: FS.FolderSpec;
  let deepDirSpec: FS.FolderSpec | null = null;

  beforeAll(async () => {
    tmpDirSpec = await FS.FolderSpec.makeTemp({ prefix: 'walk-test-' });
    const realPath = await tmpDirSpec.realPath();
    tmpDirSpec = new FS.FolderSpec(realPath);

    testDirSpec = await tmpDirSpec.mkdir('test_dir' as FS.Name);
    await new FS.FileSpec(testDirSpec, 'file1.txt').write('content');

    await testDirSpec.mkdir('subdir1' as FS.Name);
    await new FS.FileSpec(testDirSpec, 'subdir1', 'file2.js').write('content');

    await testDirSpec.mkdir('subdir2' as FS.Name);
    await new FS.FileSpec(testDirSpec, 'subdir2', 'file3.ts').write('content');

    // Create nested directories for testing exclude pruning
    const nodeModulesDir = await testDirSpec.mkdir('node_modules' as FS.Name);
    await new FS.FileSpec(nodeModulesDir, 'package.json').write('{}');
    await nodeModulesDir.mkdir('some-package' as FS.Name);
    await new FS.FileSpec(nodeModulesDir, 'some-package', 'index.js').write('// code');

    const gitDir = await testDirSpec.mkdir('.git' as FS.Name);
    await new FS.FileSpec(gitDir, 'config').write('[core]');

    // Create deep nested structure for testing exclude at any depth
    deepDirSpec = await testDirSpec.mkdir('deep' as FS.Name);
    const nestedNodeModules = await deepDirSpec.mkdir('node_modules' as FS.Name);
    await new FS.FileSpec(nestedNodeModules, 'deep-package.js').write('// code');

    await nfs.symlink(path.join(testDirSpec.path, 'file1.txt'), path.join(testDirSpec.path, 'symlink_to_file.txt'));
    await nfs.symlink(path.join(testDirSpec.path, 'subdir1'), path.join(testDirSpec.path, 'symlink_to_dir'));
  });

  afterAll(async () => {
    await nfs.rm(tmpDirSpec.path, { recursive: true, force: true });
  });

  it('should walk all files and directories by default', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec)) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
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
    ].sort());
  });

  it('should respect maxDepth option', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { maxDepth: 0 })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      '',
    ]);

    const entries2: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { maxDepth: 1 })) {
      entries2.push(entry);
    }
    const paths2 = entries2.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths2).toEqual([
      '',
      '.git',
      'deep',
      'file1.txt',
      'node_modules',
      'subdir1',
      'subdir2',
      'symlink_to_dir',
      'symlink_to_file.txt',
    ].sort());
  });

  it('should include only files when includeDirs is false', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { includeDirs: false, includeSymlinks: false })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      '.git/config',
      'deep/node_modules/deep-package.js',
      'file1.txt',
      'node_modules/package.json',
      'node_modules/some-package/index.js',
      'subdir1/file2.js',
      'subdir2/file3.ts',
    ].sort());
  });

  it('should include only directories when includeFiles is false', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { includeFiles: false, includeSymlinks: false })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      '',
      '.git',
      'deep',
      'deep/node_modules',
      'node_modules',
      'node_modules/some-package',
      'subdir1',
      'subdir2',
    ].sort());
  });

  it('should filter by exts option', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { exts: ['.txt', '.js'] })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      'deep/node_modules/deep-package.js',
      'file1.txt',
      'node_modules/some-package/index.js',
      'subdir1/file2.js',
      'symlink_to_file.txt',
    ].sort());
  });

  it('should filter by match option', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { match: [/file/] })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    // Only paths containing "file" (deep-package.js and index.js do NOT contain "file")
    expect(paths).toEqual([
      'file1.txt',
      'subdir1/file2.js',
      'subdir2/file3.ts',
      'symlink_to_file.txt',
    ].sort());
  });

  describe('exclude option', () => {
    it('should exclude directories from traversal (pruning)', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { exclude: [/node_modules/, /\.git/] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      // node_modules and .git directories and their contents should be excluded
      // deep/node_modules should also be excluded since it matches /node_modules/
      expect(paths).toEqual([
        '',
        'deep',
        'file1.txt',
        'subdir1',
        'subdir1/file2.js',
        'subdir2',
        'subdir2/file3.ts',
        'symlink_to_dir',
        'symlink_to_file.txt',
      ].sort());
    });

    it('should exclude specific files', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { exclude: [/file1\.txt/, /file2\.js/] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      expect(paths).toEqual([
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
      ].sort());
    });

    it('should work with exts and exclude together', async () => {
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
      // Only .js and .ts files, excluding node_modules
      expect(paths).toEqual([
        'subdir1/file2.js',
        'subdir2/file3.ts',
      ].sort());
    });

    it('should work with match and exclude together', async () => {
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
      // Files matching "file" but excluding node_modules, file1.txt, and symlinks
      expect(paths).toEqual([
        'subdir1/file2.js',
        'subdir2/file3.ts',
      ].sort());
    });

    it('should exclude directories at any depth', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { exclude: [/node_modules/, /\.git/] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      // Should exclude node_modules at both root and deep/
      expect(paths).not.toContain('node_modules');
      expect(paths).not.toContain('node_modules/package.json');
      expect(paths).not.toContain('node_modules/some-package');
      expect(paths).not.toContain('node_modules/some-package/index.js');
      expect(paths).not.toContain('deep/node_modules');
      expect(paths).not.toContain('deep/node_modules/deep-package.js');
      expect(paths).toContain('deep');
    });
  });

  describe('deprecated skip option', () => {
    it('should still work with skip for backward compatibility', async () => {
      const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
      for await (const entry of walk(testDirSpec, { skip: [/node_modules/, /\.git/] })) {
        entries.push(entry);
      }
      const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
      expect(paths).toEqual([
        '',
        'deep',
        'file1.txt',
        'subdir1',
        'subdir1/file2.js',
        'subdir2',
        'subdir2/file3.ts',
        'symlink_to_dir',
        'symlink_to_file.txt',
      ].sort());
    });

    it('should throw error if both skip and exclude are provided', async () => {
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

      await expect(walkPromise).rejects.toThrow('Cannot use both `skip` and `exclude` options');
    });
  });

  it('should follow symlinks when followSymlinks is true', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { followSymlinks: true })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
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
    ].sort());
  });

  it('should not follow symlinks by default', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec)) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
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
    ].sort());
  });

  it('should include symlinks when includeSymlinks is true', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { includeSymlinks: true, includeFiles: false, includeDirs: false })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      'symlink_to_dir',
      'symlink_to_file.txt',
    ].sort());
  });

  it('should not include symlinks when includeSymlinks is false', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { includeSymlinks: false, includeFiles: false, includeDirs: false })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([]);
  });

  it('should exclude symlink targets when followSymlinks is true and exclude matches', async () => {
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
    // When following symlinks, subdir1 should be excluded entirely
    expect(paths).not.toContain('subdir1');
    expect(paths).not.toContain('subdir1/file2.js');
    expect(paths).toContain('file1.txt');
  });
});
