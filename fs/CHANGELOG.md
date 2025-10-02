# Changelist

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
