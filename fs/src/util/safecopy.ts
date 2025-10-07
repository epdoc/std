import { FileSpec, FolderSpec, FSSpec, SymlinkSpec } from '$spec'; // Import as value
import * as dfs from '@std/fs';
import path from 'node:path';
import { FSError } from '../error.ts';
import type { FilePath, FolderPath } from '../types.ts';
import { fileConflictStrategyType } from './consts.ts';
import { resolveType } from './resolve-type.ts';
import type * as util from './types.ts';

/**
 * Checks if a given value is a valid FileConflictStrategyType.
 *
 * @param value The value to check.
 * @returns True if the value is a valid FileConflictStrategyType, false otherwise.
 */
export function isFileConflictStrategyType(value: unknown): value is util.FileConflictStrategyType {
  return typeof value === 'string' && value in Object.keys(fileConflictStrategyType);
}

/**
 * Safely copies a source file or folder to a destination.
 * @param {BaseSpec} src - The source file or folder to copy.
 * @param {FilePath | BaseSpec} dest - The destination path.
 * @param {Object} options - Options for the copy operation.
 * @returns {Promise<void>} - A promise that resolves when the copy is complete.
 */
export async function safeCopy(
  src: FSSpec | FileSpec | FolderSpec | FolderSpec | SymlinkSpec,
  dest: FilePath | FSSpec | FileSpec | FolderSpec | FolderPath,
  options: util.SafeCopyOpts = {},
): Promise<void> {
  const fsSrc = await resolveType(src);

  // Check if src is a symlink
  if (fsSrc.isSymlink()) {
    throw new FSError('Source cannot be a symlink', { path: fsSrc.path });
  }

  // Ensure src exists
  const srcExists = await fsSrc.getExists();
  if (!srcExists) {
    throw new FSError('Source does not exist', { path: fsSrc.path });
  }

  const fsDest = await resolveType(dest);
  if (fsDest instanceof SymlinkSpec) {
    throw new FSError('Destination cannot be a symlink', { path: fsDest.path });
  }

  if (src instanceof FileSpec) {
    if (fsDest instanceof FSSpec) {
      throw new FSError('Destination must be a FileSpec or FolderSpec', { path: fsDest.path });
    }
    await safeCopyFile(src, fsDest, options);
  } else if (src instanceof FolderSpec) {
    if (!(fsDest instanceof FolderSpec)) {
      throw new FSError('Destination must be a FolderSpec', { path: fsSrc.path });
    }
    await safeCopyFolder(src, fsDest, options);
  }
}

/**
 * Safely copies a file to a destination.
 * @param {BaseSpec} src - The source file to copy.
 * @param {FilePath | BaseSpec} dest - The destination path.
 * @param {Object} options - Options for the copy operation.
 * @returns {Promise<void>} - A promise that resolves when the copy is complete.
 */
export async function safeCopyFile(
  src: FileSpec,
  fsDest: FileSpec | FolderSpec,
  options: util.SafeFileCopyOpts = {},
): Promise<void> {
  if (fsDest instanceof FileSpec) {
    const destExists = await fsDest.getExists();
    if (destExists) {
      // Handle existing destination file
      const p: FilePath | undefined = await fsDest.backup(options.conflictStrategy);
      if (p === undefined) {
        return;
      }
    } else {
      await fsDest.ensureParentDir();
    }
    await src.copyTo(fsDest.path, { overwrite: true, preserveTimestamps: true });
    if (options.move) {
      await src.remove();
    }
  } else if (fsDest instanceof FolderSpec) {
    // Ensure parent directory exists
    const parent = new FolderSpec(fsDest.dirname);
    await parent.ensureDir();
    await src.copyTo(fsDest.path);

    // If moving, remove the source file
    if (options.move) {
      await src.remove();
    }
  } else {
    throw new Error('Destination must be a FileSpec or FolderSpec');
  }
}

/**
 * Safely copies a folder to a destination.
 * @param {BaseSpec} src - The source folder to copy.
 * @param {FilePath | BaseSpec} dest - The destination path.
 * @param {Object} options - Options for the copy operation.
 * @returns {Promise<void>} - A promise that resolves when the copy is complete.
 */
export async function safeCopyFolder(
  src: FolderSpec,
  fsDest: FolderSpec,
  options: util.SafeCopyOpts = {},
): Promise<void> {
  // if (options.contents === false) {
  //   fsDest = fsDest.add(src.dirname);
  // }
  // Ensure destination folder exists
  await fsDest.ensureDir();

  // Use walk to copy files and folders
  for await (const entry of dfs.walk(src.path)) {
    const relativePath = path.relative(src.path, entry.path);
    const destEntryPath = path.join(fsDest.path, relativePath);

    if (entry.isDirectory) {
      await new FolderSpec(destEntryPath).ensureDir();
    } else if (entry.isFile) {
      const srcFile = new FileSpec(entry.path);
      await safeCopyFile(srcFile, new FileSpec(destEntryPath), options);
    }
  }

  // If moving, remove the source folder
  if (options.move) {
    await src.remove();
  }
}

// function getCopyOpts(opts: SafeCopyOpts): dfs.CopyOptions {
//   const copyOpts: dfs.CopyOptions = { preserveTimestamps: true };
//   if (opts.conflictStrategy === 'overwrite') {
//     copyOpts.overwrite = true;
//   }
//   return copyOpts;
// }
