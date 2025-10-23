import * as Error from '$error';
import {
  type FileConflictStrategy,
  fileConflictStrategyType,
  joinContinuationLines,
  resolvePathArgs,
  safeCopy,
  type SafeCopyOpts,
} from '$util';
import { _, type DeepCopyOpts, type Dict, type Integer, stripJsonComments } from '@epdoc/type';
import { assert } from '@std/assert';
import { decodeBase64, encodeBase64 } from '@std/encoding';
import { fromFileUrl } from '@std/path';
import crypto from 'node:crypto';
import { promises as nfs } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DigestAlgorithm } from '../consts.ts';
import { FSBytes } from '../fsbytes.ts';
import { asFilePath, isFilePath } from '../guards.ts';
import type * as FS from '../types.ts';
import { FSSpecBase } from './basespec.ts';
import { FolderSpec } from './folderspec.ts';
import { FSSpec } from './fsspec.ts';
import type { ICopyableSpec, IRootableSpec, ISafeCopyableSpec } from './icopyable.ts';
import { PDFMetadataReader } from './readpdf.ts';
import type { JsonReplacer } from './types.ts';

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
 * Class representing a file system entry when it is known to be a file.
 */
export class FileSpec extends FSSpecBase implements ICopyableSpec, IRootableSpec, ISafeCopyableSpec {
  #file?: FileHandle;

  /**
   * Public constructor for FileSpec.
   * @param args - Path segments to resolve.
   */
  public constructor(...args: FS.PathSegment[]) {
    super();
    this._f = resolvePathArgs(...args) as FS.FilePath; // Cast to FilePath
  }

  override get path(): FS.FilePath {
    return this._f as FS.FilePath;
  }

  /**
   * Return the FolderSpec for the folder that contains this file.
   */
  parentFolder(): FolderSpec {
    return new FolderSpec(this.dirname);
  }

  /**
   * Creates a new FileSpec from a file URL, typically from `import.meta.url`.
   * This allows for creating paths relative to the current module.
   *
   * @param metaUrl - The `import.meta.url` of the calling module.
   * @param paths - Additional path segments to join.
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
  public static async makeTemp(opts: { prefix?: string; suffix?: string; dir?: string } = {}): Promise<FileSpec> {
    const tmpRoot = opts.dir ? path.resolve(opts.dir) : os.tmpdir();
    const prefix = _.isString(opts.prefix) ? opts.prefix : 'tmp-';
    const mkdtempPrefix = path.join(tmpRoot, prefix);

    try {
      // Create a unique temp directory
      const tmpDir = await nfs.mkdtemp(mkdtempPrefix);

      // Generate a unique filename
      const name = _.isFunction(crypto.randomUUID) ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');

      let filePath = path.join(tmpDir, name);
      if (opts?.suffix) {
        filePath = `${filePath}${opts.suffix}`;
      }

      // Create the file exclusively
      const fh = await nfs.open(filePath, 'wx');
      await fh.close();

      return new FileSpec(filePath);
    } catch (err: unknown) {
      throw new FileSpec(mkdtempPrefix).asError(err, 'makeTemp');
    }
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

  override copyParamsTo(target: FSSpecBase): FSSpecBase {
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
   * @param name
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

  /**
   * Appends additional path segments to the current file system path.
   *
   * @param args - One or more string path segments.
   * @returns {FileSpec} A new FileSpec instance with the updated path.
   * @experimental
   *
   *  * @example
   * const original = new FileSpec('/Users/jpravetz/projects/file.txt');
   * const updated = original.add('new_folder', 'new_file.txt');
   * console.log(updated.path); // e.g. '/Users/jpravetz/projects/new_folder/new_file.txt'
   */
  add(...args: string[]): FileSpec {
    if (args.length === 1 && _.isArray(args[0])) {
      return new FileSpec(path.resolve(this._f, ...args[0]));
    }
    return new FileSpec(path.resolve(this._f, ...args));
  }

