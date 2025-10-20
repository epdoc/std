import * as Error from '$error';
import * as Spec from '$spec'; // Import Spec
import { FileSpec, FolderSpec, type FSSpec, SymlinkSpec } from '$spec'; // Import Spec
import type { WalkOptions } from '$walk';
import { walk } from '$walk'; // Import walk from $walk
import path from 'node:path';
import type { FilePath, Path } from '../types.ts';
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
  src: Path | FSSpec | FileSpec | FolderSpec | SymlinkSpec,
  dest: Path | FSSpec | FileSpec | FolderSpec,
  options: util.SafeCopyOpts = {},
): Promise<void> {
  const fsSrc = await resolveType(src);
  const fsDest = await resolveType(dest);

  if (!fsSrc) {
    throw new Error.NotFound('Source file undiscoverable', { path: String(src) });
  }
  if (!fsDest) {
    throw new Error.NotFound('Destination file undiscoverable', { path: String(fsDest) });
  }

  // Check if src is a symlink
  if (fsSrc instanceof SymlinkSpec) {
    // use a specific error type from $error
    throw new Error.InvalidData('Source cannot be a symlink', { path: fsSrc.path });
  }
  // Check if dest is a symlink
  if (fsDest instanceof SymlinkSpec) {
    // use a specific error type from $error
    throw new Error.InvalidData('Destination cannot be a symlink', { path: fsDest.path });
  }

  // Ensure src exists
  const srcInfo = await fsSrc.stats();
  if (!srcInfo || !srcInfo.exists) {
    throw new Error.NotFound('Source file not found', { path: fsSrc.path });
  }

  if (src instanceof FileSpec) {
    if (!(fsDest instanceof FolderSpec || fsDest instanceof FileSpec)) {
      throw new Error.InvalidData('Destination must be a FileSpec or FolderSpec');
    }
    await safeCopyFile(src, fsDest, options);
  } else if (src instanceof FolderSpec) {
    if (!(fsDest instanceof FolderSpec)) {
      throw new Error.InvalidData('Destination must be a FolderSpec', { path: fsSrc.path });
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
    const destExists = await fsDest.exists();
    if (destExists) {
      const conflictStrategy = options.conflictStrategy;
      if (conflictStrategy?.type === fileConflictStrategyType.skip) {
        return;
      } else if (conflictStrategy?.type === fileConflictStrategyType.error) {
        if (conflictStrategy.errorIfExists) {
          throw new Error.AlreadyExists('File exists', { path: fsDest.path });
        }
      } else if (conflictStrategy?.type === fileConflictStrategyType.renameWithTilde) {
        await fsDest.moveTo(fsDest.path + '~' as FilePath, { overwrite: true });
        fsDest.clearInfo(); // Clear cached stats after move
      } else if (conflictStrategy?.type === fileConflictStrategyType.renameWithNumber) {
        const newPath = await fsDest.findAvailableIndexFilename(
          conflictStrategy.limit,
          conflictStrategy.separator,
          conflictStrategy.prefix,
        );
        if (newPath) {
          await fsDest.moveTo(newPath, { overwrite: true });
          fsDest.clearInfo(); // Clear cached stats after move
        } else if (conflictStrategy.errorIfExists) {
          throw new Error.AlreadyExists('File exists', { path: fsDest.path });
        }
      }
      // For 'overwrite' strategy, no action is needed here, proceed to copy
    } else {
      try {
        await fsDest.ensureParentDir();
      } catch (err) {
        // map underlying error to FSError hierarchy
        throw (err instanceof Error.FSError) ? err : new Error.FSError(String(err), { path: fsDest.path });
      }
    }
    try {
      await src.copyTo(fsDest.path, { overwrite: true, preserveTimestamps: true });
    } catch (err) {
      throw (err instanceof Error.FSError) ? err : new Error.FSError(String(err), { path: fsDest.path });
    }
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
    throw new Error.InvalidData('Destination must be a FileSpec or FolderSpec');
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
  src: Spec.FolderSpec,
  fsDest: Spec.FolderSpec,
  options: util.SafeCopyOpts = {},
): Promise<void> {
  // Ensure destination folder exists
  await fsDest.ensureDir();

  const walkOpts: WalkOptions = {
    includeFiles: true,
    includeDirs: true,
    includeSymlinks: true,
    followSymlinks: false,
    canonicalize: true,
  };

  // Use walk to copy files and folders
  for await (const entry of walk(new Spec.FolderSpec(src.path), walkOpts)) {
    const relativePath = path.relative(src.path, entry.path);
    const destEntryPath = path.join(fsDest.path, relativePath);

    if (await entry.isFolder()) {
      await new Spec.FolderSpec(destEntryPath).ensureDir();
    } else if (await entry.isFile()) {
      const srcFile = new FileSpec(entry.path);
      try {
        await safeCopyFile(srcFile, new FileSpec(destEntryPath), options);
      } catch (err) {
        // propagate as project errors
        throw (err instanceof Error.FSError) ? err : new Error.FSError(String(err), { path: destEntryPath });
      }
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
