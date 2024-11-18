import { BaseSpec, type IBaseSpec } from './basespec.ts';
import { FileSpec, fileSpec, type FileSpecParam } from './filespec.ts';
import { FolderSpec, folderSpec, type FolderSpecParam } from './folderspec.ts';
import { SymlinkSpec, symlinkSpec, type SymlinkSpecParam } from './symspec.ts';
import type { FilePath, FolderPath } from './types.ts';

/**
 * Create a new FSItem object.
 * @param {(BaseSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
 * @returns {BaseSpec} - A new FSItem object
 */
export function fsSpec(
  ...args: (FSSpec | FolderPath | FilePath)[]
): FSSpec | FolderSpec | FileSpec | SymlinkSpec {
  if (args.length === 1 && args[0] instanceof FolderSpec) {
    return folderSpec(...(args as FolderSpecParam[]));
  } else if (args.length === 1 && args[0] instanceof FileSpec) {
    return fileSpec(...(args as FileSpecParam[]));
  } else if (args.length === 1 && args[0] instanceof SymlinkSpec) {
    return symlinkSpec(...(args as SymlinkSpecParam[]));
  }
  return new FSSpec(...args);
}

/**
 * Class representing a file system item, which may be a file, folder, or
 * symlink. This is to be used when you do not know the type of the file system
 * item at the time of creation.
 */
export class FSSpec extends BaseSpec implements IBaseSpec {
  copy(): FSSpec {
    return new FSSpec(this);
  }

  resolveType(): FSSpec | FolderSpec | FileSpec | SymlinkSpec {
    if (this.isFile() === true) {
      return fileSpec(this);
    } else if (this.isFolder() === true) {
      return folderSpec(this);
    } else if (this.isSymlink() === true) {
      return symlinkSpec(this);
    }
    return this;
  }

  getResolvedType(): Promise<BaseSpec> {
    return this.getStats().then(() => {
      return this.resolveType();
    });
  }
}
