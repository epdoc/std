import type { FSSpecBase } from '$spec';
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

export type PathSegment = FSSpecBase | string;

/**
 * Represents a user ID.
 */
export type UID = Brand<Integer, 'UID'>;

/**
 * Represents a group ID.
 */
export type GID = Brand<Integer, 'GID'>;

/**
 * Represents a file mode (permissions).
 */
export type Mode = Brand<Integer, 'Mode'>;

export type FolderDiff = {
  missing: Name[];
  added: Name[];
  diff: Name[];
};

export type FsDeepCopyOpts = DeepCopyOpts & {
  includeUrl?: unknown;
};

export type FsDeepJsonDeserializeOpts = DeepCopyOpts & {
  stripComments?: StripJsonCommentsOpts;
  includeUrl?: unknown;
};

export type FSSpecCallback = (fs: FSSpecBase) => Promise<unknown>;

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

export type EqualOptions = {
  checksum?: boolean;
};

/**
 * Options which can be set when using copy
 */
export interface CopyOptions {
  /** If set to `true`, the destination file will be overwritten if it already exists.
   *
   * @default {false} */
  overwrite?: boolean;
  /** If set to `true`, the timestamps of the source file will be preserved on the destination file.
   *
   * @default {false} */
  preserveTimestamps?: boolean;
}

export interface MoveOptions {
  /**
   * Whether the destination file should be overwritten if it already exists.
   *
   * @default {false}
   */
  overwrite?: boolean;
}

/**
 * Options which can be set when using remove
 */
export interface RemoveOptions {
  /** If set to `true`, path will be removed even if it's a non-empty directory.
   *
   * @default {false} */
  recursive?: boolean;
}

/**
 * @deprecated
 */
export type RemoveOpts = Partial<{
  maxRetries: Integer;
  recursive: boolean;
  retryDelay: Integer;
}>;

export type DigestAlgorithmValues = (typeof DigestAlgorithm)[DigestAlgorithmType];
export type DigestAlgorithmType = keyof typeof DigestAlgorithm;

/**
 * Represents a file system entry with simplified properties.
 */
export interface FSEntry {
  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}

export interface FileInfo {
  /** True if the underlying file stat exists on the filesystem */
  exists: boolean;
  /** True if this is info for a regular file. Mutually exclusive to
   * `FileInfo.isDirectory` and `FileInfo.isSymlink`. */
  isFile: boolean;
  /** True if this is info for a regular directory. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isSymlink`. */
  isDirectory: boolean;
  /** True if this is info for a symlink. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isDirectory`. */
  isSymlink: boolean;
  /** The size of the file, in bytes. */
  size: number;
  /** The last modification time of the file. This corresponds to the `mtime`
   * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
   * may not be available on all platforms. */
  modifiedAt: Date | null;
  /** The last access time of the file. This corresponds to the `atime`
   * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
   * be available on all platforms. */
  atime: Date | null;
  /** The creation time of the file. This corresponds to the `birthtime`
   * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
   * not be available on all platforms. */
  createdAt: Date | null;
  /** The last change time of the file. This corresponds to the `ctime`
   * field from `stat` on Mac/BSD and `ChangeTime` on Windows. This may
   * not be available on all platforms. */
  ctime: Date | null;
  /** ID of the device containing the file. */
  dev: number;
  /** Corresponds to the inode number on Unix systems. On Windows, this is
   * the file index number that is unique within a volume. This may not be
   * available on all platforms. */
  ino: number | null;
  /** The underlying raw `st_mode` bits that contain the standard Unix
   * permissions for this file/directory.
   */
  mode: number | null;
  /** Number of hard links pointing to this file. */
  nlink: number | null;
  /** User ID of the owner of this file.
   *
   * _Linux/Mac OS only._ */
  uid: number | null;
  /** Group ID of the owner of this file.
   *
   * _Linux/Mac OS only._ */
  gid: number | null;
  /** Device ID of this file.
   *
   * _Linux/Mac OS only._ */
  rdev: number | null;
  /** Blocksize for filesystem I/O.
   *
   * _Linux/Mac OS only._ */
  blksize: number | null;
  /** Number of blocks allocated to the file, in 512-byte units. */
  blocks: number | null;
  /**  True if this is info for a block device.
   *
   * _Linux/Mac OS only._ */
  isBlockDevice: boolean | null;
  /**  True if this is info for a char device.
   *
   * _Linux/Mac OS only._ */
  isCharDevice: boolean | null;
  /**  True if this is info for a fifo.
   *
   * _Linux/Mac OS only._ */
  isFifo: boolean | null;
  /**  True if this is info for a socket.
   *
   * _Linux/Mac OS only._ */
  isSocket: boolean | null;
}
