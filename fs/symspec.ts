import { BaseSpec } from './basespec.ts';
import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { FSSpec } from './fsspec.ts';
import type { ICopyableSpec } from './icopyable.ts';
import type { SafeCopyOpts } from './safecopy.ts';
import type { FilePath, FolderPath } from './types.ts';

export type SymlinkSpecParam = FolderPath | FilePath;

/**
 * Create a new FSItem object.
 * @param {(FileSpec | FolderSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
 * @returns {FileSpec} - A new FSItem object
 */
export function symlinkSpec(...args: SymlinkSpecParam[]): SymlinkSpec {
  return new SymlinkSpec(...args);
}

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
export class SymlinkSpec extends BaseSpec implements ICopyableSpec {
  /**
   * Return a copy of this object. Does not copy the file.
   * @see FileSpec#copyTo
   */
  copy(): SymlinkSpec {
    const result = new SymlinkSpec(this.path);
    this.copyParamsTo(result);
    return result;
  }

  safeCopy(_destFile: FilePath | FileSpec | FolderSpec | FSSpec, _opts: SafeCopyOpts = {}): Promise<boolean> {
    throw new Error('Cannot copy a symlink');
  }

  override copyParamsTo(target: SymlinkSpec): SymlinkSpec {
    super.copyParamsTo(target);
    return target;
  }

  override isFile(): boolean | undefined {
    return false;
  }

  override isFolder(): boolean | undefined {
    return false;
  }

  override isSymlink(): boolean | undefined {
    return true;
  }
}
