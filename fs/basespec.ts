import { isError } from '@epdoc/type';
import * as dfs from '@std/fs';
import path from 'node:path';
import { FSStats } from './fsstats.ts';
import type { FilePath, FolderPath } from './types.ts';

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
   * Creates a new instance of BaseSpec by resolving the provided path parts.
   * The constructor accepts a variable number of arguments, which can be the
   * path from a FolderSpec of FSSpec, followed by strings representing the
   * path, or just path parts, or a single FileSpec path.
   *
   * @throws {Error} Throws an error if the parameters are invalid, such as if
   * multiple FileSpec instances are provided or if a FolderSpec or FSSpec is
   * used for anything other than the first argument.
   */
  // constructor(...args: FSSpecParam) {
  //   this._f = resolvePathArgs(...args);
  // }

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
