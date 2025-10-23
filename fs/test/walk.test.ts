import * as FS from '$mod';
import { walk } from '$walk';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { promises as nfs } from 'node:fs';
import path from 'node:path';

describe('walk', () => {
  let tmpDirSpec: FS.FolderSpec;
  let testDirSpec: FS.FolderSpec;

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
      'file1.txt',
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
      'file1.txt',
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
      'file1.txt',
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
      'file1.txt',
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
    expect(paths).toEqual([
      'file1.txt',
      'subdir1/file2.js',
      'subdir2/file3.ts',
      'symlink_to_file.txt',
    ].sort());
  });

  it('should filter by skip option', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { skip: [/subdir1/] })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      '',
      'file1.txt',
      'subdir2',
      'subdir2/file3.ts',
      'symlink_to_dir',
      'symlink_to_file.txt',
    ].sort());
  });

  it('should follow symlinks when followSymlinks is true', async () => {
    const entries: (FS.FolderSpec | FS.FileSpec | FS.SymlinkSpec | FS.FSSpec)[] = [];
    for await (const entry of walk(testDirSpec, { followSymlinks: true })) {
      entries.push(entry);
    }
    const paths = entries.map((e) => path.relative(testDirSpec.path, e.path)).sort();
    expect(paths).toEqual([
      '',
      'file1.txt',
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
      'file1.txt',
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
});
