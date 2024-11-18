import { isArray, isError, isString } from '@epdoc/type';
import * as dfs from '@std/fs';
import os from 'node:os';
import path from 'node:path';
import { FileSpec } from './filespec.ts';
import { FolderSpec, folderSpec } from './folderspec.ts';
import { FSSpec } from './fsspec.ts';
import { FSStats } from './fsstats.ts';
import { type FilePath, type FolderPath, isFilePath, type SafeCopyOpts } from './types.ts';

export interface IBaseSpec {
  copy(): BaseSpec;
}

/**
 * Abstract class representing a file system item, which may be of unknown type,
 * a file, folder, or symlink.
 */
export abstract class BaseSpec {
  // @ts-ignore this does get initialized
  protected _f: FilePath | FolderPath;
  protected _stats: FSStats = new FSStats();
  protected _dirEntry: Deno.DirEntry | undefined;

  /**
   * Create a new FSItem object from an existing FSItem object, a file path or
   * an array of file path parts that can be merged using node:path#resolve.
   * @param {(BaseSpec | FolderPath | FilePath)[]} args - An FSItem, a path, or a spread of paths to be used with path.resolve
   */
  constructor(...args: (BaseSpec | FolderPath | FilePath)[]) {
    this._f = BaseSpec.fromArgs(...args);
    if (args.length === 1 && args[0] instanceof BaseSpec) {
      args[0].copyParamsTo(this);
    }
  }

  /**
   * Copies parameters from this FSSpec to the target FSSpec.
   * @param {BaseSpec} target - The target FSSpec to copy parameters to.
   * @returns {BaseSpec} - The target FSSpec with copied parameters.
   */
  copyParamsTo(target: BaseSpec): BaseSpec {
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

  static fromArgs(...args: (BaseSpec | FolderPath | FilePath)[]): string {
    const parts: string[] = [];
    for (let fdx = 0; fdx < args.length; fdx++) {
      const item = args[fdx];
      if (fdx !== args.length - 1 && item instanceof FileSpec) {
        throw new Error('Invalid FileSpec found');
      }
      if (item instanceof BaseSpec) {
        parts.push(item.path);
      } else if (isString(item)) {
        parts.push(item);
      } else {
        throw new Error('Invalid parameter');
      }
    }
    return path.resolve(...parts);
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
    return this.getStats().then((stats: FSStats) => {
      return stats.exists();
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
    return this.getStats().then(() => {
      return this._stats.isFile();
    });
  }

  getIsFolder(): Promise<boolean> {
    return this.getStats().then(() => {
      return this._stats.isDirectory();
    });
  }

  getIsSymlink(): Promise<boolean> {
    return this.getStats().then(() => {
      return this._stats.isSymlink();
    });
  }

  createdAt(): Date | undefined {
    if (this._stats.isInitialized()) {
      return this._stats.createdAt();
    }
  }

  getCreatedAt(): Promise<Date | undefined> {
    return this.getStats().then(() => {
      return this._stats.createdAt();
    });
  }

  /**
   * Removes this file or folder.
   * @param {Deno.RemoveOptions} options - Options for removing the file or folder.
   * @returns {Promise<void>} - A promise that resolves when the file or folder is removed.
   */
  remove(options: Deno.RemoveOptions = {}): Promise<void> {
    return this.getStats()
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
   * @param {FilePath | BaseSpec} dest - The destination path.
   * @param {dfs.CopyOptions} [options] - Options for the copy operation.
   * @returns {Promise<void>} - A promise that resolves when the copy is complete.
   */
  copyTo(dest: FilePath | BaseSpec, options?: dfs.CopyOptions): Promise<void> {
    const p: FilePath = dest instanceof BaseSpec ? dest.path : dest;
    return dfs.copy(this._f, p, options);
  }

  /**
   * Syncronous version of `copyTo` method.
   * @param dest
   * @param options An dfs.CopyOptionsSync object
   * @returns
   */
  copySync(dest: FilePath | BaseSpec, options?: dfs.CopyOptions): this {
    const p: FilePath = dest instanceof BaseSpec ? dest.path : dest;
    dfs.copySync(this._f, p, options);
    return this;
  }

  /**
   * Moves this file or folder to the location `dest`.
   * @param {FilePath | BaseSpec} dest - The new path for the file.
   * @param {dfs.MoveOptions} options - Options to overwrite and dereference symlinks.
   * @returns {Promise<void>} - A promise that resolves when the move is complete.
   */
  moveTo(dest: FilePath | BaseSpec, options?: dfs.MoveOptions): Promise<void> {
    const p: FilePath = dest instanceof BaseSpec ? dest.path : dest;
    return dfs.move(this._f, p, options);
  }

  /**
   * Copy an existing file or directory to a new location. Optionally creates a
   * backup if there is an existing file or directory at `destFile`.
   * @param {FilePath | BaseSpec} destFile - The destination file or directory.
   * @param {SafeCopyOpts} [opts={}] - Options for the copy or move operation.
   * @returns {Promise<boolean | undefined>} A promise that resolves with true if the file was copied or moved, false otherwise.
   */
  safeCopy(
    destFile: FilePath | FileSpec | FolderSpec,
    opts: SafeCopyOpts = {}
  ): Promise<boolean | undefined> {
    let fsSrc: FileSpec | FolderSpec;
    let fsDest: FileSpec | FolderSpec;
    return Promise.resolve()
      .then(() => {
        if (this instanceof FSSpec) {
          return this.getResolvedType();
        } else {
          return Promise.resolve(this);
        }
      })
      .then((resp) => {
        if (resp instanceof FileSpec || resp instanceof FolderSpec) {
          fsSrc = resp;
          return fsSrc.getExists();
        } else {
          throw new Error('Invalid safeCopy source');
        }
      })
      .then((exists: boolean | undefined) => {
        if (exists === false) {
          throw new Error('Does not exist: ' + this._f);
        }
        if (isFilePath(destFile)) {
          return new FSSpec(destFile).getResolvedType();
        } else if (destFile instanceof FileSpec || destFile instanceof FolderSpec) {
          fsDest = destFile;
        } else {
          throw new Error('Invalid safeCopy destination');
        }
      })
      .then(() => {
        if (fsDest instanceof FileSpec) {
          // The dest already exists. Deal with it
          return fsDest.backup(opts.conflictStrategy);
        }
        return Promise.resolve(true);
      })
      .then((bGoAhead: FilePath | boolean) => {
        if (bGoAhead) {
          const fsDestParent: FolderSpec = fsDest instanceof FolderSpec ? fsDest : folderSpec(fsDest.dirname);
          return Promise.resolve()
            .then(() => {
              if (opts.ensureParentDirs) {
                return fsDestParent.ensureDir();
              }
            })
            .then((_resp) => {
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
            });
        }
      });
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
