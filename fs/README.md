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

---

## 📦 Install

To install @epdoc/fs, run the following command in your project directory:

```bash
deno add jsr:@epdoc/fs
```

### Importing the Library

This library provides two distinct ways to import its functionality, separating the primary components from the file
system utilities for cleaner usage.

### 1\. Primary Export (Default)

The main features of the library are available directly from the package name. Use a **named import** to access the
functions and classes defined in the primary module (`./src/mod.ts`).

```typescript
import { mainFunction, MyClass } from '@my-scope/my-project';

// Use the primary function
mainFunction('Data');

// Instantiate the main class
const instance = new MyClass();
```

---

### 2\. File System Utilities (Namespaced)

The file system utilities are exposed under a dedicated namespace. Use a **namespace import** (`import * as FS`) on the
`/fs` subpath to access all utilities from `./src/fs.ts` neatly grouped under the `FS` object.

```typescript
import * as FS from '@my-scope/my-project/fs';

// Use the namespaced utilities
FS.readDir('./path/to/files');
FS.writeFile('output.txt', 'content');
```

## Usage

Here's an example of how to use @epdoc/fs to read a JSON file:

```javascript
import { fileSpec } from 'jsr:@epdoc/fs';
// Check if a directory exists
if (await new FolderSpec('~/.ssh').isDirectory()) {
  console.log('SSH directory exists');
}
// Read a JSON file
const config = await new FileSpec('config.json').readJson();
// Write to a file
await new FileSpec('output.txt').write('Hello, World!');
// Copy a file safely
await new FileSpec('source.txt').safeCopy('destination.txt');
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
const fsFile = new FileSpec('/my/path/to/non-existant/file.txt');
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

## License

[MIT](./LICENSE)

## Contributing

Contributions are not whole heartedly welcome yet, as I am still developing this mostly for personal use! With this
said, feel semi-free to submit a Pull Request, especially if you have superior knowledge to share.

## Support

If you encounter any problems or have any questions, please open an issue on the
[GitHub repository](https://github.com/epdoc/std/issues).
