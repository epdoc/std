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
 * @param {(FSSpec | FolderPath | FilePath)[])} args - An FSItem, a path, or a spread of paths to be used with path.resolve
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
  protected _hasFileInfo: boolean = false;
  // protected _isFile: boolean = false;
  // protected _isDirectory: boolean = false;
  // protected _isSymlink: boolean = false;

  protected _stats: FSStats = new FSStats();

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

  copy(): FSSpec {
    return new FSSpec(this);
  }

  copyParamsTo(target: FSSpec): FSSpec {
    target._hasFileInfo = this._hasFileInfo;
    target._stats = this._stats;
    return target;
  }

  static fromDirEntry(path: FolderPath, entry: Deno.DirEntry): FSSpec {
    if (entry.isFile) {
      return new FileSpec(path, entry.name).hasFileInfo();
    } else if (entry.isDirectory) {
      return new FolderSpec(path, entry.name).hasFileInfo();
    } else if (entry.isSymlink) {
      return new SymlinkSpec(path, entry.name).hasFileInfo();
    }
    throw new Error('Invalid file system entry');
  }

  static fromWalkEntry(entry: dfs.WalkEntry): FSSpec {
    if (entry.isFile) {
      return new FileSpec(entry.path).hasFileInfo();
    } else if (entry.isDirectory) {
      return new FolderSpec(entry.path).hasFileInfo();
    } else if (entry.isSymlink) {
      return new SymlinkSpec(entry.path).hasFileInfo();
    }
    throw new Error('Invalid file system entry');
  }

  hasFileInfo(): this {
    this._hasFileInfo = true;
    return this;
  }

  /**
   * Returns the full filename of the file or folder, including it's extension.
   * For example, '/path/to/file.name.html' would return 'file.name.html'.
   * @return {string} - The full file or folder name, including it's extension, if unknown.
   */
  get filename(): string {
    return path.basename(this._f);
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
   * Return the FSSTATS for this file or folder, retrieving the stats and
   * referencing them with this._stats if they have not been previously read.
   * FSSTATS can become stale and should be reread if a file is manipulated.
   *
   * Example `fsutil('mypath/file.txt').getStats().isFile()`.
   *
   * @param {boolean} force Force retrieval of the states, even if they have
   * already been retrieved.
   * @returns {Promise<FSStats>} A promise with an FSStats object
   */
  public getStats(force = false): Promise<FSSpec | FileSpec | FolderSpec | SymlinkSpec> {
    if (force || !this._stats.isInitialized()) {
      return Promise.resolve(this)
        .then(() => {
          return Deno.lstat(this._f);
        })
        .then((resp: Deno.FileInfo) => {
          this._stats = new FSStats(resp);
          if (resp.isFile && !(this instanceof FileSpec)) {
            return Promise.resolve(fileSpec(this).setStats(this._stats).hasFileInfo());
          } else if (resp.isDirectory && !(this instanceof FolderSpec)) {
            return Promise.resolve(folderSpec(this).setStats(this._stats).hasFileInfo());
          } else if (resp.isSymlink && !(this instanceof SymlinkSpec)) {
            return Promise.resolve(symlinkSpec(this).setStats(this._stats).hasFileInfo());
          }
          return Promise.resolve(this);
        })
        .catch((_err) => {
          this._stats = new FSStats();
          return Promise.resolve(this);
        });
    } else {
      return Promise.resolve(this);
    }
  }

  setStats(stats: FSStats): this {
    this._stats = stats;
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
   * Does this file or folder exist? Will retrieve the FSStats for the file
   * system entry if they haven't been previously read.
   * @returns a promise with value true if this exists.
   */
  exists(): Promise<boolean> {
    return this.getStats().then(() => {
      return this instanceof FileSpec || this instanceof FolderSpec || this instanceof SymlinkSpec;
    });
  }

  /**
   * When was this file system entry created? Will retrieve the FSStats for the
   * file system entry if they haven't been previously read.
   * @returns a promise with the Date this file was created.
   * @deprecated Use isFile() method instead.
   */
  createdAt(): Promise<Date | undefined> {
    return this.getStats().then(() => {
      return this._stats.createdAt();
    });
  }

  /**
   * Removes this file or folder.
   * @returns {Promise<void>} A promise that resolves when the file or folder is removed.
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
   * Copy this file or folder to the location `dest`.
   * @param dest
   * @param options An fx.CopyOptions object
   * @returns
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
   * Move `this` file or folder to the location `dest`.
   * @param {FilePath | FSSpec} dest - The new path for the file
   * @param {fx.MoveOptions} options - Options to `overwrite` and `dereference` symlinks.
   * @returns {Promise<void>}
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
    await this.getStats();

    if (this._stats && this._stats.exists()) {
      let fsDest: FSSpec = destFile instanceof FSSpec ? destFile : fsSpec(destFile);
      fsDest = await fsDest.getStats();

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
