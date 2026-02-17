/**
 * @module FolderSpec
 * @description **The definitive way to work with directories in Deno, Node.js, and Bun.**
 *
 * This module provides `FolderSpec`, the primary class for type-safe, cross-runtime
 * directory operations. It unifies the disparate APIs of `node:fs`, Deno, and Bun into
 * a single, consistent, and intuitive interface.
 *
 * ## Recommended Import Pattern
 *
 * For the best developer experience and cleanest code, import the entire module as a namespace:
 *
 * ```ts
 * import * as FS from '@epdoc/fs/fs';
 *
 * // Then use the FS namespace for all file system operations
 * const folder = FS.Folder.home('.config');
 * const file = FS.File.cwd('config.json');
 * ```
 *
 * This pattern provides:
 * - **Clear intent:** `FS.Folder` and `FS.File` immediately indicate filesystem operations
 * - **IDE support:** Better autocomplete and documentation lookup
 * - **Consistency:** Same import style across all `@epdoc/fs` features
 *
 * ## Why FolderSpec?
 *
 * Stop wrestling with different filesystem APIs for each runtime. FolderSpec gives you:
 *
 * - **Universal Compatibility:** Write once, run on Deno, Node.js, and Bun without modification.
 * - **Type Safety:** `FS.FolderPath` branded types prevent costly mistakes (e.g., passing a folder path where a file is expected).
 * - **Fluent API:** Chain methods for readable, concise code: `FS.Folder.home('.config').ensureDir()`.
 * - **Rich Feature Set:** Includes recursive creation, atomic temporary directories, safe copying, and more—no external dependencies like `mkdirp` needed.
 * - **Superior Error Handling:** Get clear, contextual error messages instead of cryptic system codes.
 *
 * ## Quick Start
 *
 * ```ts
 * import * as FS from '@epdoc/fs/fs';
 *
 * // Access standard directories
 * const cfg = FS.Folder.config('myapp');
 * const data = FS.Folder.home('.local', 'share', 'myapp');
 *
 * // Ensure it exists (creates parents automatically)
 * await data.ensureDir();
 *
 * // Create a temporary directory
 * const tmp = await FS.Folder.makeTemp({ prefix: 'myapp-' });
 *
 * // Work with contents
 * const jsonFiles = await data.getFiles(/\.json$/);
 * ```
 *
 * @see {@link FileSpec} for file-specific operations.
 * @see {@link FSSpec} for generic filesystem entries.
 */

import * as Util from '$util';
import { walk, type WalkOptions } from '$walk';
import { _, type Dict } from '@epdoc/type';
import { type Dirent, promises as nfs } from 'node:fs';
import path from 'node:path';
import type * as FS from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import { FileSpec } from './filespec.ts';
import type { FSSpec } from './fsspec.ts';
import type { IRootableSpec, ISafeCopyableSpec } from './icopyable.ts';
import { SymlinkSpec } from './symspec.ts';
import type { TypedFSSpec } from './types.ts';

