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
