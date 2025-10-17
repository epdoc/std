import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import * as path from 'node:path';
import { Error as Err, FileSpec } from '../src/mod.ts';

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
    const parentFile = path.join(tmpDir, 'parent-file');
    await fs.writeFile(parentFile, 'data');
    const child = new FileSpec(path.join(parentFile, 'child.txt'));
    try {
      await child.ensureParentDir();
      throw new Error('Expected ensureParentDir to throw NotADirectory');
    } catch (err) {
      // some platforms may report EISDIR vs ENOTDIR; accept either specific mapping
      expect(
        err instanceof Err.NotADirectory || err instanceof Err.IsADirectory,
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
      expect(err).toBeInstanceOf(Err.FSError);
      expect(err).not.toBeInstanceOf(Err.NotFound);
    }
  });
});
