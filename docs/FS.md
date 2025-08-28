# @epdoc/fs

Async File System utilities for ~~Node.js~~ Deno

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
10. PDF metadata extraction

## Installation

To install @epdoc/fs, run the following command in your project directory:

```bash
deno add jsr:@epdoc/fs
```

## Usage

Here's an example of how to use @epdoc/fs to read a JSON file:

```javascript
import { fileSpec } from 'jsr:@epdoc/fs';
// Check if a directory exists
if (await folderSpec('~/.ssh').getIsFolder()) {
  console.log('SSH directory exists');
}
// Read a JSON file
const config = await fileSpec('config.json').readJson();
// Write to a file
await fileSpec('output.txt').write('Hello, World!');
// Copy a file safely
await fileSpec('source.txt').safeCopy('destination.txt');
```

## API Overview

### Main Classes

- `FileSpec`: Core class for file operations
  - Methods for file/directory operations (e.g., `isFile()`, `isDir()`, `getStats()`)
  - File content operations (e.g., `readAsBytes()`, `readAsString()`, `readJson()`)
  - File manipulation (e.g., `write()`, `safeCopy()`, `backup()`, `filesEqual()`)
  - Date (e.g. `getPdfDate()`)

- `FolderSpec`: Core class for folder operations
  - Async directory operations (e.g., `getChildren()`, `getFiles()`, `getFolders()`, `walk()`)
  - Sorting methods (e.g., `sortChildren()`, `sortByFilename()`, `sortFilesBySize()`)
  - Shallow comparision (e.g. `compare()`, `getDiff()`)

- `FSBytes`: Class for working with file bytes and detecting file types
  - Methods for file type detection (e.g., `getType()`, `getCategory()`)
  - Utility methods for byte manipulation and comparison

- `FSStats`: Extended class for file statistics
  - Provides additional methods on top of Node.js's `fs.Stats`

### Factory Functions

- `fileSpec(path: string): FileSpec`: Creates an FileSpec instance for the given path
- `folderSpec(path: string): FolderSpec`: Creates a FolderSpec instance for the given path
- `fsbytes(buffer: Buffer): FSBytes`: Creates an FSBytes instance for the given buffer

For detailed API documentation and usage examples, please refer to the JSDoc comments in the source code of each class
and function.

## License

[MIT](./LICENSE)

## Contributing

Contributions are not whole heartedly welcome yet, as I am still developing this mostly for personal use! With this
said, feel free to submit a Pull Request.

## Support

If you encounter any problems or have any questions, please open an issue on the
[GitHub repository](https://github.com/epdoc/std/issues).
