import * as Err from '$error';
import * as util from '$util';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import * as fs from 'node:fs';
import path from 'node:path';
import type * as FS from '../types.ts';
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
   * Clears the cached `FileInfo` object. This forces a re-read from the
   * filesystem on the next call to a method that relies on file stats (e.g.,
   * `exists()`, `isFile()`).
   */
  clearInfo(): void {
    this._info = undefined;
  }

  /**
   * Copies internal parameters (like cached `FileInfo`) from this instance to
   * another `FSSpecBase` instance. This is useful when creating a more specific
   * type (e.g., `FileSpec`) from a general one without re-fetching stats.
   * @param target - The target `FSSpecBase` instance to receive the parameters.
   * @returns The `target` instance with the parameters copied.
   */
  copyParamsTo(target: FSSpecBase): FSSpecBase {
    target._info = this._info;
    target._dirEntry = this._dirEntry;
    return target;
  }

  /**
   * Gets the full, resolved path of the file system item.
   * @returns The file system path.
   */
  get path(): Path {
    return this._f;
  }

  /**
   * Gets the directory portion of the file system path.
   * For example, for `/path/to/file.name.html`, this returns `/path/to`.
   * @returns The directory name.
   */
  get dirname(): string {
    return path.dirname(this._f);
  }

  /**
   * Gets the filename (including extension) of the file system item.
   * For example, for `/path/to/file.name.html`, this returns `file.name.html`.
   * @returns The filename.
   */
  get filename(): string {
    return path.basename(this._f);
  }

  /**
   * Sets the directory entry for this file system item, typically when it is
   * discovered during a directory walk.
   * @param dirEntry - The `FSEntry` object from a directory listing.
   * @returns The current instance for chaining.
   */
  setDirEntry(dirEntry: FSEntry | undefined): this {
    this._dirEntry = dirEntry;
    return this;
  }

  /**
   * Checks if a `FileInfo` object has been cached.
   * @returns `true` if the `info` property is available, otherwise `false`.
   */
  hasInfo(): boolean {
    return this._info ? true : false;
  }

  /**
   * Accesses the cached file information.
   * This property is populated by calling an async method like `stats()`.
   * Always check `hasInfo()` or call `stats()` before accessing this property.
   * @returns The cached `FileInfo` object.
   * @throws {Error} If file stats have not been previously read.
   */
  get info(): FileInfo {
    assert(this._info, 'File stats have not been read');
    return this._info;
  }

  /**
   * Asynchronously retrieves the stats for this file or folder.
   * After this method has been called, the `info` property will be populated, and you can
   * directly access properties like `info.exists`, `info.isFile`, etc.
   * @param {boolean} force - Force retrieval of the stats, even if they have
   * already been retrieved.
   * @returns {Promise<FileInfo | undefined>} A promise that resolves with the file's stats.
   */
  async stats(force = false): Promise<FileInfo | undefined> {
    if (force || !this._info) {
      try {
        const rawStats = await fs.promises.lstat(this._f);
        this._info = util.statsToFileInfo(rawStats);
      } catch (err: unknown) {
        if (_.isObject(err) && 'code' in err && err.code === 'ENOENT') {
          this._info = undefined; // Correctly handle non-existent files
        } else {
          // For all other errors, throw a classified error
          throw this.asError(err, 'stats');
        }
      }
    }
    return this._info;
  }

  /**
   * Asynchronously checks if this file or folder exists.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.exists` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns a promise with value true if this exists.
   */
  async exists(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.exists === true;
  }

  /**
   * Asynchronously checks if the file system item is a file.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.isFile` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a file.
   */
  async isFile(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isFile === true;
  }

  /**
   * Asynchronously checks if the file system item is a folder.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.isDirectory` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a folder.
   */
  async isFolder(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isDirectory === true;
  }

  /**
   * Asynchronously checks if the file system item is a directory.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.isDirectory` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a directory.
   */
  async isDir(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isDirectory === true;
  }

  /**
   * Asynchronously checks if the file system item is a symlink.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.isSymlink` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<boolean>} A promise that resolves to true if it is a symlink.
   */
  async isSymlink(force = false): Promise<boolean> {
    const info = await this.stats(force);
    return info?.isSymlink === true;
  }

  /**
   * Asynchronously retrieves the creation date of this file or folder.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.createdAt` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<Date | undefined>} A promise that resolves to the creation date, or undefined if not available.
   */
  async createdAt(force = false): Promise<Date | null | undefined> {
    const info = await this.stats(force);
    return info?.createdAt;
  }

  /**
   * Asynchronously retrieves the modification date of this file or folder.
   * This method uses a cached `FileInfo` object if available. If not, it will
   * fetch the stats from the filesystem. If the cache might be stale, set `force`
   * to `true` to ensure fresh data. After calling `stats()`, you can also
   * access this value through the `info.modifiedAt` property.
   * @param {boolean} force - When `true`, forces a refresh of the file stats cache.
   * @returns {Promise<Date | undefined>} A promise that resolves to the modification date, or undefined if not available.
   */
  async modifiedAt(force = false): Promise<Date | null | undefined> {
    const info = await this.stats(force);
    return info?.modifiedAt;
  }

  /**
   * Removes this file or folder.
   * @param options - Options for the remove operation.
   * @param {boolean} [options.recursive=false] - If `true`, removes directories
   * and their contents recursively. Required for non-empty directories.
   * @returns A promise that resolves when the removal is complete.
   */
  async remove(options: RemoveOptions = {}): Promise<void> {
    if (await this.exists(true)) {
      try {
        await fs.promises.rm(this._f, options);
        this.clearInfo();
      } catch (err: unknown) {
        throw this.asError(err, 'remove');
      }
    }
  }

  /**
   * Copies this file to a new destination.
   * This method is for files only and does not support directory copies.
   * @param dest - The destination path for the new file.
   * @param options - Options for the copy operation.
   * @param {boolean} [options.overwrite=false] - If `true`, the destination file
   * will be overwritten if it exists.
   * @param {boolean} [options.preserveTimestamps=true] - If `true`, the access
   * and modification times are copied from the source to the destination.
   * @returns A promise that resolves when the copy is complete.
   */
  async copyTo(dest: Path, options?: CopyOptions): Promise<void> {
    try {
      let flags = 0;
      if (options?.overwrite === false) {
        flags = fs.constants.COPYFILE_EXCL;
      }
      await fs.promises.copyFile(this._f, dest, flags);

      if (options?.preserveTimestamps !== false) {
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
   * Asynchronously retrieves the canonicalized absolute path of the file system
   * item by resolving symbolic links, `..` segments, and `.` segments.
   * @returns A promise that resolves to the canonicalized absolute path.
   */
  async realPath(): Promise<Path> {
    try {
      const resolvedPath = await fs.promises.realpath(this._f);
      return resolvedPath as Path;
    } catch (err: unknown) {
      throw this.asError(err, 'realPath');
    }
  }

  /**
   * Compares the path of this instance with another `FSSpecBase` instance.
   * @param val - The FS item to compare against.
   * @returns `true` if both items have the same path, otherwise `false`.
   */
  equalPaths(val: FSSpecBase): boolean {
    return this.path === val.path;
  }

  /**
   * Wraps a caught error in an appropriate `FSError` subclass, enriching it
   * with context like the file path and operation that caused it.
   * @param error - The original error, which can be of any type.
   * @param cause - A string identifying the operation that failed (e.g., 'read').
   * @returns An instance of an `FSError` subclass.
   */
  asError(error: unknown, cause?: string): Err.Main {
    if (error instanceof Err.Main) {
      return error;
    }

    const base = _.asError(error);

    // Narrow view of possible platform error shape (no `any` used).
    type ErrWithCode = { code?: string; errno?: number | string; message?: string };
    const errWithCode = base as unknown as ErrWithCode;

    const code = errWithCode.code ?? (errWithCode.errno !== undefined ? String(errWithCode.errno) : undefined);
    const opts: Err.Options = { path: this._f, cause, code };

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
        return new Err.Main(base, opts);
      case 'ENOTEMPTY':
        return new Err.Main(base, opts);
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
      return new Err.Main(base, opts);
    }

    // Fallback to the generic FSError
    return new Err.Main(base, opts);
  }

  /**
   * Changes the owner of the file system item.
   * @param uid - User ID
   * @param gid - Group ID (optional)
   */
  abstract chown(uid: FS.UID, gid?: FS.GID): Promise<void>;

  /**
   * Changes the group of the file system item.
   * @param gid - Group ID
   */
  abstract chgrp(gid: FS.GID): Promise<void>;

  /**
   * Changes the permissions of the file system item.
   * @param mode - File mode (permissions)
   */
  abstract chmod(mode: FS.Mode): Promise<void>;
}
