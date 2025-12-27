import { resolvePathArgs, safeCopy, type SafeCopyOpts } from '$util';
import { fromFileUrl } from '@std/path';
import { promises as nfs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type * as FS from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import { FolderSpec } from './folderspec.ts';
import type { ICopyableSpec, IRootableSpec } from './icopyable.ts';
import { SymlinkSpec } from './symspec.ts';
import type { TypedFSSpec } from './types.ts';

/**
 * Class representing a file system item, which may be a file, folder, or symlink. Use this when you
 * do not know the specific type at creation time. FileSpec, FolderSpec and SymlinkSpec do NOT
 * subclass FSSpec as they do not share methods with this class.
 */
export class FSSpec extends FSSpecBase implements ICopyableSpec, IRootableSpec {
  /**
   * Public constructor for FSSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: FS.PathSegment[]) {
    super();
    this._f = resolvePathArgs(...args);
  }

  /**
   * Creates a new FSSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * @param metaUrl - The `import.meta.url` of the calling module.
   * @param paths - Additional path segments to join.
   * @returns {FSSpec} A new FSSpec instance.
   *
   * @example
   * // Assuming this code is in /path/to/your/project/src/app.ts
   * const configFile = FSSpec.fromMeta(import.meta.url, '../data/config.json');
   * // configFile.path will be /path/to/your/project/data/config.json
   */
  public static fromMeta(metaUrl: string, ...paths: string[]): FSSpec {
    const dir = path.dirname(fromFileUrl(metaUrl));
    const fullPath = path.join(dir, ...paths);
    return new FSSpec(fullPath);
  }

  /**
   * Creates a copy of the current FSSpec instance.
   * @returns {FSSpec} A new FSSpec object with the same configuration.
   */
  copy(): FSSpec {
    return new FSSpec(this);
  }

  /**
   * Copies parameters from this instance to the target BaseSpec.
   * @param target - The target BaseSpec to copy parameters to.
   * @returns {FSSpecBase} The target BaseSpec with copied parameters.
   */
  override copyParamsTo(target: FSSpecBase): FSSpecBase {
    super.copyParamsTo(target);
    return target;
  }

  /**
   * Resolves the type of the file system item.
   * Depending on whether the item is a file, folder, or symlink,
   * this function returns an instance of FileSpec, FolderSpec, or SymlinkSpec.
   * The caller should have previously called getStats().
   *
   * @returns {FSSpec | FolderSpec | FileSpec | SymlinkSpec} The resolved type instance.
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
   */
  async resolvedType(force = false): Promise<TypedFSSpec | undefined> {
    if (await this.stats(force)) {
      return this.cachedResolveType();
    }
  }

  /**
   * Appends additional path segments to the current file system path.
   *
   * @param args - One or more string path segments.
   * @returns {FSSpec} A new FSSpec instance with the updated path.
   * @experimental
   *
   *  * @example
   * const original = new FSSpec('/Users/jpravetz/projects');
   * const updated = original.add('src', 'index.ts');
   * console.log(updated.path); // e.g. '/Users/jpravetz/projects/src/index.ts'
   */
  add(...args: string[]): FSSpec {
    const fullPath = path.resolve(this._f, ...args);
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
   */

  static home(...args: string[]): FSSpec {
    const fullPath = path.resolve(os.userInfo().homedir, ...args);
    return new FSSpec(fullPath);
  }

  /**
   * Safely copies this file system item to a destination.
   *
   * @param destFile - The destination path or FS item.
   * @param [opts={}] - Optional safe copy options.
   * @returns {Promise<void>} A promise that resolves when the copy operation completes.
   */
  safeCopy(
    destFile: FS.Path | FileSpec | FolderSpec | FSSpec,
    opts: SafeCopyOpts = {},
  ): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  /**
   * Changes the owner of the file system item.
   * @param uid - User ID
   * @param gid - Group ID (optional)
   */
  async chown(uid: FS.UID, gid?: FS.GID): Promise<void> {
    await nfs.chown(this._f, uid, gid ?? -1);
  }

  /**
   * Changes the group of the file system item.
   * @param gid - Group ID
   */
  async chgrp(gid: FS.GID): Promise<void> {
    await nfs.chown(this._f, -1, gid);
  }

  /**
   * Changes the permissions of the file system item.
   * @param mode - File mode (permissions)
   */
  async chmod(mode: FS.Mode): Promise<void> {
    await nfs.chmod(this._f, mode);
  }
}
