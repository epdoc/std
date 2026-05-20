# @epdoc/text

Standalone string manipulation utilities and `msub`, a string replacement method that supports substitution of object
properties or array values.

This package was previously published as `@epdoc/string`

## Install

```bash
deno add jsr:@epdoc/text
```

## Text Utilities

All text utilities are exported as standalone functions from the package root:

```ts
import { countLeadingTabs, createTable, hexEncode, padCenter, padLeft, padRight, pluralize, wrap } from '@epdoc/text';

pluralize('cat', 2); // "cats"
padLeft('cat', 5); // "  cat"
padRight('cat', 5); // "cat  "
padCenter('cat', 5); // " cat "
hexEncode('cat'); // "006300610074"
countLeadingTabs('\t\tcat'); // 2
wrap('The quick brown fox', 10); // ["The quick", "brown fox"]
createTable(['a', 'bb', 'ccc'], 10, 2); // ["a   bb", "ccc"]
```

### Available functions

| Function                                    | Description                               |
| ------------------------------------------- | ----------------------------------------- |
| `wrap(text, maxWidth?)`                     | Wrap text into lines of maximum width.    |
| `pluralize(word, count, pluralForm?)`       | Return plural or singular form of a word. |
| `countLeadingTabs(text)`                    | Count leading tab characters.             |
| `padRight(text, length, char?, truncate?)`  | Right-pad or truncate to a fixed length.  |
| `padLeft(text, length, char?, truncate?)`   | Left-pad or truncate to a fixed length.   |
| `padCenter(text, length, char?, truncate?)` | Center or truncate to a fixed length.     |
| `hexEncode(text)`                           | Encode a string as 16-bit hexadecimal.    |
| `createTable(strings, maxWidth?, padding?)` | Arrange strings into aligned columns.     |

## Msub

