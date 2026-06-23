# AGENTS.md for @epdoc/condition

Generic condition evaluation library with no domain knowledge.

## Architecture

- `src/types.ts` — `ITestable<D>`, `LogFn`, `AnyCondition` (logical only), operator types
- `src/evaluator.ts` — `evaluateValueCondition` and `evaluateFieldCondition`
- `src/and.ts` / `src/or.ts` / `src/not.ts` / `src/boolean.ts` — Logical combinator classes
- `src/factory.ts` — Builds `ITestable<D>` for `and`/`or`/`not`/`boolean`; no field handling
- `test/` — Unit tests for evaluator and factory

## Implementation Notes

- All condition classes accept an optional `LogFn` (`(msg: string) => void`) for spam-level logging.
- No class extends a framework base class; conditions are plain `ITestable<D>` implementations.
- `AnyCondition` intentionally does **not** include field conditions. Domain packages layer those on top.
- Use `@epdoc/type` guards (`_.isString`, `_.isArray`, `_.isDict`, etc.) for all runtime checks.

## Maintenance Tasks

- Run `deno task ok` before committing.
- Update `library-docs.json` via `deno task docs` when exports change.
- Keep operator logic in sync with `@finsync/schema`/`@finsync/condition` consumers.
