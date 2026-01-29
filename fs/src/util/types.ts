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
  }
  | {
    type: 'renameWithDatetime';
    format?: string;
    separator?: string;
    prefix?: string;
    errorIfExists?: boolean;
  }
  | {
    type: 'renameWithEpochMs';
    separator?: string;
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

export type SafeWriteOptions = {
  safe?: boolean;
  backupStrategy?: FileConflictStrategy;
};

export type WriteJsonOptions = SafeWriteOptions & {
  // JSON formatting
  replacer?: JsonReplacer;
  space?: string | Integer;

  // Deep copy serialization (uses _.jsonSerialize vs JSON.stringify)
  deepCopy?: DeepCopyOpts | boolean; // defaults to false
};

export type ReadJsonOptions = {
  // Deep copy deserialization (uses _.jsonDeserialize vs JSON.parse)
  deepCopy?: boolean; // defaults to false

  // JSON comment stripping
  stripComments?: StripJsonCommentsOpts;

  // Only applicable when deepCopy is true
  includeUrl?: unknown;
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
