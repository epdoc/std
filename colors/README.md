# @epdoc/colors

A standardized terminal color API and curated palette for CLI applications, designed to be flexible and type-safe.

This package provides a unified `Color.Spec` type that accepts:

- Simple hex colors for foregrounds (e.g. `0xff0000`)
- Structured objects for foreground/background combinations (e.g. `{ fg: 0xffffff, bg: 0x000000 }`)
- Complete custom styling functions from `@std/fmt/colors`

It also includes a curated, named hex color palette (`Color.palette`) that is ideal for CLI interfaces.

## Usage

```ts
import { Color } from '@epdoc/colors';

// 1. Using the curated palette
const primary = Color.palette.cyan;
const warning = Color.palette.amber;

// 2. Applying colors
const styledText1 = Color.apply('Hello World', primary);
const styledText2 = Color.apply('Error!', { fg: Color.palette.white, bg: Color.palette.red });

// 3. Converting to a StyleFn for passing around
const myStyleFn = Color.toStyleFn({ fg: 0x51d67c });
console.log(myStyleFn('This is green!'));

// 4. Integrating with @std/fmt/colors
import { bold } from '@std/fmt/colors';
const boldCyan: Color.StyleFn = (s) => bold(Color.apply(s, primary));
```

## Types

The `Color.Spec` union type encompasses the three supported formats:

```ts
export type Spec = StyleFn | number | Def;
```

- **`StyleFn`**: A function `(text: string) => string`, exactly matching `@std/fmt/colors` exports.
- **`number`**: A hex number shorthand for setting the foreground color via `rgb24(text, n)`.
- **`Def`**: An object `{ fg?: number, bg?: number }` to set both text and background colors via `rgb24` and `bgRgb24`.

## API

- **`Color.palette`**: A read-only map of curated hex color numbers (e.g., `black`, `slate`, `red`, `teal`, `amber`,
  `sand`).
- **`Color.toStyleFn(spec: Color.Spec): Color.StyleFn`**: Normalizes any color specification into a callable styling
  function.
- **`Color.apply(text: string, spec: Color.Spec): string`**: Convenience method to style a string using a color
  specification.
