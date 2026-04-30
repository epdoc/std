import { getHomeDir, resolvePath, resolvePathArgs, safeCopy, type SafeCopyOpts } from '$util';
import { walk } from '$walk';
import { fromFileUrl } from '@std/path';
import { promises as nfs } from 'node:fs';
import path from 'node:path';
import type * as FS from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import { FolderSpec } from './folderspec.ts';
import type { IClonableSpec, IRootableSpec } from './icopyable.ts';
import { SymlinkSpec } from './symspec.ts';
import type { TypedFSSpec } from './types.ts';

/**
 * Class representing a file system item, which may be a file, folder, or symlink. Use this when you
 * do not know the specific type at creation time. FileSpec, FolderSpec and SymlinkSpec do NOT
 * subclass FSSpec as they do not share methods with this class.
 */
export class FSSpec extends FSSpecBase implements IClonableSpec, IRootableSpec {
  /**
   * Public constructor for FSSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: FS.PathSegment[]) {
    super();
    this._f = resolvePathArgs(...args);
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Creates a new FSSpec from a file:// URL string.
   *
   * When called with just a URL, the URL is converted directly to a path.
   * When called with additional path segments, the URL's directory is extracted
   * and the segments are joined to create a path relative to that directory.
   *
   * This is especially useful with `import.meta.url` to create paths relative
   * to the current module's location.
   *
   * @param url - A file URL string (e.g., `import.meta.url` or "file:///path/to/file.ts")
   * @param paths - Optional path segments to join relative to the URL's directory.
   *   When omitted, the URL itself is used as the file path.
   * @returns {FSSpec} A new FSSpec instance.
   *
   * @example
   * // Get the current module's file path
   * const currentFile = FSSpec.fromFileUrl(import.meta.url);
   *
   * @example
   * // Create a path relative to the current module's directory
   * const configFile = FSSpec.fromFileUrl(import.meta.url, '../data/config.json');
   *
   * @category Factory Methods
   */
  public static fromFileUrl(url: string, ...paths: string[]): FSSpec {
    if (paths.length === 0) {
      // No additional paths: use the URL directly as the file path
      return new FSSpec(fromFileUrl(url));
    }
    // With additional paths: extract directory and join paths relative to it
    const dir = path.dirname(fromFileUrl(url));
    const fullPath = path.join(dir, ...paths);
    return new FSSpec(fullPath);
  }

  /**
   * Constructs a new FSSpec instance rooted at the user's home directory.
   *
   * @param args - Additional path segments to append after the home directory.
   * @returns {FSSpec} A new FSSpec instance for the specified path.
   *
   * @example
   * // Create an FSSpec instance rooted at the home directory and point to a specific folder.
   * const fs = new FSSpec('/any/initial/path');
   * const homeFs = fs.home('Documents', 'Projects');
   * console.log(homeFs.path); // e.g. '/Users/yourUsername/Documents/Projects'
   *
   * @category Factory Methods
   */
  static home(...args: string[]): FSSpec {
    const fullPath = resolvePath(getHomeDir(), ...args);
    return new FSSpec(fullPath);
  }

  // ============================================================================
  // PATH MANIPULATION
  // ============================================================================

