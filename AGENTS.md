# AGENTS.md — @epdoc/std

This file provides project-specific context for AI agents working in this repository.

For universal conventions, load the following skills:

- Deno project conventions: load the `/deno-guidelines` skill
- **@epdoc/std library API reference**: load the `/epdoc-std` skill — do this before writing any type checks, filesystem
  code, string manipulation, or date handling
- Library documentation files: load the `/deno-library-docs` skill
- JSDoc commenting standards: load the `/jsdoc` skill
- Git workflow and version bumping: load the `/git` skill

### Committing and Publishing

Before committing or bumping versions in this repository, load the `/git` skill. Two slash commands are available:

- **`/commit`** — for non-publishable changes: docs, task additions, metadata, configuration, `.gitignore`, test
  scaffolding. Performs a plain `git commit` with no version bump.
- **`/bump`** — for publishable changes: bug fixes, new or changed exports, behavioral changes, dependency updates. Runs
  `bump -g` (and optionally `-c` / `-t`) from within the affected workspace directory.

**Decision guide:**

- Would a consumer of the published JSR package care about this change? → `/bump`
- Is this purely internal housekeeping? → `/commit`
- When in doubt, ask before bumping.

---

## Project Architecture

`@epdoc/std` is a **Deno monorepo** containing seven independently published utility packages. The root `deno.json`
defines the workspace members. Each package is published to JSR under the `@epdoc` scope.

```
@epdoc/std/
├── deno.json                  # Workspace root; defines workspace members and shared imports
├── deno.lock
├── daterange/                 # @epdoc/daterange
├── datetime/                  # @epdoc/datetime
├── duration/                  # @epdoc/duration
├── fs/                        # @epdoc/fs
├── response/                  # @epdoc/response
├── string/                    # @epdoc/string
└── type/                      # @epdoc/type
```

### Package Entry Points

| Package            | Entry Point     |
| ------------------ | --------------- |
| `@epdoc/daterange` | `src/mod.ts`    |
| `@epdoc/datetime`  | `src/mod.ts`    |
| `@epdoc/duration`  | `src/mod.ts`    |
| `@epdoc/fs`        | `src/mod.ts`    |
| `@epdoc/response`  | `mod.ts` (root) |
| `@epdoc/string`    | `mod.ts` (root) |
| `@epdoc/type`      | `src/mod.ts`    |

> Note: `@epdoc/string` and `@epdoc/response` place their entry point at the workspace root (`mod.ts`), not under
> `src/`.

---

## Package Descriptions and Key Exports

### `@epdoc/type`

Type guards, deep-copy utilities, JSON serialization, and dictionary helpers.

- `isString`, `isNumber`, `isBoolean`, `isDate`, etc. — type guard functions. Always use instead of typeof.
- `_.deepCopy(obj, opts)` — deep copy with optional string substitution
- `stripJsonComments` — remove comments from JSON strings
- Dictionary utilities via `dictutil.ts`

### `@epdoc/datetime`

Enhanced `Date` wrapper with timezone, formatting, and interop features.

- `DateEx` class / `dateEx()` factory — primary API
- ISO 8601 output with local timezone offset
- Google Sheets serial number conversion
- PDF date string parsing
- Julian Day calculation

### `@epdoc/duration`

Duration formatting beyond `Intl.DurationFormat`, with adaptive and humanize modes.

- `Duration.Formatter` — fluent builder for narrow/digital/long/short formats
- `humanize(ms, future?)` — natural language description ("about an hour ago")
- `Time` constants namespace
- `Format` utilities namespace

### `@epdoc/daterange`

Date range creation and management, built on `@epdoc/datetime`.

- `DateRange` and related classes (`src/date-ranges.ts`)
- Type definitions and utility functions

### `@epdoc/fs`

Type-safe async filesystem operations for Deno (in progress: Node.js / Bun support).

- `FileSpec` — file operations: read/write/copy/move/exists, Web Streams, JSON, Base64
- `FolderSpec` — directory operations: list, create, walk
- `FileSpecWriter` — streaming file writer
- `Walk` namespace — recursive directory traversal
- `Error` namespace — filesystem error types
- `util` namespace — path helpers
- File type detection (PDF, XML, JSON, etc.)

### `@epdoc/string`

Advanced string manipulation utilities.

- `ex.ts` exports — string extension helpers
- `msub` namespace — string substitution (simple and advanced)

### `@epdoc/response`

Consistent API response helpers with safe error wrapping.

- `apires.ts` — API result types
- `catchAsArray` namespace — catch errors as arrays
- `catchAsObj` namespace — catch errors as objects

---

## Cross-Package Dependencies

```
@epdoc/daterange  →  @epdoc/datetime, @epdoc/type
@epdoc/datetime   →  @epdoc/type
@epdoc/duration   →  @epdoc/type
@epdoc/fs         →  (no internal @epdoc deps)
@epdoc/string     →  @epdoc/type
@epdoc/response   →  @epdoc/type
@epdoc/type       →  (no internal @epdoc deps; foundational package)
```

**`@epdoc/type` is the foundational package.** When bumping its version, update all dependent packages.

---

## Development Commands

Run from the **root** of the monorepo:

```bash
deno task docs          # Generate docs via _scripts/gen_docs.ts
```

Run from within a **workspace directory**:

```bash
deno task prepublish    # Run fmt, lint, check and test
deno task docs          # Generate or regenerate library-docs.json, generate library-metadata.json if it does not exist
deno publish            # Publish to JSR
deno update             # Update project's dependencies. Add --latest for latest
bump -g "message"       # Bump version, commit, and push (uses @epdoc/bump)
```

---

## Project-Specific Conventions

### Workspace Layout Variations

Not all workspaces follow the standard `src/` layout:

- `@epdoc/string` and `@epdoc/response` have their source files at the workspace root (no `src/` directory)
- `@epdoc/fs` uses internal import aliases (`$spec`, `$error`, `$util`, `$walk`) defined in its `deno.json`

### Testing

- Most workspaces use a `test/` directory with `.test.ts` files
- `@epdoc/string` and `@epdoc/response` place test files at the workspace root (`.test.ts` suffix)
- Run `deno test -A` from within a workspace for all permissions
- `@epdoc/fs` requires `deno test -SERW test` (sys, env, read, write permissions)
- `@epdoc/type` uses `deno test -SERW` (sys, env, read, write permissions)

### fs Package: Node.js / Bun Compatibility

`@epdoc/fs` is inactively being modified to support Node.js and Bun in addition to Deno. When editing this package, be
aware that Deno-specific APIs may need Node.js equivalents.

### Version Bumping Workflow

Since these are published packages, it is best to use the `bump` tool rather than manually editing version fields:

```bash
# Within the workspace being updated
deno task prepublish
bump -g "Fix: description of change"
deno publish
# Then update dependents
deno update --latest   # In dependent workspaces
bump -g "Update @epdoc/type to 1.2.5"
```

### Import Convention

The root `deno.json` imports reflect the **published JSR versions** of workspace packages, used for cross-workspace
testing. When developing locally, workspaces reference each other through the Deno workspace protocol (resolved
automatically).

---

## Library Documentation Files

Each workspace should have:

- `library-docs.json` — machine-generated by `deno doc --json`; **excluded from git** (in `.gitignore`)
- `library-metadata.json` — human/AI-curated summary; **committed to git**

See the `/deno-library-docs` skill for schema and generation rules.
