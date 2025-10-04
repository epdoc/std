import { _, type DeepCopyOpts, type Dict, type Integer, stripJsonComments } from '@epdoc/type';
import { assert } from '@std/assert';
import { decodeBase64, encodeBase64 } from '@std/encoding';
import * as dfs from '@std/fs';
import { fromFileUrl } from '@std/path';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { BaseSpec } from './basespec.ts';
import { FSError } from './error.ts';
import type { FolderSpec } from './folderspec.ts';
import { FSBytes } from './fsbytes.ts';
import { FSSpec, fsSpec } from './fsspec.ts';
import type { FSStats } from './fsstats.ts';
import { type FSSpecParam, type IRootableSpec, type ISafeCopyableSpec, resolvePathArgs } from './icopyable.ts';
import { type FileConflictStrategy, fileConflictStrategyType, safeCopy, type SafeCopyOpts } from './safecopy.ts';
import {
  DigestAlgorithm,
  type DigestAlgorithmValues,
  type FilePath,
  type FsDeepCopyOpts,
  type FsDeepJsonDeserializeOpts,
} from './types.ts';
import { isFilePath, joinContinuationLines } from './util.ts';

const REG = {
  pdf: /\.pdf$/i,
  xml: /\.xml$/i,
  json: /\.json$/i,
  jsonc: /\.jsonc$/i,
  txt: /\.(txt|text)$/i,
  lineSeparator: new RegExp(/\r?\0?\n/),
  leadingDot: new RegExp(/^\./),
  BOM: new RegExp(/^\uFEFF/),
};
const BUFSIZE = 2 * 8192;

/**
 * Create a new FSItem object.
 */
export function fileSpec(...args: FSSpecParam): FileSpec {
  return new FileSpec(...args);
}

/**
 * An object representing a file system entry when it is known to be a file.
 */
export class FileSpec extends BaseSpec implements ISafeCopyableSpec, IRootableSpec {
  #file: Deno.FsFile | undefined;

  constructor(...args: FSSpecParam) {
    super();
    this._f = resolvePathArgs(...args);
  }

  /**
   * Creates a new FileSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * @param {string} metaUrl - The `import.meta.url` of the calling module.
   * @param {...string[]} paths - Additional path segments to join.
   * @returns {FileSpec} A new FileSpec instance.
   *
   * @example
   * // Assuming this code is in /path/to/your/project/src/app.ts
   * const configFile = FileSpec.fromMeta(import.meta.url, '../data/config.json');
   * // configFile.path will be /path/to/your/project/data/config.json
   */
  public static fromMeta(metaUrl: string, ...paths: string[]): FileSpec {
    return new FileSpec(path.resolve(fromFileUrl(metaUrl), ...paths));
  }

