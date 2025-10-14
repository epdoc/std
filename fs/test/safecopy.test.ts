import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, test } from '@std/testing/bdd';
import { FileSpec, FolderSpec, util } from '../src/mod.ts';

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
  });
});
