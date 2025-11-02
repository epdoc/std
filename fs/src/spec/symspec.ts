import * as util from '$util';
import { promises as nfs } from 'node:fs';
import type { FilePath, FolderPath, PathSegment } from '../types.ts';
import type * as FS from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { FSSpec } from './fsspec.ts';
import type { ICopyableSpec } from './icopyable.ts';

/**
 * An object representing a file system entry, which may be either a file or a
 * folder.
 *
 * Has methods to:
 *  - Retrieve properties of an existing file or folder.
 *  - Manipulate file paths.
 *  - Recursive support for reading the contents of folders
 *  - Safe copy and backup methods for an existing file or folder
 *  - Reading and writing files
 *  - Getting the creation dates of files, including using the metadata of some file formats
 *  - Testing files for equality
 */
export class SymlinkSpec extends FSSpecBase implements ICopyableSpec {
  /**
   * Public constructor for SymlinkSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: PathSegment[]) {
    super();
    // Symlinks can point to either files or folders, so we use FSPath.
    this._f = util.resolvePathArgs(...args) as FilePath | FolderPath;
  }

  /**
   * Return a copy of this object. Does not copy the file.
   */
  copy(): SymlinkSpec {
    return new SymlinkSpec(this);
  }

  safeCopy(_destFile: FilePath | FileSpec | FolderSpec | FSSpec, _opts: util.SafeCopyOpts = {}): Promise<boolean> {
    throw new Error('Cannot copy a symlink');
  }

  override copyParamsTo(target: SymlinkSpec): SymlinkSpec {
    super.copyParamsTo(target);
    return target;
  }

  /**
   * Changes the owner of the symlink (not the target).
   * @param uid - User ID
   * @param gid - Group ID (optional)
   */
  async chown(uid: FS.UID, gid?: FS.GID): Promise<void> {
    await nfs.lchown(this._f, uid, gid ?? -1);
  }

  /**
   * Changes the group of the symlink (not the target).
   * @param gid - Group ID
   */
  async chgrp(gid: FS.GID): Promise<void> {
    await nfs.lchown(this._f, -1, gid);
  }

  /**
   * Changes the permissions of the symlink (not the target).
   * @param mode - File mode (permissions)
   */
  async chmod(mode: FS.Mode): Promise<void> {
    await nfs.lchmod(this._f, mode);
  }
}
