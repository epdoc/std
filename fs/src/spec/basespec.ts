import * as Err from '$error';
import * as util from '$util';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import * as fs from 'node:fs';
import path from 'node:path';
import type { CopyOptions, FileInfo, FSEntry, Path, RemoveOptions } from '../types.ts';

/**
 * Abstract class representing a file system item, which may be of unknown type,
 * a file, folder, or symlink.
 */
export abstract class FSSpecBase {
  // @ts-ignore this does get initialized
  protected _f: Path;
  protected _info: FileInfo | undefined;
  protected _dirEntry: FSEntry | undefined;

  /**
   * Clears the cached FileInfo, forcing a re-read on the next stats() call.
   */
  clearInfo(): void {
    this._info = undefined;
  }

  /**
   * Copies parameters from this FSSpec to the target FSSpec.
   * @param {FSSpecBase} target - The target FSSpec to copy parameters to.
   * @returns {FSSpecBase} - The target FSSpec with copied parameters.
   */
  copyParamsTo(target: FSSpecBase): FSSpecBase {
    target._info = this._info;
    target._dirEntry = this._dirEntry;
    return target;
  }

  /**
   * Getter that returns the resolved file system path.
   * @returns {FilePath} The full path of the file system item.
   */
  get path(): Path {
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
   * Sets the directory entry for this file system item.
   * @param {FSEntry | undefined} dirEntry - The FSEntry object, or undefined if not applicable.
   * @returns {this} The current instance for chaining.
   */
  setDirEntry(dirEntry: FSEntry | undefined): this {
    this._dirEntry = dirEntry;
    return this;
  }

  hasInfo(): boolean {
    return this._info ? true : false;
  }

  /**
   * Synchronously returns the cached FileInfo object, or undefined if
   * stats have not been loaded.
   */
  get info(): FileInfo {
    assert(this._info, 'File stats have not been read');
    return this._info;
  }

  /**
   * Asynchronously retrieves the stats for this file or folder.
   * @param {boolean} force - Force retrieval of the stats, even if they have
   * already been retrieved.
   * @returns {Promise<FileInfo | undefined>} A promise that resolves with the file's stats.
   */
  stats(force = false): Promise<FileInfo | undefined> {
    if (force || !this._info) {
      return fs.promises.lstat(this._f)
        .then((rawStats: fs.Stats) => {
          this._info = util.statsToFileInfo(rawStats);
          return this._info;
        })
        .catch((_err) => {
          this._info = undefined;
          return this._info;
        });
    }
    return Promise.resolve(this._info);
  }

  /**
   * Asynchronously checks if this file or folder exists.
   * @returns a promise with value true if this exists.
   */
  async exists(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.exists === true;
  }

  /**
   * Asynchronously checks if the file system item is a file.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a file.
   */
  async isFile(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isFile === true;
  }

  /**
   * Asynchronously checks if the file system item is a folder.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a folder.
   */
  async isFolder(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isDirectory === true;
  }

  /**
   * Asynchronously checks if the file system item is a symlink.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a symlink.
   */
  async isSymlink(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isSymlink === true;
  }

  /**
   * Asynchronously retrieves the creation date of this file or folder.
   * @returns {Promise<Date | undefined>} A promise that resolves to the creation date, or undefined if not available.
   */
  async createdAt(force = false): Promise<Date | null | undefined> {
    const info = await this.stats(force);
    return info?.createdAt;
  }

  /**
   * Removes this file or folder.
   * @param {Deno.RemoveOptions} options - Options for removing the file or folder.
   * @param {boolean} options.recursive - Recursively remove items if this is a folder.
   * @returns {Promise<void>} - A promise that resolves when the file or folder is removed.
   */
  async remove(options: RemoveOptions = {}): Promise<void> {
    const exists = await this.exists(true);
    if (exists) {
      return fs.promises.rm(this._f, options);
    }
  }

  /**
   * Copies this file or folder to the location `dest`.
   * @param {Path} dest - The destination path.
   * @param {CopyOptions} [options] - Options for the copy operation.
   * @returns {Promise<void>} - A promise that resolves when the copy is complete.
   */
  async copyTo(dest: Path, options?: CopyOptions): Promise<void> {
    try {
      let flags = 0;
      if (options?.overwrite === false) {
        flags = fs.constants.COPYFILE_EXCL;
      }
      await fs.promises.copyFile(this._f, dest, flags);

      if (options?.preserveTimestamps) {
        const sourceInfo = await this.stats();
        if (sourceInfo?.atime && sourceInfo?.modifiedAt) {
          await fs.promises.utimes(dest, sourceInfo.atime, sourceInfo.modifiedAt);
        }
      }
    } catch (err) {
      throw this.asError(err, 'copyTo');
    }
  }

  /**
   * Asynchronously retrieves the canonicalized absolute path of the file system item.
   * This resolves symbolic links and '..' or '.' segments.
   * @returns {Promise<Path>} A promise that resolves to the canonicalized absolute path.
   */
  realPath(): Promise<Path> {
    return fs.promises.realpath(this._f) as Promise<Path>;
  }

  asError(error: unknown, cause?: string): Err.FSError {
    const base = _.asError(error);

    // Narrow view of possible platform error shape (no `any` used).
    type ErrWithCode = { code?: string; errno?: number | string; message?: string };
    const errWithCode = base as unknown as ErrWithCode;

    const code = errWithCode.code ?? (errWithCode.errno !== undefined ? String(errWithCode.errno) : undefined);
    const opts: Err.FSErrorOptions = { path: this._f, cause, code };

    const codeStr = String(code || '').toUpperCase();

    switch (codeStr) {
      case 'ENOENT':
        return new Err.NotFound(base, opts);
      case 'ENOTDIR':
        return new Err.NotADirectory(base, opts);
      case 'EISDIR':
        return new Err.IsADirectory(base, opts);
      case 'EEXIST':
        return new Err.AlreadyExists(base, opts);
      case 'EACCES':
      case 'EPERM':
        return new Err.PermissionDenied(base, opts);
      case 'EBADF':
        return new Err.BadResource(base, opts);
      case 'EIO':
        return new Err.FSError(base, opts);
      case 'ENOTEMPTY':
        return new Err.FSError(base, opts);
      case 'ETIMEDOUT':
        return new Err.TimedOut(base, opts);
      case 'EINTR':
        return new Err.Interrupted(base, opts);
      case 'EAGAIN':
      case 'EWOULDBLOCK':
        return new Err.WouldBlock(base, opts);
      case 'ECONNREFUSED':
        return new Err.ConnectionRefused(base, opts);
      case 'ECONNRESET':
        return new Err.ConnectionReset(base, opts);
      case 'ECONNABORTED':
        return new Err.ConnectionAborted(base, opts);
      case 'ENOTCONN':
        return new Err.NotConnected(base, opts);
      case 'EADDRINUSE':
        return new Err.AddrInUse(base, opts);
      case 'EADDRNOTAVAIL':
        return new Err.AddrNotAvailable(base, opts);
      case 'EPIPE':
        return new Err.BrokenPipe(base, opts);
      default:
        break;
    }

    const lowerCause = String(cause ?? '').toLowerCase();
    const msg = String(errWithCode.message ?? '').toLowerCase();

    if (msg.includes('eof') || msg.includes('unexpected eof')) {
      return new Err.UnexpectedEof(base, opts);
    }

    if (lowerCause.includes('read')) {
      return new Err.BadResource(base, opts);
    }

    if (
      lowerCause.includes('write') || lowerCause.includes('mkdir') || lowerCause.includes('open') ||
      lowerCause.includes('create') || lowerCause.includes('rename') || lowerCause.includes('move') ||
      lowerCause.includes('unlink')
    ) {
      return new Err.FSError(base, opts);
    }

    // Fallback to the generic FSError
    return new Err.FSError(base, opts);
  }
}
