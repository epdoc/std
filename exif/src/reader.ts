import * as Cmd from '@epdoc/cmd';
import * as FS from '@epdoc/fs/fs';
import type { Dict } from '@epdoc/type';
import { _ } from '@epdoc/type';
import { EXIFTOOL_READ_FLAGS, File } from './file.ts';
import { json as parseJson } from './meta/parse.ts';
import type { IDigest, IDryRun } from './types.ts';

/**
 * Factory for reading EXIF metadata from one or more files in a single
 * exiftool invocation.
 *
 * All write operations live on {@link File}; construct or obtain a File and
 * use its setters followed by {@link File.write}.
 */
export class Reader {
  #dryRun: boolean;

  constructor(opts?: IDryRun) {
    this.#dryRun = opts?.dryRun ?? false;
  }

  /**
   * Read JSON metadata for one or more files.
   *
   * @returns An array of {@link File} instances, one per input file (in input order).
   */
  async read(files: (FS.FilePath | FS.File)[], opts: IDigest = {}): Promise<File[]> {
    const paths = files.map((f) => (_.isString(f) ? f : f.path));
    const args = [...EXIFTOOL_READ_FLAGS, ...paths];
    const exiftoolPromise = await Cmd.runner<Dict>('exiftool', args).dryRun(this.#dryRun).cwd(FS.cwd()).run();

    const result = await exiftoolPromise;
    if (result.exitCode !== 0 && !result.stdout) {
      const err = _.asError(result.stderr.trim() || `exiftool exited with code ${result.exitCode}`, { silent: true });
      throw err;
    }

    const metadataArray = parseJson(result.stdout);
    const results = metadataArray.map((metadata) => File.fromMetadata(metadata, { dryRun: this.#dryRun }));

    // Run stats and digests in parallel
    const promises: Promise<unknown>[] = results.map((f) => f.fsFile.stats());
    if (opts.digest) {
      const alg = _.isString(opts.digest) ? opts.digest as FS.DigestAlgorithmValues : FS.DigestAlgorithm.sha1;
      promises.push(...results.map((f) => f.getDigest(alg)));
    }
    await Promise.all(promises);

    return results;
  }
}
