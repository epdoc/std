import * as Err from '$error';
import { FileSpec, FolderSpec, util } from '$mod';
import { assert, assertEquals, assertInstanceOf, assertStringIncludes } from '@std/assert';

async function makeTree(root: FolderSpec): Promise<void> {
  await root.ensureDir();
  await new FileSpec(root, 'a.txt').write('file-a');
  const sub = new FolderSpec(root, 'sub');
  await sub.ensureDir();
  await new FileSpec(sub, 'b.txt').write('file-b');
  const deep = new FolderSpec(sub, 'deep');
  await deep.ensureDir();
  await new FileSpec(deep, 'c.txt').write('file-c');
}

async function withFiles(
  fn: (env: {
    testDir: string;
    srcFile: FileSpec;
    destFile: FileSpec;
    destFolder: FolderSpec;
  }) => Promise<void>,
): Promise<void> {
  const testDir = await Deno.makeTempDir({ prefix: 'safecopy_test_' });
  const testDirSpec = new FolderSpec(testDir);
  const srcFile = new FileSpec(testDirSpec.path, 'src', 'file.txt');
  const destFile = new FileSpec(testDirSpec.path, 'dest', 'file.txt');
  const destFolder = new FolderSpec(testDirSpec.path, 'dest');

  await testDirSpec.ensureDir();
  await srcFile.ensureParentDir();
  await srcFile.write('source file');
  await destFolder.ensureDir();

  try {
    await fn({ testDir, srcFile, destFile, destFolder });
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
}

async function withFolders(
  fn: (env: {
    testDir: string;
    srcDir: FolderSpec;
    dstDir: FolderSpec;
  }) => Promise<void>,
): Promise<void> {
  const testDir = await Deno.makeTempDir({ prefix: 'safecopy_test_' });
  const srcDir = new FolderSpec(testDir, 'src_tree');
  const dstDir = new FolderSpec(testDir, 'dst_tree');
  await makeTree(srcDir);

  try {
    await fn({ testDir, srcDir, dstDir });
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
}

Deno.test('Safe Copy Operations', async (t) => {
  // Conflict strategies (file → file, dest pre-exists)
  await t.step('skip strategy does nothing if destination exists', () =>
    withFiles(async ({ srcFile, destFile }) => {
      await destFile.write('dest file');
      await srcFile.safeCopy(destFile, {
        conflictStrategy: { type: util.fileConflictStrategyType.skip },
      });
      assertEquals(await destFile.readAsString(), 'dest file');
    }));

  await t.step('error strategy throws if destination exists', () =>
    withFiles(async ({ srcFile, destFile }) => {
      await destFile.write('dest file');
      const opts = {
        conflictStrategy: { type: util.fileConflictStrategyType.error, errorIfExists: true },
      };

      let errorThrown = false;
      try {
        await srcFile.safeCopy(destFile, opts);
      } catch (e) {
        errorThrown = true;
        assertInstanceOf(e, Error);
        if (e instanceof Error) {
          assertStringIncludes(e.message, 'File exists');
        }
      }
      assert(errorThrown);
    }));

  await t.step('overwrite strategy overwrites if destination exists', () =>
    withFiles(async ({ srcFile, destFile }) => {
      await destFile.write('dest file');
      await srcFile.safeCopy(destFile, {
        conflictStrategy: { type: util.fileConflictStrategyType.overwrite },
      });
      assertEquals(await destFile.readAsString(), 'source file');
    }));

  await t.step(
    'renameWithTilde strategy renames destination if it exists',
    () =>
      withFiles(async ({ srcFile, destFile }) => {
        await destFile.write('dest file');
        await srcFile.safeCopy(destFile, {
          conflictStrategy: { type: util.fileConflictStrategyType.renameWithTilde },
        });

        assertEquals(await destFile.readAsString(), 'source file');

        const backupFile = new FileSpec(destFile.path + '~');
        assertEquals(await backupFile.readAsString(), 'dest file');
      }),
  );

  await t.step(
    'renameWithNumber strategy renames destination if it exists',
    () =>
      withFiles(async ({ srcFile, destFile, destFolder }) => {
        await destFile.write('dest file');
        await srcFile.safeCopy(destFile, {
          conflictStrategy: { type: util.fileConflictStrategyType.renameWithNumber },
        });

        assertEquals(await destFile.readAsString(), 'source file');

        const backupFile = new FileSpec(destFolder.path, 'file-01.txt');
        assertEquals(await backupFile.readAsString(), 'dest file');
      }),
  );

  await t.step(
    'renameWithDatetime strategy renames destination with timestamp',
    () =>
      withFiles(async ({ srcFile, destFile, destFolder }) => {
        await destFile.write('dest file');
        await srcFile.safeCopy(destFile, {
          conflictStrategy: {
            type: util.fileConflictStrategyType.renameWithDatetime,
            format: 'yyyyMMdd',
            separator: '_',
            prefix: 'backup',
          },
        });

        assertEquals(await destFile.readAsString(), 'source file');

        const entries = await destFolder.getFiles();
        const backupFile = entries.find((e) => e.basename.startsWith('file_backup'));
        assert(backupFile);
        if (backupFile instanceof FileSpec) {
          assertEquals(await backupFile.readAsString(), 'dest file');
        }
      }),
  );

  await t.step(
    'renameWithEpochMs strategy renames destination with epoch',
    () =>
      withFiles(async ({ srcFile, destFile, destFolder }) => {
        await destFile.write('dest file');
        await srcFile.safeCopy(destFile, {
          conflictStrategy: {
            type: util.fileConflictStrategyType.renameWithEpochMs,
            separator: '.',
            prefix: 'old',
          },
        });

        assertEquals(await destFile.readAsString(), 'source file');

        const entries = await destFolder.getFiles();
        const backupFile = entries.find((e) => e.basename.startsWith('file.old'));
        assert(backupFile);
        if (backupFile instanceof FileSpec) {
          assertEquals(await backupFile.readAsString(), 'dest file');
          const suffix = backupFile.basename.split('old').pop();
          assert(!isNaN(Number(suffix)));
        }
      }),
  );

  // FileSpec → FileSpec: new parent directories, move, and no-conflict copy
  await t.step(
    'copies to a destination that does not yet exist (creates parent dirs)',
    () =>
      withFiles(async ({ testDir, srcFile }) => {
        const deepDest = new FileSpec(testDir, 'new', 'nested', 'file.txt');
        assertEquals(await deepDest.exists(), false);
        await srcFile.safeCopy(deepDest);
        assertEquals(await deepDest.readAsString(), 'source file');
      }),
  );

  await t.step('copy leaves source intact', () =>
    withFiles(async ({ srcFile, destFile }) => {
      await srcFile.safeCopy(destFile);
      assertEquals(await srcFile.exists(), true);
      assertEquals(await srcFile.readAsString(), 'source file');
    }));

  await t.step('move removes source after copy', () =>
    withFiles(async ({ srcFile, destFile }) => {
      await srcFile.safeCopy(destFile, { move: true });
      assertEquals(await destFile.readAsString(), 'source file');
      assertEquals(await srcFile.exists(), false);
    }));

  // FileSpec → FolderSpec
  await t.step(
    'copies file into existing folder using original filename',
    () =>
      withFiles(async ({ srcFile, destFolder }) => {
        await srcFile.safeCopy(destFolder);
        const copied = new FileSpec(destFolder, 'file.txt');
        assertEquals(await copied.readAsString(), 'source file');
      }),
  );

  await t.step('creates the destination folder if it does not exist', () =>
    withFiles(async ({ testDir, srcFile }) => {
      const newFolder = new FolderSpec(testDir, 'brand-new-dir');
      assertEquals(await newFolder.exists(), false);
      await srcFile.safeCopy(newFolder);
      const copied = new FileSpec(newFolder, 'file.txt');
      assertEquals(await copied.readAsString(), 'source file');
    }));

  await t.step(
    'conflict strategy (skip) applies when copying into a folder',
    () =>
      withFiles(async ({ srcFile, destFolder }) => {
        const existingDest = new FileSpec(destFolder, 'file.txt');
        await existingDest.write('original content');

        await srcFile.safeCopy(destFolder, {
          conflictStrategy: { type: util.fileConflictStrategyType.skip },
        });
        assertEquals(await existingDest.readAsString(), 'original content');
      }),
  );

  await t.step(
    'conflict strategy (renameWithTilde) applies when copying into a folder',
    () =>
      withFiles(async ({ srcFile, destFolder }) => {
        const existingDest = new FileSpec(destFolder, 'file.txt');
        await existingDest.write('original content');

        await srcFile.safeCopy(destFolder, {
          conflictStrategy: { type: util.fileConflictStrategyType.renameWithTilde },
        });
        assertEquals(await existingDest.readAsString(), 'source file');
        const backup = new FileSpec(existingDest.path + '~');
        assertEquals(await backup.readAsString(), 'original content');
      }),
  );

  await t.step(
    'move removes source file when copying into a folder',
    () =>
      withFiles(async ({ srcFile, destFolder }) => {
        await srcFile.safeCopy(destFolder, { move: true });
        assertEquals(await srcFile.exists(), false);
        const copied = new FileSpec(destFolder, 'file.txt');
        assertEquals(await copied.readAsString(), 'source file');
      }),
  );

  // FolderSpec → FolderSpec (safeCopyFolder)
  await t.step(
    'copies entire directory tree to an existing destination',
    () =>
      withFolders(async ({ srcDir, dstDir }) => {
        await dstDir.ensureDir();
        await new FolderSpec(srcDir).safeCopy(dstDir);

        assertEquals(await new FileSpec(dstDir, 'a.txt').readAsString(), 'file-a');
        assertEquals(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString(), 'file-b');
        assertEquals(await new FileSpec(dstDir, 'sub', 'deep', 'c.txt').readAsString(), 'file-c');
      }),
  );

  await t.step(
    'creates the destination directory tree if it does not exist',
    () =>
      withFolders(async ({ srcDir, dstDir }) => {
        await new FolderSpec(srcDir).safeCopy(dstDir);

        assertEquals(await new FileSpec(dstDir, 'a.txt').readAsString(), 'file-a');
        assertEquals(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString(), 'file-b');
      }),
  );

  await t.step('move removes entire source tree after copy', () =>
    withFolders(async ({ srcDir, dstDir }) => {
      await new FolderSpec(srcDir).safeCopy(dstDir, { move: true });

      assertEquals(await new FileSpec(dstDir, 'a.txt').readAsString(), 'file-a');
      assertEquals(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString(), 'file-b');
      assertEquals(await new FileSpec(dstDir, 'sub', 'deep', 'c.txt').readAsString(), 'file-c');

      assertEquals(await srcDir.exists(), false);
    }));

  await t.step('copy leaves source tree intact', () =>
    withFolders(async ({ srcDir, dstDir }) => {
      await new FolderSpec(srcDir).safeCopy(dstDir);

      assertEquals(await srcDir.exists(), true);
      assertEquals(await new FileSpec(srcDir, 'a.txt').readAsString(), 'file-a');
    }));

  await t.step(
    'conflict strategy applies to individual files during folder copy',
    () =>
      withFolders(async ({ srcDir, dstDir }) => {
        await dstDir.ensureDir();
        const existingFile = new FileSpec(dstDir, 'a.txt');
        await existingFile.write('original-a');

        await new FolderSpec(srcDir).safeCopy(dstDir, {
          conflictStrategy: { type: util.fileConflictStrategyType.skip },
        });

        assertEquals(await existingFile.readAsString(), 'original-a');
        assertEquals(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString(), 'file-b');
      }),
  );

  // Error cases
  await t.step('throws NotFound when source file does not exist', () =>
    withFiles(async ({ testDir, destFolder }) => {
      const missing = new FileSpec(testDir, 'no-such-file.txt');
      let threw = false;
      try {
        await missing.safeCopy(destFolder);
      } catch (e) {
        threw = true;
        assertInstanceOf(e, Err.NotFound);
      }
      assert(threw);
    }));

  await t.step(
    'throws InvalidData when source is a symlink',
    () =>
      withFiles(async ({ testDir, srcFile, destFolder }) => {
        const linkPath = testDir + '/mylink.txt';
        await Deno.symlink(srcFile.path, linkPath);

        const { safeCopy } = await import('$util');
        const { FSSpec } = await import('$spec');
        let threw = false;
        try {
          await safeCopy(new FSSpec(linkPath), destFolder);
        } catch (e) {
          threw = true;
          assertInstanceOf(e, Err.InvalidData);
        }
        assert(threw);
      }),
  );

  await t.step('throws InvalidData when destination is a symlink', () =>
    withFiles(async ({ testDir, srcFile }) => {
      const linkTarget = new FolderSpec(testDir, 'real_dir');
      await linkTarget.ensureDir();
      const linkPath = testDir + '/linked_dir';
      await Deno.symlink(linkTarget.path, linkPath);

      const { safeCopy } = await import('$util');
      const { FSSpec } = await import('$spec');
      let threw = false;
      try {
        await safeCopy(srcFile, new FSSpec(linkPath));
      } catch (e) {
        threw = true;
        assertInstanceOf(e, Err.InvalidData);
      }
      assert(threw);
    }));
});
