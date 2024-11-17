import { FSSpec } from './fsspec.ts';
import type { FilePath, FolderPath } from './types.ts';
import { assert } from 'jsr:@std/assert';

export type SymlinkSpecParam = FSSpec | SymlinkSpec | FolderPath | FilePath;

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
export class SymlinkSpec extends FSSpec {
  // @ts-ignore this does get initialized
  protected _f: FilePath | FolderPath;

  /**
   * Create a new FSItem object from an existing FSItem object, a file path or
   * an array of file path parts that can be merged using node:path#resolve.
   * @param {(FileSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
   */
  constructor(...args: (FSSpec | FolderPath | FilePath)[]) {
    super(...args);
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see FileSpec#copyTo
   */
  override copy(): SymlinkSpec {
    return this.copyParamsTo(new SymlinkSpec(this));
  }

  override copyParamsTo(target: SymlinkSpec): SymlinkSpec {
    super.copyParamsTo(target);
    return target;
  }

  override isFile(): Promise<boolean> {
    return super.isFile().then((resp: boolean) => {
      assert(resp === false, 'isFile() must be false');
      return resp;
    });
  }

  override isFolder(): Promise<boolean> {
    return super.isFolder().then((resp: boolean) => {
      assert(resp === false, 'isFolder() must be false');
      return resp;
    });
  }

  override isSymlink(): Promise<boolean> {
    return super.isSymlink().then((resp: boolean) => {
      assert(resp === true, 'isSymlink() must be true');
      return resp;
    });
  }
}
