import type { Dict, Integer } from '@epdoc/type';
import {
  deepCopy,
  deepCopySetDefaultOpts,
  isArray,
  isDict,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isRegExp,
  isString,
  pad,
} from '@epdoc/type';
import { assert } from '@std/assert';
import checksum from 'checksum';
import { Buffer } from 'node:buffer';
import fs, { close } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BaseSpec } from './basespec.ts';
import type { FolderSpec } from './folderspec.ts';
import { FSBytes } from './fsbytes.ts';
import { FSSpec, fsSpec } from './fsspec.ts';
import type { FSStats } from './fsstats.ts';
import { type FSSpecParam, type IRootableSpec, type ISafeCopyableSpec, resolvePathArgs } from './icopyable.ts';
import { type FileConflictStrategy, fileConflictStrategyType, safeCopy, type SafeCopyOpts } from './safecopy.ts';
import type { FilePath, FsDeepCopyOpts } from './types.ts';
import { isFilePath } from './types.ts';
import { joinContinuationLines } from './util.ts';

const REG = {
  pdf: /\.pdf$/i,
  xml: /\.xml$/i,
  json: /\.json$/i,
  txt: /\.(txt|text)$/i,
  lineSeparator: new RegExp(/\r?\0?\n/),
  leadingDot: new RegExp(/^\./),
  BOM: new RegExp(/^\uFEFF/),
};

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
  // @ts-ignore this does get initialized

  constructor(...args: FSSpecParam) {
    super();
    this._f = resolvePathArgs(...args);
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
    if (args.length === 1 && isArray(args[0])) {
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
      if (isRegExp(entry)) {
        if (entry.test(lowerCaseExt)) {
          return true;
        }
      } else if (isString(entry)) {
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
 * Asynchronously reads a specified number of bytes from the file and returns
 * them as an FSBytes instance. In order to determine what type of file this is,
 * at least 24 bytes must be read.

 * @param {number} [length=24] The number of bytes to read from the file.
 * Defaults to 24.
 * @returns {Promise<FSBytes>} A promise that resolves with an FSBytes instance
 * containing the read bytes, or rejects with an error.
 */
  getBytes(length = 24): Promise<FSBytes> {
    return this.readBytes(length).then((buffer: Buffer) => {
      return new FSBytes(buffer as Buffer);
    });
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
   * For files, calculate the checksum of this file
   * @returns {Promise<string>} A promise that resolves with the checksum of the file.
   */
  checksum(): Promise<string> {
    return new Promise((resolve, reject) => {
      // @ts-ignore too picky
      checksum.file(this._f, (err, sum) => {
        if (err) {
          reject(this.newError(err));
        } else {
          resolve(sum as string);
        }
      });
    });
  }

  /**
   * For PDF files, gets the Creation Date of this file file by reading it's
   * metadata.
   * @returns {Promise<Date | undefined>} A promise that resolves with the creation date of the PDF file, or undefined if not found.
   */
  getPdfDate(): Promise<Date | undefined> {
    let doc: unknown;
    return import('npm:pdf-lib')
      .then(({ PDFDocument }) => {
        doc = PDFDocument;
        if (doc) {
          return Deno.readFile(this._f);
        }
      })
      .then((arrayBuffer) => {
        if (doc) {
          // @ts-ignore we don't have types for pdf-lib
          return doc.load(arrayBuffer, { updateMetadata: false });
        }
        return Promise.reject(new Error('No PDFDocument found'));
      })
      .then((pdf) => {
        const pdfDate = pdf.getCreationDate();
        if (pdfDate) {
          return Promise.resolve(pdfDate);
        }
        return Promise.reject(new Error('No creation date found'));
      });
  }

  /**
   * Use checksums to test if this file is equal to path2
   * @param path2
   * @returns {Promise<boolean>} A promise that resolves with true if the files are equal, false otherwise.
   */
  filesEqual(arg: FilePath | FileSpec | FSSpec): Promise<boolean> {
    assert(isFilePath(arg) || arg instanceof BaseSpec, 'Invalid filesEqual argument');
    const fs: BaseSpec = arg instanceof BaseSpec ? arg : fsSpec(arg);

    return new Promise((resolve, _reject) => {
      if (fs instanceof FileSpec) {
        return this._filesEqual2(fs).then((resp) => {
          resolve(resp);
        });
      } else if (fs instanceof FSSpec) {
        return fs.getResolvedType().then((resp) => {
          if (resp instanceof FileSpec) {
            return this._filesEqual2(resp);
          } else {
            return Promise.resolve(false);
          }
        });
      } else {
        return Promise.resolve(false);
      }
    });
  }

  protected _filesEqual2(fs: FileSpec): Promise<boolean> {
    const job1 = this.checksum();
    const job2 = fs.checksum();
    return Promise.all([job1, job2]).then((resps) => {
      if (resps && resps.length === 2 && resps[0] === resps[1]) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    });
  }

  /**
   * Asynchronously reads a specified number of bytes from a file.
   *
   * @param {number} length The number of bytes to read from the file.
   * @param {Buffer} [buffer] An optional buffer to store the read bytes. If not provided, a new buffer will be allocated with the specified length.
   * @param {number} [offset=0] The offset within the buffer where to start storing the read bytes. Defaults to 0.
   * @param {number} [position=0] The offset within the file from where to start reading (optional). Defaults to 0.
   * @returns {Promise<Buffer>} A promise that resolves with the buffer containing the read bytes, or rejects with an error.
   * @throws {Error} Rejects the promise with unknown error encountered during the file opening, reading, or closing operations.
   */
  readBytes(length: Integer, buffer?: Buffer, offset: Integer = 0, position: Integer = 0): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fs.open(this.path, 'r', (err, fd) => {
        if (err) {
          reject(err);
        } else {
          const buf = buffer ? buffer : Buffer.alloc(length);
          fs.read(fd, buf, offset, length, position, (err2, _bytesRead: Integer, resultBuffer) => {
            close(fd, (err3) => {
              if (err2) {
                reject(err2);
              } else if (err3) {
                reject(err3);
              } else {
                resolve(resultBuffer);
              }
            });
          });
        }
      });
    });
  }

  /**
   * Reads the entire file as a buffer.
   * @returns {Promise<Buffer>} A promise that resolves with the file contents as a buffer.
   */
  readAsBuffer(): Promise<Buffer> {
    return readFile(this._f).catch((err) => {
      throw this.newError(err);
    });
  }

  /**
   * Reads the entire file as a string.
   * @returns {Promise<string>} A promise that resolves with the file contents as a string.
   */
  readAsString(): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._f, 'utf8', (err, data) => {
        if (err) {
          reject(this.newError(err));
        } else {
          // Remove BOM, if present
          resolve(data.replace(REG.BOM, '').toString());
        }
      });
    });
  }

  /**
   * Reads the file as a string and splits it into lines.
   * @returns {Promise<string[]>} A promise that resolves with an array of lines.
   */
  readAsLines(continuation?: string): Promise<string[]> {
    return this.readAsString().then((data: string) => {
      const lines = data.split(REG.lineSeparator).map((line) => {
        // RSC output files are encoded oddly and this seems to clean them up
        return line.replace(/\r/, '').replace(/\0/g, '');
      });

      if (continuation) {
        return joinContinuationLines(lines, continuation);
      } else {
        return lines;
      }
    });
  }

  /**
   * Reads the file as JSON and parses it.
   * @returns {Promise<unknown>} A promise that resolves with the parsed JSON content.
   */
  readJson(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._f, 'utf8', (err, data) => {
        if (err) {
          reject(this.newError(err));
        } else {
          try {
            const json = JSON.parse(data.toString());
            resolve(json);
          } catch (error) {
            reject(this.newError(error));
          }
        }
      });
    });
  }

  /**
   * Reads the file as JSON, parses it, and performs a deep copy with optional transformations.
   * @param {FsDeepCopyOpts} [opts={}] - Options for the deep copy operation.
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed JSON content.
   */
  deepReadJson(opts: FsDeepCopyOpts = {}): Promise<unknown> {
    return this.readJson().then((resp) => {
      return this.deepCopy(resp, opts);
    });
  }

  /**
   * Performs a deep copy of the given data with optional transformations.
   * @param {unknown} a - The data to deep copy.
   * @param {FsDeepCopyOpts} [options] - Options for the deep copy operation.
   * @returns {Promise<unknown>} A promise that resolves with the deeply copied and transformed data.
   */
  private deepCopy(a: unknown, options?: FsDeepCopyOpts): Promise<unknown> {
    const opts: FsDeepCopyOpts = deepCopySetDefaultOpts(options);
    const urlTest = new RegExp(`^${opts.pre}(file|http|https):\/\/(.+)${opts.post}$`, 'i');
    if (opts.includeUrl && isNonEmptyString(a) && urlTest.test(a)) {
      const p: string[] | null = a.match(urlTest);
      if (isNonEmptyArray(p) && isFilePath(p[2])) {
        const fs = new FileSpec(this.dirname, p[2]);
        return fs.deepReadJson(opts).then((resp) => {
          return Promise.resolve(resp);
        });
      } else {
        return Promise.resolve(a);
      }
    } else if (isObject(a)) {
      // @ts-ignore xxx
      const re: RegExp = opts && opts.detectRegExp ? asRegExp(a) : undefined;
      if (re && isDict(a)) {
        return Promise.resolve(re);
      } else {
        const jobs: unknown[] = [];
        const result2: Dict = {};
        Object.keys(a).forEach((key) => {
          // @ts-ignore fight the type system latter
          const job = this.deepCopy(a[key], opts).then((resp) => {
            result2[key] = resp;
          });
          jobs.push(job);
        });
        return Promise.all(jobs).then((_resp) => {
          return Promise.resolve(result2);
        });
      }
    } else {
      return Promise.resolve(deepCopy(a, opts));
    }
  }

  /**
   * Writes JSON data to the file.
   * @param {unknown} data - The data to write as JSON.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  async writeJson(data: unknown): Promise<void> {
    const buf = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    await fs.promises.writeFile(this._f, buf);
  }

  /**
   * Writes base64-encoded data to the file.
   * @param {string} data - The base64-encoded data to write.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  writeBase64(data: string): Promise<void> {
    return this.write(data, 'base64');
  }

  /**
   * Writes data to the file with the specified encoding.
   * @param {string | string[]} data - The data to write.
   * @param {BufferEncoding} [type='utf8'] - The encoding to use.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  write(data: string | string[], type = 'utf8'): Promise<void> {
    if (isArray(data)) {
      data = data.join('\n');
    }
    // @ts-ignore fight the type daemons later. this should be looked at.
    const buf = Buffer.from(data, type);
    return fs.promises.writeFile(this._f, buf);
  }

  /**
   * 'Backup' a file by moving it to a new filename. Use when copying a file to
   * the same location or creating a new file at the same location.
   * @param {BackupOpts} opts
   * @returns {Promise<FilePath | undefined>} - Path to file if file was backed
   * up, or true if the file didn't exist
   */
  backup(opts: FileConflictStrategy = { type: 'renameWithTilde', errorIfExists: false }): Promise<FilePath> {
    return this.getStats()
      .then((stats: FSStats) => {
        if (!stats || !stats.exists()) {
          throw this.newError('ENOENT', 'File does not exist');
        }
        return this._getNewPath(opts);
      })
      .then((newPath: FilePath | undefined) => {
        if (isFilePath(newPath)) {
          return this.moveTo(newPath, { overwrite: true })
            .then(() => {
              return Promise.resolve(newPath);
            })
            .catch(() => {
              throw this.newError('ENOENT', 'File could not be renamed');
            });
        } else {
          throw new Error('File could not be renamed');
        }
      });
  }

  safeCopy(destFile: FilePath | FileSpec | FolderSpec | FSSpec, opts: SafeCopyOpts = {}): Promise<boolean> {
    return safeCopy(this, destFile, opts);
  }

  private _getNewPath(opts: FileConflictStrategy): Promise<FilePath | undefined> {
    return new Promise((resolve, reject) => {
      if (opts.type === fileConflictStrategyType.renameWithTilde) {
        resolve(this.path + '~'); // Changed to return string directly
      } else if (opts.type === fileConflictStrategyType.renameWithNumber) {
        const limit = isInteger(opts.limit) ? opts.limit : 32;
        this.findAvailableIndexFilename(limit, opts.separator).then((resp) => {
          if (!resp && opts.errorIfExists) {
            reject(this.newError('EEXIST', 'File exists'));
          } else {
            resolve(resp);
          }
        });
      } else if (opts.type === 'overwrite') {
        resolve(this.path); // Changed to return string directly
      } else {
        if (opts.errorIfExists) {
          reject(this.newError('EEXIST', 'File exists'));
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
  async findAvailableIndexFilename(_limit: Integer = 32, sep: string = '-'): Promise<FilePath | undefined> {
    let newFsDest: FileSpec | undefined;
    let count = 0;
    let looking = true;
    while (looking) {
      newFsDest = fileSpec(this.dirname, this.basename + sep + pad(++count, 2) + this.extname);
      looking = await newFsDest.getExists();
    }
    if (!looking && newFsDest instanceof FileSpec) {
      return newFsDest.path;
    }
  }
}
