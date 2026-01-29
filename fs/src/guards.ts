import { _ } from '@epdoc/type';
import type { Stats } from 'node:fs';
import type { FileBasename, FileExt, FileName, FilePath, FolderName, FolderPath } from './types.ts';
import { fileConflictStrategyType } from './util/consts.ts';
import type { FileConflictStrategyType } from './util/types.ts';

/**
 * Converts a raw string to a branded FileBasename.
 */
export const asFileBasename: (s: string) => FileBasename = (s) => {
  return s as FileBasename;
};

/**
 * Converts a raw string to a branded FileExt.
 */
export const asFileExt: (s: string) => FileExt = (s) => {
  // A real function might check if the string contains a dot ('.')
  return s as FileExt;
};

/**
 * Converts a raw string to a branded FolderName.
 */
export const asFolderName: (s: string) => FolderName = (s) => {
  // A real function might check for path separators (like '/' or '\')
  return s as FolderName;
};

export function asFileName(basename: FileBasename | string, ext: FileExt | string): FileName;
export function asFileName(val: string): FileName;
export function asFileName(a: FileBasename | string, b?: FileExt | string): FileName {
  return b ? `${a}.${b}` as FileName : a as FileName;
}

export function asFolderPath(s: string): FolderPath;
export function asFolderPath(parent: FolderPath, name: FolderName): FolderPath;
export function asFolderPath(a: FolderPath | string, b?: FolderName): FolderPath {
  return (b ? `${a}/${b}` : a) as FolderPath;
}

export function asFilePath(s: string): FilePath;
export function asFilePath(folder: FolderPath, name: FileName): FilePath;
export function asFilePath(a: FolderPath | string, b?: FileName): FilePath {
  return (b ? `${a}/${b}` : a) as FilePath;
}

export function isFileName(val: unknown): val is FileName {
  return _.isNonEmptyString(val);
}
export function isFolderPath(val: unknown): val is FolderPath {
  return _.isNonEmptyString(val);
}
export function isFilePath(val: unknown): val is FilePath {
  return _.isNonEmptyString(val);
}
export function isFileBasename(val: unknown): val is FileBasename {
  return _.isNonEmptyString(val);
}
export function isFileExt(val: unknown): val is FileExt {
  return _.isNonEmptyString(val);
}
export function isFolderName(val: unknown): val is FolderName {
  return _.isNonEmptyString(val);
}

/**
 * Type guard to check if an object is a Node.js Stats instance
 */
export function isNodeStats(val: unknown): val is Stats {
  return _.isDict(val) &&
    'isFile' in val && 'isDirectory' in val && 'isSymbolicLink' in val &&
    _.isFunction(val.isFile) && _.isFunction(val.isDirectory) && _.isFunction(val.isSymbolicLink) &&
    'mode' in val && 'size' in val;
}

/**
 * Checks if a given value is a valid FileConflictStrategyType.
 *
 * @param value The value to check.
 * @returns True if the value is a valid FileConflictStrategyType, false otherwise.
 */
export function isFileConflictStrategyType(value: unknown): value is FileConflictStrategyType {
  return _.isString(value) &&
    Object.values(fileConflictStrategyType).includes(value as unknown as FileConflictStrategyType);
}
