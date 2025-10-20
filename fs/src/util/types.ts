import type { Integer } from '@epdoc/type';
import type { fileConflictStrategyType } from './consts.ts';

/**
 * Represents the possible conflict resolution strategies for a file.
 */
export type FileConflictStrategy =
  | { type: 'renameWithTilde'; errorIfExists?: boolean }
  | {
    type: 'renameWithNumber';
    separator?: string;
    limit?: Integer;
    prefix?: string;
    errorIfExists?: boolean;
  }
  | { type: 'overwrite'; errorIfExists?: boolean }
  | { type: 'skip'; errorIfExists?: boolean }
  | { type: 'error'; errorIfExists?: boolean };

/**
 * Type representing the possible conflict strategy types.
 * This type is derived from the keys of the `fileConflictStrategyType` object.
 */
export type FileConflictStrategyType = (typeof fileConflictStrategyType)[keyof typeof fileConflictStrategyType];

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

export type SafeFolderCopyOpts = SafeCopyOptsBase;

/**
 * Represents the options for the safeCopy method.
 */
export type SafeCopyOpts = SafeFileCopyOpts & SafeFolderCopyOpts;
