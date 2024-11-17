import { isArray, isError, isString } from '@epdoc/type';
import * as dfs from '@std/fs';
import os from 'node:os';
import path from 'node:path';
import { FileSpec, fileSpec, type FileSpecParam } from './filespec.ts';
import { FolderSpec, folderSpec, type FolderSpecParam } from './folderspec.ts';
import { FSStats } from './fsstats.ts';
import { SymlinkSpec, symlinkSpec } from './symspec.ts';
import type { FilePath, FolderPath, SafeCopyOpts } from './types.ts';

/**
 * Create a new FSItem object.
 * @param {(FSSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
 * @returns {FSSpec} - A new FSItem object
 */
export function fsSpec(...args: (FSSpec | FolderPath | FilePath)[]): FSSpec {
  if (args.length === 1 && args[0] instanceof FolderSpec) {
    return folderSpec(...(args as FolderSpecParam[]));
  } else if (args.length === 1 && args[0] instanceof FileSpec) {
    return fileSpec(...(args as FileSpecParam[]));
  }
  return new FSSpec(...args);
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
export class FSSpec {
  // @ts-ignore this does get initialized
  protected _f: FilePath | FolderPath;
  protected _stats: FSStats = new FSStats();
  protected _dirEntry: Deno.DirEntry | undefined;

  /**
   * Create a new FSItem object from an existing FSItem object, a file path or
   * an array of file path parts that can be merged using node:path#resolve.
   * @param {(FSSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
   */
  constructor(...args: (FSSpec | FolderPath | FilePath)[]) {
    this._f = FSSpec.fromArgs(...args);
    if (args.length === 1 && args[0] instanceof FSSpec) {
      args[0].copyParamsTo(this);
    }
  }

  /**
   * Copies parameters from this FSSpec to the target FSSpec.
   * @param {FSSpec} target - The target FSSpec to copy parameters to.
   * @returns {FSSpec} - The target FSSpec with copied parameters.
   */
  copyParamsTo(target: FSSpec): FSSpec {
    target._stats = this._stats;
    target._dirEntry = this._dirEntry;
    return target;
  }

  get path(): FilePath {
    return this._f;
  }

  /**
   * Returns '/path/to' portion of /path/to/file.name.html'
   */
  get dirname(): string {
    return path.dirname(this._f);
  }

  /**
   * Returns the full filename of the file or folder, including it's extension.
   * For example, '/path/to/file.name.html' would return 'file.name.html'.
   * @return {string} - The full file or folder name, including it's extension, if unknown.
   */
  get filename(): string {
    return path.basename(this._f);
  }

  setStats(stats: FSStats): this {
    this._stats = stats;
    return this;
  }

  setDirEntry(dirEntry: Deno.DirEntry | undefined): this {
    this._dirEntry = dirEntry;
    return this;
  }

  /**
   * Getter returns the FSStats object associated with this file. A previous
   * call to getStats() is needed in order to read stats from disk.
   * @return {FSStats} - The FSStats for this file, if they have been read.
   */
  get stats(): FSStats {
    return this._stats;
  }

  /**
   * Checks if the stats for this file or folder are initialized.
   * @returns {boolean} - True if stats are initialized, false otherwise.
   */
  hasStats(): boolean {
    return this._stats.isInitialized();
  }

  get hasFileSize(): boolean {
    return this._stats.size !== -1;
  }

  copy(): FSSpec {
    return new FSSpec(this);
  }

  static fromArgs(...args: (FSSpec | FolderPath | FilePath)[]): string {
    const parts: string[] = [];
    for (let fdx = 0; fdx < args.length; fdx++) {
      const item = args[fdx];
      if (fdx !== args.length - 1 && item instanceof FileSpec) {
        throw new Error('Invalid FileSpec found');
      }
      if (item instanceof FSSpec) {
        parts.push(item.path);
      } else if (isString(item)) {
        parts.push(item);
      } else {
        throw new Error('Invalid parameter');
      }
    }
    return path.resolve(...parts);
  }

  static fromDirEntry(path: FolderPath, entry: Deno.DirEntry): FSSpec {
    const fsspec = new FSSpec(path, entry.name);
    fsspec._dirEntry = entry;
    return fsspec.resolveType();
  }

  static fromWalkEntry(entry: dfs.WalkEntry): FSSpec {
    const fsspec = new FSSpec(entry.path);
    fsspec._dirEntry = entry;
    return fsspec.resolveType();
  }

  /**
   * Append a file or folder name to this.f.
   * @param args A file name or array of file names.
   * @returns This
   */
  add(...args: FilePath[] | FolderPath[]): this {
    if (args.length === 1) {
      if (isArray(args[0])) {
        this._f = path.resolve(this._f, ...args[0]);
      } else {
        this._f = path.resolve(this._f, args[0]);
      }
    } else if (args.length > 1) {
      this._f = path.resolve(this._f, ...args);
    }
    return this;
  }

  /**
   * Set the path relative to the home dir
   */
  home(...args: FilePath[] | FolderPath[]): this {
    this._f = os.userInfo().homedir;
    if (args) {
      this.add(...args);
    }
    return this;
  }

  /**
   * Retrieves the stats for this file or folder and returns a new instance of FileSpec, FolderSpec, or SymlinkSpec.
   * @param {boolean} force - Force retrieval of the stats, even if they have already been retrieved.
   * @returns {Promise<FSSpec | FileSpec | FolderSpec | SymlinkSpec>} - A promise with an FSSpec or one of its subclasses.
   */
  public getStats(force = false): Promise<FSStats> {
    if (force || !this._stats.isInitialized()) {
      return (
        Promise.resolve(this)
          .then(() => {
            return Deno.lstat(this._f);
          })
          // @ts-ignore xxx Trying to find a way to quiet this error
          .then((resp: Deno.FileInfo) => {
            this._stats = new FSStats(resp);
            return Promise.resolve(this._stats);
          })
          .catch((_err) => {
            this._stats = new FSStats();
            return Promise.resolve(this._stats);
          })
      );
    } else {
      return Promise.resolve(this._stats);
    }
  }

  resolveType(): FSSpec {
    if (this.isFile() === true) {
      return fileSpec(this);
    } else if (this.isFolder() === true) {
      return folderSpec(this);
    } else if (this.isSymlink() === true) {
      return symlinkSpec(this);
    }
    return this;
  }

  getResolvedType(): Promise<FSSpec> {
    return this.getResolvedType().then(() => {
      return this.resolveType();
    });
  }

  exists(): boolean | undefined {
    if (this._dirEntry) {
      return true;
    }
    if (this._stats.isInitialized()) {
      return this._stats.exists();
    }
  }

  /**
   * Does this file or folder exist? Will retrieve the FSStats for the file
   * system entry if they haven't been previously read.
   * @returns a promise with value true if this exists.
   */
  getExists(): Promise<boolean> {
    return this.getResolvedType().then(() => {
      return this instanceof FileSpec || this instanceof FolderSpec || this instanceof SymlinkSpec;
    });
  }

  knowType(): boolean {
    return this._dirEntry || this._stats.isInitialized() ? true : false;
  }

  isFile(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isFile;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isFile();
    }
  }

  isFolder(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isDirectory;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isDirectory();
    }
  }

  isSymlink(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isSymlink;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isSymlink();
    }
  }

  getIsFile(): Promise<boolean> {
    return this.getResolvedType().then(() => {
      return this._stats.isFile();
    });
  }

  getIsFolder(): Promise<boolean> {
    return this.getResolvedType().then(() => {
      return this._stats.isDirectory();
    });
  }

  getIsSymlink(): Promise<boolean> {
    return this.getResolvedType().then(() => {
      return this._stats.isSymlink();
    });
  }

  createdAt(): Date | undefined {
    if (this._stats.isInitialized()) {
      return this._stats.createdAt();
    }
  }

  getCreatedAt(): Promise<Date | undefined> {
    return this.getResolvedType().then(() => {
      return this._stats.createdAt();
    });
  }

  /**
   * Removes this file or folder.
   * @param {Deno.RemoveOptions} options - Options for removing the file or folder.
   * @returns {Promise<void>} - A promise that resolves when the file or folder is removed.
   */
  remove(options: Deno.RemoveOptions = {}): Promise<void> {
    return this.getResolvedType()
      .then(() => {
        if (this._stats.exists()) {
          return Deno.remove(this._f, options);
        }
      })
      .catch((err) => {
        if (err && err.code === 'ENOTEMPTY') {
          err.message += ', set recursive option to true to delete non-empty folders.';
        }
        return Promise.reject(err);
      });
  }

  /**
   * Copies this file or folder to the location `dest`.
   * @param {FilePath | FSSpec} dest - The destination path.
   * @param {dfs.CopyOptions} [options] - Options for the copy operation.
   * @returns {Promise<void>} - A promise that resolves when the copy is complete.
   */
  copyTo(dest: FilePath | FSSpec, options?: dfs.CopyOptions): Promise<void> {
    const p: FilePath = dest instanceof FSSpec ? dest.path : dest;
    return dfs.copy(this._f, p, options);
  }

  /**
   * Syncronous version of `copyTo` method.
   * @param dest
   * @param options An dfs.CopyOptionsSync object
   * @returns
   */
  copySync(dest: FilePath | FSSpec, options?: dfs.CopyOptions): this {
    const p: FilePath = dest instanceof FSSpec ? dest.path : dest;
    dfs.copySync(this._f, p, options);
    return this;
  }

  /**
   * Moves this file or folder to the location `dest`.
   * @param {FilePath | FSSpec} dest - The new path for the file.
   * @param {dfs.MoveOptions} options - Options to overwrite and dereference symlinks.
   * @returns {Promise<void>} - A promise that resolves when the move is complete.
   */
  moveTo(dest: FilePath | FSSpec, options?: dfs.MoveOptions): Promise<void> {
    const p: FilePath = dest instanceof FSSpec ? dest.path : dest;
    return dfs.move(this._f, p, options);
  }

  /**
   * Copy an existing file or directory to a new location. Optionally creates a
   * backup if there is an existing file or directory at `destFile`.
   * @param {FilePath | FSSpec} destFile - The destination file or directory.
   * @param {SafeCopyOpts} [opts={}] - Options for the copy or move operation.
   * @returns {Promise<boolean | undefined>} A promise that resolves with true if the file was copied or moved, false otherwise.
   */
  async safeCopy(destFile: FilePath | FSSpec, opts: SafeCopyOpts = {}): Promise<boolean | undefined> {
    await this.getResolvedType();

    if (this._stats && this._stats.exists()) {
      let fsDest: FSSpec = destFile instanceof FSSpec ? destFile : fsSpec(destFile);
      fsDest = await fsDest.getResolvedType();

      let bGoAhead: FilePath | boolean = true;
      const fsDestParent: FolderSpec = fsDest instanceof FolderSpec ? fsDest : folderSpec(fsDest.dirname);

      if (fsDest instanceof FileSpec) {
        bGoAhead = false;
        // The dest already exists. Deal with it
        bGoAhead = await fsDest.backup(opts.conflictStrategy);
      }

      if (bGoAhead) {
        if (opts.ensureParentDirs) {
          await fsDestParent.ensureDir();
        }

        if (opts.move) {
          return this.moveTo(fsDestParent.path, { overwrite: true }).then((_resp) => {
            // console.log(`  Moved ${srcFile} to ${destPath}`);
            return Promise.resolve(true);
          });
        } else {
          return this.copyTo(fsDestParent.path, { overwrite: true }).then((_resp) => {
            // console.log(`  Copied ${srcFile} to ${destPath}`);
            return Promise.resolve(true);
          });
        }
      } else {
        return Promise.resolve(false);
      }
    } else {
      // This shouldn't happen. The caller should know the file exists before
      // calling this method.
      throw this.newError('ENOENT', 'File does not exist');
    }
  }

  /**
   * Creates a new Error with the specified code and message, including the file path.
   * @param {unknown} code - The error code or Error object.
   * @param {string} [message] - The error message.
   * @returns {Error} A new Error object.
   */
  newError(code: unknown, message?: string): Error {
    if (isError(code)) {
      code.message = `${code.message}: ${this._f}`;
      return code;
    }
    const err: Error = new Error(`${message}: ${this._f}`);
    // @ts-ignore xxx
    err.code = code;
    return err;
  }
}