  /**
   * Creates a new temporary file in the default directory for temporary
   * files, unless `dir` is specified.
   *
   * Other options include prefixing and suffixing the directory name with
   * `prefix` and `suffix` respectively.
   *
   * This call resolves to the full path to the newly created file.
   *
   * Multiple programs calling this function simultaneously will create
   * different files. It is the caller's responsibility to remove the file when
   * no longer needed.
   *
   * ```ts
   * const tmpFileName0 = await Deno.makeTempFile();  // e.g. /tmp/419e0bf2
   * const tmpFileName1 = await Deno.makeTempFile({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
   * ```
   *
   * Requires `allow-write` permission
   *
   * @param opts
   * @param opts.prefix -String that should precede the random portion of the temporary
   * directory's name. This helps you identify the files you've created.
   * @param opts.suffix - String that should follow the random portion of the temporary
   * directory's name. This can be set to an extension (eg. ".json")
   * @param opts.dir - Directory where the temporary directory should be created (defaults to
   * the env variable `TMPDIR`, or the system's default, usually `/tmp`). Note that if the passed `dir` is relative, the path returned  will also be relative. Be mindful of
   * this when changing working directory
   * @returns A new FileSpec object with the path
   */
  public static async makeTemp(opts?: Deno.MakeTempOptions): Promise<FileSpec> {
    const tempFilePath = await Deno.makeTempFile(opts);
    return new FileSpec(tempFilePath);
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see FileSpec#copyTo
   */
  copy(): FileSpec {
    const result = new FileSpec(this);
    this.copyParamsTo(result);
    return result;
  }

  override copyParamsTo(target: BaseSpec): BaseSpec {
    super.copyParamsTo(target);
    return target;
  }

  /**
   * Returns the file's base file name, minus it's extension. For example, for
   * '/path/to/file.name.html', this method will return 'file.name'. Unlike
   * node:path
   * [basename](https://nodejs.org/api/path.html#pathbasenamepath-suffix)
   * method, this does NOT include the extension.
   * @return {string} The base portion of the filename, which excludes the file's extension.
   */
  get basename(): string {
    return path.basename(this._f).replace(/\.[^\.]*$/, '');
  }

  /**
   * Test for equality with the basename of this file.
   * @param {string} name
   * @returns {boolean} True if equal
   */
  isNamed(name: string): boolean {
    return name === this.basename;
  }

  /**
   * Returns the file extension, exluding the decimal character. For example,
   * '/path/to/file.name.html' will return 'html'.
   * @return {string} File extension, exluding the decimal character.
   */
  get extname(): string {
    return path.extname(this._f);
  }

  add(...args: string[]): FileSpec {
    if (args.length === 1 && _.isArray(args[0])) {
      return new FileSpec(path.resolve(this._f, ...args[0]));
    }
    return new FileSpec(path.resolve(this._f, ...args));
  }

  home(...args: string[]): FileSpec {
    return this.add(os.userInfo().homedir, ...args);
  }

  size(): Integer | undefined {
    if (this._stats.isInitialized()) {
      return this._stats.size;
    }
  }

  getSize(): Promise<Integer | undefined> {
    return this.getStats().then(() => {
      return this._stats.size;
    });
  }

  /**
   * Looks at the extension of the filename to determine if it is one of the
   * listed types.
   * @param type List of types (eg. 'jpg', 'png')
   * @returns
   */
  isExtType(...type: (RegExp | string)[]): boolean {
    const lowerCaseExt = this.extname.toLowerCase().replace(/^\./, '');
    for (const entry of type) {
      if (_.isRegExp(entry)) {
        if (entry.test(lowerCaseExt)) {
          return true;
        }
      } else if (_.isString(entry)) {
        if (entry.toLowerCase() === lowerCaseExt) {
          return true;
        }
      }
    }
    return false;
  }

  override isFile(): boolean | undefined {
    return true;
  }

  override isFolder(): boolean | undefined {
    return false;
  }

  override isSymlink(): boolean | undefined {
    return false;
  }

  /**
   * Tests the extension to see if this is a PDF file.
   * @param {boolean} [testContents=false] If true, tests the file contents as well (not implemented).
   * @returns {boolean} True if the extension indicates this is a PDF file.
   */
  isPdf(_testContents = false): boolean {
    return REG.pdf.test(this.extname);
  }

  /**
   * Tests the extension to see if this is an XML file.
   * @returns  {boolean} True if the extension indicates this is an XML file.
   */
  isXml(): boolean {
    return REG.xml.test(this.extname);
  }

  /**
   * Tests the extension to see if this is a text file.
   * @returns {boolean} True if the extension indicates this is a text file.
   */
  isTxt(): boolean {
    return REG.txt.test(this.extname);
  }

  /**
   * Tests the extension to see if this is a JSON file.
   * @returns {boolean} True if the extension indicates this is a JSON file.
   */

  isJson(): boolean {
    return REG.json.test(this.extname);
  }

  /**
   * Tests the extension to see if this is a JSONC file.
   * @returns {boolean} True if the extension indicates this is a JSONC file.
   */

  isJsonc(): boolean {
    return REG.jsonc.test(this.extname);
  }

  /**
 * Asynchronously reads a specified number of bytes from the file and returns
 * them as an FSBytes instance. In order to determine what type of file this is,
 * at least 24 bytes must be read.

 * @param {number} [length=24] The number of bytes to read from the file.
 * Defaults to 24.
 * @returns {Promise<FSBytes>} A promise that resolves with an FSBytes instance
 * containing the read bytes, or rejects with an error.
 */
  async getBytes(length = 24): Promise<FSBytes> {
    const buf = new Uint8Array(length);
    const _numRead = await this.readBytes(buf, 0);
    this.close();
    return new FSBytes(buf);
  }

  /**
   * Set or change the extension of this file. `This` must be a file.
   * @param {string} ext The extension. The string may or may not include a leading '.'.
   * @returns {this} The current FSItem instance.
   */
  setExt(ext: string): this {
    if (!REG.leadingDot.test(ext)) {
      ext = '.' + ext;
    }
    if (ext !== this.extname) {
      this._f = path.format({ ...path.parse(this._f), base: '', ext: ext });
      this._stats.clear();
    }
    return this;
  }

  /**
   * Set or change the basename of this file. `This` must be a file.
   * @param {string} val The new basename for the file.
   * @returns {this} The current FSItem instance.
   */
  setBasename(val: string): this {
    if (val !== this.basename) {
      this._f = path.format({ dir: this.dirname, name: val, ext: this.extname });
      this._stats.clear();
    }
    return this;
  }

  /**
   * For files, calculate the checksum of this file using SHA1
   * @returns {Promise<string>} A promise that resolves with the checksum of the file.'
   * @deprecated - Use digest() instead
   */
  checksum(): Promise<string> {
    return this.digest();
  }

  /**
   * Generates a digest (hash) of the file's contents using the specified algorithm.
   *
   * @param type - The digest algorithm to use (e.g., 'sha1', 'sha256', 'md5'). Defaults to 'sha1'.
   * @returns A promise that resolves to the hexadecimal representation of the digest.
   */
  async digest(type: DigestAlgorithmValues = DigestAlgorithm.sha1): Promise<string> {
    const buf = new Uint8Array(BUFSIZE);
    const hash = crypto.createHash(type);

    let position = 0;
    let bytesRead: number | null = 0;
    try {
      while (bytesRead !== null) {
        bytesRead = await this.readBytes(buf, position, false);
        if (bytesRead !== null) {
          hash.update(buf.slice(0, bytesRead));
          position += bytesRead;
        }
      }
      this.close();
    } catch (error) {
      this.close();
      throw this.asError(error);
    }
    return hash.digest('hex');
  }

  /**
   * Ensures that the parent folder to this file exists
   * @returns {Promise<void>} A promise that resolves when the directory is ensured.
   */
  async ensureParentDir(): Promise<void> {
    await dfs.ensureDir(this.dirname);
  }

  /**
   * For PDF files, gets the Creation Date of this file file by reading it's
   * metadata.
   * @returns {Promise<Date | undefined>} A promise that resolves with the creation date of the PDF file, or undefined if not found.
   */
  getPdfDate(): Promise<Date | undefined> {
    return Promise.resolve()
      .then(() => {
        return Deno.readFile(this._f);
      })
      .then((arrayBuffer) => {
        return PDFDocument.load(arrayBuffer, { updateMetadata: false });
      })
      .then((pdf) => {
        const pdfDate = pdf.getCreationDate();
        if (pdfDate) {
          return Promise.resolve(pdfDate);
        }
        return Promise.reject(new Error('No creation date found'));
      })
      .catch((err) => {
        throw _.asError(err, { path: this._f, cause: 'getPdfDate' });
      });
  }

  /**
   * Use checksums to test if this file is equal to path2
   * @param path2
   * @returns {Promise<boolean>} A promise that resolves with true if the files are equal, false otherwise.
   */
  filesEqual(arg: FilePath | FileSpec | FSSpec): Promise<boolean> {
    if (arg instanceof FileSpec) {
      return this._equal(arg);
    }
    assert(isFilePath(arg) || arg instanceof BaseSpec, 'Invalid filesEqual argument');
    const fs: BaseSpec = arg instanceof BaseSpec ? arg : fsSpec(arg);

    return new Promise((resolve, _reject) => {
      if (fs instanceof FileSpec) {
        return this._equal(fs).then((resp) => {
          resolve(resp);
        });
      } else if (fs instanceof FSSpec) {
        return fs.getResolvedType().then((resp) => {
          if (resp instanceof FileSpec) {
            return this._equal(resp);
          } else {
            return Promise.resolve(false);
          }
        });
      } else {
        return Promise.resolve(false);
      }
    });
  }

  protected async _equal(fs: FileSpec): Promise<boolean> {
    const exists1 = await this.getExists();
    const exists2 = await fs.getExists();
    if (exists1 && exists2) {
      const checksum1 = await this.digest();
      const checksum2 = await fs.digest();
      return checksum1 === checksum2;
    }
    return false;
  }

  async open(opts: { read?: boolean; write?: boolean }): Promise<Deno.FsFile> {
    this.#file = await Deno.open(this._f, opts);
    return this.#file;
  }

  close(): void {
    if (this.#file) {
      this.#file.close();
      this.#file = undefined;
    }
  }

  /**
   * @param {Uint8Array} buffer - An Uint8Array of the length that is to be read
   * @param {Integer} [position=0] - The starting offset to read from the file
   * @returns {Promise<number>} - Resolves to either the number of bytes read during the operation or EOF (null) if there was nothing more to read.
   *
   * @example
   * ```ts
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = await fileSpec.read(buf,0);
   * ```
   */
  async readBytes(buffer: Uint8Array, position: Integer = 0, close = false): Promise<number | null> {
    try {
      if (!this.#file) {
        await this.open({ read: true });
        assert(this.#file, 'File was not opened');
      }
      await this.#file.seek(position, Deno.SeekMode.Start);
      const numRead = await this.#file.read(buffer);
      if (close) {
        this.close();
      }
      return numRead;
    } catch (err) {
      if (close) {
        this.close();
      }
      throw _.asError(err, { path: this._f, cause: 'readBytes' });
    }
  }

  /**
   * Reads the entire file as a Uint8Array. Can optionally decode base64-encoded content.
   *
   * @param {('base64' | undefined)} [encoding] - If 'base64', decodes the file content from base64
   * @returns {Promise<Uint8Array>} A promise that resolves with the file contents as bytes
   *
   * @example
   * // Read binary file
   * const bytes = await file.readAsBytes();
   * console.log(bytes); // Uint8Array [72, 101, 108, 108, 111]
   *
   * // Read base64-encoded file
   * const base64File = await file.readAsBytes('base64');
   * // If file contains "SGVsbG8=" the result will be:
   * // Uint8Array [72, 101, 108, 108, 111] ("Hello" in ASCII)
   */
  async readAsBytes(encoding?: 'base64'): Promise<Uint8Array> {
    try {
      if (encoding === 'base64') {
        const result = await Deno.readTextFile(this._f);
        return decodeBase64(result);
      }
      return await Deno.readFile(this._f);
    } catch (err) {
      throw _.asError(err, { path: this._f, cause: 'readFile' });
    }
  }

  /**
   * Reads the entire file as a string. Can optionally decode base64-encoded content.
   *
   * @param {('base64' | undefined)} [encoding] - If 'base64', decodes the file content from base64 before converting to string
   * @returns {Promise<string>} A promise that resolves with the file contents as a string
   *
   * @example
   * // Read text file
   * const text = await file.readAsString();
   * console.log(text); // e.g., "Hello World"
   *
   * // Read base64-encoded file
   * const base64Text = await file.readAsString('base64');
   * // If file contains "SGVsbG8=" the result will be:
   * // "Hello"
   *
   * @throws {FSError} If the file cannot be read or decoded
   */
  async readAsString(encoding?: 'base64'): Promise<string> {
    try {
      if (encoding === 'base64') {
        const encodedAsBase64 = await Deno.readTextFile(this._f);
        const byteArray: Uint8Array = decodeBase64(encodedAsBase64);
        const decoder = new TextDecoder();
        return decoder.decode(byteArray);
      }
      return await Deno.readTextFile(this._f);
    } catch (err) {
      throw _.asError(err, { path: this._f, cause: 'readTextFile' });
    }
  }

  // safeReadAsString(): ApiResponsePromise<string> {
  //   return await safe(read)
  //   const result = new ApiResponse<string>();
  //   return Deno.readTextFile(this._f)
  //     .then((resp) => {
  //       result.setData(resp);
  //       return Promise.resolve(result);
  //     })
  //     .catch((err) => {
  //       result.setError(new FSError(err, { cause: err.cause, path: this._f }));
  //       return Promise.resolve(result);
  //     });
  // }

  /**
   * Reads the file as a string and splits it into lines.
   * @returns {Promise<string[]>} A promise that resolves with an array of lines.
   */
  async readAsLines(continuation?: string): Promise<string[]> {
    try {
      const data = await Deno.readTextFile(this._f);
      const lines = data.split(REG.lineSeparator).map((line) => {
        // RSC output files are encoded oddly and this seems to clean them up
        return line.replace(/\r/, '').replace(/\0/g, '');
      });

      if (continuation) {
        return joinContinuationLines(lines, continuation);
      } else {
        return lines;
      }
    } catch (err) {
      throw _.asError(err, { path: this._f, cause: 'readAsLines' });
    }
  }

  /**
   * Reads the file as JSON and parses it.
   * @returns {Promise<unknown>} A promise that resolves with the parsed JSON content.
   */
  async readJson<T = unknown>(): Promise<T> {
    try {
      const s = await Deno.readTextFile(this._f);
      if (this.isJsonc()) {
        // If the file is JSONC, strip comments before parsing
        return JSON.parse(stripJsonComments(s, { trailingCommas: true })) as T;
      }
      return JSON.parse(s) as T;
    } catch (err) {
      throw _.asError(err, { path: this._f, cause: 'readJson' });
    }
  }

  /**
   * Reads the file as JSON, parses it, and performs a deep copy with optional transformations. If
   * the file is JSONC, comments are stripped before parsing.
   *
   * This method is unique in that it allows you to deeply clone and transform JSON data as it is
   * read from disk, supporting advanced options such as recursive file inclusion, RegExp detection,
   * and custom transformation hooks.
   *
   * @param {FsDeepJsonDeserializeOpts} [options] - Options for the deep copy operation:
   *   @param {boolean} [options.replace=Dict] - If set, replaces keys with values throughout `a`.
   *   @param {string} [options.pre='{'] - Prefix string for detecting replacement strings and URLs
   *   in string values.
   *   @param {string} [options.post='}'] - Suffix string for detecting replacement strings and URLs
   *   in string values.
   *   @param {boolean} [options.includeUrl=false] - Recursively loads and merges JSON from URLs or
   *   file paths found in string values.
   *   @param {boolean} [options.detectRegExp=false] - If true, detects and reconstructs RegExp
   *   objects from plain objects using asRegExp.
   *   @param [opts.stripJsonComments=false] - If true, strip JSON comments (jsonc)
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed JSON
   * content.
   *
   * @example
   * // Recursively load and merge referenced files
   * const data = await file.deepReadJson({ includeUrl: true });
   */
  async readJsonEx<T = unknown>(opts: FsDeepJsonDeserializeOpts = {}): Promise<T> {
    const data = await this.readAsString();
    return _.jsonDeserialize(data, opts);
  }

  async writeJsonEx(value: unknown, options: DeepCopyOpts | null = null, space?: string | number): Promise<void> {
    const text = _.jsonSerialize(value, options, space);
    await Deno.writeTextFile(this._f, text);
  }

  /**
   * Performs a deep copy of the given data with optional transformations.
   *
   * This function is unique in that it supports:
   *   - Recursively loading and merging JSON from URLs or file paths found in string values.
   *   - Detecting and reconstructing RegExp objects from plain objects.
   *   - Custom transformation or replacement of values during the copy.
   *
   * @param {unknown} a - The data to deep copy.
   * @param {FsDeepCopyOpts} [options] - Options for the deep copy operation:
   *   @param {boolean} [options.replace=Dict] - If set, replaces keys with values throughout `a`.
   *   @param {string} [options.pre='{'] - Prefix string for detecting replacement strings and URLs in string values.
   *   @param {string} [options.post='}'] - Suffix string for detecting replacement strings and URLs in string values.
   *   @param {boolean} [options.includeUrl=false] - Recursively loads and merges JSON from URLs or file paths found in string values.
   *   @param {boolean} [options.detectRegExp=false] - If true, detects and reconstructs RegExp objects from plain objects using asRegExp.
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed data.
   *
   * @example
   * // Deep copy with RegExp detection
   * const copy = await file.#deepCopy(obj, { detectRegExp: true });
   */
  #deepCopy(a: unknown, options?: FsDeepCopyOpts): Promise<unknown> {
    const opts: FsDeepCopyOpts = _.deepCopySetDefaultOpts(options);
    const urlTest = new RegExp(`^${opts.pre}(file|http|https):\/\/(.+)${opts.post}$`, 'i');
    if (opts.includeUrl && _.isNonEmptyString(a) && urlTest.test(a)) {
      const p: string[] | null = a.match(urlTest);
      if (_.isNonEmptyArray(p) && isFilePath(p[2])) {
        const fs = new FileSpec(this.dirname, p[2]);
        return fs.readJsonEx(opts).then((resp) => {
          return Promise.resolve(resp);
        });
      } else {
        return Promise.resolve(a);
      }
    } else if (_.isObject(a)) {
      // @ts-ignore xxx
      const re: RegExp = opts && opts.detectRegExp ? asRegExp(a) : undefined;
      if (re && _.isDict(a)) {
        return Promise.resolve(re);
      } else {
        const jobs: unknown[] = [];
        const result2: Dict = {};
        Object.keys(a).forEach((key) => {
          // @ts-ignore fight the type system latter
          const job = this.#deepCopy(a[key], opts).then((resp) => {
            result2[key] = resp;
          });
          jobs.push(job);
        });
        return Promise.all(jobs).then((_resp) => {
          return Promise.resolve(result2);
        });
      }
    } else {
      return Promise.resolve(_.deepCopy(a, opts));
    }
  }

  /**
   * Writes JSON data to the file.
   * @param {unknown} data - The data to write as JSON.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  async writeJson(data: unknown): Promise<void> {
    const text = JSON.stringify(data, null, 2);
    await Deno.writeTextFile(this._f, text);
  }

  /**
   * Encodes input as base64 and writes to the file.
   * @param {string | Uint8Array} data - The data to encode and write as base64
   * @returns {Promise<void>} A promise that resolves when the write completes
   *
   * @example
   * // Write string as base64
   * await file.writeBase64('Hello world');
   * // File contains: SGVsbG8gd29ybGQ=
   *
   * // Write binary data as base64
   * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
   * await file.writeBase64(bytes);
   * // File contains: SGVsbG8=
   */
  async writeBase64(data: string | Uint8Array | ArrayBuffer): Promise<void> {
    const encoded = encodeBase64(data);
    await this.write(encoded);
  }

  /**
   * Writes data to the file.
   *
   * @param {string | string[] | Uint8Array} data - The data to write:
   *   - string: Text content with encoding
   *   - string[]: Array of lines to join with newlines
   *   - Uint8Array: Raw binary data
   * @param {string} [type='utf8'] - Text encoding (ignored for Uint8Array)
   * @returns {Promise<void>} Promise that resolves when write completes
   *
   * @example
   * // Write text content
   * await file.write('Hello world');
   *
   * // Write array of lines
   * await file.write(['line 1', 'line 2']);
   *
   * // Write binary data
   * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
   * await file.write(bytes);
   */
  async write(data: string | string[] | Uint8Array): Promise<void> {
    try {
      if (data instanceof Uint8Array) {
        await Deno.writeFile(this._f, data);
      } else {
        const text = _.isArray(data) ? data.join('\n') : data;
        await Deno.writeTextFile(this._f, text);
      }
    } catch (err) {
      throw this.asError(err);
    }
  }
  safeCopy(destFile: FilePath | FileSpec | FolderSpec | FSSpec, opts: SafeCopyOpts = {}): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  /**
   * 'Backup' a file by moving it to a new filename. Use when copying a file to
   * the same location or creating a new file at the same location.
   * @param {BackupOpts} opts
   * @returns {Promise<FilePath | undefined>} - Path to file if file was backed
   * up, or true if the file didn't exist
   */
  async backup(
    opts: FileConflictStrategy = { type: 'renameWithTilde', errorIfExists: false },
  ): Promise<FilePath | undefined> {
    const stats: FSStats = await this.getStats();
    if (!stats || !stats.exists()) {
      throw new FSError('File does not exist', { code: 'ENOENT', path: this._f });
    }
    const newPath: FilePath | undefined = await this.#getNewPath(opts);
    if (isFilePath(newPath)) {
      return this.moveTo(newPath, { overwrite: true })
        .then(() => {
          return Promise.resolve(newPath);
        })
        .catch((err) => {
          if (err instanceof Error) {
            throw err;
          }
          throw new FSError(String(err), { code: 'ENOENT', path: this._f });
        });
    }
    return Promise.resolve(undefined);
  }

  #getNewPath(opts: FileConflictStrategy): Promise<FilePath | undefined> {
    return new Promise((resolve, reject) => {
      if (opts.type === fileConflictStrategyType.renameWithTilde) {
        resolve(this.path + '~'); // Changed to return string directly
      } else if (opts.type === fileConflictStrategyType.renameWithNumber) {
        const limit = _.isInteger(opts.limit) ? opts.limit : 32;
        this.findAvailableIndexFilename(limit, opts.separator, opts.prefix).then((resp) => {
          if (!resp && opts.errorIfExists) {
            reject(new FSError('File exists', { code: 'EEXIST', path: this._f }));
          } else {
            resolve(resp);
          }
        });
      } else if (opts.type === 'overwrite') {
        resolve(this.path); // Changed to return string directly
      } else {
        if (opts.errorIfExists) {
          reject(new FSError('File exists', { code: 'EEXIST', path: this._f }));
        }
        resolve(undefined);
      }
    });
  }

  /**
   * Finds the next available indexed filename. For example, for `filename.ext`,
   * tries `filename-01.ext`, `filename-02.ext`, etc until it finds a filename
   * that is not used.
   * @param {Integer} [limit=32] - The maximum number of attempts to find an available filename.
   * @param {string} [sep='-'] - The separator to use between the filename and the index.
   * @returns {Promise<FilePath | undefined>} A promise that resolves with an available file path, or undefined if not found.
   */
  async findAvailableIndexFilename(
    _limit: Integer = 32,
    sep: string = '-',
    prefix: string = '',
  ): Promise<FilePath | undefined> {
    let newFsDest: FileSpec | undefined;
    let count = 0;
    let looking = true;
    while (looking) {
      newFsDest = fileSpec(this.dirname, this.basename + sep + prefix + _.pad(++count, 2) + this.extname);
      looking = await newFsDest.getExists();
    }
    if (!looking && newFsDest instanceof FileSpec) {
      return newFsDest.path;
    }
  }

  asError(error: unknown): FSError {
    return new FSError(_.asError(error), { path: this._f });
  }
}
