import type { DeepCopyOpts, Integer, StripJsonCommentsOpts } from '@epdoc/type';
import type { JsonReplacer } from '../spec/types.ts';
import type { fileConflictStrategyType } from './consts.ts';

/**
 * Represents the possible conflict resolution strategies for a file.
 */
export type FileConflictStrategy =
  | { type: 'renameWithTilde'; errorIfExists?: boolean }
  | {
    type: 'renameWithNumber';
    limit?: Integer;
    separator?: string;
    prefix?: string;
    errorIfExists?: boolean;
    keep?: { ms?: Integer; generations?: Integer };
  }
  | {
    /**
     * @remarks
     * When `keep` is used with this strategy, the age is determined by parsing the timestamp from the filename.
     * The timestamp is assumed to be in local time. Use `renameWithEpochMs` for cross-timezone reliability IF
     * you are rotating backups with short time periods.
     */
    type: 'renameWithDatetime';
    format?: string;
    separator?: string;
    prefix?: string;
    errorIfExists?: boolean;
    keep?: { ms?: Integer; generations?: Integer };
  }
  | {
    /**
     * @remarks
     * When `keep` is used with this strategy, the age is determined by parsing the epoch milliseconds from the filename.
     * This is recommended for cross-timezone reliability.
     */
    type: 'renameWithEpochMs';
    separator?: string;
    prefix?: string;
    errorIfExists?: boolean;
    keep?: { ms?: Integer; generations?: Integer };
  }
  | { type: 'overwrite'; errorIfExists?: boolean }
  | { type: 'skip'; errorIfExists?: boolean }
  | { type: 'error'; errorIfExists?: boolean };

/**
 * Type representing the possible conflict strategy types.
 * This type is derived from the keys of the `fileConflictStrategyType` object.
 */
export type FileConflictStrategyType = (typeof fileConflictStrategyType)[keyof typeof fileConflictStrategyType];

/**
 * Options for safe file writing with atomic write semantics and optional backup.
 *
 * When `safe` is enabled, the write operation:
 * 1. Backs up the existing file (if it exists) using the `backupStrategy`
 * 2. Writes to a temporary file
 * 3. Moves the temporary file to the target path
 * 4. On failure, restores the backup to the original path
 *
 * This ensures the target file is never left in a partially-written state.
 */
/**
 * Options for safe file writing with optional atomic writes and/or backup.
 *
 * These two concerns are independent and can be used separately or together:
 * - `safe` alone: atomic write via temp file, no backup
 * - `backupStrategy` alone: backup existing file, then direct write
 * - Both: backup existing file, then atomic write via temp file
 */
export type SafeWriteOptions = {
  /**
   * Enable atomic write. Content is written to a temporary file and moved
   * into place, preventing partial writes. On failure the backup (if any)
   * is restored. Defaults to `false`.
   */
  safe?: boolean;
  /**
   * Strategy for backing up the existing file before overwriting.
   * Can be used independently of `safe`. When the target file does not
   * exist, this option has no effect.
   *
   * @see {@link FileConflictStrategy} for all available strategies.
   */
  backupStrategy?: FileConflictStrategy;
};

/**
 * Options for {@link FileSpec.writeJson}, combining JSON formatting
 * with safe write semantics.
 */
/**
 * Options for {@link FileSpec.writeJson}, combining JSON formatting
 * with safe write semantics from {@link SafeWriteOptions}.
 */
export type WriteJsonOptions = SafeWriteOptions & {
  /**
   * A replacer function or array of property names passed to `JSON.stringify()`.
   * Controls which values are included in the JSON output.
   */
  replacer?: JsonReplacer;
  /**
   * Indentation for pretty-printing. Passed as the `space` argument to
   * `JSON.stringify()`. Use `2` for two-space indentation or `'\t'` for tabs.
   */
  space?: string | Integer;
  /**
   * When truthy, uses `_.jsonSerialize` instead of `JSON.stringify` for
   * deep copy serialization (e.g., handling `Date`, `RegExp`, and custom types).
   * Pass an object for fine-grained control via {@link DeepCopyOpts}.
   * Defaults to `false`.
   */
  deepCopy?: DeepCopyOpts | boolean;
  /**
   * Content to append after the final JSON closing brace/bracket.
   * Commonly set to `'\n'` for git-friendly file formatting.
   */
  trailing?: string;
};

export type ReadJsonOptions = {
  // Deep copy deserialization (uses _.jsonDeserialize vs JSON.parse)
  deepCopy?: boolean; // defaults to false

  // JSON comment stripping
  stripComments?: StripJsonCommentsOpts;

  // Only applicable when deepCopy is true
  includeUrl?: unknown;
};

export type WriteYamlOptions = {
  yaml?: Parameters<typeof import('@std/yaml').stringify>[1];
  write?: SafeWriteOptions;
};

export type SafeCopyOptsBase = {
  /**
   * Don't actually move or copy the file, just execute the logic around it
   */
  dryRun?: boolean;
  /**
   * Whether to move or copy the file or folder.
   */
  move?: boolean;
  /**
   * Whether to overwrite existing files.
   */
  overwrite?: boolean;
  /**
   * Whether to preserve the original file's timestamps.
   */
  preserveTimestamps?: boolean;
};

/**
 * Represents the options for the safeCopy method.
 */
export type SafeFileCopyOpts = SafeCopyOptsBase & {
  /**
   * The strategy to use when a file with the same name already exists.
   */
  conflictStrategy?: FileConflictStrategy;
};

/**
 * Represents the options for safely copying a folder.
 */
export type SafeFolderCopyOpts = SafeCopyOptsBase;

/**
 * Represents the options for the safeCopy method.
 */
/**
 * Represents the combined options for safe copy operations, including both file and folder specific options.
 */
export type SafeCopyOpts = SafeFileCopyOpts & SafeFolderCopyOpts;
