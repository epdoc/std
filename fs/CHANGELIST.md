# Changelist

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
