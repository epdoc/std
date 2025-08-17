import { _, type Dict } from '@epdoc/type';
import * as dfs from '@std/fs';
import { fromFileUrl } from '@std/path';
import os from 'node:os';
import path from 'node:path';
import { BaseSpec } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import { FSSpec } from './fsspec.ts';
import { type FSSpecParam, type IRootableSpec, type ISafeCopyableSpec, resolvePathArgs } from './icopyable.ts';
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

function fromWalkEntry(entry: dfs.WalkEntry): FileSpec | FolderSpec | SymlinkSpec | FSSpec {
  if (entry.isDirectory) {
    return new FolderSpec(entry.path).setDirEntry(entry);
  } else if (entry.isFile) {
    return new FileSpec(entry.path).setDirEntry(entry);
  } else if (entry.isSymlink) {
    return new SymlinkSpec(entry.path).setDirEntry(entry);
  }
  return new FSSpec(entry.path).setDirEntry(entry);
}

/**
 * Factory function to create a new FolderSpec object.
 */
export function folderSpec(...args: FSSpecParam): FolderSpec {
  return new FolderSpec(...args);
}

export type FolderDiff = {
  missing: FileName[];
  added: FileName[];
  diff: FileName[];
};

export type WalkOptions = dfs.WalkOptions;

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
   * Creates a new FolderSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * @param {string} metaUrl - The `import.meta.url` of the calling module.
   * @param {...string[]} paths - Additional path segments to join.
   * @returns {FolderSpec} A new FolderSpec instance.
   *
   * @example
   * // Assuming this code is in /path/to/your/project/src/app.ts
   * const dataFolder = FolderSpec.fromMeta(import.meta.url, '../data');
   * // dataFolder.path will be /path/to/your/project/data
   */
  public static fromMeta(metaUrl: string, ...paths: string[]): FolderSpec {
    const dir = path.dirname(fromFileUrl(metaUrl));
    return new FolderSpec(path.join(dir, ...paths));
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
    if (args.length === 1 && _.isArray(args[0])) {
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

  /**
   * Reads the contents of the directory and returns an array of BaseSpec objects
   * representing both files and folders.
   * @returns {Promise<BaseSpec[]>} Array of BaseSpec objects for directory entries
   */
  async readDir(): Promise<BaseSpec[]> {
    const results: BaseSpec[] = [];
    for await (const entry of Deno.readDir(this._f)) {
      results.push(fromDirEntry(this.path, entry));
    }
    return results;
  }

  /**
   * Returns an array of FileSpec objects for files in the directory that match
   * the optional regex pattern.
   * @param {RegExp} [regex] - Optional regular expression to filter filenames
   * @returns {Promise<FileSpec[]>} Array of FileSpec objects for matching files
   */
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

  /**
   * Returns an array of FolderSpec objects for subdirectories that match
   * the optional regex pattern.
   * @param {RegExp} [regex] - Optional regular expression to filter folder names
   * @returns {Promise<FolderSpec[]>} Array of FolderSpec objects for matching folders
   */
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

  /**
   * Recursively walks through the directory tree and returns all matching entries.
   *
   * @param {dfs.WalkOptions} opts - Options for the walk:
   *   - maxDepth?: number - Maximum directory depth to traverse
   *   - includeFiles?: boolean - Whether to include files (default: true)
   *   - includeDirs?: boolean - Whether to include directories (default: true)
   *   - match?: RegExp[] - Array of patterns to match against
   *   - skip?: RegExp[] - Array of patterns to skip
   * @returns {Promise<BaseSpec[]>} Array of BaseSpec objects for matched entries
   *
   * @example
   * // Find all files ending in 2 digits (e.g. metadata-01.json)
   * const folder = new FolderSpec("./data");
   * const results = await folder.walk({
   *   includeFiles: true,
   *   includeDirs: false,
   *   match: [/\-\d{2}\..*$/]
   * });
   * // Results: [
   * //   FileSpec { path: "data/metadata-01.json" },
   * //   FileSpec { path: "data/chapter-42.md" }
   * // ]
   */
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
      levels: _.isNumber(options.levels) ? options.levels - 1 : 0,
      callback: options.callback,
      sort: _.isDict(options.sort) ? options.sort : {},
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
            if (_.isString(opts.match) && entry.name === opts.match) {
              bMatch = true;
            } else if (_.isRegExp(opts.match) && opts.match.test(entry.name)) {
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
        if (_.isDict(opts.sort)) {
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
      return _.compareValues(a as unknown as Dict, b as unknown as Dict, 'filename');
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
        return _.compareValues(a as unknown as Dict, b as unknown as Dict, 'size');
      });
  }

  /**
   * Shallow comparison of the files in two folders to see if they are
   * identical. This is not a deep compare, and ignores subfolders.
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
      const bEqual = await filesEqual(aFile, bFile, opts);
      if (!bEqual) {
        return false;
      }
    }
    return true;
  }

  /**
   * Shallow comparison of the files in two folders to see if they are
   * identical. This is not a deep compare, and ignores subfolders.
   * @param folder
   * @param filter
   * @param opts
   * @returns
   */
  async getDiff(folder: FolderSpec, filter?: RegExp, opts: { checksum?: boolean } = {}): Promise<FolderDiff> {
    const result: FolderDiff = { missing: [], added: [], diff: [] };
    let aFiles = await this.getFiles(filter);
    let bFiles = await folder.getFiles(filter);
    aFiles = FolderSpec.sortByFilename(aFiles) as FileSpec[];
    bFiles = FolderSpec.sortByFilename(bFiles) as FileSpec[];
    for (let adx = 0; adx < aFiles.length; ++adx) {
      const aFile = aFiles[adx];
      const bFile = bFiles.find((file) => {
        return file.filename === aFile.filename;
      });
      if (!bFile) {
        result.missing.push(aFile.filename);
      } else {
        const bEqual = await filesEqual(aFile, bFile, opts);
        if (!bEqual) {
          result.diff.push(aFile.filename);
        }
      }
    }
    for (let bdx = 0; bdx < bFiles.length; ++bdx) {
      const bFile = bFiles[bdx];
      const aFile = aFiles.find((file) => {
        return file.filename === bFile.filename;
      });
      if (!aFile) {
        result.added.push(bFile.filename);
      }
    }

    return result;
  }
}

async function filesEqual(
  aFile: FileSpec,
  bFile: FileSpec,
  opts: { checksum?: boolean } = { checksum: true },
): Promise<boolean> {
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
  return true;
}
