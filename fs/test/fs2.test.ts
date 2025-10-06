import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileSpec, FolderSpec, folderSpec, FSSpec, fsSpec } from '../mod.ts';

const READONLY = FolderSpec.fromMeta(import.meta.url, './readonly');

describe('FSSpec, FileSpec, FolderSpec', () => {
  const testDir = path.join(READONLY.path, 'test-fsitem');
  const testFile = path.join(testDir, 'test.txt');
  const testJson = path.join(testDir, 'test.json');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, 'Hello, World!');
    await fs.writeFile(testJson, JSON.stringify({ key: 'value' }));
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('getExists() returns true for a test directory', async () => {
    expect(await fsSpec(testDir).getExists()).toBe(true);
  });

  test('fsSpec() factory function creates FSSpec instance', () => {
    const item = fsSpec(testFile);
    expect(item).toBeInstanceOf(FSSpec);
  });

  test('filename getter returns correct filename', () => {
    const item = fileSpec(testFile);
    expect(item.filename).toBe('test.txt');
  });

  test('dirname getter for FileSpec returns correct directory name', () => {
    const item = fileSpec(testFile);
    expect(item.dirname).toBe(testDir);
  });

  test('dirname getter for FolderSpec returns correct directory name', () => {
    const item = folderSpec(testFile);
    expect(item.dirname).toBe(testDir);
  });

  test('extname getter returns correct extension', () => {
    const item = fileSpec(testFile);
    expect(item.extname).toBe('.txt');
  });

  test('basename getter returns correct basename', () => {
    const item = fileSpec(testFile);
    expect(item.basename).toBe('test');
  });

  test('setExt changes file extension', () => {
    const item = fileSpec(testFile);
    item.setExt('.md');
    expect(item.extname).toBe('.md');
    expect(item.path).toBe(path.join(testDir, 'test.md'));
  });

  test('setBasename changes file basename', () => {
    const item = fileSpec(testFile);
    item.setBasename('newtest');
    expect(item.basename).toBe('newtest');
    expect(item.path).toBe(path.join(testDir, 'newtest.txt'));
  });

  test('isNamed correctly identifies file name', () => {
    const item = fileSpec(testFile);
    expect(item.isNamed('test')).toBe(true);
    expect(item.isNamed('wrong')).toBe(false);
  });

  test('isTxt correctly identifies txt files', () => {
    const txtItem = fileSpec(testFile);
    const jsonItem = fileSpec(testJson);
    expect(txtItem.isTxt()).toBe(true);
    expect(jsonItem.isTxt()).toBe(false);
  });

  test('isJson correctly identifies json files', () => {
    const txtItem = fileSpec(testFile);
    const jsonItem = fileSpec(testJson);
    expect(txtItem.isJson()).toBe(false);
    expect(jsonItem.isJson()).toBe(true);
  });

  test('isType correctly identifies file types', () => {
    const txtItem = fileSpec(testFile);
    expect(txtItem.isExtType('txt')).toBe(true);
    expect(txtItem.isExtType('json')).toBe(false);
    expect(txtItem.isExtType('txt', 'json')).toBe(true);
  });

  test('add() correctly joins paths', () => {
    const item = fileSpec(testDir).add('subdir', 'file.txt');
    expect(item.path).toBe(path.join(testDir, 'subdir', 'file.txt'));
    return item.getIsFile().then((resp) => {
      expect(resp).toBe(false);
    });
  });

  test('readAsString() reads file content correctly', async () => {
    const item = fileSpec(testFile);
    const content = await item.readAsString();
    expect(content).toBe('Hello, World!');
  });

  test('readJson() reads and parses JSON correctly', async () => {
    const item = fileSpec(testJson);
    const content = await item.readJson();
    expect(content).toEqual({ key: 'value' });
  });

  test('write() writes content to file correctly', async () => {
    const newFile = path.join(testDir, 'new.txt');
    const item = fileSpec(newFile);
    await item.write('New content');
    const content = await fs.readFile(newFile, 'utf8');
    expect(content).toBe('New content');
  });

  test('writeJson() writes JSON to file correctly', async () => {
    const newFile = path.join(testDir, 'new.json');
    const item = fileSpec(newFile);
    await item.writeJson({ newKey: 'newValue' });
    const content = await fs.readFile(newFile, 'utf8');
    expect(JSON.parse(content)).toEqual({ newKey: 'newValue' });
  });
});
