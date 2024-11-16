import { expect } from 'jsr:@std/expect';
import { afterAll, beforeAll, describe, test } from 'jsr:@std/testing/bdd';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSpec, fileSpec } from '../mod.ts';

const pwd: string = import.meta.dirname as string;

describe('FSItem Additional Tests', () => {
  const testDir = path.join(pwd, 'test-fsitem');
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

  test('fsitem factory function creates FSItem instance', () => {
    const item = fileSpec(testFile);
    expect(item).toBeInstanceOf(FileSpec);
  });

  test('filename getter returns correct filename', () => {
    const item = fileSpec(testFile);
    expect(item.filename).toBe('test.txt');
  });

  test('dirname getter returns correct directory name', () => {
    const item = fileSpec(testFile);
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
    expect(txtItem.isType('txt')).toBe(true);
    expect(txtItem.isType('json')).toBe(false);
    expect(txtItem.isType('txt', 'json')).toBe(true);
  });

  test('add method correctly joins paths', () => {
    const item = fileSpec(testDir);
    const newItem = item.add('subdir', 'file.txt');
    expect(newItem.path).toBe(path.join(testDir, 'subdir', 'file.txt'));
  });

  test('readAsString reads file content correctly', async () => {
    const item = fileSpec(testFile);
    const content = await item.readAsString();
    expect(content).toBe('Hello, World!');
  });

  test('readJson reads and parses JSON correctly', async () => {
    const item = fileSpec(testJson);
    const content = await item.readJson();
    expect(content).toEqual({ key: 'value' });
  });

  test('write writes content to file correctly', async () => {
    const newFile = path.join(testDir, 'new.txt');
    const item = fileSpec(newFile);
    await item.write('New content');
    const content = await fs.readFile(newFile, 'utf8');
    expect(content).toBe('New content');
  });

  test('writeJson writes JSON to file correctly', async () => {
    const newFile = path.join(testDir, 'new.json');
    const item = fileSpec(newFile);
    await item.writeJson({ newKey: 'newValue' });
    const content = await fs.readFile(newFile, 'utf8');
    expect(JSON.parse(content)).toEqual({ newKey: 'newValue' });
  });
});
