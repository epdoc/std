# AGENTS.md — @epdoc/table

This file provides project-specific context for AI agents working on the `@epdoc/table` package.

## Package Purpose

`@epdoc/table` is a terminal table formatter with ANSI-aware padding, column auto-sizing, zebra striping, and per-cell
styling. It is designed for rendering aligned, styled tables in CLI applications.

## Package Dependencies

This package depends on:

- `@epdoc/duration` — For duration formatting in the `formatters.uptime` utility
- `@epdoc/type` — For the `Integer` branded type (transitive dependency via `@epdoc/duration`)
- `@std/fmt` — For ANSI color utilities (`rgb24`, `bgRgb24`, etc.)

## Development Guidelines

Follow the universal Deno project conventions from the root monorepo's AGENTS.md, with the exception of the @epdoc/type
usage requirement.

### Key Patterns

See `test/example*.test.ts` files for usage patterns:
- **example01** - Basic table with `buildColumns()`
- **example02** - Styled tables with colors
- **example03** - Using built-in formatters
- **example04** - Fluent API chaining
- **example09** - ColorType API (number, ColorSpec, StyleFn)
- **example10** - noColor option for plain output

### Source Organization

```
src/
  mod.ts       - Public exports
  types.ts     - TypeScript types (Column, Options, ColorType, etc.)
  render.ts    - TableRenderer class (constructor + fluent APIs)
  formatters.ts - Built-in formatters (percent, bytes, uptime)
  utils.ts     - buildColumns() and utilities
  terminal.ts  - ANSI-aware string utilities
```

### Testing

Run tests with:

```bash
deno test -SERW
```

### Publishing

Before publishing:

```bash
deno task prepublish
```

This runs formatting, linting, type checking, tests, and documentation generation.
