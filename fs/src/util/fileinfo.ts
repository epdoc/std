import { DateTime } from '@epdoc/datetime';
import { isFunction } from '@epdoc/type';
import type { Dirent, Stats } from 'node:fs';
import path from 'node:path';
import { FileSpec, FolderSpec, SymlinkSpec, type TypedFSSpec } from '../spec/mod.ts';
import type { FileInfo, FolderPath, FSEntry, GID, Mode, Path, UID } from '../types.ts';

/**
 * Converts Node.js `Stats` object to a `FileInfo` object.
 * @param stats - The Node.js `Stats` object.
 * @returns A `FileInfo` object containing file information.
 */
export function statsToFileInfo(stats: Stats): FileInfo {
  const isFile = stats.isFile();
  const isDirectory = stats.isDirectory();
  const isSymlink = stats.isSymbolicLink();
  return {
    exists: isFile || isDirectory || isSymlink,
    isFile: isFile,
    isDirectory: isDirectory,
    isSymlink: isSymlink,
    size: stats.size,
    modifiedAt: DateTime.fromDate(stats.mtime),
    atime: DateTime.fromDate(stats.atime),
    createdAt: DateTime.fromDate(stats.birthtime),
    ctime: DateTime.fromDate(stats.ctime),
    dev: stats.dev,
    ino: stats.ino,
    mode: stats.mode as Mode,
    nlink: stats.nlink,
    uid: stats.uid as UID,
    gid: stats.gid as GID,
    rdev: stats.rdev,
    blksize: stats.blksize,
    blocks: stats.blocks,
    isBlockDevice: isFunction(stats.isBlockDevice) ? stats.isBlockDevice() : null,
    isCharDevice: isFunction(stats.isCharacterDevice) ? stats.isCharacterDevice() : null,
    isFifo: isFunction(stats.isFIFO) ? stats.isFIFO() : null,
    isSocket: isFunction(stats.isSocket) ? stats.isSocket() : null,
  };
}

/**
 * Converts a `FSEntry` to a partial `FileInfo` object, seeded with type flags
 * and `exists` from directory-listing metadata. Stat-only fields (size, dates,
 * permissions) are set to sentinel / null values and will be upgraded to real
 * values by `stats()` on first access.
 * @param entry - The `FSEntry` object.
 * @returns A partial `FileInfo` object.
 */
export function entryToFileInfo(entry: FSEntry): FileInfo {
  return {
    exists: true,
    isFile: entry.isFile,
    isDirectory: entry.isDirectory,
    isSymlink: entry.isSymlink,
    size: -1,
    modifiedAt: null,
    atime: null,
    createdAt: null,
    ctime: null,
    dev: -1,
    ino: null,
    mode: null,
    nlink: null,
    uid: null,
    gid: null,
    rdev: null,
    blksize: null,
    blocks: null,
    isBlockDevice: null,
    isCharDevice: null,
    isFifo: null,
    isSocket: null,
  };
}

/**
 * Converts a Node.js `Dirent` object to a `TypedFSSpec` (FileSpec, FolderSpec, or SymlinkSpec).
 * The resulting spec is seeded with type flags from the dirent via `setDirEntry`,
 * so `info.isFile` works synchronously without an extra `lstat`.
 * @param parentPath - The path of the parent directory.
 * @param dirent - The Node.js `Dirent` object.
 * @returns A `TypedFSSpec` object if the dirent is a file, directory, or symlink, otherwise `undefined`.
 */
export function direntToSpec(parentPath: FolderPath, dirent: Dirent): TypedFSSpec | undefined {
  const entryPath = path.join(parentPath, dirent.name) as Path;
  const entry: FSEntry = {
    path: entryPath,
    name: dirent.name,
    isFile: dirent.isFile(),
    isDirectory: dirent.isDirectory(),
    isSymlink: dirent.isSymbolicLink(),
  };
  if (dirent.isFile()) {
    return new FileSpec(entryPath).setDirEntry(entry) as FileSpec;
  } else if (dirent.isDirectory()) {
    return new FolderSpec(entryPath).setDirEntry(entry) as FolderSpec;
  } else if (dirent.isSymbolicLink()) {
    return new SymlinkSpec(entryPath).setDirEntry(entry) as SymlinkSpec;
  }
}
