# Gemini Instructions

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

## References

- [README](./README.md)

## Code Generation

- Do not use the TypeScript type 'any'. Instead use 'unknown'.
- Do not use switch statements. Prefer `if () {} else if () {} else {}`.
- If and only if `@epdoc/type` is already imported into this project, use the type guards and tests and other utility
  functions provided in `@epdoc/type` where possible. For example:
  - instead of using `val instanceof Date`, use `isDate(val)`.
  - instead of using `typeof val === 'string'`, use `isString(val)`. If and only if `@epdoc/fs` is already imported into
    this project, use this module for filesystem operations.
  - Fallback to Deno `@std/fs` functions if `@epdoc/fs` does not expose the required functionality.
- Import statements
  - Need to include the `.ts` extension for imported files.
  - Automatically fix `type` keyword usage in `import` statements where found in typescript `.ts` files. For example:
    - If `gapi` is only imported for types, use `import { type gapi, label } from '../src/dep.ts';`.
    - If both `gapi` and `label` are only imported for types, use `import type { gapi, label } from '../src/dep.ts';`.
  - If deleting an import statement, delete the entire line so that a blank line is not left.

## Code commenting

### JSDoc Commenting Guidelines (for TypeScript)

When generating or modifying TypeScript code, please adhere to the following JSDoc commenting standards:

1. **Purpose**: JSDoc comments improve code clarity, provide IDE IntelliSense, and support automated API documentation.
2. **Placement**: Use `/** ... */` block comments directly above the code element being documented.
3. **Required Documentation**:
   - All exported functions, classes, methods, and complex type definitions (interfaces, type aliases).
   - Internal helper functions if their logic is not immediately obvious.
   - File overview, only if the file is not a single class that is already sufficiently documented
4. **Content**:
   - Start with a concise summary sentence.
   - Follow with a more detailed explanation if necessary (complex logic, edge cases, context).
5. **Common JSDoc Tags**:
   - `@param {Type} [name] - Description.`: For function/method parameters. Use brackets `[]` for optional parameters
     and specify default values if applicable (e.g., `[name='default']`).
   - `@returns {Type} - Description.`: For what a function/method returns. Omit for `void` or `Promise<void>` returns.
   - `@example <caption>Optional Caption</caption>\nCode example here.`: Provide small, runnable code snippets.
   - `@throws {ErrorType} - Description.`: Document potential errors or exceptions.
   - `@deprecated [reason and/or alternative]`: Indicate deprecated elements.
   - `@see {@link otherFunction}` or `@see URL`: Link to related functions or external resources.
   - `{@link targetCode|displayText}`: For inline links within descriptions.
6. **Class-Specific Tags**:
   - `@extends {BaseClass}`: If the class extends another.
   - `@template T`: For generic classes, define type parameters.
7. **Method-Specifics**: Document all `public` and `protected` methods. `private` methods only if their logic isn't
   obvious.
8. **Consistency**: Ensure consistent style and tag usage throughout the code.
9. **Accuracy**: Comments must be kept up-to-date with code changes. Inaccurate comments are worse than no comments.
10. **Conciseness**: Avoid redundant comments that simply restate obvious code. Focus on the "why" and the API contract.

### Git Commit Messages

Only use the work 'refactor' when a significant change has been made to how code is organized or a class is implemented.
Instead use the word 'modified' when changes are made.

## Unit tests

- Use the Deno `-A` option to provide read, write, sys and env permissions.
