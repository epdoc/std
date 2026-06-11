// deno-lint-ignore-file no-explicit-any
import type * as FS from '$mod';
import { DigestAlgorithm, FileSpec, FolderSpec } from '$mod';
import { DateTime } from '@epdoc/datetime';
import { _ } from '@epdoc/type';
import { assert, assertEquals, assertInstanceOf, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { Buffer } from 'node:buffer';
import { promises as nfs } from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';
import { generateRobustPDF } from './pdfgen.ts';

Deno.test('FileSpec', async (t) => {
  const testDir = await FolderSpec.makeTemp({ prefix: 'filespec_test_' });
  const testFile = new FileSpec(testDir, 'test.txt');
  const testJson = new FileSpec(testDir, 'test.json');
  const pdfFile = new FileSpec(testDir, 'test.pdf');

  await testFile.write('Hello, World!');
  await testFile.write(JSON.stringify({ key: 'value' }));

  const robustPDF = generateRobustPDF('20180201000000');
  await pdfFile.write(robustPDF);

  try {
    await t.step('Basic Properties', async (t) => {
      await t.step('filename getter returns correct filename', () => {
        assertEquals(testFile.filename, 'test.txt');
      });

      await t.step('dirname getter returns correct directory', () => {
        assertEquals(testFile.dirname, testDir.path);
      });

      await t.step('extname getter returns correct extension', () => {
        assertEquals(testFile.extname, '.txt');
      });

      await t.step('basename getter returns correct basename', () => {
        assertEquals(testFile.basename, 'test');
      });
    });

    await t.step('Path Manipulation', async (t) => {
      await t.step('setExt() changes file extension', () => {
        const file = testFile.clone();
        file.setExt('.md');
        assertEquals(file.extname, '.md');
        assertEquals(file.path, path.join(testDir.path, 'test.md'));
      });

      await t.step('setBasename() changes file basename', () => {
        const file = testFile.clone();
        file.setBasename('newtest');
        assertEquals(file.basename, 'newtest');
        assertEquals(file.path, path.join(testDir.path, 'newtest.txt'));
      });

      await t.step('add() correctly joins paths', async () => {
        const file = new FileSpec(testDir).add('subdir', 'file.txt');
        assertEquals(file.path, path.join(testDir.path, 'subdir', 'file.txt'));
        const isFile = await file.isFile();
        assertEquals(isFile, false);
      });

      await t.step('relativeTo() returns correct relative path to folder', () => {
        const root = new FolderSpec(testDir);
        const file = new FileSpec(testDir, 'subdir', 'file.txt');
        const relPath = file.relativeTo(root);
        assertEquals(relPath, 'subdir/file.txt');
      });

      await t.step('relativeTo() returns correct relative path to file', () => {
        const otherFile = new FileSpec(testDir, 'other.txt');
        const file = new FileSpec(testDir, 'subdir', 'file.txt');
        const relPath = file.relativeTo(otherFile);
        assertEquals(relPath, 'subdir/file.txt');
      });

      await t.step('depth() returns 1 when file is directly in ancestor folder', () => {
        const root = new FolderSpec(testDir);
        const file = new FileSpec(testDir, 'file.txt');
        assertEquals(file.depth(root), 1);
      });

      await t.step('depth() returns correct depth for nested file', () => {
        const root = new FolderSpec(testDir);
        const file = new FileSpec(testDir, 'level1', 'level2', 'file.txt');
        assertEquals(file.depth(root), 3);
      });

      await t.step('depth() returns -1 when folder is not an ancestor', () => {
        const otherRoot = new FolderSpec('/completely/different/path');
        const file = new FileSpec(testDir, 'file.txt');
        assertEquals(file.depth(otherRoot), -1);
      });

      await t.step('homeRelativePath() returns tilde path for file in home directory', () => {
        const homeDir = new FolderSpec(os.homedir());
        const file = new FileSpec(homeDir, 'config', 'settings.json');
        const homeRelPath = file.homeRelativePath;
        assert(/^~\//.test(homeRelPath));
        assertStringIncludes(homeRelPath, 'config/settings.json');
      });

      await t.step('homeRelativePath() returns absolute path for file outside home directory', () => {
        const file = new FileSpec('/var', 'log', 'test.log');
        const homeRelPath = file.homeRelativePath;
        assertEquals(homeRelPath, '/var/log/test.log');
        assert(!/^~/.test(homeRelPath));
      });

      await t.step('toFileUrl() returns valid file URL', () => {
        const file = new FileSpec(testDir, 'test.txt');
        const fileUrl = file.toFileUrl();
        assert(/^file:\/\/\//.test(fileUrl));
        assertStringIncludes(fileUrl, 'test.txt');
      });
    });

    await t.step('File Operations', async (t) => {
      await t.step('getExists() returns true for existing file', async () => {
        assert(await testFile.exists());
      });

      await t.step('isFile() returns true for file', async () => {
        assert(await testFile.isFile());
      });

      await t.step('readJson() reads and parses JSON correctly', async () => {
        await testJson.writeJson({ key: 'value' });
        const content = await testJson.readJson();
        assertEquals(content, { key: 'value' });
      });

      await t.step('writeJson() writes JSON to file correctly', async () => {
        const file = new FileSpec(testDir, 'new.json');
        await file.writeJson({ newKey: 'newValue' });
        const content = await file.readAsString();
        assertEquals(JSON.parse(content), { newKey: 'newValue' });
      });

      await t.step('write() returns self', async () => {
        const file = new FileSpec(testDir, 'write-self.txt');
        const result = await file.write('test');
        assertEquals(result, file);
      });

      await t.step('writeJson() returns self', async () => {
        const file = new FileSpec(testDir, 'write-json-self.json');
        const result = await file.writeJson({ test: 'test' });
        assertEquals(result, file);
      });

      await t.step('writeJson() with trailing option appends content after final }', async () => {
        const file = new FileSpec(testDir, 'trailing.json');
        await file.writeJson({ key: 'value' }, { trailing: '\n' });
        const content = await file.readAsString();
        assertEquals(content, '{"key":"value"}\n');
      });

      await t.step('writeJson() with trailing option works with deepCopy', async () => {
        const file = new FileSpec(testDir, 'trailing-deep.json');
        await file.writeJson({ key: 'value' }, { trailing: '\n' });
        const content = await file.readAsString();
        assertEquals(content, '{"key":"value"}\n');
      });

      await t.step('moveTo() moves the file and returns the new FileSpec', async () => {
        const srcFile = new FileSpec(testDir, 'move-src.txt');
        await srcFile.write('move test');
        const destFile = new FileSpec(testDir, 'move-dest.txt');

        const newFile = await srcFile.moveTo(destFile);

        assertInstanceOf(newFile, FileSpec);
        assertEquals(newFile.path, destFile.path);

        const destExists = await destFile.exists();
        assert(destExists);

        const srcExists = await srcFile.exists();
        assertEquals(srcExists, false);
      });

      await t.step('moveTo() moves the file', async () => {
        const srcFile = new FileSpec(testDir, 'move-src2.txt');
        await srcFile.write('move test');
        const destFile = new FileSpec(testDir, 'move-dest2.txt');

        await srcFile.moveTo(destFile);

        const destExists = await destFile.exists(true);
        assert(destExists);

        const srcExists = await srcFile.exists(true);
        assertEquals(srcExists, false);
      });
    });

    await t.step('File Hashing', async (t) => {
      await t.step('digest() returns SHA1 hash', async () => {
        const hash = await testFile.digest();
        assertEquals(typeof hash, 'string');
        assertEquals(hash.length, 40);
      });

      await t.step('digest() returns SHA256 hash', async () => {
        const hash = await testFile.digest(DigestAlgorithm.sha256);
        assertEquals(typeof hash, 'string');
        assertEquals(hash.length, 64);
      });
    });

    await t.step('PDF Operations', async (t) => {
      await t.step('getPdfDate() returns creation date from PDF metadata', async () => {
        const date = await pdfFile.getPdfDate();
        assert(date instanceof DateTime as any);
        if (date) {
          assert(/^2018-02-01T00:00:00(Z|\+00:00)$/.test(date.toISOString()));
        }
      });
    });

    await t.step('Constructor Variants', async (t) => {
      await t.step('creates FileSpec from URL and relative path', () => {
        const file = new FileSpec(import.meta.url, './test.txt');
        assertInstanceOf(file, FileSpec);
        assertEquals(file.filename, 'test.txt');
      });

      await t.step('creates FileSpec from URL and absolute path', () => {
        const absPath = path.resolve('somefile.json');
        assertThrows(
          () => {
            new FileSpec(import.meta.url, absPath);
          },
          Error,
          'Only the first argument can be absolute',
        );
      });
    });

    await t.step('Permission Operations', async (t) => {
      await t.step('chown() changes file ownership', async () => {
        const stats = await testFile.stats();
        const originalUid = stats?.uid;
        const originalGid = stats?.gid;

        if (originalUid !== null && originalGid !== null) {
          await testFile.chown(originalUid as FS.UID, originalGid as FS.GID);
        }
      });

      await t.step('chgrp() changes file group', async () => {
        const stats = await testFile.stats();
        const originalGid = stats?.gid;

        if (!_.isNullOrUndefined(originalGid)) {
          await testFile.chgrp(originalGid as FS.GID);
        }
      });

      await t.step('chmod() changes file permissions', async () => {
        const stats = await testFile.stats();
        const originalMode = stats?.mode;

        if (originalMode !== null) {
          await testFile.chmod(originalMode as FS.Mode);
        }
      });
    });
  } finally {
    await testDir.remove({ recursive: true });
  }
});

Deno.test('FileSpec read/write helpers', async (t) => {
  const tmpDir = await nfs.mkdtemp(path.join(os.tmpdir(), 'fsspec-read-'));
  try {
    await t.step('writeJson() then readAsString() returns the exact JSON text', async () => {
      const filePath = path.join(tmpDir, 'data.json');
      const f = new FileSpec(filePath);
      const obj = { version: '1.0.0' };
      await f.writeJson(obj);
      const txt = await f.readAsString();
      assertEquals(txt, JSON.stringify(obj));
    });

    await t.step('readAsBytes() returns the written bytes', async () => {
      const filePath = path.join(tmpDir, 'bytes.json');
      const f = new FileSpec(filePath);
      const obj = { a: 1, b: 'x' };
      await f.writeJson(obj);
      const bytes = await f.readAsBytes();
      const expected = Buffer.from(JSON.stringify(obj), 'utf8');
      assertEquals(Buffer.from(bytes), expected);
    });

    await t.step('readJson() parses JSON written by writeJson()', async () => {
      const filePath = path.join(tmpDir, 'parsed.json');
      const f = new FileSpec(filePath);
      const obj = { name: 'test', n: 2 };
      await f.writeJson(obj, null, 2);
      const parsed = await f.readJson<typeof obj>();
      assertEquals(parsed, obj);
    });

    await t.step('writeJson() with safe and backupStrategy creates backup', async () => {
      const filePath = path.join(tmpDir, 'safe-write.json');
      const f = new FileSpec(filePath);

      await f.writeJson({ version: '1.0.0' });

      await f.writeJson({ version: '2.0.0' }, { safe: true, backupStrategy: { type: 'renameWithTilde' } });

      const content = await f.readJson();
      assertEquals(content, { version: '2.0.0' });

      const backupFile = new FileSpec(filePath + '~');
      assert(await backupFile.exists());
      const backupContent = await backupFile.readJson();
      assertEquals(backupContent, { version: '1.0.0' });
    });

    await t.step('writeJson() with replacer and SafeWriteOptions', async () => {
      const filePath = path.join(tmpDir, 'replacer-safe.json');
      const f = new FileSpec(filePath);

      const data = { secret: 'hidden', public: 'visible' };
      const replacer = (key: string, value: unknown) => key === 'secret' ? undefined : value;

      await f.writeJson(data, { replacer, space: 2, safe: true });

      const content = await f.readJson();
      assertEquals(content, { public: 'visible' });
    });

    await t.step('writeJson() with space and DeepCopyOpts', async () => {
      const filePath = path.join(tmpDir, 'space-deepcopy.json');
      const f = new FileSpec(filePath);

      const data = { path: '{HOME}/test' };
      const deepCopyOpts = { replace: { HOME: '/users/test' }, pre: '{', post: '}' };

      await f.writeJson(data, { space: 2, ...deepCopyOpts });

      const rawContent = await f.readAsString();
      assertStringIncludes(rawContent, '/users/test');
      assertStringIncludes(rawContent, '  ');
    });

    await t.step('writeJson() with DeepCopyOpts and SafeWriteOptions', async () => {
      const filePath = path.join(tmpDir, 'deepcopy-safe.json');
      const f = new FileSpec(filePath);

      await f.writeJson({ env: 'dev' });

      const data = { env: '{ENV}', version: '1.0' };
      const deepCopyOpts = { replace: { ENV: 'prod' }, pre: '{', post: '}' };

      await f.writeJson(data, { ...deepCopyOpts, safe: true, backupStrategy: { type: 'renameWithTilde' } });

      const content = await f.readJson();
      assertEquals(content, { env: 'prod', version: '1.0' });

      const backupFile = new FileSpec(filePath + '~');
      assert(await backupFile.exists());
    });

    await t.step('writeJson() parameter order flexibility', async () => {
      const filePath = path.join(tmpDir, 'param-order.json');
      const f = new FileSpec(filePath);

      const data = { test: 'value' };

      const deepCopyOpts = { detectRegExp: true };
      await f.writeJson(data, { space: 2, ...deepCopyOpts, safe: true });

      const content = await f.readJson();
      assertEquals(content, data);

      const rawContent = await f.readAsString();
      assertStringIncludes(rawContent, '  ');
    });

    await t.step('writeJson() with only SafeWriteOptions (no other params)', async () => {
      const filePath = path.join(tmpDir, 'only-safe.json');
      const f = new FileSpec(filePath);

      const data = { simple: 'test' };
      await f.writeJson(data, { safe: true });

      const content = await f.readJson();
      assertEquals(content, data);
    });

    await t.step('writeJson() with backupStrategy only (no safe) creates backup', async () => {
      const filePath = path.join(tmpDir, 'backup-only.json');
      const f = new FileSpec(filePath);

      await f.writeJson({ version: '1.0.0' });
      await f.writeJson({ version: '2.0.0' }, { backupStrategy: { type: 'renameWithTilde' } });

      const content = await f.readJson();
      assertEquals(content, { version: '2.0.0' });

      const backupFile = new FileSpec(filePath + '~');
      assert(await backupFile.exists());
      const backupContent = await backupFile.readJson();
      assertEquals(backupContent, { version: '1.0.0' });
    });

    await t.step('writeJson() with safe only (no backupStrategy) does not create backup', async () => {
      const filePath = path.join(tmpDir, 'safe-no-backup.json');
      const f = new FileSpec(filePath);

      await f.writeJson({ version: '1.0.0' });
      await f.writeJson({ version: '2.0.0' }, { safe: true });

      const content = await f.readJson();
      assertEquals(content, { version: '2.0.0' });

      const backupFile = new FileSpec(filePath + '~');
      assertEquals(await backupFile.exists(), false);
    });

    await t.step('write() with backupStrategy only creates backup', async () => {
      const filePath = path.join(tmpDir, 'write-backup-only.txt');
      const f = new FileSpec(filePath);

      await f.write('original content');
      await f.write('new content', { backupStrategy: { type: 'renameWithTilde' } });

      const content = await f.readAsString();
      assertEquals(content, 'new content');

      const backupFile = new FileSpec(filePath + '~');
      assert(await backupFile.exists());
      const backupContent = await backupFile.readAsString();
      assertEquals(backupContent, 'original content');
    });

    await t.step('writeJson() with only DeepCopyOpts (no other params)', async () => {
      const filePath = path.join(tmpDir, 'only-deepcopy.json');
      const f = new FileSpec(filePath);

      const data = { path: '{HOME}' };
      const deepCopyOpts = { replace: { HOME: '/test' }, pre: '{', post: '}' };

      await f.writeJson(data, deepCopyOpts);

      const content = await f.readJson();
      assertEquals(content, { path: '/test' });
    });

    await t.step('writeBase64/readAsString(base64) encode and decode correctly', async () => {
      const filePath = path.join(tmpDir, 'b64.txt');
      const f = new FileSpec(filePath);
      await f.writeBase64('Hello');
      const decoded = await f.readAsString('base64');
      assertEquals(decoded, 'Hello');
    });

    await t.step('readAsLines() returns lines split correctly', async () => {
      const filePath = path.join(tmpDir, 'lines.txt');
      const f = new FileSpec(filePath);
      await f.write(['one', 'two', 'three']);
      const lines = await f.readAsLines();
      assertEquals(lines, ['one', 'two', 'three']);
    });

    await t.step('writeYaml() then readYaml() work correctly with generics', async () => {
      const filePath = path.join(tmpDir, 'data.yaml');
      const f = new FileSpec(filePath);
      interface MyData {
        name: string;
        tags: string[];
        active: boolean;
        nested: {
          value: number;
        };
      }
      const obj: MyData = {
        name: 'Test Project',
        tags: ['typescript', 'deno'],
        active: true,
        nested: { value: 42 },
      };

      const result = await f.writeYaml(obj);
      assertEquals(result, f);

      const parsed = await f.readYaml<MyData>();
      assertEquals(parsed, obj);
      assertEquals(parsed.name, 'Test Project');
      assertEquals(parsed.nested.value, 42);
    });

    await t.step('readYaml() throws error for invalid yaml', async () => {
      const filePath = path.join(tmpDir, 'invalid.yaml');
      const f = new FileSpec(filePath);
      await f.write('invalid: [ : : ]');
      await assertRejects(
        () => f.readYaml(),
      );
    });

    await t.step('writeToml() then readToml() work correctly with generics', async () => {
      const filePath = path.join(tmpDir, 'data.toml');
      const f = new FileSpec(filePath);
      const obj = {
        name: 'Test Project',
        tags: ['typescript', 'deno'],
        active: true,
        nested: { value: 42 },
      };

      const result = await f.writeToml(obj);
      assertEquals(result, f);

      interface MyData {
        name: string;
        tags: string[];
        active: boolean;
        nested: {
          value: number;
        };
      }
      const parsed = await f.readToml<MyData>();
      assertEquals(parsed, obj);
      assertEquals(parsed.name, 'Test Project');
      assertEquals(parsed.nested.value, 42);
    });

    await t.step('writeToml() with keyAlignment option aligns keys', async () => {
      const filePath = path.join(tmpDir, 'aligned.toml');
      const f = new FileSpec(filePath);
      const data = {
        short: 1,
        longer: 2,
        veryLongKey: 3,
      };

      await f.writeToml(data, { toml: { keyAlignment: true } });
      const content = await f.readAsString();
      assertStringIncludes(content, 'short       = 1');
      assertStringIncludes(content, 'longer      = 2');
      assertStringIncludes(content, 'veryLongKey = 3');
    });

    await t.step('writeToml() with safe and backupStrategy creates backup', async () => {
      const filePath = path.join(tmpDir, 'config.toml');
      const f = new FileSpec(filePath);

      await f.writeToml({ version: '1.0.0' });
      await f.writeToml({ version: '2.0.0' }, { write: { safe: true, backupStrategy: { type: 'renameWithTilde' } } });

      const content = await f.readToml<{ version: string }>();
      assertEquals(content.version, '2.0.0');

      const backupFile = new FileSpec(filePath + '~');
      const backupContent = await backupFile.readToml<{ version: string }>();
      assertEquals(backupContent.version, '1.0.0');
    });

    await t.step('readToml() throws error for invalid toml', async () => {
      const filePath = path.join(tmpDir, 'invalid.toml');
      const f = new FileSpec(filePath);
      await f.write('name = "test\ninvalid = [');
      await assertRejects(
        () => f.readToml(),
      );
    });
  } finally {
    await nfs.rm(tmpDir, { recursive: true, force: true });
  }
});

Deno.test('FileSystem Simulation for deno.json write', async (t) => {
  await t.step('should read, modify, and write deno.json with 2-space indentation', async () => {
    const fsTempDir = await FolderSpec.makeTemp();
    const originalCwd = FolderSpec.cwd();
    fsTempDir.chdir();

    try {
      const denoJsonFile = new FileSpec('deno.json');
      await denoJsonFile.writeJson({ version: '1.0.0' });

      const config = await denoJsonFile.readJson<{ version: string }>();
      config.version = '1.0.1';
      await denoJsonFile.writeJson(config, null, 2);

      const content = await denoJsonFile.readAsString();
      const expectedContent = JSON.stringify({ version: '1.0.1' }, null, 2);
      assertEquals(content, expectedContent);
    } finally {
      originalCwd.chdir();
      await fsTempDir.remove({ recursive: true });
    }
  });
});

Deno.test('FileSpec Backup Rotation', async (t) => {
  const testDir = await FolderSpec.makeTemp({ prefix: 'backup_rotation_test_' });
  const originalCwd = FolderSpec.cwd();
  testDir.chdir();

  try {
    await t.step('Tilde Suffix with keep option', async (t) => {
      await t.step('renameWithNumber results in ~ suffix when keep is used', async () => {
        const file = new FileSpec('num_test.txt');
        await file.write('content1');
        await file.backup({ type: 'renameWithNumber', keep: { generations: 5 } });

        const backupFiles = await testDir.getFiles(/num_test-01\.txt~/);
        assertEquals(backupFiles.length, 1);
      });

      await t.step('renameWithDatetime results in ~ suffix when keep is used', async () => {
        const file = new FileSpec('date_test.txt');
        await file.write('content1');
        await file.backup({ type: 'renameWithDatetime', keep: { generations: 5 } });

        const backupFiles = await testDir.getFiles(/date_test-.*\.txt~/);
        assertEquals(backupFiles.length, 1);
      });
    });

    await t.step('Rotation Logic', async (t) => {
      await t.step('rotates by generations', async () => {
        const file = new FileSpec('gen_test.txt');
        await file.write('v1');
        await file.backup({ type: 'renameWithNumber', keep: { generations: 2 } });
        await file.write('v2');
        await file.backup({ type: 'renameWithNumber', keep: { generations: 2 } });
        await file.write('v3');
        await file.backup({ type: 'renameWithNumber', keep: { generations: 2 } });

        const backupFiles = await testDir.getFiles(/gen_test-.*\.txt~/);
        assertEquals(backupFiles.length, 2);
      });

      await t.step('rotates by age (ms)', async () => {
        const file = new FileSpec('age_test.txt');
        await file.write('v1');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 100 } });

        await _.delayPromise(200);

        await file.write('v2');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 100 } });

        const backupFiles = await testDir.getFiles(/age_test-.*\.txt~/);
        assertEquals(backupFiles.length, 1);
      });

      await t.step('rotates by both ms AND generations', async () => {
        const file = new FileSpec('both_test.txt');

        await file.write('v1');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 500, generations: 2 } });
        await file.write('v2');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 500, generations: 2 } });
        await file.write('v3');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 500, generations: 2 } });

        let backupFiles = await testDir.getFiles(/both_test-.*\.txt~/);
        assertEquals(backupFiles.length, 3);

        await _.delayPromise(600);

        await file.write('v4');
        await file.backup({ type: 'renameWithEpochMs', keep: { ms: 500, generations: 2 } });

        backupFiles = await testDir.getFiles(/both_test-.*\.txt~/);
        assertEquals(backupFiles.length, 2);
      });
    });
  } finally {
    originalCwd.chdir();
    await testDir.remove({ recursive: true });
  }
});
