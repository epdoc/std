import { type DeepCopyOpts, type Integer, isNonEmptyString } from '@epdoc/type';
import type { BaseSpec } from './basespec.ts';

/**
 * Represents a file path.
 */
export type FilePath = string;

/**
 * Represents a folder path.
 */
export type FolderPath = string;

/**
 * Represents a file name including it's extension.
 */
export type FileName = string;

/**
 * Represents a file extension, excluding the leading dot (e.g., 'txt').
 */
export type FileExt = string;

/**
 * Represents a folder name.
 */
export type FolderName = string;

/**
 * Type guard checks if the given value is a valid file name.
 *
 * @param {unknown} val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFilename(val: unknown): val is FileName {
  return isNonEmptyString(val);
}

/**
 * Type guard checks if the given value is a valid folder path.
 *
 * @param val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFolderPath(val: unknown): val is FolderPath {
  return isNonEmptyString(val);
}

/**
 * Type guard checks if the given value is a valid file path.
 *
 * @param val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFilePath(val: unknown): val is FilePath {
  return isNonEmptyString(val);
}

export type FsDeepCopyOpts = DeepCopyOpts & {
  includeUrl?: unknown;
};

// export type BackupOpts = Partial<{
//   /** Do a simple backup by renaming the file with a `~` appended, overwriting unknown previous backups with this same name. If a string then append this string. */
//   backup: boolean | string;
//   /** If set and backup is not set, do a backup by renaming the file with a count appended to it's `basename`. If an integer, only allow this many counts to be tried. */
//   index: boolean | Integer;
//   /** Separator to uses before the index */
//   sep: string;
//   /** if backup and index are not set, and this is set, then overwrite the old file */
//   overwrite: boolean;
//   /** If true then throw an error if this file does not exist */
//   errorOnNoSource: boolean;
//   /** If true then throw an error if a backup could not be completed because this filename is taken. */
//   errorOnExist: boolean;
// }>;

// export type SafeCopyOpts2 = BackupOpts &
//   Partial<{
//     /** Set to true to move the file rather than copy the file */
//     move: boolean;
//     /** Ensure the parent dest folder exists. Not used with #backup method. */
//     ensureDir: boolean;
//     /** don't actually move or copy the file, just execute the logic around it */
//     test: boolean;
//   }>;

export type FSSpecCallback = (fs: BaseSpec) => Promise<unknown>;

export type FSSortOpts = {
  type?: 'alphabetical' | 'size';
  direction?: 'ascending' | 'descending';
};

export type GetChildrenOpts = Partial<
  FSSortOpts & {
    match: RegExp | string | undefined;
    levels: Integer;
    sort?: FSSortOpts;
    callback?: FSSpecCallback;
  }
>;

export type RemoveOpts = Partial<{
  maxRetries: Integer;
  recursive: boolean;
  retryDelay: Integer;
}>;
