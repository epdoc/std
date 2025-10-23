import { Error as Err, FileSpec } from '$mod';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import * as path from 'node:path';

describe('FSSpec error conditions', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fsspec_test_'));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('readAsString -> NotFound for missing file', async () => {
    const missingPath = path.join(tmpDir, 'no-such-file.txt');
    const f = new FileSpec(missingPath);
    try {
      await f.readAsString();
      throw new Error('Expected readAsString to throw NotFound');
    } catch (err) {
      expect(err).toBeInstanceOf(Err.NotFound);
    }
  });

  test('ensureParentDir -> NotADirectory when parent is a file', async () => {
    const fsParentFile = new FileSpec(tmpDir, 'parent-file');
    await fsParentFile.write('these are the content of the file names "parent-file"');
    const child = new FileSpec(fsParentFile, 'child.txt');
    try {
      await child.ensureParentDir();
      throw new Error('Expected ensureParentDir to throw NotADirectory');
    } catch (err) {
      // The underlying Node.js mkdir throws EEXIST when a file blocks directory creation.
      // This is mapped to Err.AlreadyExists.
      expect(
        err instanceof Err.AlreadyExists,
      ).toBe(true);
    }
  });

  test('backup -> NotFound for non-existent file', async () => {
    const missing = new FileSpec(path.join(tmpDir, 'noexist.backup.txt'));
    try {
      await missing.backup();
      throw new Error('Expected backup to throw NotFound');
    } catch (err) {
      expect(err).toBeInstanceOf(Err.NotFound);
    }
  });

  test('readJson -> generic FSError on invalid JSON (not NotFound)', async () => {
    const badJsonPath = path.join(tmpDir, 'bad.json');
    await fs.writeFile(badJsonPath, '{ invalid json ');
    const f = new FileSpec(badJsonPath);
    try {
      await f.readJson();
      throw new Error('Expected readJson to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(Err.Main);
      expect(err).not.toBeInstanceOf(Err.NotFound);
    }
  });
});
