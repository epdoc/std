import { FileSpec, FolderSpec, SymlinkSpec } from '$mod';
import type * as FS from '$mod';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import { promises as nfs } from 'node:fs';

describe('SymlinkSpec', () => {
  let testDir: FolderSpec;
  let testFile: FileSpec;
  let testSymlink: SymlinkSpec;

  beforeAll(async () => {
    testDir = await FolderSpec.makeTemp({ prefix: 'symspec_test_' });
    testFile = new FileSpec(testDir, 'target.txt');
    await testFile.write('Hello, World!');

    testSymlink = new SymlinkSpec(testDir, 'test-symlink');
    await nfs.symlink(testFile.path, testSymlink.path);
  });

  afterAll(async () => {
    await testDir.remove({ recursive: true });
  });

  describe('Permission Operations', () => {
    test('chown() changes symlink ownership', async () => {
      const stats = await testSymlink.stats();
      const originalUid = stats?.uid;
      const originalGid = stats?.gid;

      // Test with same uid/gid (should not fail)
      if (originalUid !== null && originalGid !== null) {
        await expect(testSymlink.chown(originalUid as FS.UID, originalGid as FS.GID)).resolves.not.toThrow();
      }
    });

    test('chgrp() changes symlink group', async () => {
      const stats = await testSymlink.stats();
      const originalGid = stats?.gid;

      // Test with same gid (should not fail)
      if (originalGid !== null) {
        await expect(testSymlink.chgrp(originalGid as FS.GID)).resolves.not.toThrow();
      }
    });

    test('chmod() changes symlink permissions', async () => {
      const stats = await testSymlink.stats();
      const originalMode = stats?.mode;

      // Test with same mode (should not fail)
      if (originalMode !== null) {
        await expect(testSymlink.chmod(originalMode as FS.Mode)).resolves.not.toThrow();
      }
    });
  });
});
