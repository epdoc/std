# FS Module Exports

This document outlines the exports available when importing from `./src/fs.ts`.

```ts
import * as FS from '@epdoc/fs/fs';
```

## Top-Level Exports

### Classes

- [FS.Bytes](./src/fsbytes.ts) (alias for `FSBytes`)
  - Used by `FileSpec.getBytes()` to determine file type from the first 24 bytes of a file.
- [FS.File](./src/spec/filespec.ts) (alias for `FileSpec`)
  - Use when you know the path is a file.
- [FS.Folder](./src/spec/folderspec.ts) (alias for `FolderSpec`)
  - Use when you know the path is a folder.
- [FS.Spec](./src/spec/fsspec.ts) (alias for `FSSpec`)
  - Use when you don't know if the path is a file or folder.
- [FS.Symlink](./src/spec/symspec.ts) (alias for `SymlinkSpec`)
  - Use when you know the path is a symbolic link.

### Functions

- [FS.cwd()](./src/utils.ts) - Returns the current working directory.
- [FS.statsToFileInfo(stats: Stats)](./src/util/fileinfo.ts) - Converts Node.js `Stats` object to a `FileInfo` object.
- [FS.direntToSpec(parentPath: FolderPath, dirent: Dirent)](./src/util/fileinfo.ts) - Converts a Node.js `Dirent` object
  to a `TypedFSSpec` (FileSpec, FolderSpec, or SymlinkSpec).
- [FS.asFileBasename(s: string)](./src/guards.ts) - Converts a raw string to a branded FileBasename.
- [FS.asFileExt(s: string)](./src/guards.ts) - Converts a raw string to a branded FileExt.
- [FS.asFolderName(s: string)](./src/guards.ts) - Converts a raw string to a branded FolderName.
- [FS.asFileName(basename: FileBasename | string, ext: FileExt | string)](./src/guards.ts) - Converts a raw string to a
  branded FileName.
