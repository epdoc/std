import { FSSpecBase } from '$spec';
import { assertEquals, assertThrows } from '@std/assert';
import path from 'node:path';
import * as FS from '../src/fs.ts';
// import { Base as FSSpecBase } from '../src/spec/spec.ts';
// import type { GID, Mode, UID } from '../src/types.ts';
// import { FS.resolvePathArgs } from '../src/util/resolve-path.ts';

// Mock FSSpecBase for testing
class MockFSSpec extends FSSpecBase {
  constructor(public mockPath: string) {
    super();
    // We use Object.defineProperty to set the private _f property for testing
    Object.defineProperty(this, '_f', {
      value: mockPath,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  override chown(_uid: FS.UID, _gid?: FS.GID): Promise<void> {
    throw new Error('Method not implemented.');
  }

  override chgrp(_gid: FS.GID): Promise<void> {
    throw new Error('Method not implemented.');
  }

  override chmod(_mode: FS.Mode): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

Deno.test('resolvePathArgs - basic string path resolution', () => {
  const result = FS.resolvePathArgs('folder', 'subfolder', 'file.txt');
  const expected = path.resolve(Deno.cwd(), 'folder', 'subfolder', 'file.txt');
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - absolute path as first argument', () => {
  const absPath = path.resolve('/absolute/path/to/file.txt');
  const result = FS.resolvePathArgs(absPath);
  assertEquals(result, absPath);
});

Deno.test('resolvePathArgs - absolute path as non-first argument throws error', () => {
  const absPath = path.resolve('/absolute/path');
  assertThrows(
    () => FS.resolvePathArgs('relative', absPath),
    Error,
    `Absolute path "${absPath}" found at index 1. Only the first argument can be absolute.`,
  );
});

Deno.test('resolvePathArgs - home relative path as first argument', () => {
  const homeRelPath = '~/documents/file.txt';
  const result = FS.resolvePathArgs(homeRelPath);
  assertEquals(result, path.resolve(homeRelPath));
});

Deno.test('resolvePathArgs - home relative path as non-first argument throws error', () => {
  assertThrows(
    () => FS.resolvePathArgs('relative', '~/documents'),
    Error,
    `Home relative path "~/documents" found at index 1. Only the first argument can be home relative.`,
  );
});

Deno.test('resolvePathArgs - FSSpecBase as first argument', () => {
  const mockPath = path.resolve('/some/path/file.txt');
  const mockSpec = new MockFSSpec(mockPath);
  const result = FS.resolvePathArgs(mockSpec, 'subfolder', 'file.txt');
  assertEquals(result, path.resolve(mockPath, 'subfolder', 'file.txt'));
});

Deno.test('resolvePathArgs - FSSpecBase as non-first argument throws error', () => {
  const mockPath = path.resolve('/some/path');
  const mockSpec = new MockFSSpec(mockPath);
  assertThrows(
    () => FS.resolvePathArgs('first', mockSpec),
    Error,
    `A path may only use a ${mockSpec.constructor.name} as its first parameter`,
  );
});

Deno.test('resolvePathArgs - single string argument', () => {
  const result = FS.resolvePathArgs('single-file.txt');
  const expected = path.resolve(Deno.cwd(), 'single-file.txt');
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - single absolute path', () => {
  const absPath = path.resolve('/absolute/path');
  const result = FS.resolvePathArgs(absPath);
  assertEquals(result, absPath);
});

Deno.test('resolvePathArgs - multiple relative segments', () => {
  const result = FS.resolvePathArgs('folder', 'subfolder', 'deep', 'file.txt');
  const expected = path.resolve(Deno.cwd(), 'folder', 'subfolder', 'deep', 'file.txt');
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - mixed relative and parent directory references', () => {
  const result = FS.resolvePathArgs('folder', '..', 'other', 'file.txt');
  const expected = path.resolve(Deno.cwd(), 'folder', '..', 'other', 'file.txt');
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - empty arguments', () => {
  const result = FS.resolvePathArgs();
  const expected = Deno.cwd();
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - invalid argument type throws error', () => {
  assertThrows(
    () => FS.resolvePathArgs(123 as unknown as string),
    Error,
    'Invalid argument type: number',
  );

  assertThrows(
    () => FS.resolvePathArgs({} as unknown as string),
    Error,
    'Invalid argument type: object',
  );

  assertThrows(
    () => FS.resolvePathArgs(null as unknown as string),
    Error,
    'Invalid argument type: object',
  );

  assertThrows(
    () => FS.resolvePathArgs(undefined as unknown as FS.FolderPath),
    Error,
    'Invalid argument type: undefined',
  );
});

Deno.test('resolvePathArgs - handles path normalization', () => {
  const result = FS.resolvePathArgs('folder', 'subfolder', '..', 'file.txt');
  const expected = path.resolve(Deno.cwd(), 'folder', 'subfolder', '..', 'file.txt');
  assertEquals(result, expected);
});

Deno.test('resolvePathArgs - with FSSpecBase only', () => {
  const mockPath = path.resolve('/some/mock/path');
  const mockSpec = new MockFSSpec(mockPath);
  const result = FS.resolvePathArgs(mockSpec);
  assertEquals(result, mockPath);
});
