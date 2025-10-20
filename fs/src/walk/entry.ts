import { type Dirent, promises as nfs } from 'node:fs';
import path from 'node:path';
import type { FSEntry } from '../types.ts'; // Updated import path

export async function createWalkEntry(filePath: string): Promise<FSEntry> {
  const stats = await nfs.lstat(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    isSymlink: stats.isSymbolicLink(),
  };
}

// Create a FSEntry-like object from Node.js fs.Dirent
export function createWalkEntryFromDirent(parentPath: string, dirent: Dirent): FSEntry {
  return {
    path: path.join(parentPath, dirent.name),
    name: dirent.name,
    isFile: dirent.isFile(),
    isDirectory: dirent.isDirectory(),
    isSymlink: dirent.isSymbolicLink(),
  };
}
