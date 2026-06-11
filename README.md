# @epdoc/std

A collection of standard library modules for Deno and TypeScript, providing robust and reusable utilities for common
programming tasks.

## Workspaces

This repository is organized into several workspaces, each focusing on a specific domain:

| Workspace                            | Description                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| [`colors`](./colors/README.md)       | Standardized terminal color palette and utilities.                        |
| [`daterange`](./daterange/README.md) | Date range creation and management.                                       |
| [`datetime`](./datetime/README.md)   | Date/time tools.                                                          |
| [`duration`](./duration/README.md)   | Duration handling and formatting.                                         |
| [`fmt`](./fmt/README.md)             | Formatting functions (bool, bytes, percent, uptime).                      |
| [`fs`](./fs/README.md)               | Type-safe filesystem operations.                                          |
| [`progress`](./progress/README.md)   | Progress bar / spinner utilities.                                         |
| [`response`](./response/README.md)   | Consistent API response helpers.                                          |
| [`table`](./table/README.md)         | Terminal table formatter with ANSI-aware padding.                         |
| [`terminal`](./terminal/README.md)   | Terminal interaction utilities.                                           |
| [`text`](./text/README.md)           | Advanced string manipulation (formerly `@epdoc/string`).                  |
| [`transform`](./transform/README.md) | Deep copy, JSON serialization with type preservation, string replacement. |
| [`type`](./type/README.md)           | Type guards and runtime type safety utilities.                            |

> See [AGENTS.md](./AGENTS.md) for architecture details, cross-package dependencies, and development commands.

## Usage

Each package is published to [JSR](https://jsr.io/@epdoc). Add a package to your project:

```sh
deno add @epdoc/type
```

Then import and use:

```typescript
import { isString } from '@epdoc/type';

const value: unknown = 'hello world';

if (isString(value)) {
  console.log(value.toUpperCase());
}
```

## Development

### Prerequisites

```sh
deno install -g -A -n dtask jsr:@epdoc/dtask
```

### Running Tests

Run tests for a specific workspace:

```sh
cd transform
deno task test
```

Run all workspace tests from root:

```sh
deno task test
```

### Formatting & Linting

```sh
deno task fmt
deno task lint
```

### Full Check (fmt + lint + check + test)

```sh
deno task ok
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
