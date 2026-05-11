import * as Err from '$error';
import { FileSpec, FolderSpec, util } from '$mod';
import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function makeTree(root: FolderSpec): Promise<void> {
  // root/
  //   a.txt       "file-a"
  //   sub/
  //     b.txt     "file-b"
  //     deep/
  //       c.txt   "file-c"
  await root.ensureDir();
  await new FileSpec(root, 'a.txt').write('file-a');
  const sub = new FolderSpec(root, 'sub');
  await sub.ensureDir();
  await new FileSpec(sub, 'b.txt').write('file-b');
  const deep = new FolderSpec(sub, 'deep');
  await deep.ensureDir();
  await new FileSpec(deep, 'c.txt').write('file-c');
}

// ---------------------------------------------------------------------------
// Suite 1 – FileSpec → FileSpec  (existing conflict-strategy coverage)
// ---------------------------------------------------------------------------

describe('Safe Copy Operations', () => {
  let testDir: string;
  let srcFile: FileSpec;
  let destFile: FileSpec;
  let destFolder: FolderSpec;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'safecopy_test_' });
    const testDirSpec = new FolderSpec(testDir);
    srcFile = new FileSpec(testDirSpec.path, 'src', 'file.txt');
    destFile = new FileSpec(testDirSpec.path, 'dest', 'file.txt');
    destFolder = new FolderSpec(testDirSpec.path, 'dest');

    await testDirSpec.ensureDir();
    await srcFile.ensureParentDir();
    await srcFile.write('source file');
    await destFolder.ensureDir();
  });

  afterEach(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  // -------------------------------------------------------------------------
  // Conflict strategies (file → file, dest pre-exists)
  // -------------------------------------------------------------------------

  describe('Conflict Strategies', () => {
    test('skip strategy does nothing if destination exists', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.skip },
      };
      await srcFile.safeCopy(destFile, opts);
      const content = await destFile.readAsString();
      expect(content).toBe('dest file');
    });

    test('error strategy throws if destination exists', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.error, errorIfExists: true },
      };

      let errorThrown = false;
      try {
        await srcFile.safeCopy(destFile, opts);
      } catch (e) {
        errorThrown = true;
        expect(e).toBeInstanceOf(Error);
        if (e instanceof Error) {
          expect(e.message).toContain('File exists');
        }
      }
      expect(errorThrown).toBe(true);
    });

    test('overwrite strategy overwrites if destination exists', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.overwrite },
      };
      await srcFile.safeCopy(destFile, opts);
      const content = await destFile.readAsString();
      expect(content).toBe('source file');
    });

    test('renameWithTilde strategy renames destination if it exists', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.renameWithTilde },
      };
      await srcFile.safeCopy(destFile, opts);

      const content = await destFile.readAsString();
      expect(content).toBe('source file');

      const backupFile = new FileSpec(destFile.path + '~');
      const backupContent = await backupFile.readAsString();
      expect(backupContent).toBe('dest file');
    });

    test('renameWithNumber strategy renames destination if it exists', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.renameWithNumber },
      };
      await srcFile.safeCopy(destFile, opts);

      const content = await destFile.readAsString();
      expect(content).toBe('source file');

      const backupFile = new FileSpec(destFolder.path, 'file-01.txt');
      const backupContent = await backupFile.readAsString();
      expect(backupContent).toBe('dest file');
    });

    test('renameWithDatetime strategy renames destination with timestamp', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: {
          type: util.fileConflictStrategyType.renameWithDatetime,
          format: 'yyyyMMdd',
          separator: '_',
          prefix: 'backup',
        },
      };
      await srcFile.safeCopy(destFile, opts);

      const content = await destFile.readAsString();
      expect(content).toBe('source file');

      // Since we can't predict exact time, we check pattern
      const entries = await destFolder.getFiles();
      const backupFile = entries.find((e) => e.basename.startsWith('file_backup'));
      expect(backupFile).toBeDefined();
      if (backupFile instanceof FileSpec) {
        const backupContent = await backupFile.readAsString();
        expect(backupContent).toBe('dest file');
      }
    });

    test('renameWithEpochMs strategy renames destination with epoch', async () => {
      await destFile.write('dest file');
      const opts: util.SafeCopyOpts = {
        conflictStrategy: {
          type: util.fileConflictStrategyType.renameWithEpochMs,
          separator: '.',
          prefix: 'old',
        },
      };
      await srcFile.safeCopy(destFile, opts);

      const content = await destFile.readAsString();
      expect(content).toBe('source file');

      const entries = await destFolder.getFiles();
      const backupFile = entries.find((e) => e.basename.startsWith('file.old'));
      expect(backupFile).toBeDefined();
      if (backupFile instanceof FileSpec) {
        const backupContent = await backupFile.readAsString();
        expect(backupContent).toBe('dest file');
        // Check if suffix is numeric (epoch)
        const suffix = backupFile.basename.split('old').pop();
        expect(Number(suffix)).not.toBeNaN();
      }
    });
  });

  // -------------------------------------------------------------------------
  // FileSpec → FileSpec: new parent directories, move, and no-conflict copy
  // -------------------------------------------------------------------------

  describe('FileSpec → FileSpec', () => {
    test('copies to a destination that does not yet exist (creates parent dirs)', async () => {
      const deepDest = new FileSpec(testDir, 'new', 'nested', 'file.txt');
      // Parent does not exist yet
      expect(await deepDest.exists()).toBe(false);
      await srcFile.safeCopy(deepDest);
      expect(await deepDest.readAsString()).toBe('source file');
    });

    test('copy leaves source intact', async () => {
      await srcFile.safeCopy(destFile);
      expect(await srcFile.exists()).toBe(true);
      expect(await srcFile.readAsString()).toBe('source file');
    });

    test('move removes source after copy', async () => {
      await srcFile.safeCopy(destFile, { move: true });
      expect(await destFile.readAsString()).toBe('source file');
      expect(await srcFile.exists()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // FileSpec → FolderSpec  (the fixed code path)
  // -------------------------------------------------------------------------

  describe('FileSpec → FolderSpec', () => {
    test('copies file into existing folder using original filename', async () => {
      // destFolder already created in beforeEach
      await srcFile.safeCopy(destFolder);
      const copied = new FileSpec(destFolder, 'file.txt');
      expect(await copied.readAsString()).toBe('source file');
    });

    test('creates the destination folder if it does not exist', async () => {
      const newFolder = new FolderSpec(testDir, 'brand-new-dir');
      expect(await newFolder.exists()).toBe(false);
      await srcFile.safeCopy(newFolder);
      const copied = new FileSpec(newFolder, 'file.txt');
      expect(await copied.readAsString()).toBe('source file');
    });

    test('conflict strategy (skip) applies when copying into a folder', async () => {
      // Pre-populate the destination
      const existingDest = new FileSpec(destFolder, 'file.txt');
      await existingDest.write('original content');

      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.skip },
      };
      await srcFile.safeCopy(destFolder, opts);
      // File should be unchanged because skip was applied
      expect(await existingDest.readAsString()).toBe('original content');
    });

    test('conflict strategy (renameWithTilde) applies when copying into a folder', async () => {
      const existingDest = new FileSpec(destFolder, 'file.txt');
      await existingDest.write('original content');

      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.renameWithTilde },
      };
      await srcFile.safeCopy(destFolder, opts);
      expect(await existingDest.readAsString()).toBe('source file');
      const backup = new FileSpec(existingDest.path + '~');
      expect(await backup.readAsString()).toBe('original content');
    });

    test('move removes source file when copying into a folder', async () => {
      await srcFile.safeCopy(destFolder, { move: true });
      expect(await srcFile.exists()).toBe(false);
      const copied = new FileSpec(destFolder, 'file.txt');
      expect(await copied.readAsString()).toBe('source file');
    });
  });

  // -------------------------------------------------------------------------
  // FolderSpec → FolderSpec
  // -------------------------------------------------------------------------

  describe('FolderSpec → FolderSpec (safeCopyFolder)', () => {
    let srcDir: FolderSpec;
    let dstDir: FolderSpec;

    beforeEach(async () => {
      srcDir = new FolderSpec(testDir, 'src_tree');
      dstDir = new FolderSpec(testDir, 'dst_tree');
      await makeTree(srcDir);
    });

    test('copies entire directory tree to an existing destination', async () => {
      await dstDir.ensureDir();
      const srcFolder = new FolderSpec(srcDir);
      await srcFolder.safeCopy(dstDir);

      expect(await new FileSpec(dstDir, 'a.txt').readAsString()).toBe('file-a');
      expect(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString()).toBe('file-b');
      expect(await new FileSpec(dstDir, 'sub', 'deep', 'c.txt').readAsString()).toBe('file-c');
    });

    test('creates the destination directory tree if it does not exist', async () => {
      const srcFolder = new FolderSpec(srcDir);
      await srcFolder.safeCopy(dstDir);

      expect(await new FileSpec(dstDir, 'a.txt').readAsString()).toBe('file-a');
      expect(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString()).toBe('file-b');
    });

    test('move removes entire source tree after copy', async () => {
      const srcFolder = new FolderSpec(srcDir);
      await srcFolder.safeCopy(dstDir, { move: true });

      // Destination should have all files
      expect(await new FileSpec(dstDir, 'a.txt').readAsString()).toBe('file-a');
      expect(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString()).toBe('file-b');
      expect(await new FileSpec(dstDir, 'sub', 'deep', 'c.txt').readAsString()).toBe('file-c');

      // Source should be gone
      expect(await srcDir.exists()).toBe(false);
    });

    test('copy leaves source tree intact', async () => {
      const srcFolder = new FolderSpec(srcDir);
      await srcFolder.safeCopy(dstDir);

      // Source should still exist with original content
      expect(await srcDir.exists()).toBe(true);
      expect(await new FileSpec(srcDir, 'a.txt').readAsString()).toBe('file-a');
    });

    test('conflict strategy applies to individual files during folder copy', async () => {
      // Pre-populate destination with a file that will conflict
      await dstDir.ensureDir();
      const existingFile = new FileSpec(dstDir, 'a.txt');
      await existingFile.write('original-a');

      const opts: util.SafeCopyOpts = {
        conflictStrategy: { type: util.fileConflictStrategyType.skip },
      };
      const srcFolder = new FolderSpec(srcDir);
      await srcFolder.safeCopy(dstDir, opts);

      // Conflicting file should be skipped (unchanged)
      expect(await existingFile.readAsString()).toBe('original-a');
      // Non-conflicting file should be copied
      expect(await new FileSpec(dstDir, 'sub', 'b.txt').readAsString()).toBe('file-b');
    });
  });

  // -------------------------------------------------------------------------
  // Error cases
  // -------------------------------------------------------------------------

  describe('Error cases', () => {
    test('throws NotFound when source file does not exist', async () => {
      const missing = new FileSpec(testDir, 'no-such-file.txt');
      let threw = false;
      try {
        await missing.safeCopy(destFolder);
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(Err.NotFound);
      }
      expect(threw).toBe(true);
    });

    test('throws InvalidData when source is a symlink', async () => {
      const linkPath = testDir + '/mylink.txt';
      await Deno.symlink(srcFile.path, linkPath);

      // Wrap in FSSpec so resolveType hits the disk and detects the symlink.
      const { safeCopy } = await import('$util');
      const { FSSpec } = await import('$spec');
      let threw = false;
      try {
        await safeCopy(new FSSpec(linkPath), destFolder);
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(Err.InvalidData);
      }
      expect(threw).toBe(true);
    });

    test('throws InvalidData when destination is a symlink', async () => {
      const linkTarget = new FolderSpec(testDir, 'real_dir');
      await linkTarget.ensureDir();
      const linkPath = testDir + '/linked_dir';
      await Deno.symlink(linkTarget.path, linkPath);

      // Wrap in FSSpec so resolveType detects the symlink on disk.
      const { safeCopy } = await import('$util');
      const { FSSpec } = await import('$spec');
      let threw = false;
      try {
        await safeCopy(srcFile, new FSSpec(linkPath));
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(Err.InvalidData);
      }
      expect(threw).toBe(true);
    });
  });
});
