import { BaseSpec, type IBaseSpec } from './basespec.ts';
import type { FilePath, FolderPath } from './types.ts';

export type SymlinkSpecParam = BaseSpec | SymlinkSpec | FolderPath | FilePath;

/**
 * Create a new FSItem object.
 * @param {(FileSpec | FolderSpec | FolderPath | FilePath)[])} args - An FSItem, a path, or a spread of paths to be used with path.resolve
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
export class SymlinkSpec extends BaseSpec implements IBaseSpec {
  // @ts-ignore this does get initialized
  protected _f: FilePath | FolderPath;

  /**
   * Create a new FSItem object from an existing FSItem object, a file path or
   * an array of file path parts that can be merged using node:path#resolve.
   * @param {(FileSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
   */
  constructor(...args: (BaseSpec | FolderPath | FilePath)[]) {
    super(...args);
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see FileSpec#copyTo
   */
  copy(): SymlinkSpec {
    return new SymlinkSpec(this);
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