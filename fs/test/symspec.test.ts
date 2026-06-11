import { FileSpec, FolderSpec, SymlinkSpec } from '$mod';
import type * as FS from '$mod';
import { promises as nfs } from 'node:fs';

Deno.test('SymlinkSpec', async (t) => {
  const testDir = await FolderSpec.makeTemp({ prefix: 'symspec_test_' });
  const testFile = new FileSpec(testDir, 'target.txt');
  await testFile.write('Hello, World!');

  const testSymlink = new SymlinkSpec(testDir, 'test-symlink');
  await nfs.symlink(testFile.path, testSymlink.path);

  try {
    await t.step('Permission Operations', async (t) => {
      await t.step('chown() changes symlink ownership', async () => {
        const stats = await testSymlink.stats();
        const originalUid = stats?.uid;
        const originalGid = stats?.gid;

        if (originalUid !== null && originalGid !== null) {
          await testSymlink.chown(originalUid as FS.UID, originalGid as FS.GID);
        }
      });

      await t.step('chgrp() changes symlink group', async () => {
        const stats = await testSymlink.stats();
        const originalGid = stats?.gid;

        if (originalGid !== null) {
          await testSymlink.chgrp(originalGid as FS.GID);
        }
      });

      await t.step('chmod() changes symlink permissions', async () => {
        const stats = await testSymlink.stats();
        const originalMode = stats?.mode;

        if (originalMode !== null) {
          await testSymlink.chmod(originalMode as FS.Mode);
        }
      });
    });
  } finally {
    await testDir.remove({ recursive: true });
  }
});
