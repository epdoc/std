import { deepEquals } from '@epdoc/type';
import { expect } from '@std/expect';
import { afterAll, beforeEach, describe, test } from '@std/testing/bdd';
import os from 'node:os';
import { FileSpec } from '../src/mod.ts';

const HOME = os.userInfo().homedir;

describe('JSON Extended Operations', () => {
  let testDir: string;
  let testFilePath: FileSpec;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir({ prefix: 'jsonex_test_' });
    testFilePath = new FileSpec(testDir, 'test-jsonex.json');
  });

  afterAll(async () => {
    if (testDir) {
      await Deno.remove(testDir, { recursive: true });
    }
  });

  describe('Basic JSON Operations', () => {
    test('writes and reads basic JSON data', async () => {
      const data = {
        name: 'Test Object',
        value: 123,
        isActive: true,
      };
      await testFilePath.writeJsonEx(data);
      const readData = await testFilePath.readJsonEx();
      expect(readData).toEqual(data);
    });
  });

  describe('Special Type Serialization', () => {
    test('roundtrips RegExp objects', async () => {
      const data = {
        pattern: new RegExp('^test.*$', 'i'),
        another: 'value',
      };
      await testFilePath.writeJsonEx(data);
      const readData = await testFilePath.readJsonEx() as any;

      expect(readData.another).toEqual(data.another);
      expect(readData.pattern).toBeInstanceOf(RegExp);
      expect(readData.pattern.source).toEqual(data.pattern.source);
      expect(readData.pattern.flags).toEqual(data.pattern.flags);
    });

    test('roundtrips Set objects', async () => {
      const data = {
        mySet: new Set([1, 2, 3, 'hello']),
        other: 'data',
      };
      await testFilePath.writeJsonEx(data);
      const readData = await testFilePath.readJsonEx() as any;

      expect(readData.other).toEqual(data.other);
      expect(readData.mySet).toBeInstanceOf(Set);
      expect(deepEquals(readData.mySet, data.mySet)).toBe(true);
    });

    test('roundtrips Map objects', async () => {
      const data = {
        myMap: new Map([['key1', 'value1'], ['key2', '123']]),
        info: 'more',
      };
      await testFilePath.writeJsonEx(data);
      const readData = await testFilePath.readJsonEx() as any;

      expect(readData.info).toEqual(data.info);
      expect(readData.myMap).toBeInstanceOf(Map);
      expect(Array.from(readData.myMap.entries())).toEqual(Array.from(data.myMap.entries()));
    });

    test('roundtrips Uint8Array objects', async () => {
      const data = {
        byteArray: new Uint8Array([10, 20, 30, 40, 50]),
        id: 1,
      };
      await testFilePath.writeJsonEx(data);
      const readData = await testFilePath.readJsonEx() as any;

      expect(readData.id).toEqual(data.id);
      expect(readData.byteArray).toBeInstanceOf(Uint8Array);
      expect(deepEquals(readData.byteArray, data.byteArray)).toBe(true);
    });
  });

  describe('String Replacement', () => {
    test('performs string replacements during write and read', async () => {
      const data = {
        path: '{HOME}/documents/config.json',
        message: 'Hello from {USER}!',
      };
      const replaceMap = {
        HOME: HOME,
        USER: 'testuser',
      };
      await testFilePath.writeJsonEx(data, { replace: replaceMap });

      // Read without replacement to check raw content
      const rawReadData = await testFilePath.readJsonEx({}) as any;
      expect(rawReadData.path).toEqual(`${HOME}/documents/config.json`);
      expect(rawReadData.message).toEqual(`Hello from testuser!`);

      // Read with replacement
      const readDataWithReplace = await testFilePath.readJsonEx({ replace: replaceMap }) as any;
      expect(readDataWithReplace.path).toEqual(`${HOME}/documents/config.json`);
      expect(readDataWithReplace.message).toEqual(`Hello from testuser!`);
    });
  });

  describe('Complex Nested Objects', () => {
    test('handles nested objects with special types and replacements', async () => {
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

      const replaceMap = { HOME: HOME };
      await testFilePath.writeJsonEx(nestedData, { replace: replaceMap });
      const readData = await testFilePath.readJsonEx({ replace: replaceMap }) as any;

      expect(readData.version).toEqual(nestedData.version);

      const readConfig = readData.config;
      const originalConfig = nestedData.config;

      expect(readConfig.regex).toBeInstanceOf(RegExp);
      expect(readConfig.regex.source).toEqual(originalConfig.regex.source);
      expect(readConfig.regex.flags).toEqual(originalConfig.regex.flags);

      expect(readConfig.settings).toBeInstanceOf(Map);
      expect(Array.from(readConfig.settings.entries())).toEqual(Array.from(originalConfig.settings.entries()));

      expect(readConfig.users).toBeInstanceOf(Set);
      expect(deepEquals(readConfig.users, originalConfig.users)).toBe(true);

      expect(readConfig.token).toBeInstanceOf(Uint8Array);
      expect(deepEquals(readConfig.token, originalConfig.token)).toBe(true);

      expect(readConfig.logPath).toEqual(`${HOME}/logs/app.log`);
    });
  });
});