- [FS.asFolderPath(s: string)](./src/guards.ts) - Converts a raw string to a branded FolderPath.
- [FS.asFilePath(s: string)](./src/guards.ts) - Converts a raw string to a branded FilePath.
- [FS.isFileName(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FileName.
- [FS.isFolderPath(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FolderPath.
- [FS.isFilePath(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FilePath.
- [FS.isFileBasename(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FileBasename.
- [FS.isFileExt(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FileExt.
- [FS.isFolderName(val: unknown)](./src/guards.ts) - Type guard to check if a value is a FolderName.
- [FS.isNodeStats(val: unknown)](./src/guards.ts) - Type guard to check if an object is a Node.js Stats instance.

### Constants

- [FS.DigestAlgorithm](./src/consts.ts) - Digest algorithms for checksums.
- [FS.FILE_HEADERS](./src/fsheaders.ts) - Map of file types to their header information.
- [FS.fileConflictStrategyType](./src/util/consts.ts) - Strategies for handling file conflicts.

### Types

- [FS.JsonReplacer](./src/spec/types.ts) - A function that alters the behavior of the stringification process.
- [FS.Typed](./src/spec/types.ts) - A type that can be a FileSpec, FolderSpec, or SymlinkSpec.
- [FS.FileHeaderEntry](./src/fsheaders.ts) - Represents an entry in the file header map.
- [FS.FileType](./src/fsheaders.ts) - Represents the supported file types for header detection.
- [FS.FileCategory](./src/fsheaders.ts) - Represents the categories of files supported by the system.
- [FS.FilePath](./src/types.ts) - Represents a file path.
- [FS.FolderPath](./src/types.ts) - Represents a folder path.
- [FS.FileName](./src/types.ts) - Represents a file name including its extension.
- [FS.FileBasename](./src/types.ts) - Represents a file name excluding it's extension.
- [FS.FileExt](./src/types.ts) - Represents a file extension, excluding the leading dot.
- [FS.FolderName](./src/types.ts) - Represents a folder name.
- [FS.Path](./src/types.ts) - Represents a file or folder path.
- [FS.Name](./src/types.ts) - Represents a file or folder name.
- [FS.PathSegment](./src/types.ts) - Represents a segment of a path.
- [FS.FolderDiff](./src/types.ts) - Represents the difference between two folders.
- [FS.FsDeepCopyOpts](./src/types.ts) - Options for deep copying with URL inclusion.
- [FS.FsDeepJsonDeserializeOpts](./src/types.ts) - Options for deep JSON deserialization.
- [FS.FSSpecCallback](./src/types.ts) - Callback for FSSpec operations.
- [FS.FSSortOpts](./src/types.ts) - Options for sorting file system entries.
- [FS.GetChildrenOpts](./src/types.ts) - Options for getting children of a folder.
- [FS.EqualOptions](./src/types.ts) - Options for comparing files.
- [FS.CopyOptions](./src/types.ts) - Options for copying files.
- [FS.MoveOptions](./src/types.ts) - Options for moving files.
- [FS.RemoveOptions](./src/types.ts) - Options for removing files.
- [FS.RemoveOpts](./src/types.ts) - Deprecated options for removing files.
- [FS.DigestAlgorithmValues](./src/types.ts) - The values of the digest algorithms.
- [FS.DigestAlgorithmType](./src/types.ts) - The types of the digest algorithms.
- [FS.FSEntry](./src/types.ts) - Represents a file system entry with simplified properties.
- [FS.FileInfo](./src/types.ts) - Represents detailed file information.
- [FS.FileConflictStrategy](./src/util/types.ts) - Represents the possible conflict resolution strategies for a file.
- [FS.FileConflictStrategyType](./src/util/types.ts) - Type representing the possible conflict strategy types.
- [FS.SafeCopyOptsBase](./src/util/types.ts) - Base options for safe copy operations.
- [FS.SafeFileCopyOpts](./src/util/types.ts) - Options for safely copying a file.
- [FS.SafeFolderCopyOpts](./src/util/types.ts) - Options for safely copying a folder.
- [FS.SafeCopyOpts](./src/util/types.ts) - Combined options for safe copy operations.

## Namespaced Exports

### `FS.Err`

- [FS.Err.Main](./src/error/fserror.ts) (alias for `FSError`)
- [FS.Err.NotFound](./src/error/error.ts)
- [FS.Err.PermissionDenied](./src/error/error.ts)
- [FS.Err.ConnectionRefused](./src/error/error.ts)
- [FS.Err.ConnectionReset](./src/error/error.ts)
- [FS.Err.ConnectionAborted](./src/error/error.ts)
- [FS.Err.NotConnected](./src/error/error.ts)
- [FS.Err.AddrInUse](./src/error/error.ts)
- [FS.Err.AddrNotAvailable](./src/error/error.ts)
- [FS.Err.BrokenPipe](./src/error/error.ts)
- [FS.Err.AlreadyExists](./src/error/error.ts)
- [FS.Err.InvalidData](./src/error/error.ts)
- [FS.Err.TimedOut](./src/error/error.ts)
- [FS.Err.Interrupted](./src/error/error.ts)
- [FS.Err.WouldBlock](./src/error/error.ts)
- [FS.Err.WriteZero](./src/error/error.ts)
- [FS.Err.UnexpectedEof](./src/error/error.ts)
- [FS.Err.BadResource](./src/error/error.ts)
- [FS.Err.Http](./src/error/error.ts)
- [FS.Err.Busy](./src/error/error.ts)
- [FS.Err.NotSupported](./src/error/error.ts)
- [FS.Err.FilesystemLoop](./src/error/error.ts)
- [FS.Err.IsADirectory](./src/error/error.ts)
- [FS.Err.NetworkUnreachable](./src/error/error.ts)
- [FS.Err.NotADirectory](./src/error/error.ts)
- [FS.Err.NotCapable](./src/error/error.ts)
- [FS.Err.Options](./src/error/types.ts)
