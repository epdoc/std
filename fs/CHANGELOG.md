# Changelog for @epdoc/fs

## [1.0.0-alpha.8] - 2025-10-23

- Moved equalPaths method from FSSpec to FSSpecBase

## [1.0.0-alpha.7] - 2025-10-23

- Added JSDoc comments to FSSpecBase

## [1.0.0-alpha.5] - 2025-10-21

- Resolved fs write to file race condition error due to nodejs library limitiations

## [1.0.0-alpha.5] - 2025-10-21

- **Fix**: Resolved a race condition in Deno's file system operations where `FileSpec.readAsString()` could return empty
  content if called immediately after a write operation. This issue was masked by asynchronous operations (e.g.,
  logging) that introduced an artificial delay.
  - Modified `FileSpec.writeJson()`, `FileSpec.writeJsonEx()`, and `FileSpec.write()` to explicitly flush data to disk
    using `fileHandle.sync()` after writing, ensuring data persistence before the write method returns.
  - This fix improves the robustness of file write operations and resolves `AssertionError`s in test environments where
    timing is critical.

## [1.0.0-alpha.4] - 2025-10-21

- Centralize and provide better error handling. Improved implementations of various methods.

## [1.0.0-alpha.4] - 2025-10-21

- **Refactor**: Enhanced error handling across `FSSpecBase`, `FileSpec`, and `FolderSpec` classes.
  - Centralized error wrapping using `this.asError()` for all `nfs` operations.
  - Made `FSSpecBase.asError()` idempotent to simplify error propagation.
  - Improved `FSSpecBase.stats()` to correctly handle `ENOENT` and throw classified errors for others.
  - Added `try...catch` blocks to `FileSpec.makeTemp()`, `FileSpec.open()`, `FileSpec.writeJsonEx()`,
    `FSSpecBase.remove()`, `FSSpecBase.realPath()`, `FolderSpec.makeTemp()`, `FolderSpec.ensureDir()`,
    `FolderSpec.ensureParentDir()`, `FolderSpec.readDir()`, and `FolderSpec.moveTo()`.
- **Consistency**: Ensured `clearInfo()` is called after operations that invalidate cached file information (e.g.,
  `FileSpec.moveTo()`, `FolderSpec.moveTo()`, `FSSpecBase.remove()`, `FolderSpec.ensureDir()`).
- **JSDoc**: Updated and improved JSDoc comments for `FileSpec.moveTo()`, `FileSpec.backup()`, `FileSpec.safeCopy()`,
  `FileSpec.equalTo()`, `FSSpecBase.info` getter, `FolderSpec.ensureDir()`, `FolderSpec.ensureParentDir()`, and
  `FolderSpec.mkdir()`.
- **Tests**: Corrected `test/error.test.ts` to align with Node.js `fs.mkdir` behavior, expecting `Err.AlreadyExists` for
  file-blocking-directory-creation scenarios.

## [1.0.0-alpha.3] - 2025-10-20

- Major refactoring with breaking changes.
- Removed many dependencies on Deno as part of migrating module for use on multiple runtimes
- Removed `FSStat` object and now use `FileInfo` for `Stats`
- Cleaned up, with naming changes, method interface for determining `Stats` values
- Changed naming on `resolveTypes()` as well
- Updated version to 1.0.0-alpha.3.
- More _eat your own dog good_, using our own code for reading directories, etc. This applies to `src/walk/walk.ts` as
  well as other code areas.

## [0.2.28] - 2025-10-17

- Added FileSpec.parentFolder method.
- Added new set of Error types.
- Updated FileSpec to not use Deno libraries.

## [0.2.27] - 2025-10-13

- Added cwd() to FolderSpec

## [0.2.26] - 2025-10-13

- **BREAKING**: Reorganized test suite to eliminate static test dependencies
- Converted all tests to use temporary directories instead of static `readonly` and `data2` folders
- Reorganized test files by functionality:
  - `filespec.test.ts` - Core FileSpec operations
  - `folderspec.test.ts` - Core FolderSpec operations
  - `fsspec.test.ts` - Base FSSpec operations
  - `safecopy.test.ts` - Safe copy operations (renamed from fs4.test.ts)
  - `fsbytes.test.ts` - File type detection
  - `jsonex.test.ts` - JSON extended operations (renamed from fs.jsonex.test.ts)
- Added `pdfgen.ts` utility for generating test PDFs with metadata
- Eliminated redundant tests across multiple files
- Improved test organization with clear separation of concerns
- All 87 tests now pass with 100% success rate
- Removed static test data files from repository

## [0.2.25] - 2025-10-12

- Fixed readlines implementation when using continuation.

## [0.2.24] - 2025-10-06

- Fixed bug in FolderSpec.makeTemp return type

## [0.2.23] - 2025-10-05

- Update dependencies

## [0.2.22] - 2025-10-05

- Update @epdoc/type dependency.

## [0.2.21] - 2025-10-05

- Update @epdoc/type dependency because of jsonSerialize changes.

## [0.2.20] - 2025-10-05

- Updated dependencies

## [0.2.19] - 2025-10-03

- Added makeTemp to FolderSpec and FileSpec.

## [0.2.18] - 2025-10-02

- Added readJsonEx and writeJsonEx to FileSpec

## [0.2.17] - 2025-08-23

- Resolve unhandles project rejection in `safeCopy`.
- Modified `backup` and `safeCopyFile` to correctly handle all file conflict strategies, preventing unhandled promise
  rejections.
- Added new `fs4.test.ts` to test changes.

## [0.2.16] - 2025-08-17

- Moved dependencies to `deno.json`, where they should be.

## 0.2.15

- Added JSONC read support.

## 0.2.14

- Fixed bug in `FileSpec.fromMeta()`.

## 0.2.13

- Added generics when reading JSON files.

## 0.2.12

- Added `fromMeta` static method to `FSSpec`, `FileSpec`, and `FolderSpec` to create paths relative to the current
  module.
- Renamed `tests/data` to `tests/readonly`.
- Refactored tests to use `fromMeta` and the new `readonly` directory.
- Improved test descriptions for clarity.
- Added more tests for `FolderSpec.walk()`.

## 0.2.9

- Removed CodeError object definition. This is not backward compatible, and will require client fixes.
- Updated dependencies to reflect this change.

## 0.2.8

- Fix bug in FileSpec filesEqual when one of the files does not exist
