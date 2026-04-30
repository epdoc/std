import * as util from '$util';
import { promises as nfs } from 'node:fs';
import type * as FS from '../types.ts';
import type { FilePath, FolderPath, PathSegment } from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { FSSpec } from './fsspec.ts';
import type { IClonableSpec } from './icopyable.ts';

/**
 * Represents a symbolic link in the file system.
 * Symlinks can point to files, folders, or non-existent paths.
 */
export class SymlinkSpec extends FSSpecBase implements IClonableSpec {
  /**
   * Public constructor for SymlinkSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: PathSegment[]) {
    super();
    // Symlinks can point to either files or folders, so we use FSPath.
    this._f = util.resolvePathArgs(...args) as FilePath | FolderPath;
  }

  // ============================================================================
  // PATH MANIPULATION
  // ============================================================================

  /**
   * Creates a shallow clone of this SymlinkSpec instance.
   *
   * Copies the path and cached info, but **does not** copy the actual symlink.
   *
   * @returns {SymlinkSpec} A new SymlinkSpec with the same path and cached state
   *
   * @category Path Manipulation
   */
  clone(): SymlinkSpec {
    const result = new SymlinkSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  /**
   * Copies parameters from this instance to the target BaseSpec.
   * @param target - The target BaseSpec to copy parameters to.
   * @returns {SymlinkSpec} The target instance with copied parameters.
   * @protected
   */
  override copyParamsTo(target: SymlinkSpec): SymlinkSpec {
    super.copyParamsTo(target);
    return target;
  }

  /**
   * Safely copies this symlink to a destination.
   * @throws {Error} Always throws - cannot copy a symlink using this method.
   *
   * @category File Operations
   */
  safeCopy(_destFile: FilePath | FileSpec | FolderSpec | FSSpec, _opts: util.SafeCopyOpts = {}): Promise<boolean> {
    throw new Error('Cannot copy a symlink');
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Changes the owner of the symlink itself (not the target).
   * @param uid - User ID
   * @param gid - Group ID (optional)
   *
   * @category Permissions
   */
  async chown(uid: FS.UID, gid?: FS.GID): Promise<void> {
    await nfs.lchown(this._f, uid, gid ?? -1);
  }

  /**
   * Changes the group of the symlink itself (not the target).
   * @param gid - Group ID
   *
   * @category Permissions
   */
  async chgrp(gid: FS.GID): Promise<void> {
    await nfs.lchown(this._f, -1, gid);
  }

  /**
   * Changes the permissions of the symlink itself (not the target).
   * @param mode - File mode (permissions)
   *
   * @category Permissions
   */
  async chmod(mode: FS.Mode): Promise<void> {
    await nfs.lchmod(this._f, mode);
  }
}
