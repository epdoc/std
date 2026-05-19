# AGENTS.md — @epdoc/text

This file provides project-specific context for AI agents working on the `@epdoc/text` package.

## Package Purpose

`@epdoc/text` provides standalone string manipulation utilities and `msub`, a template substitution engine that supports
`${key}` replacement with object properties or array values. This package was previously published as `@epdoc/string`.

## Package Dependencies

This package depends on:

- `@epdoc/type` — Type guards (`isString`, `isNumber`, `isDate`, etc.) and the `Integer` branded type

## Development Guidelines

Follow the universal Deno project conventions from the root monorepo's AGENTS.md.

### Key Patterns

- **text.ts**: Stateless utility functions. Add new string manipulation helpers here.
- **msub.ts**: Template substitution engine. The `MSubImpl` class is internal; consumers use the `msub` namespace
  exports (`replace`, `configure`, `create`).

### Source Organization

```
src/
  mod.ts    - Public exports: text.ts re-exports + msub namespace
  text.ts   - Standalone string utilities
  msub.ts   - MSubImpl class + namespace exports (replace, configure, create)
```

### Public API

#### Text utilities

```typescript
import { countLeadingTabs, createTable, hexEncode, padCenter, padLeft, padRight, pluralize, wrap } from '@epdoc/text';
```

#### MSub singleton

```typescript
import { msub } from '@epdoc/text';

// Direct replacement with default ${} syntax
msub.replace('Hello, ${name}!', { name: 'World' });

// Configure singleton for different delimiters
msub.configure({ open: '{{', close: '}}' });
msub.replace('Hello, {{name}}!', { name: 'World' });
```

#### MSub isolated instances

```typescript
const instance = msub.create({ open: '<<', close: '>>' });
instance.replace('Hello, <<name>>!', { name: 'World' });
```

### Important API Notes

- `msub.configure()` modifies a **singleton**. Use `msub.create()` for independent instances.
- `ConfigureOptions.format` is a fallback callback invoked when a format string does not match a method on the value.
- The `uppercase` option converts `SNAKE_CASE` keys to `camelCase` for object lookups.

### Testing

Run tests with:

```bash
deno task test
```

### Publishing

Before publishing:

```bash
deno task prepublish
```

This runs formatting, linting, type checking, tests, and documentation generation.

## Notes

- The package name is `@epdoc/text` on JSR. It was previously `@epdoc/string`.
- Test files live in `test/` with the `.test.ts` suffix.
- Entry point is `src/mod.ts` (not at the workspace root).
