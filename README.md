# @epdoc/std

A collection of standard library modules for Deno and TypeScript, providing robust and reusable utilities for common
programming tasks.

## Workspaces

This repository is organized into several workspaces, each focusing on a specific domain:

| Workspace                            | Description                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| [`daterange`](./daterange/README.md) | Utilities for creating and managing date ranges.            |
| [`datetime`](./datetime/README.md)   | Tools for working with dates and times.                     |
| [`duration`](./duration/README.md)   | Functions for handling time durations and formatting.       |
| [`fs`](./fs/README.md)               | A library for advanced filesystem operations.               |
| [`response`](./response/README.md)   | Helpers for creating consistent and safe API responses.     |
| [`string`](./string/README.md)       | A collection of advanced string manipulation utilities.     |
| [`type`](./type/README.md)           | A set of type guards and utilities for runtime type safety. |

## Usage

You can add a package to your project using the `deno add` command, which will add the package to your `deno.json` file.
It is recommended to pin to a specific version for stability.

```sh
deno add @epdoc/type
```

_Note: Please replace `0.1.0` with the desired version tag._

Then, you can import and use the modules in your code.

```typescript
// Example: Using the isString type guard from the 'type' module
import { isString } from '@epdoc/type';

const value: unknown = 'hello world';

if (isString(value)) {
  console.log(value.toUpperCase()); // HELLO WORLD
}
```

### Direct URL Imports

Alternatively, you can import a module directly from its URL without adding it to your `deno.json`.

```typescript
// Example: Using the isString type guard from the 'type' module
import { isString } from 'https://deno.land/x/epdoc_std@v0.1.0/type/mod.ts';

const value: unknown = 'hello world';

if (isString(value)) {
  console.log(value.toUpperCase()); // HELLO WORLD
}
```

_Note: Please replace `v0.1.0` with the desired version tag._

## Development

### Running Tests

To run all tests for all workspaces, execute the following command from the root of the repository:

```sh
deno test
```

To run tests for a specific workspace, navigate to its directory:

```sh
cd type
deno task test
```

### Formatting

This project uses `deno fmt` for code formatting.

```sh
deno fmt
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
