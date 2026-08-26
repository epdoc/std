# AGENTS.md — @epdoc/fmt

This file provides project-specific context for AI agents working on `@epdoc/fmt`.

For universal conventions, load the root `/AGENTS.md` skills (deno-guidelines, epdoc-std, jsdoc, git).

## Package Purpose

Factory functions that return closures for formatting common data types for display, with optional ANSI coloring:

- `bool()` — boolean with named presets (`check`, `circleDot`, `yesno`, ...) or custom chars/colors
- `bytes()` — binary byte sizes (B → YiB)
- `percent()` — ratio → percentage with sub-threshold rendering (`<0.01 %`)
- `uptime()` — seconds → compact narrow duration via `@epdoc/duration`
- `char()` — semantic name → Unicode glyph lookup over `Icon` and char tables
- `Icon` / `IconValues` / `isIcon` / `Direction` / `isDirection` — icon data and type guards

Each factory resolves its options once at creation time and returns a zero-configuration closure. This is the pattern
`@epdoc/table` relies on for column formatters.

## Conventions

- Formatter signatures take `unknown` and coerce via `Number()`, returning `String(value)` for non-numeric input.
- `unitColor` colors only the unit suffix; `bool` colors the whole cell.
- `bytes`/`percent` clamp `decimals` to the range `[0, 100]`; `bytes` never overflows past YiB.
- `bool` throws `TypeError` on an unknown preset name; unknown `char()` names return `''`.
- Sub-path exports mirror each source file: `./bool`, `./bytes`, `./percent`, `./uptime`, `./char`, `./icons`.

## Source Layout

```
src/
  mod.ts      - Public exports (all formatters + types)
  bool.ts     - bool formatter, BOOL_PRESETS, BoolPreset value/type
  bytes.ts    - byte-size formatter
  percent.ts  - percentage formatter
  uptime.ts   - duration/uptime formatter
  char.ts     - character tables + char() lookup factory
  icons.ts    - Icon glyph map, Direction, type guards
test/
  formatters.test.ts  - bool/bytes/percent/uptime coverage
  char.test.ts        - char() and icon/direction guards
```

## Dependencies

`@epdoc/colors` (palette), `@epdoc/duration` (Formatter), `@epdoc/type` (`Integer`), `@std/fmt` (`rgb24`).

## Maintenance

- Run `deno task ok` before committing (fmt + lint + check + test + docs).
- This is a published package consumed outside this monorepo (`@epdoc/table` and others). Public API changes warrant a
  version bump via `bump -g "..."`.
