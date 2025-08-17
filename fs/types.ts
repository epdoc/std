import type { DeepCopyOpts, Integer } from '@epdoc/type';
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

export type FsDeepCopyOpts = DeepCopyOpts & {
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

export const DigestAlgorithm = {
  sha1: 'SHA1',
  sha256: 'SHA256',
  sha512: 'SHA512',
  ripemd: 'RIPEMD',
  ripemd160: 'RIPEMD160',
  blake2s256: 'BLAKE2s256',
  blake2b512: 'BLAKE2b512',
  md5Sha1: 'MD5-SHA1',
} as const;
export type DigestAlgorithmValues = (typeof DigestAlgorithm)[DigestAlgorithmType];
export type DigestAlgorithmType = keyof typeof DigestAlgorithm;
