/**
 * Options for configuring the file system walk operation.
 */
export interface WalkOptions {
  /**
   * The maximum depth to traverse the directory tree.
   * A depth of 0 means only the starting directory is processed.
   * Defaults to `Infinity`.
   */
  maxDepth?: number;
  /**
   * Whether to include files in the walk results.
   * Defaults to `true`.
   */
  includeFiles?: boolean;
  /**
   * Whether to include directories in the walk results.
   * Defaults to `true`.
   */
  includeDirs?: boolean;
  /**
   * Whether to include symbolic links in the walk results.
   * Defaults to `true`.
   */
  includeSymlinks?: boolean;
  /**
   * Whether to follow symbolic links. If `true`, the targets of symlinks will be traversed.
   * Defaults to `false`.
   */
  followSymlinks?: boolean;
  /**
   * Whether to canonicalize paths (resolve '..' and '.' segments and symbolic links) before processing.
   * Defaults to `true`.
   */
  canonicalize?: boolean;
  /**
   * An array of file extensions (e.g., `['.ts', '.js']`) to include.
   * Only entries with these extensions will be returned.
   */
  exts?: string[];
  /**
   * An array of regular expressions. Only entries whose paths match at least one of these patterns will be returned.
   */
  match?: RegExp[];
  /**
   * An array of regular expressions. Entries whose paths match any of these patterns will be skipped.
   */
  skip?: RegExp[];
}
