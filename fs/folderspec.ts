import { compareDictValue, type Dict, isArray, isDict, isNumber, isRegExp, isString } from '@epdoc/type';
import * as dfs from '@std/fs';
import os from 'node:os';
import path from 'node:path';
import { BaseSpec } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import { FSSpec, fsSpec } from './fsspec.ts';
import {
  type FSSpecParam,
  type IRootableSpec,
  type ISafeCopyableSpec,
  resolvePathArgs,
} from './icopyable.ts';
import { safeCopy, type SafeCopyOpts } from './safecopy.ts';
import { SymlinkSpec } from './symspec.ts';
import type { FileName, FilePath, FolderName, FolderPath, FSSortOpts, GetChildrenOpts } from './types.ts';

function fromDirEntry(path: FolderPath, entry: Deno.DirEntry): FileSpec | FolderSpec | SymlinkSpec | FSSpec {
  if (entry.isDirectory) {
    return new FolderSpec(path, entry.name).setDirEntry(entry);
  } else if (entry.isFile) {
    return new FileSpec(path, entry.name).setDirEntry(entry);
  } else if (entry.isSymlink) {
    return new SymlinkSpec(path, entry.name).setDirEntry(entry);
  }
  return new FSSpec(path, entry.name).setDirEntry(entry);
}

function fromWalkEntry(entry: dfs.WalkEntry): BaseSpec {
  const result = fsSpec(entry.path).setDirEntry(entry);
  if (result instanceof FSSpec) {
    return result.resolveType();
  }
  return result;
}

/**
 * Create a new FolderSpec object.
 */