  /**
   * Creates a shallow clone of this FSSpec instance.
   *
   * Copies the path and cached file info, but **does not** copy the actual
   * file system item on disk.
   *
   * @returns {FSSpec} A new FSSpec object with the same configuration.
   * @see {@link safeCopy} to copy the actual file/directory contents
   * @see {@link copyParamsTo} for internal use
   *
   * @category Path Manipulation
   */
  clone(): FSSpec {
    const result = new FSSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  /**
   * Copies parameters from this instance to the target BaseSpec.
   * @param target - The target BaseSpec to copy parameters to.
   * @returns {FSSpecBase} The target BaseSpec with copied parameters.
   * @protected
   */
  override copyParamsTo(target: FSSpecBase): FSSpecBase {
    super.copyParamsTo(target);
    return target;
  }

  /**
   * Appends additional path segments to the current file system path.
   *
   * @param args - One or more string path segments.
   * @returns {FSSpec} A new FSSpec instance with the updated path.
   * @experimental
   *
   * @example
   * const original = new FSSpec('/Users/jpravetz/projects');
   * const updated = original.add('src', 'index.ts');
   * console.log(updated.path); // e.g. '/Users/jpravetz/projects/src/index.ts'
   *
   * @category Path Manipulation
   */
  add(...args: string[]): FSSpec {
    const fullPath = path.resolve(this._f, ...args);
    return new FSSpec(fullPath);
  }

  // ============================================================================
  // TYPE RESOLUTION
  // ============================================================================

  /**
   * Resolves the type of the file system item.
   * Depending on whether the item is a file, folder, or symlink,
   * this function returns an instance of FileSpec, FolderSpec, or SymlinkSpec.
   * The caller should have previously called getStats().
   *
   * @returns {FSSpec | FolderSpec | FileSpec | SymlinkSpec} The resolved type instance.
   *
   * @category Type Resolution
   */
  cachedResolveType(): TypedFSSpec | undefined {
    let result: TypedFSSpec | undefined = undefined;
    if (this.info.isFile) {
      result = new FileSpec(this);
    } else if (this.info.isDirectory === true) {
      result = new FolderSpec(this);
    } else if (this.info.isSymlink === true) {
      result = new SymlinkSpec(this.path);
    }
    if (!result) {
      return undefined;
    }
    this.copyParamsTo(result);
    return result;
  }

  /**
   * Async retrieve the resolved file system item type after obtaining file
   * statistics. This will call getStats().
   * @returns {Promise<FSSpec | FolderSpec | FileSpec | SymlinkSpec>} A promise
   * resolving to the specific type instance. Undefined if the file does not exist.
   *
   * @category Type Resolution
   */
  async resolvedType(force = false): Promise<TypedFSSpec | undefined> {
    if (await this.stats(force)) {
      return this.cachedResolveType();
    }
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  /**
   * Safely copies this file system item to a destination.
   *
   * @param destFile - The destination path or FS item.
   * @param [opts={}] - Optional safe copy options.
   * @returns {Promise<void>} A promise that resolves when the copy operation completes.
   *
   * @category File Operations
   */
  safeCopy(
    destFile: FS.Path | FileSpec | FolderSpec | FSSpec,
    opts: SafeCopyOpts = {},
  ): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Changes the owner of the file system item.
   * @param uid - User ID
   * @param gid - Group ID (optional)
   * @param recursive - Apply recursively to all contents (only meaningful for directories)
   *
   * @remarks For bulk operations on large directory trees, shell scripts using
   * `find` with batched `-exec ... {} +` are significantly more efficient than
   * JavaScript/TypeScript iteration.
   *
   * @category Permissions
   */
  async chown(uid: FS.UID, gid?: FS.GID, recursive = false): Promise<void> {
    await nfs.chown(this._f, uid, gid ?? -1);
    if (recursive && await this.isFolder()) {
      for await (const entry of walk(new FolderSpec(this._f), {})) {
        await nfs.chown(entry.path, uid, gid ?? -1);
      }
    }
  }

  /**
   * Changes the group of the file system item.
   * @param gid - Group ID
   * @param recursive - Apply recursively to all contents (only meaningful for directories)
   *
   * @remarks For bulk operations on large directory trees, shell scripts using
   * `find` with batched `-exec ... {} +` are significantly more efficient than
   * JavaScript/TypeScript iteration.
   *
   * @category Permissions
   */
  async chgrp(gid: FS.GID, recursive = false): Promise<void> {
    await nfs.chown(this._f, -1, gid);
    if (recursive && await this.isFolder()) {
      for await (const entry of walk(new FolderSpec(this._f), {})) {
        await nfs.chown(entry.path, -1, gid);
      }
    }
  }

  /**
   * Changes the permissions of the file system item.
   * @param mode - File mode (permissions)
   * @param recursive - Apply recursively to all contents (only meaningful for directories)
   *
   * @remarks For bulk operations on large directory trees, shell scripts using
   * `find` with batched `-exec ... {} +` are significantly more efficient than
   * JavaScript/TypeScript iteration.
   *
   * @category Permissions
   */
  async chmod(mode: FS.Mode, recursive = false): Promise<void> {
    await nfs.chmod(this._f, mode);
    if (recursive && await this.isFolder()) {
      for await (const entry of walk(new FolderSpec(this._f), {})) {
        await nfs.chmod(entry.path, mode);
      }
    }
  }
}
