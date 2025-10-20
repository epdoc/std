import * as Spec from '$spec';
import { include } from './filter.ts';
import type { WalkOptions } from './types.ts';

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
    skip = undefined,
  } = options ?? {};

  if (maxDepth < 0) {
    return;
  }

  const currentCanonicalRoot = canonicalize ? await fsRoot.realPath() : fsRoot.path;

  if (privateVisited.has(currentCanonicalRoot)) {
    return;
  }
  privateVisited.add(currentCanonicalRoot);

  if (exts) {
    exts = exts.map((ext) => ext.startsWith('.') ? ext : `.${ext}`);
  }

  if (includeDirs && include(fsRoot.path, exts, match, skip)) {
    yield fsRoot;
  }

  if (maxDepth < 1) {
    return;
  }

  const dirents: (Spec.FolderSpec | Spec.FileSpec | Spec.SymlinkSpec | Spec.FSSpec)[] = await fsRoot.readDir();

  for (const dirent of dirents) {
    if (dirent instanceof Spec.SymlinkSpec) {
      if (!followSymlinks) {
        if (includeSymlinks && include(dirent.path, exts, match, skip)) {
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
        if (skip !== undefined) opts.skip = skip;

        yield* walk(fsRealEnt, opts, privateVisited);
      } else if (fsRealEnt instanceof Spec.FileSpec) {
        if (includeFiles && include(fsRealEnt.path, exts, match, skip)) {
          yield fsRealEnt;
        }
      } else if (fsRealEnt instanceof Spec.SymlinkSpec) {
        // This case should ideally not happen if realpath resolves to a non-symlink
        // but if it does, we yield it if includeSymlinks is true
        if (includeSymlinks && include(fsRealEnt.path, exts, match, skip)) {
          yield fsRealEnt;
        }
      }
    } else if (dirent instanceof Spec.FolderSpec) {
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
      if (skip !== undefined) opts.skip = skip;

      yield* walk(dirent, opts, privateVisited);
    } else if (dirent instanceof Spec.FileSpec) {
      if (includeFiles && include(dirent.path, exts, match, skip)) {
        const canonicalPath = canonicalize ? await dirent.realPath() : dirent.path;
        if (!privateVisited.has(canonicalPath)) {
          privateVisited.add(canonicalPath);
          yield dirent;
        }
      }
    }
  }
}
