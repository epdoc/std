// deno-lint-ignore-file no-explicit-any
import { FileSpec } from '$mod';
import { deepEquals, type Dict } from '@epdoc/type';
import { assert, assertEquals, assertInstanceOf } from '@std/assert';

async function withJsonFile(
  fn: (testFilePath: FileSpec, testDir: string) => Promise<void>,
): Promise<void> {
  const testDir = await Deno.makeTempDir({ prefix: 'jsonex_test_' });
  const testFilePath = new FileSpec(testDir, 'test-jsonex.json');
  try {
    await fn(testFilePath, testDir);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
}

Deno.test('JSON Extended Operations', async (t) => {
  await t.step('writes and reads basic JSON data', () =>
    withJsonFile(async (f) => {
      const data = {
        name: 'Test Object',
        value: 123,
        isActive: true,
      };
      await f.writeJson(data, { encode: true });
      const readData = await f.readJson({ decode: true });
      assertEquals(readData, data);
    }));

  await t.step('filter roundtrips RegExp objects', () =>
    withJsonFile(async (f) => {
      const data = {
        pattern: new RegExp('^test.*$', 'i'),
        another: 'value',
      };
      await f.writeJson(data, { encode: true });
      const readData = await f.readJson({ decode: true }) as any;

      assertEquals(readData.another, data.another);
      assertInstanceOf(readData.pattern, RegExp);
      assertEquals(readData.pattern.source, data.pattern.source);
      assertEquals(readData.pattern.flags, data.pattern.flags);
    }));

  await t.step('autoRegExp roundtrips RegExp objects', () =>
    withJsonFile(async (f) => {
      const data = {
        pattern: new RegExp('^test.*$', 'i'),
        another: 'value',
      };
      await f.writeJson(data, { autoRegExp: true });
      const readData = await f.readJson({ autoRegExp: true }) as any;

      assertEquals(readData.another, data.another);
      assertInstanceOf(readData.pattern, RegExp);
      assertEquals(readData.pattern.source, data.pattern.source);
      assertEquals(readData.pattern.flags, data.pattern.flags);
    }));

  await t.step('roundtrips Set objects', () =>
    withJsonFile(async (f) => {
      const data = {
        mySet: new Set([1, 2, 3, 'hello']),
        other: 'data',
      };
      await f.writeJson(data, { encode: true });
      const readData = await f.readJson({ decode: true }) as any;

      assertEquals(readData.other, data.other);
      assertInstanceOf(readData.mySet, Set);
      assert(deepEquals(readData.mySet, data.mySet));
    }));

  await t.step('roundtrips Map objects', () =>
    withJsonFile(async (f) => {
      const data = {
        myMap: new Map([['key1', 'value1'], ['key2', '123']]),
        info: 'more',
      };
      await f.writeJson(data, { encode: true });
      const readData = await f.readJson({ decode: true }) as any;

      assertEquals(readData.info, data.info);
      assertInstanceOf(readData.myMap, Map);
      assertEquals(Array.from(readData.myMap.entries()), Array.from(data.myMap.entries()));
    }));

  await t.step('roundtrips Uint8Array objects', () =>
    withJsonFile(async (f) => {
      const data = {
        byteArray: new Uint8Array([10, 20, 30, 40, 50]),
        id: 1,
      };
      await f.writeJson(data, { encode: true });
      const readData = await f.readJson({ decode: true }) as any;

      assertEquals(readData.id, data.id);
      assertInstanceOf(readData.byteArray, Uint8Array);
      assert(deepEquals(readData.byteArray, data.byteArray));
    }));

  await t.step('performs string replacements during write and read', () =>
    withJsonFile(async (f, testDir) => {
      const data = {
        path: '{HOME}/documents/config.json',
        message: 'Hello from {USER}!',
      };
      const replaceMap = {
        HOME: testDir,
        USER: 'testuser',
      };
      await f.writeJson(data, { replace: replaceMap, pre: '{', post: '}' });

      const rawReadData = await f.readJson() as any;
      assertEquals(rawReadData.path, `${testDir}/documents/config.json`);
      assertEquals(rawReadData.message, `Hello from testuser!`);

      await f.writeJson(data);

      const readDataWithReplace = await f.readJson<Dict>({ replace: replaceMap, pre: '{', post: '}' });
      assertEquals(readDataWithReplace.path, `${testDir}/documents/config.json`);
      assertEquals(readDataWithReplace.message, `Hello from testuser!`);
    }));

  await t.step('handles nested objects with special types and replacements', () =>
    withJsonFile(async (f, testDir) => {
      const nestedData = {
        config: {
          regex: new RegExp('\\d+', 'g'),
          settings: new Map([['key', 'value']]),
          users: new Set(['admin', 'guest']),
          token: new Uint8Array([1, 2, 3]),
          logPath: '{HOME}/logs/app.log',
        },
        version: '1.0.0',
      };

      const replaceMap = { HOME: testDir };
      await f.writeJson(nestedData, { encode: true, replace: replaceMap, pre: '{', post: '}' });
      const readData = await f.readJson({ decode: true, replace: replaceMap, pre: '{', post: '}' }) as any;

      assertEquals(readData.version, nestedData.version);

      const readConfig = readData.config;
      const originalConfig = nestedData.config;

      assertInstanceOf(readConfig.regex, RegExp);
      assertEquals(readConfig.regex.source, originalConfig.regex.source);
      assertEquals(readConfig.regex.flags, originalConfig.regex.flags);

      assertInstanceOf(readConfig.settings, Map);
      assertEquals(Array.from(readConfig.settings.entries()), Array.from(originalConfig.settings.entries()));

      assertInstanceOf(readConfig.users, Set);
      assert(deepEquals(readConfig.users, originalConfig.users));

      assertInstanceOf(readConfig.token, Uint8Array);
      assert(deepEquals(readConfig.token, originalConfig.token));

      assertEquals(readConfig.logPath, `${testDir}/logs/app.log`);
    }));
});
