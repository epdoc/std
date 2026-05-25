import * as Spec from '$spec';
import { include, shouldExclude } from './filter.ts';
import type { WalkOptions } from './types.ts';

/**
 * Asynchronously walks a file system tree, yielding `FSSpec` entries that match the specified options.
 * This function is an async generator, allowing iteration over file system entries as they are discovered.
 *
 * @param fsRoot The starting folder to begin the walk.
 * @param options Optional configuration for the walk operation.
 * @param privateVisited Internal set used to track visited canonical paths to prevent infinite loops when following symlinks.
 * @returns An async iterable iterator that yields `FSSpec` objects (FolderSpec, FileSpec, or SymlinkSpec).
 */
export async function* walk(
  fsRoot: Spec.FolderSpec,
  options?: WalkOptions,
  privateVisited: Set<string> = new Set<string>(),
): AsyncIterableIterator<Spec.FolderSpec | Spec.FileSpec | Spec.SymlinkSpec | Spec.FSSpec> {
  let {
    maxDepth = Infinity,
    includeFiles = true,
    includeDirs = true,
    includeSymlinks = true,
    followSymlinks = false,
    canonicalize = true,
    exts = undefined,
    match = undefined,
    exclude = undefined,
    skip = undefined,
  } = options ?? {};

  // Error if both skip and exclude are provided
  if (skip !== undefined && exclude !== undefined) {
    throw new Error(
      'Cannot use both `skip` and `exclude` options. `skip` is deprecated, please use `exclude` instead.',
    );
  }

  // Use skip as exclude if exclude is not provided (backward compatibility)
  const effectiveExclude = exclude ?? skip;

  if (maxDepth < 0) {
    return;
  }

  const currentCanonicalRoot = canonicalize ? await fsRoot.realPath() : fsRoot.path;

  if (privateVisited.has(currentCanonicalRoot)) {
    return;
  }
  privateVisited.add(currentCanonicalRoot);

  // Check if this directory should be excluded (pruned)
  if (shouldExclude(fsRoot.path, effectiveExclude)) {
    return;
  }

  if (exts) {
    exts = exts.map((ext) => ext.startsWith('.') ? ext : `.${ext}`);
  }

  if (includeDirs && include(fsRoot.path, exts, match, effectiveExclude, undefined)) {
    yield fsRoot;
  }

  if (maxDepth < 1) {
    return;
  }

  const dirents: (Spec.FolderSpec | Spec.FileSpec | Spec.SymlinkSpec | Spec.FSSpec)[] = await fsRoot.readDir();

  for (const dirent of dirents) {
    if (dirent instanceof Spec.SymlinkSpec) {
      if (!followSymlinks) {
        if (includeSymlinks && include(dirent.path, exts, match, effectiveExclude, undefined)) {
          yield dirent;
        }
        continue;
      }

      // Follow symlink
      const realPath = await dirent.realPath();
      const canonicalRealPath = realPath;
      if (privateVisited.has(canonicalRealPath)) {
        continue;
      }
      privateVisited.add(canonicalRealPath); // Mark as visited

      // Check if the symlink target should be excluded
      if (shouldExclude(realPath, effectiveExclude)) {
        continue;
      }

      const fsRealEnt = await new Spec.FSSpec(realPath).resolvedType();

      if (fsRealEnt instanceof Spec.FolderSpec) {
        const opts: WalkOptions = {
          maxDepth: maxDepth - 1,
          includeFiles,
          includeDirs,
          includeSymlinks,
          followSymlinks,
          canonicalize,
        };
        if (exts !== undefined) opts.exts = exts;
        if (match !== undefined) opts.match = match;
        if (effectiveExclude !== undefined) opts.exclude = effectiveExclude;

        yield* walk(fsRealEnt, opts, privateVisited);
      } else if (fsRealEnt instanceof Spec.FileSpec) {
        if (includeFiles && include(fsRealEnt.path, exts, match, effectiveExclude, undefined)) {
          yield fsRealEnt;
        }
      } else if (fsRealEnt instanceof Spec.SymlinkSpec) {
        // This case should ideally not happen if realpath resolves to a non-symlink
        // but if it does, we yield it if includeSymlinks is true
        if (includeSymlinks && include(fsRealEnt.path, exts, match, effectiveExclude, undefined)) {
          yield fsRealEnt;
        }
      }
    } else if (dirent instanceof Spec.FolderSpec) {
      // Check if this subdirectory should be excluded before descending
      if (shouldExclude(dirent.path, effectiveExclude)) {
        continue;
      }

      const opts: WalkOptions = {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        includeSymlinks,
        followSymlinks,
        canonicalize,
      };
      if (exts !== undefined) opts.exts = exts;
      if (match !== undefined) opts.match = match;
      if (effectiveExclude !== undefined) opts.exclude = effectiveExclude;

      yield* walk(dirent, opts, privateVisited);
    } else if (dirent instanceof Spec.FileSpec) {
      if (includeFiles && include(dirent.path, exts, match, effectiveExclude, undefined)) {
        const canonicalPath = canonicalize ? await dirent.realPath() : dirent.path;
        if (!privateVisited.has(canonicalPath)) {
          privateVisited.add(canonicalPath);
          yield dirent;
        }
      }
    }
  }
}
