# Changelist

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
