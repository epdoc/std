import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { SymlinkSpec } from './symspec.ts';

export type JsonReplacer = ((this: unknown, key: string, value: unknown) => unknown) | Array<number | string> | null;

export type TypedFSSpec = FileSpec | FolderSpec | SymlinkSpec;
