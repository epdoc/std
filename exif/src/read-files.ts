import * as Cmd from '@epdoc/cmd';
import * as FS from '@epdoc/fs/fs';
import type { Dict } from '@epdoc/type';
import { _ } from '@epdoc/type';
import { EXIFTOOL_READ_FLAGS, File } from './file.ts';
import { json as parseJson } from './meta/parse.ts';
import type { IDigest, IDryRun } from './types.ts';

/**
 * Read JSON metadata for one or more files in a single exiftool invocation.
 *
 * File stats (and digests, when requested) are computed in parallel after the
 * exiftool read. This is the recommended way to bulk-read metadata; it replaces
 * the former `Reader` class.
 *
 * @param files Paths or {@link FS.File} instances to read.
 * @param [opts.dryRun=false] When true, the returned {@link File} instances
 *   have {@link File.write} and {@link File.repair} as no-ops on the binary.
 * @param [opts.digest] Compute a digest per file; a string names the
 *   algorithm, `true` uses the default (`sha1`). Exposed via
 *   {@link File.info} as `file.digest`.
 * @returns An array of {@link File} instances, one per input file (in input
 *   order). Files whose metadata could not be read still appear in the result.
 */
export async function readFiles(files: (FS.FilePath | FS.File)[], opts: IDigest & IDryRun = {}): Promise<File[]> {
  const paths = files.map((f) => (_.isString(f) ? f : f.path));
  const args = [...EXIFTOOL_READ_FLAGS, ...paths];
  const exiftoolPromise = await Cmd.runner<Dict>('exiftool', args).cwd(FS.cwd()).run();

  const result = await exiftoolPromise;
  if (result.exitCode !== 0 && !result.stdout) {
    const err = _.asError(result.stderr.trim() || `exiftool exited with code ${result.exitCode}`, { silent: true });
    throw err;
  }

  const metadataArray = parseJson(result.stdout);
  const results = metadataArray.map((metadata) => File.fromMetadata(metadata, opts));

  // Run stats and digests in parallel
  const promises: Promise<unknown>[] = results.map((f) => f.fsFile.stats());
  if (opts.digest) {
    const alg = _.isString(opts.digest) ? opts.digest as FS.DigestAlgorithmValues : FS.DigestAlgorithm.sha1;
    promises.push(...results.map((f) => f.getDigest(alg)));
  }
  await Promise.all(promises);

  return results;
}
