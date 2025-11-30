import type { SafeCopyOpts } from '$util';
import type * as FS from '../types.ts';
import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { FSSpec } from './fsspec.ts';
import type { SymlinkSpec } from './symspec.ts';

export interface ICopyableSpec {
  copy(): SymlinkSpec | FileSpec | FolderSpec | FSSpec;
}

export interface IRootableSpec {
  add(...args: string[]): FolderSpec | FileSpec | FSSpec;
}

export interface ISafeCopyableSpec {
  copy(): SymlinkSpec | FileSpec | FolderSpec | FSSpec;
  safeCopy(destFile: FS.Path | FSSpec | FileSpec | FolderSpec, opts: SafeCopyOpts): Promise<void>;
}
