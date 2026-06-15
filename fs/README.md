# @epdoc/fs

Async File System utilities for Deno.

Work in progress: We are currently modifying this library to work in nodejs and Bun.

## Description

@epdoc/fs provides asynchronous file system utilities. It offers an intuitive API for working with files and
directories, including operations like reading, writing, copying, and moving files, as well as directory management and
file type detection.

## Key Features

1. `FileSpec` for common file operations
2. `FolderSpec` for common folder operations
3. File type detection (including PDF, XML, JSON, and more)
4. File and folder comparison and checksums
5. JSON reading and writing with deep copy support
6. Base64 encoding/decoding support
7. File backup
8. Flexible sorting options for files and directories
9. Read or walk folder contents
10. PDF metadata extraction via a lightweight parser

### Web Stream API

The `FileSpec` class now includes methods for working with Web Streams, providing an efficient way to handle file I/O
for large files.

- `readableStream(): Promise<ReadableStream<Uint8Array>>` Returns a `ReadableStream` for reading the file's content.

- `writableStream(): Promise<WritableStream<Uint8Array>>` Returns a `WritableStream` for writing to the file.

- `pipeFrom(source: ReadableStream<Uint8Array>): Promise<void>` Pipes a `ReadableStream` to the file.

- `pipeTo(destination: WritableStream<Uint8Array>): Promise<void>` Pipes the file's content to a `WritableStream`.

- `writer(): Promise<FileSpecWriter>` Returns a `FileSpecWriter` instance for more convenient writing.

#### FileSpecWriter

The `FileSpecWriter` class provides a higher-level abstraction for writing to a file.

- `write(data: string | Uint8Array): Promise<void>` Writes a chunk of data.

- `writeLine(line: string): Promise<void>` Writes a line of text with a newline character.

- `close(): Promise<void>` Closes the writer and the underlying file stream.

#### Usage Examples

**Piping a network download directly to a file:**

```typescript
import * as FS from '@epdoc/fs/fs';

const url = 'https://example.com/large-file.zip';
const fileSpec = FS.File.from('./downloaded-file.zip');

const response = await fetch(url);
if (response.body) {
  await fileSpec.pipeFrom(response.body);
}
```

**Reading a file and piping it to standard output:**

```typescript
import * as FS from '@epdoc/fs/fs';

const fileSpec = FS.File.from('./my-large-log-file.log');
await fileSpec.pipeTo(Deno.stdout.writable);
```

**Using the FileSpecWriter:**

```typescript
import * as FS from '@epdoc/fs/fs';
import { DateTime } from '@epdoc/datetime';

const fileSpec = FS.File.from('./log.txt');
const writer = await fileSpec.writer();

try {
  await writer.writeLine('Log started at ' + DateTime.now().setTz().toISOString());
  await writer.write('This is a log entry.');
  await writer.write(' And another one.');
} finally {
  await writer.close();
}
```

---

## 📦 Install

To install @epdoc/fs, run the following command in your project directory:

```bash
deno add jsr:@epdoc/fs
```

## API Overview

### Main Classes

- `FSSpec`: Factory class for file system entries
  - Async methods to detect entry type (e.g., `isFile()`, `isFolder()`, `stats()`)
  - Cached `FileInfo` available using `info` getter (also available to `FileSpec` and `FolderSpec`)

- `FileSpec`: Core class for file operations
  - File content operations (e.g., `readAsBytes()`, `readAsString()`, `readJson()`)
  - File manipulation (e.g., `write()`, `safeCopy()`, `backup()`, `equals()`)
  - Date (e.g. `getPdfDate()`)

- `FolderSpec`: Core class for folder operations
  - Async directory operations (e.g., `getChildren()`, `getFiles()`, `getFolders()`, `walk()`)
  - Sorting methods (e.g., `sortChildren()`, `sortByFilename()`, `sortFilesBySize()`)
  - Shallow comparision (e.g. `compare()`, `getDiff()`)

- `FSBytes`: Class for working with file bytes and detecting file types
  - Methods for file type detection (e.g., `getType()`, `getCategory()`)
  - Utility methods for byte manipulation and comparison

### Resolving a file type