/**
 * **The recommended way to work with directories in Deno, Node.js, and Bun.**
 *
 * FolderSpec provides a type-safe, fluent API for directory operations that works
 * identically across all JavaScript runtimes. It eliminates the need to remember
 * different APIs for `node:fs`, `Deno`, or `Bun` - one class, consistent behavior everywhere.
 *
 * ## Why use FolderSpec instead of native APIs?
 *
 * - **Cross-runtime compatibility**: Same code runs on Deno, Node.js, and Bun without changes
 * - **Type safety**: `FS.FolderPath` branded types prevent mixing files and folders
 * - **Fluent API**: Chain methods like `FolderSpec.home('.config').ensureDir().then(f => f.list())`
 * - **Built-in utilities**: No need for external `mkdirp` or `rimraf` packages
 * - **Error handling**: Descriptive errors with context instead of generic ENOENT
 *
 * ## Key Capabilities
 *
 * - Navigate and manipulate folder paths with `home()`, `cwd()`, `fromMeta()`, `add()`
 * - Create directories atomically with `ensureDir()` and `mkdir()`
 * - Read contents with `readDir()`, `getFiles()`, `getFolders()`, `walk()`
 * - Safe copy and backup operations with `safeCopy()`
 * - Temporary directory creation with `makeTemp()`
 * - Change working directory with `chdir()`
 *
 * ## Quick Start
 *
 * ```ts
 * import * as FS from '@epdoc/fs/fs';
 *
 * // Get common directories
 * const configDir = FS.Folder.config('myapp');
 * const dataDir = FS.Folder.home('.local', 'share', 'myapp');
 * const tempDir = await FS.Folder.makeTemp({ prefix: 'myapp-' });
 *
 * // Ensure directory exists (creates parents if needed)
 * await dataDir.ensureDir();
 *
 * // List contents
 * const files = await dataDir.getFiles(/\.json$/);
 * ```
 *
 * @see {@link FileSpec} for file operations
 * @see {@link FSSpec} for generic filesystem entries
 * @category Filesystem
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
  /**
   * @deprecated This property is deprecated and will be removed in a future version.
   *   Path segments are resolved immediately in the constructor.
   */
  protected _args: FS.Path[] = [];

  /**
   * Creates a new FolderSpec from path segments.
   *
   * Automatically resolves relative paths against the current working directory.
   * Multiple segments are joined using the platform-specific separator.
   *
   * @param args - Path segments to resolve. Each segment can be a string,
   *   another FolderSpec, or a FileSpec (extracts its directory).
   * @returns A new FolderSpec instance (this is a constructor, returns `this`)
   *
   * @example
   * // Absolute path
   * const logs = new FolderSpec('/var/log');
   *
   * // Relative to current directory
   * const data = new FolderSpec('data', 'exports');
   *
   * // From another FolderSpec
   * const backup = new FolderSpec(logs, 'backups');
   */
  public constructor(...args: FS.PathSegment[]) {
    super();
    this._f = Util.resolvePathArgs(...args) as FS.FolderPath; // Cast to FolderPath
  }

  /**
   * Creates a new FolderSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * This is the **recommended way** to create paths relative to your source code.
   * It works identically in Deno, Node.js, and Bun, handling the subtle differences
   * in how each runtime resolves `import.meta.url`.
   *
   * @param metaUrl - The `import.meta.url` of the calling module.
   * @param paths - Additional path segments to join.
   * @returns {FolderSpec} A new FolderSpec instance.
   *
   * @example
   * // Assuming this code is in /path/to/your/project/src/app.ts
   * const dataFolder = FolderSpec.fromMeta(import.meta.url, '../data');
   * // dataFolder.path will be /path/to/your/project/data
   *
   * @category Factory Methods
   */
  public static fromMeta(metaUrl: string, ...paths: string[]): FolderSpec {
    const dir = path.dirname(Util.fileURLToPath(metaUrl));
    const fullPath = path.join(dir, ...paths);
    return new FolderSpec(fullPath);
  }

  /**
   * Creates a FolderSpec pointing to the current working directory.
   *
   * @returns {FolderSpec} A new FolderSpec instance for `process.cwd()` (Node/Bun)
   *   or `Deno.cwd()` (Deno).
   *
   * @example
   * const here = FolderSpec.cwd();
   * const relative = here.add('config', 'settings.json');
   *
   * @category Factory Methods
   */
  public static cwd(): FolderSpec {
    return new FolderSpec(Util.getCwd());
  }

  /**
   * Changes the current working directory to this folder's path.
   *
   * @warning This affects the entire process. Use with caution in multi-request
   *   applications (e.g., HTTP servers).
   *
   * @returns {this} This FolderSpec instance for method chaining.
   * @throws {FSError} If the directory doesn't exist or lacks permissions.
   *
   * @example
   * FolderSpec.cwd().add('build').chdir();
   * // process.cwd() is now the build directory
   */
  chdir(): this {
    Util.setCwd(this._f);
    return this;
  }

  /**
   * Creates a new temporary directory with optional prefix/suffix.
   *
   * Generates a unique directory name and creates it atomically when possible.
   *
   * ## Cross-runtime Behavior
   *
   * - **Deno**: Uses native `Deno.makeTempDir()` - fully atomic, no collision risk
   * - **Node.js/Bun**: Uses `fs.mkdtemp()` - atomic directory creation with unique suffix
   *
   * @param opts - Configuration options
   * @param opts.prefix - String prepended to the random portion (default: 'tmp-')
   * @param opts.suffix - String appended after the random portion (e.g., '.bak')
   * @param opts.dir - Parent directory (default: system temp directory from `$TMPDIR` or OS default)
   *
   * @returns {Promise<FolderSpec>} A new FolderSpec for the created directory
   *
   * @example
   * const temp = await FolderSpec.makeTemp({ prefix: 'upload-', suffix: '.tmp' });
   * // e.g., /tmp/upload-a3f7c2d8.tmp
   *
   * @remarks
   * The caller is responsible for removing the directory when done.
   * Use `temp.removeAll()` to clean up recursively.
   *
   * @category Factory Methods
   */
  public static async makeTemp(opts: { prefix?: string; suffix?: string; dir?: string } = {}): Promise<FolderSpec> {
    const tmpRoot = opts.dir ? path.resolve(opts.dir) : Util.getTempDir();
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
   * Creates a shallow copy of this FolderSpec instance.
   *
   * Copies the path and cached file info, but **does not** copy the actual
   * directory on disk. Use `copyTo()` or `safeCopy()` for filesystem operations.
   *
   * @returns {FolderSpec} A new FolderSpec with the same path and cached state
   * @see {@link safeCopy} to copy the actual directory contents
   * @see {@link copyParamsTo} for internal use
   */
  copy(): FolderSpec {
    const result = new FolderSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  /**
   * Copies internal state (cached folder contents) to another FolderSpec.
   *
   * Primarily for internal use. Preserves the results of previous `list()`
   * operations when creating copies.
   *
   * @param target - The FolderSpec to receive the copied state
   * @returns {FSSpecBase} The target instance for chaining
   * @protected
   */
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

  /**
   * The absolute, normalized path of this folder.
   *
   * @returns {FS.FolderPath} The folder path as a branded type, ensuring it can't
   *   be accidentally used where a file path is expected.
   * @readonly
   */
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
    const fullPath = path.resolve(Util.getHomeDir(), ...args);
    return new FolderSpec(fullPath);
  }

  /**
   * Creates a new FolderSpec for a directory in the user's config directory.
   * Follows XDG Base Directory Specification:
   * - Checks XDG_CONFIG_HOME environment variable first
   * - Falls back to ~/.config on macOS and Linux
   * - Falls back to %APPDATA% on Windows (via home directory resolution)
   *
   * @param args - Path segments to append to the config directory.
   * @returns {FolderSpec} A new FolderSpec instance.
   *
   * @example
   * const appConfig = FolderSpec.config('myapp');  // e.g. ~/.config/myapp
   * const appData = FolderSpec.config('myapp', 'data');  // e.g. ~/.config/myapp/data
   *
   * @category Factory Methods
   */
  public static config(...args: string[]): FolderSpec {
    // Check for XDG_CONFIG_HOME first (standard Linux/Debian)
    const xdg = Util.getEnv('XDG_CONFIG_HOME');
    if (xdg) {
      const fullPath = Util.resolvePath(xdg, ...args);
      return new FolderSpec(fullPath);
    }

    // Fallback for macOS and standard Linux home
    return FolderSpec.home('.config', ...args);
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
        .map((d: Dirent) => Util.direntToSpec(this.path as FS.FolderPath, d))
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

  safeCopy(destFile: FS.FilePath | FileSpec | FolderSpec | FSSpec, opts: Util.SafeCopyOpts = {}): Promise<void> {
    return Util.safeCopy(this, destFile, opts);
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