The `msub` namespace allows runtime substitution of `${key}` in a string with a value, much like JavaScript
[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

Msub can be used via the exported singleton (`msub.configure`, `msub.replace`) or by creating isolated instances with
`msub.create`.

### Default Use

The `msub.replace` method replaces all instances of `${prop}` in a string with a value. Substitutions may be specified
as property key/value pairs in an object, or as array entries.

```ts
import { msub } from '@epdoc/text';
import { expect } from 'jsr:@std/expect';

const newString1 = msub.replace('This ${a} ${bC} string', { bC: 'my', a: 'is' });
expect(newString1).toBe('This is my string');

const newString2 = msub.replace('This ${1} ${0} string', ['my', 'is']);
expect(newString2).toBe('This is my string');
```

### Date and Number formatting

In the special case where the key contains a colon and the replacement value is a Date or number, a formatter will be
called. For example:

- `${a:toFixed:2}` will use Number's `toFixed(2)` method.
- `${a:getFullYear}` will use Date's `getFullYear` method.
- `${a:yyyyMMdd}` will require a [Format Function](#format-function).

Note that in the first two cases, where the 2nd parameter is the name of a method on the object, a 3rd parameter is
allowed and will be passed to the specified number or Date function.

```ts
import { msub } from '@epdoc/text';
import { expect } from 'jsr:@std/expect';

const result = msub.configure().replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 });
expect(result).toBe('There are 1.6 hours remaining');
```

```ts
import { msub } from '@epdoc/text';
import { expect } from 'jsr:@std/expect';
const ONE_HUNDRED_DAYS = 100 * 24 * 3600 * 1000;

const result = msub.replace('The year is ${a:getFullYear}', { a: new Date(ONE_HUNDRED_DAYS) });
expect(result).toBe('The year is 1970');
```

### Customization

`msub.configure` can be used to customize the substitution syntax. Because `configure` and `replace` use a singleton,
any settings will apply to all uses of the singleton in your application. If you need different substitution syntaxes in
different parts of your code, use `msub.create` to create isolated instances.

`msub.ConfigureOptions`:

- `open` — the opening delimiter, defaults to `${`
- `close` — the closing delimiter, defaults to the matching closing brace for the opening delimiter (`}`). This is
  calculated by matching braces (`{}`, `()`, `[]`, `<>`). `%<[` will result in `]>` and not `]>%`. A custom close can be
  specified for other cases.
- `format` — a [Format Function](#format-function), if specified, to use to format values that contain a colon and that
  do not match a method on the value.

#### Format Function

```ts
import { DateTime } from '@epdoc/datetime';
import { msub } from '@epdoc/text';
import { expect } from 'jsr:@std/expect';

const d = new Date('2024-11-15T00:00:00.000Z');
const fmt1 = (_d: Date, _f: string) => {
  return DateTime.fromDate(_d).tz(360).toISOLocalString();
};
const fmt2 = (d: Date, f: string) => {
  return DateTime.fromDate(d).tz(0).format(f);
};

const r0 = msub.configure({ format: fmt1 }).replace('The date is ${a:toISOString}', { a: d });
expect(r0).toBe('The date is 2024-11-15T00:00:00.000Z'); // fmt is ignored because toISOString was found on the Date object

const r1 = msub.configure({ format: fmt1 }).replace('The date is ${a}', { a: d });
expect(r1).toBe('The date is 2024-11-14T18:00:00.000-06:00');

const r2 = msub.configure({ format: fmt2 }).replace('The date is ${a:yyyy/MM/dd}', { a: d });
expect(r2).toBe('The date is 2024/11/15');
```

### Create a new MSub instance

If the exported `msub` singleton does not meet your requirements, you can use `msub.create` to create a new MSub
instance.

```ts
import { msub } from '@epdoc/text';
import { expect } from 'jsr:@std/expect';
const msub1: msub.MSub = msub.create({ open: '{[' });

const result1 = msub1.replace('My {[body]}', { body: 'nose' });
expect(result1).toBe('My nose');

const result3 = msub.configure({ open: '<<' }).replace('My <<body>>', { body: 'eyes' });
expect(result3).toBe('My eyes');
```

## Migration from StringEx / StringUtil

The `StringEx` factory and `StringUtil` class were removed in favor of standalone functions.

### Text method calls

| Before                                   | After                         |
| ---------------------------------------- | ----------------------------- |
| `StringEx('cat').pluralize(2)`           | `pluralize('cat', 2)`         |
| `StringEx('cat').rightPad(5)`            | `padRight('cat', 5)`          |
| `StringEx('cat').leftPad(5)`             | `padLeft('cat', 5)`           |
| `StringEx('cat').center(5)`              | `padCenter('cat', 5)`         |
| `StringEx('cat').hexEncode()`            | `hexEncode('cat')`            |
| `StringEx('\t\tcat').countLeadingTabs()` | `countLeadingTabs('\t\tcat')` |
| `StringEx('long text').wrap(40)`         | `wrap('long text', 40)`       |

### MSub `configure` and `replace`

`StringEx` previously provided a thin wrapper around `msub`. Replace it with `msub.create` for per-instance
configuration, or the `msub` singleton for global configuration.

**Before:**

```ts
import { StringEx } from '@epdoc/text';

const result = msub
  .create({ open: '[[' })
  .replace('My [[body]]', { body: 'nose' });
```

**After:**

```ts
import { msub } from '@epdoc/text';

const result = msub
  .createMSub({ open: '[[' })
  .replace('My [[body]]', { body: 'nose' });
```

Or, if you were using the default `${}` syntax with the singleton:

**Before:**

```ts
const result = msub.replace('My ${body}', { body: 'eyes' });
```

**After:**

```ts
const result = msub.replace('My ${body}', { body: 'eyes' });
```

## Versions

`msub` has a previous life as an [npm package](https://www.npmjs.com/package/msub). With the advent of string literals,
the need for msub has diminished, but it is still useful for some applications.

## License

[MIT](./LICENSE)