export function folderSpec(...args: FSSpecParam): FolderSpec {
  return new FolderSpec(...args);
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
export class FolderSpec extends BaseSpec implements ISafeCopyableSpec, IRootableSpec {
  // @ts-ignore this does get initialized
  // Test to see if _folders and _files have been read
  protected _haveReadFolderContents: boolean = false;
  // If this is a folder, contains a filtered list of folders within this folder
  protected _folders: FolderSpec[] = [];
  // If this is a folder, contains a filtered list of files within this folder
  protected _files: FileSpec[] = [];
  // If this is a folder, contains a filtered list of symlinks within this folder
  protected _symlinks: SymlinkSpec[] = [];
  // Stores the strings that were used to create the path. This property may be deprecated at unknown time.
  protected _args: (FilePath | FolderPath)[] = [];

  constructor(...args: FSSpecParam) {
    super();
    this._f = resolvePathArgs(...args);
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see BaseSpec#copyTo
   */
  copy(): FolderSpec {
    const result = new FolderSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  override copyParamsTo(target: BaseSpec): BaseSpec {
    super.copyParamsTo(target);
    if (target instanceof FolderSpec) {
      target._haveReadFolderContents = this._haveReadFolderContents;
      target._folders = this._folders.map((item) => {
        return item.copy();
      });
      target._files = this._files.map((item) => {
        return item.copy();
      });
      target._symlinks = this._symlinks.map((item) => {
        return item.copy();
      });
    }
    return target;
  }

  /**
   * For folders, indicates if we have read the folder's contents.
   * @returns {boolean} - true if this is a folder and we have read the folder's contents.
   */
  haveReadFolderContents(): boolean {
    return this._haveReadFolderContents;
  }

  override isFile(): boolean | undefined {
    return false;
  }

  override isFolder(): boolean | undefined {
    return true;
  }

  override isSymlink(): boolean | undefined {
    return false;
  }

  /**
   * Get the list of FSItem files that matched a previous call to getFiles() or
   * getChildren().
   * @returns {BaseSpec[]} Array of FSItem objects representing files.
   */
  get files(): FileSpec[] {
    return this._files;
  }

  /**
   * Get the list of filenames that matched a previous call to getFolders() or
   * getChildren().
   * @returns {FileName[]} Array of filenames.
   */
  get filenames(): FileName[] {
    return this._files.map((fs: FileSpec) => {
      return fs.filename;
    });
  }

  /**
   * Get the list of FSItem folders that matched a previous call to getFolders() or
   * getChildren().
   * @returns {BaseSpec[]} Array of FSItem objects representing folders.
   */
  get folders(): FolderSpec[] {
    return this._folders;
  }

  /**
   * Get the list of folder names that matched a previous call to getFolders() or
   * getChildren().
   * @returns {FolderName[]} Array of folder names.
   */
  get folderNames(): FolderName[] {
    return this._folders.map((fs) => {
      return fs.filename;
    });
  }

  add(...args: string[]): FolderSpec {
    if (args.length === 1 && isArray(args[0])) {
      return new FolderSpec(path.resolve(this._f, ...args[0]));
    }
    return new FolderSpec(path.resolve(this._f, ...args));
  }

  home(...args: string[]): FolderSpec {
    return this.add(os.userInfo().homedir, ...args);
  }

  /**
   * Ensures there is a folder with this path.
   * @returns {Promise<void>} A promise that resolves when the directory is ensured.
   */
  ensureDir(): Promise<void> {
    return dfs.ensureDir(this._f);
  }

  /**
   * Synchronous version of `ensureDir`.
   * @param {fx.EnsureDirOptions | number} [options] Options for ensuring the directory.
   * @returns {this} The current FSItem instance.
   */
  ensureDirSync(): this {
    dfs.ensureDirSync(this._f);
    return this;
  }

  async ensureParentDir(): Promise<void> {
    await dfs.ensureDir(this.dirname);
  }


  async readDir(): Promise<BaseSpec[]> {
    const results: BaseSpec[] = [];
    for await (const entry of Deno.readDir(this._f)) {
      results.push(fromDirEntry(this.path, entry));
    }
    return results;
  }

  async getFiles(regex?: RegExp): Promise<FileSpec[]> {
    const results: FileSpec[] = [];
    for await (const entry of Deno.readDir(this._f)) {
      if (entry.isFile) {
        if (!regex || regex.test(entry.name)) {
          const fileSpec = new FileSpec(this.path, entry.name).setDirEntry(entry);
          results.push(fileSpec);
        }
      }
    }
    return results;
  }

  async getFolders(regex?: RegExp): Promise<FolderSpec[]> {
    const results: FolderSpec[] = [];
    for await (const entry of Deno.readDir(this._f)) {
      if (entry.isDirectory) {
        if (!regex || regex.test(entry.name)) {
          const folderSpec = new FolderSpec(this.path, entry.name).setDirEntry(entry);
          results.push(folderSpec);
        }
      }
    }
    return results;
  }

  async walk(opts: dfs.WalkOptions): Promise<BaseSpec[]> {
    const entries = await Array.fromAsync(dfs.walk(this._f, opts));

    return entries.map((entry) => fromWalkEntry(entry));
  }

  /**
   * Retrieves the list of files and folders within this folder, optionally matching
   * a specified pattern and limiting the depth of the search.
   *
   * @param {GetChildrenOpts} options - Options for retrieving children.
   * @param {string | RegExp} [options.match] - A string or regular expression to match file or folder names.
   * @param {number} [options.levels=1] - The number of levels to traverse. Defaults to 1.
   * @param {function} [options.callback] - A callback function to be called for each matched item.
   * @param {Object} [options.sort] - Sorting options for the results.
   * @returns {Promise<BaseSpec[]>} - A promise that resolves to an array of FSSpec objects representing the files and folders.
   *
   * @example
   * ```ts
   * const folder = new FolderSpec('/path/to/folder');
   * folder.getChildren({ match: /\.txt$/, levels: 2 })
   *   .then(children => {
   *     console.log('Matched children:', children);
   *   })
   *   .catch(error => {
   *     console.error('Error retrieving children:', error);
   *   });
   * ```
   */
  getChildren(options: GetChildrenOpts = { levels: 1 }): Promise<BaseSpec[]> {
    const opts: GetChildrenOpts = {
      match: options.match,
      levels: isNumber(options.levels) ? options.levels - 1 : 0,
      callback: options.callback,
      sort: isDict(options.sort) ? options.sort : {},
    };
    const all: BaseSpec[] = [];
    this._folders = [];
    this._files = [];
    this._symlinks = [];
    this._haveReadFolderContents = false;
    return Promise.resolve()
      .then(async () => {
        const jobs: Promise<unknown>[] = [];
        for await (const entry of Deno.readDir(this._f)) {
          const fs = fromDirEntry(this.path, entry);
          let bMatch = false;
          if (opts.match) {
            if (isString(opts.match) && entry.name === opts.match) {
              bMatch = true;
            } else if (isRegExp(opts.match) && opts.match.test(entry.name)) {
              bMatch = true;
            }
          } else {
            bMatch = true;
          }
          if (bMatch) {
            all.push(fs);
            if (opts.callback) {
              const job1 = opts.callback(fs);
              jobs.push(job1);
            }
            if (fs instanceof FolderSpec) {
              this._folders.push(fs);
              if ((opts.levels as number) > 0) {
                const job2 = fs.getChildren(opts);
                jobs.push(job2);
              }
            } else if (fs instanceof FileSpec) {
              this._files.push(fs);
            } else if (fs instanceof SymlinkSpec) {
              this._symlinks.push(fs);
            }
          }
        }
        return Promise.all(jobs);
      })
      .then((_resp) => {
        this._haveReadFolderContents = true;
        if (isDict(opts.sort)) {
          this.sortChildren(opts.sort);
        }
        return Promise.resolve(all);
      });
  }

  /**
   * Sorts the children (files and folders) of this FSItem.
   * @param {FSSortOpts} [opts={}] - Sorting options.
   * @returns {void}
   */
  public sortChildren(opts: FSSortOpts = {}) {
    this._folders = FolderSpec.sortByFilename(this._folders) as FolderSpec[];
    if (opts.type === 'size') {
      this._files = FolderSpec.sortFilesBySize(this._files) as FileSpec[];
    } else {
      this._files = FolderSpec.sortByFilename(this._files) as FileSpec[];
    }
    if (opts.direction === 'descending') {
      this._folders = this._folders.reverse();
      this._files = this._files.reverse();
    }
  }

  safeCopy(destFile: FilePath | FileSpec | FolderSpec | FSSpec, opts: SafeCopyOpts = {}): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  /**
   * Sorts the files of this FSItem alphabetically.
   * @returns {this} The current FSItem instance.
   */
  static sortByFilename(items: (FileSpec | FolderSpec)[]): (FileSpec | FolderSpec)[] {
    return items.sort((a, b) => {
      return compareDictValue(a as unknown as Dict, b as unknown as Dict, 'filename');
    });
  }

  /**
   * Sorts the files of this FSItem by size. Run getChildren() first.
   * @returns {this} The current FSItem instance.
   */
  static sortFilesBySize(items: BaseSpec[]): BaseSpec[] {
    return items
      .filter((item) => item instanceof FileSpec)
      .sort((a, b) => {
        return compareDictValue(a as unknown as Dict, b as unknown as Dict, 'size');
      });
  }

  /**
   * Compare the files in two folders to see if they are identical. This is not
   * a deep compare, and ignores subfolders.
   * @param folder
   * @param filter
   * @param opts
   * @returns
   */
  async compare(folder: FolderSpec, filter?: RegExp, opts: { checksum?: boolean } = {}): Promise<boolean> {
    let bFiles = await folder.getFiles(filter);
    let aFiles = await this.getFiles(filter);
    bFiles = FolderSpec.sortByFilename(bFiles) as FileSpec[];
    aFiles = FolderSpec.sortByFilename(aFiles) as FileSpec[];
    if (aFiles.length !== bFiles.length) {
      return false;
    }
    for (let fdx = 0; fdx < aFiles.length; ++fdx) {
      const aFile = aFiles[fdx];
      const bFile = bFiles[fdx];
      if (aFile.filename.toLowerCase() !== bFile.filename.toLowerCase()) {
        return false;
      }
      const aSize = await aFile.getSize();
      const bSize = await bFile.getSize();
      if (aSize !== bSize) {
        return false;
      }
      if (opts.checksum) {
        const aChecksum = await aFile.checksum();
        const bChecksum = await bFile.checksum();
        if (aChecksum !== bChecksum) {
          return false;
        }
      }
    }
    return true;
  }
}
