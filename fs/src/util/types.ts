import type { Integer } from '@epdoc/type';
import type { fileConflictStrategyType } from './consts.ts';

/**
 * Conflict resolution strategy used when a write or copy operation targets a file that already exists.
 *
 * Pass as `backupStrategy` in {@link SafeWriteOptions} or as the `opts` argument to `backup()` / `safeCopy()`.
 *
 * **Strategies at a glance:**
 *
 * - `renameWithTilde` — Renames the existing file by appending `~` (e.g. `config.json~`).
 *   Simple and cheap; only one backup is kept. **Default for `backup()`.**
 *
 * - `renameWithNumber` — Renames the existing file with an incrementing zero-padded index
 *   (e.g. `config-01.json`). Use `limit` (default 32) to cap the search, `separator` (default `'-'`)
 *   and `prefix` to customise the suffix, and `keep` to auto-rotate old backups.
 *
 * - `renameWithDatetime` — Renames with a formatted datetime string
 *   (e.g. `config-20240614153045123.json`). Customise with `format` (default `'yyyyMMddHHmmssSSS'`).
 *   **Note:** age is derived from the timestamp embedded in the filename, which is in local time.
 *   Use `renameWithEpochMs` when rotating across timezones.
 *
 * - `renameWithEpochMs` — Renames with the current epoch milliseconds
 *   (e.g. `config-1718382645123.json`). Timezone-safe; recommended for short-interval rotation.
 *
 * - `overwrite` — Overwrites the destination without backing it up.
 *
 * - `skip` — Leaves the existing file untouched and silently skips the write.
 *
 * - `error` — Throws an `AlreadyExists` error when the target already exists.
 *
 * The `keep` option (available on `renameWithNumber`, `renameWithDatetime`, `renameWithEpochMs`) trims
 * old backups after each write. Set `generations` to keep at most N copies and/or `ms` to remove
 * backups older than a given age. When both are supplied, a backup is only deleted if **both**
 * conditions are satisfied simultaneously.
 */
export type FileConflictStrategy =
  | { type: 'renameWithTilde'; errorIfExists?: boolean }
  | {
    type: 'renameWithNumber';
    /** Maximum indexed attempts before giving up. Defaults to `32`. */
    limit?: Integer;
    /** String inserted between the basename and the index. Defaults to `'-'`. */
    separator?: string;
    /** Optional string inserted before the index digits. */
    prefix?: string;
    errorIfExists?: boolean;
    keep?: { ms?: Integer; generations?: Integer };
  }
  | {
    type: 'renameWithDatetime';
    /**
     * `DateTime.format()` pattern for the timestamp suffix. Defaults to `'yyyyMMddHHmmssSSS'`.
     * @remarks Age for `keep` is derived from the timestamp in the filename (local time).
     * Use `renameWithEpochMs` for cross-timezone reliability.
     */
    format?: string;
    /** String inserted between the basename and the timestamp. Defaults to `'-'`. */
    separator?: string;
    /** Optional string inserted before the timestamp. */
    prefix?: string;
    errorIfExists?: boolean;
    keep?: { ms?: Integer; generations?: Integer };
  }
  | {
    type: 'renameWithEpochMs';
    /**
     * @remarks Age for `keep` is derived from the epoch milliseconds embedded in the filename.
     * Recommended over `renameWithDatetime` when rotating across timezones.
     */
    /** String inserted between the basename and the epoch value. Defaults to `'-'`. */
    separator?: string;
    /** Optional string inserted before the epoch value. */
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
