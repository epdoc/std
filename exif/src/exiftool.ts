import * as Cmd from '@epdoc/cmd';
import * as FS from '@epdoc/fs/fs';
import type { Dict } from '@epdoc/type';
import { _ } from '@epdoc/type';
import { File } from './file.ts';
import type { IDryRun } from './types.ts';
import { parseExifJson } from './utils.ts';

/**
 * Factory for reading EXIF metadata from one or more files in a single
 * exiftool invocation.
 *
 * All write operations live on {@link File}; construct or obtain a File and
 * use its setters followed by {@link File.write}.
 */
export class Exiftool {
  #dryRun: boolean;

  constructor(opts?: IDryRun) {
    this.#dryRun = opts?.dryRun ?? false;
  }

  /**
   * Read JSON metadata for one or more files.
   *
   * @returns An array of {@link File} instances, one per input file (in input order).
   */
  async getInfo(files: (FS.FilePath | FS.File)[]): Promise<File[]> {
    const paths = files.map((f) => (_.isString(f) ? f : f.path));
    const args = ['-j', ...paths];
    const result = await Cmd.runner<Dict>('exiftool', args).dryRun(this.#dryRun).cwd(FS.cwd()).run();

    if (result.exitCode !== 0 && !result.stdout) {
      throw new Error(result.stderr.trim() || `exiftool exited with code ${result.exitCode}`);
    }

    const metadataArray = parseExifJson(result.stdout);
    return metadataArray.map((metadata) => File.fromMetadata(metadata, { dryRun: this.#dryRun }));
  }
}
