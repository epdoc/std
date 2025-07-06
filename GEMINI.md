# Gemini Instructions

## References

- [README](./README.md)

## Code Generation

Do not use the TypeScript type 'any'. Instead use 'unknown'.

Do not use switch statements.

Use the type guards and tests and other utility functions provided in
[@epdoc/type](https://github.com/epdoc/std/tree/master/type) where possible. Examples:

- instead of using `var instanceof Date`, use `isDate(var)`.
- instead of using `typeof var === 'string'`, use `isString(var)`.

Automatically fix `type` keyword usage in `import` statements in typescript `.ts` files:

- When an import statement only imports types, add a `type` keyword to the item being imported.
- If all items being imported from a file are only to import types, put the `type` keyword before the list of items. For
  example, `import type * as c from '../types/conditions.ts'` should include the keyword `type` where appropriate.
  Otherwise we get the error "All import identifiers are used in types

## Commit Messages

When generating commit messages, only use the word 'refactor' when a significant change has been made to how code is
organized or a class is implemented. Instead use the word 'modified' when changes are made.

## Code Explanations

This project con