  /**
   * Constructs a new FileSpec instance rooted at the user's home directory.
   *
   * @param args - Additional path segments to append after the home directory.
   * @returns {FileSpec} A new FileSpec instance for the specified path.
   *
   * @example
   * // Create an FileSpec instance rooted at the home directory and point to a specific file.
   * const fs = new FileSpec('/any/initial/path/file.txt');
   * const homeFs = fs.home('Documents', 'Projects', 'my_file.txt');
   * console.log(homeFs.path); // e.g. '/Users/yourUsername/Documents/Projects/my_file.txt'
   */
  home(...args: string[]): FileSpec {
    return this.add(os.userInfo().homedir, ...args);
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

  /**
   * Tests the extension to see if this is a PDF file.
   * @param [testContents=false] If true, tests the file contents as well (not implemented).
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

  async size(force = false): Promise<Integer | undefined> {
    const info = await this.stats(force);
    return (info && _.isPosInteger(info.size)) ? info.size as Integer : undefined;
  }

  /**
 * Asynchronously reads a specified number of bytes from the file and returns
 * them as an FSBytes instance. In order to determine what type of file this is,
 * at least 24 bytes must be read.

 * @param [length=24] The number of bytes to read from the file. Defaults to 24.
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
   * @param ext The extension. The string may or may not include a leading '.'.
   * @returns {this} The current FSItem instance.
   */
  setExt(ext: string): this {
    if (!REG.leadingDot.test(ext)) {
      ext = '.' + ext;
    }
    if (ext !== this.extname) {
      this._f = path.format({ ...path.parse(this._f), base: '', ext: ext }) as FS.FilePath;
      this._info = undefined;
    }
    return this;
  }

  /**
   * Set or change the basename of this file. `This` must be a file.
   * @param val The new basename for the file.
   * @returns {this} The current FSItem instance.
   */
  setBasename(val: string): this {
    if (val !== this.basename) {
      this._f = path.format({ dir: this.dirname, name: val, ext: this.extname }) as FS.FilePath;
      this._info = undefined;
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
  async digest(type: FS.DigestAlgorithmValues = DigestAlgorithm.sha1): Promise<string> {
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
   * Ensures that the parent folder to this file exists.
   *
   * This method will consult our FolderSpec helpers and, if the parent
   * folder does not exist, attempt to create it. Errors are thrown as
   * specific subclasses of Error.FSError so callers can respond to
   * common filesystem failure modes (e.g. not found, permission denied).
   *
   * @throws {FSNotFoundError|FSPermissionError|Error.FSError} When the parent
   * directory cannot be created or validated. The thrown error will be an
   * instance of a subclass of Error.FSError with `.path` set to the file path.
   */
  async ensureParentDir(): Promise<void> {
    const parent = new FolderSpec(this.dirname);
    try {
      await parent.ensureDir();
    } catch (err: unknown) {
      throw this.asError(err, 'ensureParentDir');
    }
  }

  /**
   * For PDF files, gets the Creation Date of this file by reading its metadata using PDFMetadataReader.
   * @returns {Promise<Date | undefined>} A promise that resolves with the creation date of the PDF file, or undefined if not found.
   */
  async getPdfDate(): Promise<Date | undefined> {
    try {
      const metadata = await PDFMetadataReader.extractMetadata(this._f);
      return metadata.creationDate;
    } catch (err) {
      throw this.asError(err, 'getPdfDate');
    }
  }

  /**
   * For PDF files, gets the Creation Date of this file file by reading it's
   * metadata.
   * @returns {Promise<Date | undefined>} A promise that resolves with the creation date of the PDF file, or undefined if not found.
   */
  // getPdfDateDeprecated(): Promise<Date | undefined> {
  //   return Promise.resolve()
  //     .then(() => {
  //       return Deno.readFile(this._f);
  //     })
  //     .then((arrayBuffer) => {
  //       return PDFDocument.load(arrayBuffer, { updateMetadata: false });
  //     })
  //     .then((pdf) => {
  //       const pdfDate = pdf.getCreationDate();
  //       if (pdfDate) {
  //         return Promise.resolve(pdfDate);
  //       }
  //       return Promise.reject(new Error('No creation date found'));
  //     })
  //     .catch((err) => {
  //       throw _.asError(err, { path: this._f, cause: 'getPdfDate' });
  //     });
  // }

  async open(opts: { read?: boolean; write?: boolean }): Promise<FileHandle> {
    try {
      // map read/write flags to Node flags
      const flags = opts.write ? (opts.read ? 'r+' : 'w') : 'r';
      this.#file = await nfs.open(this._f, flags);
      return this.#file;
    } catch (err: unknown) {
      throw this.asError(err, 'open');
    }
  }

  close(): void {
    if (this.#file) {
      // close is async on Node; keep signature void to match callers
      this.#file.close().catch(() => {/* ignore */});
      this.#file = undefined;
    }
  }

  /**
   * @param buffer - An Uint8Array of the length that is to be read
   * @param [position=0] - The starting offset to read from the file
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
      // FileHandle.read returns { bytesRead, buffer }
      const result = await this.#file.read(buffer, 0, buffer.length, position);
      const bytesRead = result.bytesRead ?? 0;
      if (close) this.close();
      // return null for EOF to match previous API
      return bytesRead === 0 ? null : bytesRead;
    } catch (err) {
      if (close) this.close();
      throw this.asError(err, 'readBytes');
    }
  }

  /**
   * Reads the entire file as a Uint8Array. Can optionally decode base64-encoded content.
   *
   * @param [encoding] - If 'base64', decodes the file content from base64
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
        const result = (await nfs.readFile(this._f)).toString('utf8');
        return decodeBase64(result);
      }
      const buf = await nfs.readFile(this._f);
      return new Uint8Array(buf);
    } catch (err) {
      throw this.asError(err, 'readAsBytes');
    }
  }

  /**
   * Reads the entire file as a string. Can optionally decode base64-encoded content.
   *
   * @param [encoding] - If 'base64', decodes the file content from base64 before converting to string
   * @returns {Promise<string>} A promise that resolves with the file contents as a string
   *
   * @throws {FSNotFoundError|FSPermissionError|FSReadError|Error.FSError} When the file cannot be read or decoded.
   */
  async readAsString(encoding?: 'base64'): Promise<string> {
    try {
      if (encoding === 'base64') {
        const encodedAsBase64 = (await nfs.readFile(this._f)).toString('utf8');
        const byteArray: Uint8Array = decodeBase64(encodedAsBase64);
        const decoder = new TextDecoder();
        return decoder.decode(byteArray);
      }
      return (await nfs.readFile(this._f)).toString('utf8');
    } catch (err: unknown) {
      throw this.asError(err, 'readAsString');
    }
  }

  /**
   * Reads the file as a string and splits it into lines.
   * @returns {Promise<string[]>} A promise that resolves with an array of lines.
   */
  async readAsLines(continuation?: string): Promise<string[]> {
    try {
      const data = (await nfs.readFile(this._f)).toString('utf8');
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
      throw this.asError(err, 'readAsLines');
    }
  }

  /**
   * Reads the file as JSON and parses it.
   * @returns {Promise<unknown>} A promise that resolves with the parsed JSON content.
   */
  async readJson<T = unknown>(): Promise<T> {
    try {
      const s = await this.readAsString();
      if (this.isJsonc()) {
        // If the file is JSONC, strip comments before parsing
        return JSON.parse(stripJsonComments(s, { trailingCommas: true })) as T;
      }
      return JSON.parse(s) as T;
    } catch (err) {
      throw this.asError(err, 'readJson');
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
   * @param [options] - Options for the deep copy operation:
   *   @param [options.replace=Dict] - If set, replaces keys with values throughout `a`.
   *   @param [options.pre='{'] - Prefix string for detecting replacement strings and URLs
   *   in string values.
   *   @param [options.post='}'] - Suffix string for detecting replacement strings and URLs
   *   in string values.
   *   @param [options.includeUrl=false] - Recursively loads and merges JSON from URLs or
   *   file paths found in string values.
   *   @param [options.detectRegExp=false] - If true, detects and reconstructs RegExp
   *   objects from plain objects using asRegExp.
   *   @param [opts.stripJsonComments=false] - If true, strip JSON comments (jsonc)
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed JSON
   * content.
   *
   * @example
   * // Recursively load and merge referenced files
   * const data = await file.deepReadJson({ includeUrl: true });
   */
  async readJsonEx<T = unknown>(opts: FS.FsDeepJsonDeserializeOpts = {}): Promise<T> {
    const data = await this.readAsString();
    const json = _.jsonDeserialize(data, opts);
    if (opts.includeUrl || opts.detectRegExp) {
      return (await this.#deepCopy(json, opts)) as T;
    }
    return json as T;
  }

  async writeJsonEx(value: unknown, options: DeepCopyOpts | null = null, space?: string | number): Promise<this> {
    const text = _.jsonSerialize(value, options, space);
    let fileHandle: FileHandle | undefined;
    try {
      fileHandle = await nfs.open(this._f, 'w');
      await fileHandle.write(new TextEncoder().encode(text));
      await fileHandle.sync(); // Ensure data is flushed to disk
    } catch (err: unknown) {
      throw this.asError(err, 'writeJsonEx');
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
    return this;
  }

  /**
   * Writes JSON data to the file.
   * Accepts the same replacer and space parameters as JSON.stringify.
   * @param data - The data to write as JSON.
   * @returns {Promise<void>} A promise that resolves to this when the write operation is complete.
   */
  async writeJson(
    data: unknown,
    replacer?: JsonReplacer,
    space?: string | number,
  ): Promise<this> {
    const replacerArg = replacer as unknown as Parameters<typeof JSON.stringify>[1];
    const text = JSON.stringify(data, replacerArg, space);
    let fileHandle: FileHandle | undefined;
    try {
      fileHandle = await nfs.open(this._f, 'w');
      await fileHandle.write(new TextEncoder().encode(text));
      await fileHandle.sync(); // Ensure data is flushed to disk
    } catch (err) {
      throw this.asError(err);
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
    return this;
  }

  /**
   * Encodes input as base64 and writes to the file.
   * @param data - The data to encode and write as base64
   * @returns {Promise<void>} A promise that resolves to this when the write completes
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
  async writeBase64(data: string | Uint8Array | ArrayBuffer): Promise<this> {
    const encoded = encodeBase64(data);
    await this.write(encoded);
    return this;
  }

  /**
   * Writes data to the file.
   *
   * @param data - The data to write:
   *   - string: Text content with encoding
   *   - string[]: Array of lines to join with newlines
   *   - Uint8Array: Raw binary data
   * @param [type='utf8'] - Text encoding (ignored for Uint8Array)
   * @returns {Promise<void>} Promise that resolves to this when write completes
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
  async write(data: string | string[] | Uint8Array): Promise<this> {
    let fileHandle: FileHandle | undefined;
    try {
      fileHandle = await nfs.open(this._f, 'w');
      if (data instanceof Uint8Array) {
        await fileHandle.write(data);
      } else {
        const text = _.isArray(data) ? data.join('\n') : data;
        await fileHandle.write(new TextEncoder().encode(text));
      }
      await fileHandle.sync(); // Ensure data is flushed to disk
    } catch (err) {
      throw this.asError(err);
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
    return this;
  }

  /**
   * Moves this file to a new location.
   * @param dest - The destination. If a `FolderSpec` is provided, the file is
   * moved into that folder. If a `FileSpec` is provided, the file is moved and
   * renamed to the path of that `FileSpec`.
   * @param options - Options for the move operation.
   * @param {boolean} [options.overwrite=false] - If true, the destination file
   * will be overwritten if it already exists.
   * @returns A promise that resolves to the new FileSpec.
   * @throws {Error.NotFound} If the source file does not exist.
   * @throws {Error.AlreadyExists} If `options.overwrite` is false and the
   * destination file already exists.
   */
  async moveTo(dest: FolderSpec | FileSpec, options?: FS.MoveOptions): Promise<FileSpec> {
    if (!await this.exists()) {
      throw new Error.NotFound('File does not exist', { code: 'ENOENT', path: this._f });
    }

    const destFile = (dest instanceof FileSpec) ? dest : new FileSpec(dest, this.filename);
    await destFile.ensureParentDir();

    try {
      if (options?.overwrite) {
        await nfs.rename(this._f, destFile.path);
      } else {
        const destExists = await destFile.exists(true);
        if (destExists) {
          throw new Error.AlreadyExists('Destination file already exists', { path: destFile.path });
        }
        await nfs.rename(this._f, destFile.path);
      }
      this.clearInfo();
    } catch (err: unknown) {
      throw this.asError(err, 'moveTo');
    }
    return destFile;
  }

  /**
   * Safely copies the file to a new destination, with built-in handling for
   * name conflicts to prevent accidental data loss.
   *
   * This method delegates to a shared `safeCopy` utility. If the destination
   * file already exists, the default behavior is to back up the destination
   * file by renaming it with a `~` suffix before performing the copy.
   *
   * @param destFile - The destination. If a `FolderSpec` or folder path is
   * provided, the file is copied into it under its original name. If a
   * `FileSpec` or file path is provided, it is copied to that exact path.
   * @param opts - Options to control the copy behavior.
   * @param {boolean} [opts.overwrite=false] - If true, directly overwrites the
   * destination file without creating a backup.
   * @param {FileConflictStrategy} [opts.conflictStrategy] - The strategy to use if
   * the destination exists and `overwrite` is false. Defaults to renaming the
   * destination with a tilde.
   * @returns A promise that resolves when the copy operation is complete.
   */
  safeCopy(destFile: FS.FilePath | FileSpec | FolderSpec | FSSpec, opts: SafeCopyOpts = {}): Promise<void> {
    return safeCopy(this, destFile, opts);
  }

  /**
   * Backs up the current file by moving it to a new path, determined by the
   * chosen strategy. This is useful for preserving a file before overwriting it.
   * The `moveTo` operation is called with `overwrite: true`, ensuring the
   * backup file is created.
   * @param opts - The strategy for resolving a file conflict to generate the
   * backup path. Defaults to renaming with a tilde (`~`).
   * @param {'renameWithTilde' | 'renameWithNumber' | 'overwrite' | 'error'} [opts.type='renameWithTilde'] - The backup strategy.
   *   - `renameWithTilde`: Appends a `~` to the filename.
   *   - `renameWithNumber`: Appends an incrementing number (e.g., `-01`).
   *   - `overwrite`: Uses the same path (no-op for backup path generation).
   *   - `error`: Throws an error if the file exists (via `#getNewPath`).
   * @param {boolean} [opts.errorIfExists=false] - If true, throws an error if the generated backup path already exists.
   * @param {string} [opts.separator='-'] - Separator for `renameWithNumber`.
   * @param {string} [opts.prefix=''] - Prefix for `renameWithNumber`.
   * @param {number} [opts.limit=32] - Max attempts for `renameWithNumber`.
   * @returns A promise that resolves with a `FileSpec` for the new backup
   * file, or `undefined` if no backup path was generated.
   * @throws {Error.NotFound} If the source file does not exist (from `moveTo`).
   * @throws {Error.AlreadyExists} If the chosen backup strategy results in a
   * path that already exists and `opts.errorIfExists` is true.
   */
  async backup(
    opts: FileConflictStrategy = { type: 'renameWithTilde', errorIfExists: false },
  ): Promise<FileSpec | undefined> {
    const newPath: FS.FilePath | undefined = await this.#getNewPath(opts);
    if (newPath && isFilePath(newPath)) {
      const newFile = new FileSpec(newPath);
      await this.moveTo(newFile, { overwrite: true });
      return newFile;
    }
  }

  /**
   * Compares this file to another file to determine if they are equal.
   *
   * The comparison is done first by size. If the sizes are equal, it can
   * optionally perform a checksum comparison for byte-for-byte equality.
   *
   * @param arg - The file to compare against. Can be a path string, a
   * `FileSpec`, or a generic `FSSpec`.
   * @param opts - Options to control the comparison.
   * @param {boolean} [opts.checksum=true] - If true, performs a checksum
   * comparison if the file sizes are identical. If false, only file sizes
   * are compared.
   * @returns A promise that resolves to `true` if the files are deemed equal,
   * otherwise `false`.
   */
  async equalTo(arg: FS.FilePath | FileSpec | FSSpec, opts: FS.EqualOptions = { checksum: true }): Promise<boolean> {
    if (arg instanceof FileSpec) {
      return await this.#equal(arg, opts);
    }
    if (arg instanceof FSSpec) {
      const fs = await arg.resolvedType();
      if (fs instanceof FileSpec) {
        return await this.#equal(fs, opts);
      }
      return false;
    }
    if (isFilePath(arg)) {
      const fs = new FileSpec(arg);
      const isFile = await fs.isFile();
      if (isFile) {
        return await this.#equal(fs, opts);
      }
      return false;
    }
    // invalid usage -> throw a usage specific error subclass
    throw this.asError('Invalid filesEqual argument', 'filesEqual');
  }

  /**
   * Returns a temporary file path by appending a tilde (~).
   * @returns {Promise<FilePath>} A promise that resolves to the temporary file path.
   * @deprecated
   */
  getUniquePath(): Promise<FS.FilePath> {
    return Promise.resolve((this.path + '~') as FS.FilePath);
  }

  /**
   * Returns a unique file path by appending a number if the file already exists.
   * @returns {Promise<FilePath>} A promise that resolves to a unique file path.
   * @deprecated
   */
  getUniqueFile(): Promise<FS.FilePath> {
    return new Promise<FS.FilePath>((resolve) => {
      let count = 0;
      const sep = '-';
      const prefix = 'copy';
      const check = async (newFs: FileSpec) => {
        const exists = await newFs.exists();
        if (exists) {
          const newFsDest = new FileSpec(this.dirname, this.basename + sep + prefix + _.pad(++count, 2) + this.extname);
          check(newFsDest);
        } else {
          resolve(newFs.path);
        }
      };
      check(this);
    });
  }

  #getNewPath(opts: FileConflictStrategy): Promise<FS.FilePath | undefined> {
    return new Promise((resolve, reject) => {
      if (opts.type === fileConflictStrategyType.renameWithTilde) {
        resolve(asFilePath(this.path + '~')); // Changed to return string directly
      } else if (opts.type === fileConflictStrategyType.renameWithNumber) {
        const limit = _.isInteger(opts.limit) ? opts.limit : 32;
        this.findAvailableIndexFilename(limit, opts.separator, opts.prefix).then((resp) => {
          if (!resp && opts.errorIfExists) {
            reject(new Error.AlreadyExists('File exists', { code: 'EEXIST', path: this._f }));
          } else {
            resolve(resp);
          }
        });
      } else if (opts.type === 'overwrite') {
        resolve(this.path); // Changed to return string directly
      } else {
        if (opts.errorIfExists) {
          reject(new Error.AlreadyExists('File exists', { code: 'EEXIST', path: this._f }));
        }
        resolve(undefined);
      }
    });
  }

  /**
   * Performs a deep copy of the given data with optional transformations.
   *
   * This function is unique in that it supports:
   *   - Recursively loading and merging JSON from URLs or file paths found in string values.
   *   - Detecting and reconstructing RegExp objects from plain objects.
   *   - Custom transformation or replacement of values during the copy.
   *
   * @param a - The data to deep copy.
   * @param [options] - Options for the deep copy operation:
   *   @param [options.replace=Dict] - If set, replaces keys with values throughout `a`.
   *   @param [options.pre='{'] - Prefix string for detecting replacement strings and URLs in string values.
   *   @param [options.post='}'] - Suffix string for detecting replacement strings and URLs in string values.
   *   @param [options.includeUrl=false] - Recursively loads and merges JSON from URLs or file paths found in string values.
   *   @param [options.detectRegExp=false] - If true, detects and reconstructs RegExp objects from plain objects using asRegExp.
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed data.
   *
   * @example
   * // Deep copy with RegExp detection
   * const copy = await file.#deepCopy(obj, { detectRegExp: true });
   */
  #deepCopy(a: unknown, options?: FS.FsDeepCopyOpts): Promise<unknown> {
    const opts: FS.FsDeepCopyOpts = _.deepCopySetDefaultOpts(options);
    if (opts.includeUrl && _.isNonEmptyString(a)) {
      const urlTest = new RegExp(`^${opts.pre}(file|http|https):\/\/(.+)${opts.post}$`, 'i');
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

  async #equal(fs: FileSpec, opts: FS.EqualOptions = { checksum: true }): Promise<boolean> {
    const aInfo = await this.stats();
    const bInfo = await fs.stats();
    if (!aInfo || !bInfo) {
      return false;
    }
    if (!aInfo.isFile || !bInfo.isFile) {
      return false;
    }
    if (aInfo.size !== bInfo.size) {
      return false;
    }
    if (opts.checksum) {
      const aChecksum = await this.digest();
      const bChecksum = await fs.digest();
      if (aChecksum !== bChecksum) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds the next available indexed filename. For example, for `filename.ext`,
   * tries `filename-01.ext`, `filename-02.ext`, etc until it finds a filename
   * that is not used.
   * @param [limit=32] - The maximum number of attempts to find an available filename.
   * @param [sep='-'] - The separator to use between the filename and the index.
   * @returns {Promise<FilePath | undefined>} A promise that resolves with an available file path, or undefined if not found.
   */
  async findAvailableIndexFilename(
    _limit: Integer = 32,
    sep: string = '-',
    prefix: string = '',
  ): Promise<FS.FilePath | undefined> {
    let newFsDest: FileSpec | undefined;
    let count = 0;
    let looking = true;
    while (looking) {
      newFsDest = new FileSpec(this.dirname, this.basename + sep + prefix + _.pad(++count, 2) + this.extname);
      looking = await newFsDest.exists();
    }
    if (!looking && newFsDest instanceof FileSpec) {
      return newFsDest.path;
    }
  }
}