```ts
const fsFile1 = await new FSSpec('/my/path/to/existing/file.txt').resolveType();
assert(fsFile1 instanceof FileSpec);
// true

const fsItem2 = await new FSSpec('/my/path/to/a/folder').resolveType();
assert(fsItem2 instanceof FolderSpec);
// true

const fsItem3 = await new FSSpec('/my/path/to/non-existant/file.txt').resolveType();
assert(fsItem3 === undefined);
// true
```

### Creating a FileSpec for a new or existing file

```ts
const fsFile = FileSpec.from('/my/path/to/non-existant/file.txt');
assert(fsFile instanceof FileSpec);
const exists = await fsFile.exists();
assert(exists);
// false
```

- `fileSpec(path: string): FileSpec`: Creates an FileSpec instance for the given path
- `folderSpec(path: string): FolderSpec`: Creates a FolderSpec instance for the given path
- `fsbytes(buffer: Buffer): FSBytes`: Creates an FSBytes instance for the given buffer

For detailed API documentation and usage examples, please refer to the JSDoc comments in the source code of each class
and function.

## Conflict Strategies for Backup

When writing a file that already exists, `@epdoc/fs` lets you choose how to handle the conflict. Pass a `backupStrategy`
(a `FileConflictStrategy`) via `SafeWriteOptions` to any write method (`write`, `writeJson`, `writeToml`, `writeYaml`),
or call `backup()` / `safeCopy()` directly.

### Available Strategies

| Strategy             | Behaviour                                                                                                                    | Example backup filename         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `renameWithTilde`    | Appends `~` to the existing filename. Simple and fast. **Default for `backup()`.**                                           | `config.json~`                  |
| `renameWithNumber`   | Appends an incrementing zero-padded index. Supports `limit`, `separator`, `prefix`, and `keep` options.                      | `config-01.json`                |
| `renameWithDatetime` | Appends a formatted datetime string. Use `format` (default `yyyyMMddHHmmssSSS`) to customise. Supports `keep`.               | `config-20240614153045123.json` |
| `renameWithEpochMs`  | Appends the current epoch millisecond timestamp. Timezone-safe; recommended when rotating across timezones. Supports `keep`. | `config-1718382645123.json`     |
| `overwrite`          | Overwrites the destination without creating a backup (no-op for the backup path).                                            | —                               |
| `skip`               | Skips the write if the file already exists.                                                                                  | —                               |
| `error`              | Throws an `AlreadyExists` error if the file already exists.                                                                  | —                               |

### Defaults

- `backup()` defaults to `{ type: 'renameWithTilde' }`.
- Write methods (`writeJson`, etc.) do **not** back up by default — you must supply `backupStrategy` explicitly.
- `safe` (atomic temp-file write) defaults to `false`.

### Rotating old backups (`keep`)

The `renameWithNumber`, `renameWithDatetime`, and `renameWithEpochMs` strategies accept a `keep` object:

```ts
keep?: {
  ms?: number;        // delete backups older than this many milliseconds
  generations?: number; // keep at most this many backup files
}
```

When both are set, a backup is only deleted if **both** conditions are met.

### Usage Examples

```ts
import * as FS from '@epdoc/fs/fs';

const file = FS.File.from('./config.json');

// Simple tilde backup (config.json → config.json~)
await file.writeJson(data, { backupStrategy: { type: 'renameWithTilde' } });

// Numbered backups, keep last 5 (config.json → config-01.json … config-05.json)
await file.writeJson(data, {
  backupStrategy: { type: 'renameWithNumber', keep: { generations: 5 } },
});

// Datetime-stamped backup with atomic write
await file.writeJson(data, {
  safe: true,
  backupStrategy: { type: 'renameWithDatetime', format: 'yyyyMMdd-HHmmss' },
});

// Epoch-ms backup — safe for cross-timezone rotation
await file.writeJson(data, {
  backupStrategy: { type: 'renameWithEpochMs', keep: { ms: 7 * 24 * 60 * 60 * 1000 } },
});

// Skip the write if the file already exists
await file.writeJson(data, { backupStrategy: { type: 'skip' } });
```

## License

[MIT](./LICENSE)

## Contributing

Contributions are not whole heartedly welcome yet, as I am still developing this mostly for personal use! With this
said, feel semi-free to submit a Pull Request, especially if you have superior knowledge to share.

## Support

If you encounter any problems or have any questions, please open an issue on the
[GitHub repository](https://github.com/epdoc/std/issues).
