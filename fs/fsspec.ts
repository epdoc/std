import { isArray } from '@epdoc/type';
import os from 'node:os';
import path from 'node:path';
import { BaseSpec } from './basespec.ts';
import { type FileSpec, fileSpec } from './filespec.ts';
import { type FolderSpec, folderSpec } from './folderspec.ts';
import { type FSSpecParam, type ICopyableSpec, type IRootableSpec, resolvePathArgs } from './icopyable.ts';
import { type SymlinkSpec, symlinkSpec } from './symspec.ts';


/**
 * Create a new FSItem object.
 * @param {(BaseSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
 * @returns {BaseSpec} - A new FSItem object
 */
export function fsSpec(...args: FSSpecParam): FSSpec {
  return new FSSpec(...args);
}

/**
 * Class representing a file system item, which may be a file, folder, or
 * symlink. This is to be used when you do not know the type of the file system
 * item at the time of creation.
 */
export class FSSpec extends BaseSpec implements ICopyableSpec, IRootableSpec {
  constructor(...args: FSSpecParam) {
    super();
    this._f = resolvePathArgs(...args);
  }

  copy(): FSSpec {
    return new FSSpec(this);
  }

  override copyParamsTo(target: BaseSpec): BaseSpec {
    super.copyParamsTo(target);
    return target;
  }

  resolveType(): FSSpec | FolderSpec | FileSpec | SymlinkSpec {
    let result: FSSpec | FolderSpec | FileSpec | SymlinkSpec;
    if (this.isFile() === true) {
      result = fileSpec(this);
    } else if (this.isFolder() === true) {
      result = folderSpec(this);
    } else if (this.isSymlink() === true) {
      result = symlinkSpec(this.path);
    } else {
      result = fsSpec(this);
    }
    this.copyParamsTo(result);
    return result;
  }

  getResolvedType(): Promise<FSSpec | FolderSpec | FileSpec | SymlinkSpec> {
    return this.getStats().then(() => {
      return this.resolveType();
    });
  }

  add(...args: string[]): FSSpec {
    if (args.length === 1 && isArray(args[0])) {
      return new FSSpec(path.resolve(this._f, ...args[0]));
    }
    return new FSSpec(path.resolve(this._f, ...args));
  }

  home(...args: string[]): FSSpec {
    return this.add(os.userInfo().homedir, ...args);
  }
}
