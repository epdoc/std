## Progress Log

### Current Status:
- `path_resolver_utils.ts`: Updated to return `FSPath` and infer `isFinalPathFile` internally.
- `icopyable.ts`: Updated `ISafeCopyableSpec` and removed `FSSpecParam`.
- `fsspec.ts`: Constructor made public, factory methods removed, `copy`, `add`, `home`, `resolveType` updated.
- `filespec.ts`: `fileSpec` function removed, constructor made public, factory methods removed, `copy`, `add`, `home` updated. `os` and `_` imports added, `exists().then` fixed, `filename` override added. `readJsonEx` and `writeJsonEx` methods added.
- `folderspec.ts`: `folderSpec` function removed, constructor made public, factory methods removed, `copy`, `add`, `home` updated. `bFile` undefined handled in `compare` and `getDiff`.
- `symspec.ts`: `symlinkSpec` function removed, constructor made public, factory methods removed, `copy` updated.
- `safecopy.ts`: `FileSpec` and `FolderSpec` imported as values.
- `util.ts`: `resolveType` updated to use public constructor.
- `fs.jsonex.test.ts`: Updated to use public constructors.
- `fs.test.ts`: Updated to use public constructors and new API.
- `fs2.test.ts`: Updated to use public constructors and new API.
- `fs3.test.ts`: Updated to use public constructors and new API.

### Next Steps:
1. Fix errors in `fs4.test.ts`.
2. Continue fixing errors in other test files.
3. Run `deno check` and `deno test`.
