# @epdoc/fmt

Factory functions for formatting common data types for display, with optional ANSI coloring. Designed for use with table
column formatters and message builders.

Each factory returns a closure that applies formatting (and optional coloring) to a value:

```ts
import { bool, bytes, char, percent, uptime } from '@epdoc/fmt';

percent()(0.5); // "50.00 %"
bytes()(1048576); // "1.0 MiB"
uptime()(3661); // "1h01m01s"
bool()(true); // "✓" (green)
char()('check'); // "✓"
char()('left'); // "←"
```

## Installation

```bash
deno add jsr:@epdoc/fmt
```

Sub-path imports are also available: `@epdoc/fmt/bool`, `@epdoc/fmt/bytes`, `@epdoc/fmt/percent`, `@epdoc/fmt/uptime`,
`@epdoc/fmt/char`, `@epdoc/fmt/icons`.

## Formatters

### bool

Renders boolean values as styled characters or text, with named presets or custom options.

```ts
import { bool, BOOL_PRESETS } from '@epdoc/fmt';

bool()(true); // "✓" (green) / "✗" (red)
bool('checkBold')(false); // "✖" (red)
bool('circleDot')(true); // "●" (green) / "‧" (slate)
bool({ trueChar: 'YES', falseChar: 'no' })(true); // "YES" (green)
bool({ trueChar: 'Y', falseChar: 'N', bold: true })(true); // bold "Y"
```

Presets: `check`, `checkBold`, `circle`, `circleRed`, `circleOpenRed`, `circleDot`, `yesno`, `truefalse`, `square`,
`arrow`, `toggle`. Passing an unknown preset name throws a `TypeError`. Custom options override the `check` preset and
support `trueChar`, `falseChar`, `trueColor`, `falseColor`, `bold`, and `dim`.

### bytes

Formats byte counts into human-readable binary units (B through YiB).

```ts
bytes()(1048576); // "1.0 MiB"
bytes({ decimals: 0 })(1536); // "2 KiB"
bytes({ separator: '' })(500); // "500B"
bytes({ unitColor: 0x888888 })(1048576); // "1.0 MiB" with colored unit
bytes()(-1024); // "-1.0 KiB"
```

### percent

Converts a ratio (0..1) to a percentage string. Sub-threshold positive values render as `<0.01 %` (the bound scales with
`decimals`), and tiny negative values render symmetrically as `>-0.01 %`.

```ts
percent()(0.5); // "50.00 %"
percent({ decimals: 0 })(0.5); // "50 %"
percent({ separator: '' })(0.5); // "50.00%"
percent()(0.00009); // "<0.01 %"
```

### uptime

Formats seconds elapsed into compact narrow duration format via `@epdoc/duration`.

```ts
uptime()(3661); // "1h01m01s"
uptime({ separator: ' ' })(3661); // "1 h 01 m 01 s"
uptime({ units: 2 })(2700090); // "31d06h"
```

## Characters and icons

`char()` resolves a semantic name to its Unicode glyph, covering the `@epdoc/fmt` icon and character tables:

```ts
char()('check'); // "✓"
char()('left'); // "←"
char()('icon.circle.open'); // "○"  (dotted path, case-insensitive)
char()('1/2'); // "½"  (vulgar fraction)
char()('plusMinus'); // "±"  (math symbol)
char()('dollar'); // "$"  (currency)
char()('unknown-name'); // ""
```

The icon tables themselves are exported for direct use:

- `Icon` — nested map of glyphs (`Icon.Check.standard`, `Icon.Arrow.Line.right`, ...)
- `IconValues`, `isIcon(value)` — flat glyph list and type guard
- `Direction`, `isDirection(value)` — direction names for sort/arrow indicators
- `SuperScript`, `SubScript`, `SuperScriptLetters`, `Fractions`, `MathSymbols`, `Currency` — character tables

## Development

```bash
deno task ok          # fmt + lint + check + test + docs
deno task test        # run tests
deno task docs        # regenerate library-docs.json
```
