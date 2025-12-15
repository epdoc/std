# Claude Code Project Guide - @epdoc/std

This document provides essential context for Claude Code when working on the @epdoc/std monorepo.

## Project Overview

@epdoc/std is a monorepo containing shared utility packages for TypeScript/Deno development. Each workspace focuses on a
specific domain and is published independently to JSR.

**Important**: See [GEMINI.md](./GEMINI.md) for the complete workspace overview and package descriptions.

## Workspaces

| Package              | Description                                                            | Location       |
| -------------------- | ---------------------------------------------------------------------- | -------------- |
| **@epdoc/daterange** | Date range creation and management                                     | `./daterange/` |
| **@epdoc/datetime**  | Date/time tools                                                        | `./datetime/`  |
| **@epdoc/duration**  | Duration handling and formatting                                       | `./duration/`  |
| **@epdoc/fs**        | Type-safe filesystem operations (FileSpec, FolderSpec, FileSpecWriter) | `./fs/`        |
| **@epdoc/response**  | Consistent API response helpers                                        | `./response/`  |
| **@epdoc/string**    | Advanced string manipulation utilities                                 | `./string/`    |
| **@epdoc/type**      | Type guards and runtime type safety utilities                          | `./type/`      |

## Development Workflow

### Making Changes to Packages

1. Navigate to package directory: `cd ~/dev/@epdoc/std/<package>`
2. Make your changes
3. Run tests: `deno test -A` (use `-A` for all permissions)
4. Bump version in `deno.json`
5. Commit changes
6. Publish: `deno publish`
7. Update dependencies in dependent projects: `deno update --latest`

### Testing

- Always use Deno `-A` option to provide read, write, sys, and env permissions
- Run from package directory: `deno test -A`
- Type check specific files: `deno check <file>`

## Important Notes

### Package Updates

- Since you are the author of these packages, **update them directly** rather than creating workarounds
- These are published packages available via `jsr:@epdoc/<package>`
- Follow the standard Deno publishing workflow when making changes

### Documentation

- Each package has its own README.md with detailed usage information
- Refer to [GEMINI.md](./GEMINI.md) for workspace overview
- Check individual package READMEs for package-specific patterns and examples

### Common Patterns

- Most packages export through `mod.ts` or `src/mod.ts`
- Use internal path mappings (like `$spec`, `$util`) within packages
- Maintain consistent API patterns across packages
- Always include proper TypeScript types

## Cross-Dependencies

- Packages within @epdoc/std may depend on each other
- When updating one package that affects others, update all dependent packages
- Check `deno.json` imports to see package dependencies
