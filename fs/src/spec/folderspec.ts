import { direntToSpec, resolvePathArgs, safeCopy, type SafeCopyOpts } from '$util';
import { walk, type WalkOptions } from '$walk';
import { _, type Dict } from '@epdoc/type';
import { type Dirent, promises as nfs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type * as FS from '../types.ts';

import { FSSpecBase } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import type { FSSpec } from './fsspec.ts';
import type { IRootableSpec, ISafeCopyableSpec } from './icopyable.ts';
import { SymlinkSpec } from './symspec.ts';
import type { TypedFSSpec } from './types.ts';

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
export class FolderSpec extends FSSpecBase implements ISafeCopyableSpec, IRootableSpec {
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
  protected _args: FS.Path[] = [];

  /**
   * Public constructor for FolderSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: FS.PathSegment[]) {
    super();
    this._f = resolvePathArgs(...args) as FS.FolderPath; // Cast to FolderPath
  }

  /**
   * Creates a new FolderSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * @param metaUrl - The `import.meta.url` of the calling module.
   * @param paths - Additional path segments to join.
   * @returns {FolderSpec} A new FolderSpec instance.
   *
   * @example
   * // Assuming this code is in /path/to/your/project/src/app.ts
   * const dataFolder = FolderSpec.fromMeta(import.meta.url, '../data');
   * // dataFolder.path will be /path/to/your/project/data
   */
  public static fromMeta(metaUrl: string, ...paths: string[]): FolderSpec {
    const dir = path.dirname(fileURLToPath(metaUrl));
    const fullPath = path.join(dir, ...paths);
    return new FolderSpec(fullPath);
  }

  public static cwd(): FolderSpec {
    return new FolderSpec(process.cwd());
  }

  chdir(): this {
    process.chdir(this._f);
    return this;
  }

  /**
   * Creates a new temporary directory in the default directory for temporary
   * files, unless `dir` is specified. Other optional options include
   * prefixing and suffixing the directory name with `prefix` and `suffix`
   * respectively.
   *
   * This call resolves to the full path to the newly created directory.
   *
   * Multiple programs calling this function simultaneously will create different
   * directories. It is the caller's responsibility to remove the directory when
   * no longer needed.
   *
   * ```ts
   * const tempDirName0 = await FolderSpec.makeTemp();  // e.g. /tmp/2894ea76
   * const tempDirName1 = await FolderSpec.makeTemp({ prefix: 'my_temp' }); // e.g. /tmp/my_temp339c944d
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @param opts
   * @param opts.prefix -String that should precede the random portion of the temporary directory's
   * name. This helps you identify the files you've created.
   * @param opts.suffix - String that should follow the random portion of the temporary directory's
   * name. This can be set to an extension (eg. ".json")
   * @param opts.dir - Directory where the temporary directory should be created (defaults to the
   * env variable `TMPDIR`, or the system's default, usually `/tmp`). Note that if the passed `dir`
   * is relative, the path returned  will also be relative. Be mindful of this when changing working
   * directory
   * @returns A new FileSpec object with the path
   */
  public static async makeTemp(opts: { prefix?: string; suffix?: string; dir?: string } = {}): Promise<FolderSpec> {
    const tmpRoot = opts.dir ? path.resolve(opts.dir) : os.tmpdir();
    const prefix = _.isString(opts.prefix) ? opts.prefix : 'tmp-';
    const mkdtempPrefix = path.join(tmpRoot, prefix);

    try {
      // mkdtemp creates a new directory with a unique suffix appended to the prefix
      const created = await nfs.mkdtemp(mkdtempPrefix);

      // If a suffix was requested, rename the created dir to include the suffix.
      // Note: this is not atomic with mkdtemp and may collide; caller responsibility.
      if (opts.suffix) {
        const finalPath = `${created}${opts.suffix}`;
        await nfs.rename(created, finalPath);
        return new FolderSpec(finalPath);
      }

      return new FolderSpec(created);
    } catch (err: unknown) {
      throw new FolderSpec(mkdtempPrefix).asError(err, 'makeTemp');
    }
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see FSSpecBase#copyTo
   */
  copy(): FolderSpec {
    const result = new FolderSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  override copyParamsTo(target: FSSpecBase): FSSpecBase {
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

  override get path(): FS.FolderPath {
    return this._f as FS.FolderPath;
  }

  /**
   * For folders, indicates if we have read the folder's contents.
   * @returns - true if this is a folder and we have read the folder's contents.
   */
  haveReadFolderContents(): boolean {
    return this._haveReadFolderContents;
  }

  /**
   * Get the list of FSItem files that matched a previous call to getFiles() or
   * getChildren().
   * @returns Array of FSItem objects representing files.
   */
  get files(): FileSpec[] {
    return this._files;
  }

  /**
   * Get the list of filenames that matched a previous call to getFolders() or
   * getChildren().
   * @returns Array of filenames.
   */
  get filenames(): FS.FileName[] {
    return this._files.map((fs: FileSpec) => {
      return fs.filename as FS.FileName;
    });
  }

  /**
   * Get the list of FSItem folders that matched a previous call to getFolders() or
   * getChildren().
   * @returns Array of FSItem objects representing folders.
   */
  get folders(): FolderSpec[] {
    return this._folders;
  }

  /**
   * Get the list of folder names that matched a previous call to getFolders() or
   * getChildren().
   * @returns Array of folder names.
   */
  get folderNames(): FS.FolderName[] {
    return this._folders.map((fs) => {
      return fs.filename as FS.FolderName;
    });
  }

  add(...args: string[]): FolderSpec {
    const fullPath = path.resolve(this._f, ...args);
    return new FolderSpec(fullPath);
  }

  static home(...args: string[]): FolderSpec {
    const fullPath = path.resolve(os.userInfo().homedir, ...args);
    return new FolderSpec(fullPath);
  }

  /**
   * Ensures that a directory exists at this path.
   *
   * This method is recursive, meaning it will create parent directories as
   * needed, similar to `mkdir -p`. If the path already exists and is a
   * directory, the method does nothing.
   *
   * @returns A promise that resolves when the directory is ensured.
   * @throws {Error.NotADirectory} If the path exists but is a file.
   */
  async ensureDir(): Promise<void> {
    try {
      await nfs.mkdir(this._f, { recursive: true });
      this.clearInfo();
    } catch (err: unknown) {
      throw this.asError(err, 'ensureDir');
    }
  }

  /**
   * Ensures that the parent directory of this path exists.
   *
   * This method is recursive, meaning it will create parent directories as
   * needed.
   *
   * @returns A promise that resolves when the parent directory is ensured.
   * @throws {Error.NotADirectory} If the path exists but is a file.
   */
  async ensureParentDir(): Promise<void> {
    try {
      await nfs.mkdir(this.dirname, { recursive: true });
    } catch (err: unknown) {
      throw this.asError(err, 'ensureParentDir');
    }
  }

  /**
   * Creates a new subdirectory within this folder.
   *
   * @param name - The name of the subdirectory to create.
   * @returns A promise that resolves with a new `FolderSpec` object
   * representing the created subdirectory.
   * @throws {Error.NotADirectory} If the path for the new subdirectory
   * already exists as a file.
   */
  async mkdir(name: FS.Name): Promise<FolderSpec> {
    const newFolder = new FolderSpec(this, name);
    await newFolder.ensureDir();
    return newFolder;
  }

  /**
   * Reads the contents of the directory and returns an array of BaseSpec objects
   * representing both files and folders.
   * @returns {Promise<FSSpecBase[]>} Array of BaseSpec objects for directory entries
   */
  async readDir(): Promise<(TypedFSSpec)[]> {
    try {
      const dirents = await nfs.readdir(this._f, { withFileTypes: true });
      const results = dirents
        .map((d: Dirent) => direntToSpec(this.path as FS.FolderPath, d))
        .filter(Boolean) as (TypedFSSpec)[];
      return results;
    } catch (err: unknown) {
      throw this.asError(err, 'readDir');
    }
  }

  /**
   * Returns an array of FileSpec objects for files in the directory that match
   * the optional regex pattern.
   * @param [regex] - Optional regular expression to filter filenames
   * @returns {Promise<FileSpec[]>} Array of FileSpec objects for matching files
   */
  async getFiles(regex?: RegExp): Promise<FileSpec[]> {
    const allEntries = await this.readDir();
    const results = allEntries
      .filter((spec): spec is FileSpec => spec instanceof FileSpec && (!regex || regex.test(spec.filename)));
    return results;
  }

  /**
   * Returns an array of FolderSpec objects for subdirectories that match
   * the optional regex pattern.
   * @param [regex] - Optional regular expression to filter folder names
   * @returns {Promise<FolderSpec[]>} Array of FolderSpec objects for matching folders
   */
  async getFolders(regex?: RegExp): Promise<FolderSpec[]> {
    const allEntries = await this.readDir();
    const results = allEntries
      .filter((spec): spec is FolderSpec => spec instanceof FolderSpec && (!regex || regex.test(spec.filename)));
    return results;
  }

  /**
   * Recursively walks through the directory tree and returns all matching entries.
   *
   * @param opts - Options for the walk:
   *   - maxDepth?: number - Maximum directory depth to traverse
   *   - includeFiles?: boolean - Whether to include files (default: true)
   *   - includeDirs?: boolean - Whether to include directories (default: true)
   *   - match?: RegExp[] - Array of patterns to match against
   *   - skip?: RegExp[] - Array of patterns to skip
   * @returns {Promise<FSSpecBase[]>} Array of BaseSpec objects for matched entries
   *
   * @example
   * // Find all files ending in 2 digits (e.g. metadata-01.json)
   * const folder = new FolderSpec("./data");
   * const results = await folder.walk({n
   *   includeFiles: true,
   *   includeDirs: false,
   *   match: [/\-\d{2}\..*$/]
   * });
   * // Results: [
   * //   FileSpec { path: "data/metadata-01.json" },
   * //   FileSpec { path: "data/chapter-42.md" }
   * // ]
   */
  async walk(opts: WalkOptions): Promise<(FileSpec | FolderSpec | SymlinkSpec | FSSpec)[]> {
    return await Array.fromAsync(walk(this, opts));
  }

  /**
   * Retrieves the list of files and folders within this folder, optionally matching
   * a specified pattern and limiting the depth of the search.
   *
   * @param options - Options for retrieving children.
   * @param [options.match] - A string or regular expression to match file or folder names.
   * @param [options.levels=1] - The number of levels to traverse. Defaults to 1.
   * @param [options.callback] - A callback function to be called for each matched item.
   * @param [options.sort] - Sorting options for the results.
   * @returns {Promise<FSSpecBase[]>} - A promise that resolves to an array of FSSpec objects representing the files and folders.
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
  async getChildren(options: FS.GetChildrenOpts = { levels: 1 }): Promise<TypedFSSpec[]> {
    const opts: FS.GetChildrenOpts = {
      match: options.match,
      levels: _.isNumber(options.levels) ? options.levels - 1 : 0,
      callback: options.callback,
      sort: _.isDict(options.sort) ? options.sort : {},
    };

    this._folders = [];
    this._files = [];
    this._symlinks = [];
    this._haveReadFolderContents = false;

    const allEntries = await this.readDir();
    const matchedEntries: TypedFSSpec[] = [];
    const jobs: Promise<unknown>[] = [];

    for (const fsItem of allEntries) {
      let bMatch = false;
      if (opts.match) {
        if (_.isString(opts.match) && fsItem.filename === opts.match) {
          bMatch = true;
        } else if (_.isRegExp(opts.match) && opts.match.test(fsItem.filename)) {
          bMatch = true;
        }
      } else {
        bMatch = true;
      }

      if (bMatch) {
        matchedEntries.push(fsItem);
        if (opts.callback) {
          const job1 = opts.callback(fsItem);
          jobs.push(job1);
        }
        if (fsItem instanceof FolderSpec) {
          this._folders.push(fsItem);
          if ((opts.levels as number) > 0) {
            const job2 = fsItem.getChildren(opts);
            jobs.push(job2);
          }
        } else if (fsItem instanceof FileSpec) {
          this._files.push(fsItem);
        } else if (fsItem instanceof SymlinkSpec) {
          this._symlinks.push(fsItem);
        }
      }
    }

    await Promise.all(jobs);
    this._haveReadFolderContents = true;
    if (_.isDict(opts.sort)) {
      this.sortChildren(opts.sort);
    }
    return matchedEntries;
  }

  /**
   * Sorts the children (files and folders) of this FSItem.
   * @param [opts={}] - Sorting options.
   * @returns {void}
   */
  public sortChildren(opts: FS.FSSortOpts = {}) {
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

  safeCopy(destFile: FS.FilePath | FileSpec | FolderSpec | FSSpec, opts: SafeCopyOpts = {}): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  /**
   * @returns Array of FileSpec or FolderSpec objects.
   */
  static sortByFilename(items: (FileSpec | FolderSpec)[]): (FileSpec | FolderSpec)[] {
    return items.sort((a, b) => {
      return _.compareValues(a as unknown as Dict, b as unknown as Dict, 'filename');
    });
  }

  /**
   * Sorts the files of this FSItem by size. Run getChildren() first.
   * @returns Array of FSSpecBase objects.
   */
  static sortFilesBySize(items: FSSpecBase[]): FSSpecBase[] {
    return items
      .filter((item) => item instanceof FileSpec)
      .sort((a, b) => {
        return _.compareValues(a.info as unknown as Dict, b.info as unknown as Dict, 'size');
      });
  }

  /**
   * Moves this file or folder to the location `dest`.
   * @param dest - The new path for the file.
   * @param options - Options to overwrite existing files.
   * @returns {Promise<void>} - A promise that resolves when the move is complete.
   */
  async moveTo(dest: FS.FolderPath | FolderSpec, options?: FS.MoveOptions): Promise<void> {
    const p: FS.FolderPath = dest instanceof FolderSpec ? dest.path : dest;
    try {
      if (options?.overwrite) {
        await nfs.rm(p, { recursive: true, force: true });
      }
      await nfs.rename(this._f, p);
      this.clearInfo();
    } catch (err: unknown) {
      throw this.asError(err, 'moveTo');
    }
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
      const bFile = bFiles.find((file) => {
        return file.filename === aFile.filename;
      });
      if (!bFile) { // Handle undefined bFile
        return false;
      }
      if (aFile.filename.toLowerCase() !== bFile.filename.toLowerCase()) {
        return false;
      }
      const bEqual = await aFile.equalTo(bFile, opts);
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
  async getDiff(folder: FolderSpec, filter?: RegExp, opts: { checksum?: boolean } = {}): Promise<FS.FolderDiff> {
    const result: FS.FolderDiff = { missing: [], added: [], diff: [] };
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
        result.missing.push(aFile.filename as FS.FileName);
      } else {
        const bEqual = await aFile.equalTo(bFile, opts);
        if (!bEqual) {
          result.diff.push(aFile.filename as FS.FileName);
        }
      }
    }
    for (let bdx = 0; bdx < bFiles.length; ++bdx) {
      const bFile = bFiles[bdx];
      const aFile = aFiles.find((file) => {
        return file.filename === bFile.filename;
      });
      if (!aFile) {
        result.added.push(bFile.filename as FS.FileName);
      }
    }

    return result;
  }

  /**
   * Changes the owner of the folder.
   * @param uid - User ID
   * @param gid - Group ID (optional)
   * @param recursive - Apply recursively to all contents
   */
  async chown(uid: FS.UID, gid?: FS.GID, recursive = false): Promise<void> {
    await nfs.chown(this._f, uid, gid ?? -1);
    if (recursive) {
      const entries = await this.walk({});
      for (const entry of entries) {
        await entry.chown(uid, gid);
      }
    }
  }

  /**
   * Changes the group of the folder.
   * @param gid - Group ID
   * @param recursive - Apply recursively to all contents
   */
  async chgrp(gid: FS.GID, recursive = false): Promise<void> {
    await nfs.chown(this._f, -1, gid);
    if (recursive) {
      const entries = await this.walk({});
      for (const entry of entries) {
        await entry.chgrp(gid);
      }
    }
  }

  /**
   * Changes the permissions of the folder.
   * @param mode - File mode (permissions)
   * @param recursive - Apply recursively to all contents
   */
  async chmod(mode: FS.Mode, recursive = false): Promise<void> {
    await nfs.chmod(this._f, mode);
    if (recursive) {
      const entries = await this.walk({});
      for (const entry of entries) {
        await entry.chmod(mode);
      }
    }
  }
}
