import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { FileSpec, FolderSpec, util } from '../src/mod.ts';

const READONLY = FolderSpec.fromMeta(import.meta.url, './readonly');
const TEST_DIR = new FolderSpec(READONLY.dirname, 'test-data-fs4');
const SRC_FILE = new FileSpec(TEST_DIR.path, 'src', 'file.txt');
const DEST_FILE = new FileSpec(TEST_DIR.path, 'dest', 'file.txt');
const DEST_FOLDER = new FolderSpec(TEST_DIR.path, 'dest');

describe('safeCopy and backup', () => {
  beforeEach(async () => {
    await TEST_DIR.ensureDir();
    await SRC_FILE.ensureParentDir();
    await SRC_FILE.write('source file');
    await DEST_FOLDER.ensureDir();
  });

  afterEach(async () => {
    await TEST_DIR.remove({ recursive: true });
  });

  it('safeCopy with skip strategy should do nothing if dest exists', async () => {
    await DEST_FILE.write('dest file');
    const opts: util.SafeCopyOpts = {
      conflictStrategy: { type: util.fileConflictStrategyType.skip },
    };
    await SRC_FILE.safeCopy(DEST_FILE, opts);
    const content = await DEST_FILE.readAsString();
    expect(content).toBe('dest file');
  });

  it('safeCopy with error strategy should throw if dest exists', async () => {
    await DEST_FILE.write('dest file');
    const opts: util.SafeCopyOpts = {
      conflictStrategy: { type: util.fileConflictStrategyType.error, errorIfExists: true },
    };
    try {
      await SRC_FILE.safeCopy(DEST_FILE, opts);
      expect(true).toBe(false); // should not be reached
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toHaveProperty('message');
      if (e instanceof Error && e.message) {
        expect(e.message).toContain('File exists');
      }
    }
  });

  it('safeCopy with overwrite strategy should overwrite if dest exists', async () => {
    await DEST_FILE.write('dest file');
    const opts: util.SafeCopyOpts = {
      conflictStrategy: { type: util.fileConflictStrategyType.overwrite },
    };
    await SRC_FILE.safeCopy(DEST_FILE, opts);
    const content = await DEST_FILE.readAsString();
    expect(content).toBe('source file');
  });

  it('safeCopy with renameWithTilde strategy should rename dest if it exists', async () => {
    await DEST_FILE.write('dest file');
    const opts: util.SafeCopyOpts = {
      conflictStrategy: { type: util.fileConflictStrategyType.renameWithTilde },
    };
    await SRC_FILE.safeCopy(DEST_FILE, opts);
    const content = await DEST_FILE.readAsString();
    expect(content).toBe('source file');
    const backupFile = new FileSpec(DEST_FILE.path + '~');
    const backupContent = await backupFile.readAsString();
    expect(backupContent).toBe('dest file');
  });

  it('safeCopy with renameWithNumber strategy should rename dest if it exists', async () => {
    await DEST_FILE.write('dest file');
    const opts: util.SafeCopyOpts = {
      conflictStrategy: { type: util.fileConflictStrategyType.renameWithNumber },
    };
    await SRC_FILE.safeCopy(DEST_FILE, opts);
    const content = await DEST_FILE.readAsString();
    expect(content).toBe('source file');
    const backupFile = new FileSpec(DEST_FOLDER.path, 'file-01.txt');
    const backupContent = await backupFile.readAsString();
    expect(backupContent).toBe('dest file');
  });
});
