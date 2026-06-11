import type { Integer } from '@epdoc/type';
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
