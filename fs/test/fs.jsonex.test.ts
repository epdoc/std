import { deepEquals } from '@epdoc/type';
import { expect } from '@std/expect';
import { afterAll, beforeEach, describe, test } from '@std/testing/bdd';
import os from 'node:os';
import { FileSpec, FolderSpec } from '../src/mod.ts'; // Import FileSpec and FolderSpec directly

interface TestData {
  name: string;
  value: number;
  isActive: boolean;
}

interface RegExpTestData {
  pattern: RegExp;
  another: string;
}

interface SetTestData {
  mySet: Set<number | string>;
  other: string;
}

interface MapTestData {
  myMap: Map<string, string | number>;
  info: string;
}

interface Uint8ArrayTestData {
  byteArray: Uint8Array;
  id: number;
}

interface ReplacementTestData {
  path: string;
  message: string;
}

interface NestedTestData {
  config: {
    regex: RegExp;
    settings: Map<string, string>;
    users: Set<string>;
    token: Uint8Array;
    logPath: string;
  };
  version: string;
}

const READONLY = new FolderSpec(import.meta.url, './readonly'); // Use new FolderSpec
const HOME = os.userInfo().homedir;

describe('FileSpec JSON Extended Read/Write', () => {
  const testFilePath = new FileSpec(READONLY, 'test-jsonex.json'); // Use new FileSpec

  // Helper function to clean up the test file
  async function cleanup() {
    const file = new FileSpec(testFilePath); // Use new FileSpec
    if (await file.getExists()) {
      await file.remove();
    }
  }

  // Before each test, ensure the test file does not exist
  beforeEach(async () => {
    await cleanup();
  });

  // After all tests, clean up the test file
  afterAll(async () => {
    await cleanup();
  });

  test('should correctly write and read basic JSON data', async () => {
    const data = {
      name: 'Test Object',
      value: 123,
      isActive: true,
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data);
    const readData = await file.readJsonEx<TestData>();
    expect(readData).toEqual(data);
  });

  test('should correctly roundtrip RegExp objects', async () => {
    const data = {
      pattern: new RegExp('^test.*$', 'i'),
      another: 'value',
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data);
    const readData = await file.readJsonEx<RegExpTestData>();

    expect(readData).toBeInstanceOf(Object);
    expect(readData.another).toEqual(data.another);
    expect(readData.pattern).toBeInstanceOf(RegExp);
    expect(readData.pattern.source).toEqual(data.pattern.source);
    expect(readData.pattern.flags).toEqual(data.pattern.flags);
  });

  test('should correctly roundtrip Set objects', async () => {
    const data = {
      mySet: new Set([1, 2, 3, 'hello']),
      other: 'data',
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data);
    const readData = await file.readJsonEx<SetTestData>();

    expect(readData).toBeInstanceOf(Object);
    expect(readData.other).toEqual(data.other);
    expect(readData.mySet).toBeInstanceOf(Set);
    expect(deepEquals(readData.mySet, data.mySet)).toBe(true);
  });

  test('should correctly roundtrip Map objects', async () => {
    const data = {
      myMap: new Map<string, string>([['key1', 'value1'], ['key2', '123']]),
      info: 'more',
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data);
    const readData = await file.readJsonEx<MapTestData>();

    expect(readData).toBeInstanceOf(Object);
    expect(readData.info).toEqual(data.info);
    expect(readData.myMap).toBeInstanceOf(Map);
    expect(Array.from(readData.myMap.entries())).toEqual(Array.from(data.myMap.entries()));
  });

  test('should correctly roundtrip Uint8Array objects', async () => {
    const data = {
      byteArray: new Uint8Array([10, 20, 30, 40, 50]),
      id: 1,
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data);
    const readData = await file.readJsonEx<Uint8ArrayTestData>();

    expect(readData).toBeInstanceOf(Object);
    expect(readData.id).toEqual(data.id);
    expect(readData.byteArray).toBeInstanceOf(Uint8Array);
    expect(deepEquals(readData.byteArray, data.byteArray)).toBe(true);
  });

  test('should perform string replacements during write and read', async () => {
    const data = {
      path: '{HOME}/documents/config.json',
      message: 'Hello from {USER}!',
    };
    const replaceMap = {
      HOME: HOME,
      USER: 'testuser',
    };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(data, { replace: replaceMap });

    // Read without replacement to check raw content
    const rawReadData = await file.readJsonEx<ReplacementTestData>({});
    expect(rawReadData).toBeInstanceOf(Object);
    expect(rawReadData.path).toEqual(`${HOME}/documents/config.json`);
    expect(rawReadData.message).toEqual(`Hello from testuser!`);

    // Read with replacement
    const readDataWithReplace = await file.readJsonEx<ReplacementTestData>({ replace: replaceMap });
    expect(readDataWithReplace).toBeInstanceOf(Object);
    expect(readDataWithReplace.path).toEqual(`${HOME}/documents/config.json`);
    expect(readDataWithReplace.message).toEqual(`Hello from testuser!`);
  });

  test('should handle nested objects with special types and replacements', async () => {
    const nestedData = {
      config: {
        regex: new RegExp('\d+', 'g'),
        settings: new Map([['key', 'value']]),
        users: new Set(['admin', 'guest']),
        token: new Uint8Array([1, 2, 3]),
        logPath: '{HOME}/logs/app.log',
      },
      version: '1.0.0',
    };

    const replaceMap = { HOME: HOME };
    const file = new FileSpec(testFilePath); // Use new FileSpec
    await file.writeJsonEx(nestedData, { replace: replaceMap });
    const readData = await file.readJsonEx<NestedTestData>({ replace: replaceMap });

    expect(readData).toBeInstanceOf(Object);
    expect(readData.version).toEqual(nestedData.version);

    const readConfig = readData.config;
    const originalConfig = nestedData.config;

    expect(readConfig).toBeInstanceOf(Object);
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
