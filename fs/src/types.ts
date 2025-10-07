import type { BaseSpec } from '$spec';
import type { Brand, DeepCopyOpts, Integer, StripJsonCommentsOpts } from '@epdoc/type';
import type { DigestAlgorithm } from './consts.ts';

/**
 * Represents a file path.
 */
export type FilePath = Brand<string, 'FilePath'>;

/**
 * Represents a folder path.
 */
export type FolderPath = Brand<string, 'FolderPath'>;

/**
 * Represents a file name including its extension.
 * Defined as an intersection of a string (for compatibility) and the components.
 */
export type FileName = Brand<string, 'FileName'>;

/**
 * Represents a file name excluding it's extension.
 */
export type FileBasename = Brand<string, 'FileBasename'>;

/**
 * Represents a file extension, excluding the leading dot (e.g., 'txt').
 */
export type FileExt = Brand<string, 'FileExt'>;

/**
 * Represents a folder name.
 * While it can be a simple string, branding it ensures it's only a single folder name, not a path.
 */
export type FolderName = Brand<string, 'FolderName'>;

export type Path = FilePath | FolderPath;
export type Name = FileName | FolderName;

export type PathSegment = BaseSpec | string;

export type FsDeepCopyOpts = DeepCopyOpts & {
  includeUrl?: unknown;
};

export type FsDeepJsonDeserializeOpts = DeepCopyOpts & {
  stripComments?: StripJsonCommentsOpts;
  includeUrl?: unknown;
};

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

export type DigestAlgorithmValues = (typeof DigestAlgorithm)[DigestAlgorithmType];
export type DigestAlgorithmType = keyof typeof DigestAlgorithm;
