import type * as dfs from '@std/fs';
import path from 'node:path';
import type * as FS from '../types.ts';
import { FileSpec } from './filespec.ts';
import { FolderSpec } from './folderspec.ts';
import { FSSpec } from './fsspec.ts';
import { SymlinkSpec } from './symspec.ts';

export function fromDirEntry(
  parentPath: FS.FolderPath,
  entry: Deno.DirEntry,
): FolderSpec | FileSpec | SymlinkSpec | FSSpec {
  const fullPath = path.join(parentPath, entry.name);
  if (entry.isDirectory) {
    return new FolderSpec(fullPath).setDirEntry(entry);
  } else if (entry.isFile) {
    return new FileSpec(fullPath).setDirEntry(entry);
  } else if (entry.isSymlink) {
    return new SymlinkSpec(fullPath).setDirEntry(entry);
  }
  return new FSSpec(fullPath).setDirEntry(entry);
}

export function fromWalkEntry(entry: dfs.WalkEntry): FileSpec | FolderSpec | SymlinkSpec | FSSpec {
  if (entry.isDirectory) {
    return new FolderSpec(entry.path).setDirEntry(entry);
  } else if (entry.isFile) {
    return new FileSpec(entry.path).setDirEntry(entry);
  } else if (entry.isSymlink) {
    return new SymlinkSpec(entry.path).setDirEntry(entry);
  }
  return new FSSpec(entry.path).setDirEntry(entry);
}
