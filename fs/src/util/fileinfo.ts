import { isFunction } from '@epdoc/type';
import type { Dirent, Stats } from 'node:fs';
import path from 'node:path';
import { FileSpec, FolderSpec, SymlinkSpec, type TypedFSSpec } from '../spec/mod.ts';
import type { FileInfo, FolderPath } from '../types.ts';

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
    modifiedAt: stats.mtime,
    atime: stats.atime,
    createdAt: stats.birthtime,
    ctime: stats.ctime,
    dev: stats.dev,
    ino: stats.ino,
    mode: stats.mode,
    nlink: stats.nlink,
    uid: stats.uid,
    gid: stats.gid,
    rdev: stats.rdev,
    blksize: stats.blksize,
    blocks: stats.blocks,
    isBlockDevice: isFunction(stats.isBlockDevice) ? stats.isBlockDevice() : null,
    isCharDevice: isFunction(stats.isCharacterDevice) ? stats.isCharacterDevice() : null,
    isFifo: isFunction(stats.isFIFO) ? stats.isFIFO() : null,
    isSocket: isFunction(stats.isSocket) ? stats.isSocket() : null,
  };
}

export function direntToSpec(parentPath: FolderPath, dirent: Dirent): TypedFSSpec | undefined {
  const entryPath = path.join(parentPath, dirent.name);
  if (dirent.isFile()) {
    return new FileSpec(entryPath);
  } else if (dirent.isDirectory()) {
    return new FolderSpec(entryPath);
  } else if (dirent.isSymbolicLink()) {
    return new SymlinkSpec(entryPath);
  }
}
