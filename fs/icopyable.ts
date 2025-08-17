import { StringEx } from '@epdoc/string';
import { isString } from '@epdoc/type';
import path from 'node:path';
import { FileSpec } from './filespec.ts';
import { FolderSpec } from './folderspec.ts';
import { FSSpec } from './fsspec.ts';
import type { SafeCopyOpts } from './safecopy.ts';
import type { SymlinkSpec } from './symspec.ts';
import type { FilePath } from './types.ts';

const ERR_STR = StringEx(
  'Invalid FSSpec resolve path argument, a ${type} must be the first argument to the constructor',
);
const ERR_FILE_STR = StringEx(
  'Invalid FSSpec resolve path argument, a ${type} must be the only argument to the constructor',
);

export interface ICopyableSpec {
  copy(): FSSpec | FolderSpec | FileSpec | SymlinkSpec;
}

export interface IRootableSpec {
  add(...args: string[]): FolderSpec | FileSpec | FSSpec;
  home(...args: string[]): FolderSpec | FileSpec | FSSpec;
}

export interface ISafeCopyableSpec {
  copy(): FSSpec | FolderSpec | FileSpec | SymlinkSpec;
  safeCopy(destFile: FilePath | FSSpec | FileSpec | FolderSpec, opts: SafeCopyOpts): Promise<void>;
}

export type FSSpecParam =
  | string[] // An array of strings
  | [FileSpec] // A single FileSpec object
  | [FolderSpec, ...string[]] // A FolderSpec followed by an optional array of strings
  | [FSSpec, ...string[]]; // An FSSpec followed by an optional array of strings

export function resolvePathArgs(...args: FSSpecParam): string {
  const parts: string[] = [Deno.cwd()];
  for (let adx = 0; adx < args.length; ++adx) {
    const item = args[adx];
    if (item instanceof FolderSpec || item instanceof FSSpec) {
      if (adx !== 0) {
        throw new Error(ERR_STR.replace({ type: 'FolderSpec or FSSpec' }));
      }
      parts.push(item.path);
    } else if (item instanceof FileSpec) {
      if (args.length !== 1) {
        throw new Error(ERR_FILE_STR.replace({ type: 'FileSpec' }));
      }
      parts.push(item.path);
    } else if (isString(item)) {
      parts.push(item);
    }
  }
  return path.resolve(...parts);
}
