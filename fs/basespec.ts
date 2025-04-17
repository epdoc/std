import path from 'node:path';
import { dfs } from './dep.ts';
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

  /**
   * Getter that returns the resolved file system path.
   * @returns {FilePath} The full path of the file system item.
   */
  get path(): FilePath {
    return this._f;
  }

  /**
   * Gets the directory portion of the file system path.
   * For example, for '/path/to/file.name.html', returns '/path/to'.
   * @returns {string} The directory name.
   */
  get dirname(): string {
    return path.dirname(this._f);
  }

  /**
   * Gets the filename (with extension) of the file system item.
   * For example, for '/path/to/file.name.html', returns 'file.name.html'.
   * @returns {string} The filename.
   */
  get filename(): string {
    return path.basename(this._f);
  }

  /**
   * Sets the FSStats for this file system item.
   * @param {FSStats} stats - An instance of FSStats representing file statistics.
   * @returns {this} The current instance for chaining.
   */
  setStats(stats: FSStats): this {
    this._stats = stats;
    return this;
  }

  /**
   * Sets the directory entry for this file system item.
   * @param {Deno.DirEntry | undefined} dirEntry - The Deno.DirEntry object, or undefined if not applicable.
   * @returns {this} The current instance for chaining.
   */
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

  /**
   * If this is a file, have we already determined the file's size in bytes?
   * @returns {boolean} - True if we know the file size, false otherwise
   */
  get hasFileSize(): boolean {
    return this._stats.size !== -1;
  }

  /**
   * Async call to retrieve the stats for this file or folder and returns a new
   * instance of FileSpec, FolderSpec, or SymlinkSpec.
   * @param {boolean} force - Force retrieval of the stats, even if they have
   * already been retrieved.
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

  /**
   * Checks if the file or folder exists.
   *
   * It is recommended to use getExists() unless it is known that getStats() has
   * already be executed.
   *
   * @returns {boolean | undefined} True if the item exists, or undefined if not
   * determined.
   */
  exists(): boolean | undefined {
    if (this._dirEntry) {
      return true;
    }
    if (this._stats.isInitialized()) {
      return this._stats.exists();
    }
  }

  /**
   * Async check if this file or folder exist? Will retrieve the FSStats for the
   * file system entry if they haven't been previously read.
   * @returns a promise with value true if this exists.
   */
  getExists(): Promise<boolean> {
    return this.getStats().then((stats: FSStats) => {
      return stats.exists();
    });
  }

  /**
   * Determines if the file system item type is known (i.e. is the item a file, folder or symlink)
   * Returns true if a directory entry is available or if the stats are initialized.
   * @returns {boolean} True if the type is known, false otherwise.
   * @experimental Use hasStats() where possible
   */
  knowType(): boolean {
    return this._dirEntry || this._stats.isInitialized() ? true : false;
  }

  /**
   * Checks if the file system item is a file.
   *
   * It is recommended to use getIsFile() unless it is known that getStats() has
   * already be executed.
   *
   * @returns {boolean | undefined} True if it is a file; false if not a file,
   * undefined if the result has not yet been determined.
   */
  isFile(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isFile;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isFile();
    }
  }

  /**
   * Checks if the file system item is a folder.
   *
   * It is recommended to use getIsFolder() unless it is known that getStats() has
   * already be executed.
   *
   * @returns {boolean | undefined} True if it is a folder; otherwise, undefined.
   */
  isFolder(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isDirectory;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isDirectory();
    }
  }

  /**
   * Checks if the file system item is a symlink.
   *
   * It is recommended to use getIsSymlink() unless it is known that getStats() has
   * already be executed.
   *
   * @returns {boolean | undefined} True if it is a symlink; otherwise, undefined.
   */
  isSymlink(): boolean | undefined {
    if (this._dirEntry) {
      return this._dirEntry.isSymlink;
    }
    if (this._stats.isInitialized()) {
      return this._stats.isSymlink();
    }
  }
  /**
   * Asynchronously checks if the file system item is a file.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a file.
   */
  getIsFile(): Promise<boolean> {
    return this.getStats().then(() => {
      return this._stats.isFile();
    });
  }

  /**
   * Asynchronously checks if the file system item is a folder.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a folder.
   */
  getIsFolder(): Promise<boolean> {
    return this.getStats().then(() => {
      return this._stats.isDirectory();
    });
  }

  /**
   * Asynchronously checks if the file system item is a symlink.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a symlink.
   */
  getIsSymlink(): Promise<boolean> {
    return this.getStats().then(() => {
      return this._stats.isSymlink();
    });
  }

  /**
   * Retrieves the creation date of this file or folder, if available.
   *
   * It is recommended to use getCreatedAt() unless it is known that getStats() has
   * already be executed.
   *
   * @returns {Date | undefined} The creation date, or undefined if not available.
   */
  createdAt(): Date | undefined {
    if (this._stats.isInitialized()) {
      return this._stats.createdAt();
    }
  }

  /**
   * Asynchronously retrieves the creation date of this file or folder.
   * @returns {Promise<Date | undefined>} A promise that resolves to the creation date, or undefined if not available.
   */
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
}
