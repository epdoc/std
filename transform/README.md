# @epdoc/transform

## Overview

`@epdoc/transform` provides deep copying, JSON serialization/deserialization with special-type preservation, and string
replacement utilities for TypeScript.

Key features:

- **Deep copying** with optional string replacement and transformation
- **JSON serialization/deserialization** preserving special types (Set, Map, RegExp, Uint8Array, Temporal)
- **String replacement** — simple built-in msub or advanced with custom `msubFn`

## Installation

```bash
deno add jsr:@epdoc/transform
```

## Import Convention

Exports are organised under two namespaces — `Deep` and `Json` — plus a standalone `msubLite` function:

```typescript
import { Deep, Json, msubLite } from '@epdoc/transform';
```

`Deep` contains deep-copy utilities.\
`Json` contains JSON serialization/deserialization with type encoding.

## Usage

### Deep Copy with String Replacement

#### Simple String Replacement

```typescript
import { Deep } from '@epdoc/transform';

const config = {
  apiUrl: '${baseUrl}/api',
  version: '${appVersion}',
};

const result = Deep.copy(config, {
  replace: { baseUrl: 'https://api.example.com', appVersion: '1.0.0' },
});
// → { apiUrl: 'https://api.example.com/api', version: '1.0.0' }
```

#### Advanced String Replacement with Custom msubFn

```typescript
import { Deep } from '@epdoc/transform';

const config = {
  timestamp: '${now:yyyy-MM-dd HH:mm:ss}',
  user: '${username}',
};

function customReplace(str: string, replace: Record<string, unknown>): string {
  let result = str;
  for (const [key, value] of Object.entries(replace)) {
    result = result.replaceAll(`\${${key}}`, String(value));
  }
  return result;
}

const result = Deep.copy(config, {
  replace: { now: new Date(), username: 'john.doe' },
  msubFn: (s, replacements) => customReplace(s, replacements),
});
```

### JSON Serialization with Special Types

```typescript
import { Json } from '@epdoc/transform';

const data = {
  users: new Set(['alice', 'bob']),
  metadata: new Map([['version', '1.0'], ['env', 'prod']]),
  pattern: /^[a-z]+$/i,
  binary: new Uint8Array([1, 2, 3, 4]),
};

// Serialize — must opt in with `encode: true` to preserve special types
const json = Json.serialize(data, { encode: true });

// Deserialize — must opt in with `decode: true` to restore special types
const restored = Json.deserialize(json, { decode: true });
// restored.users is a Set, restored.metadata is a Map, etc.
```

### Temporal Types

Temporal types (Instant, ZonedDateTime, PlainDateTime) are handled automatically and do **not** require `encode: true`
on serialization. They only need `decode: true` on deserialization:

```typescript
const obj = { time: Temporal.Instant.from('2024-01-15T12:30:45.123Z') };
const json = Json.serialize(obj); // encode not needed
const restored = Json.deserialize(json, { decode: true });
// restored.time instanceof Temporal.Instant → true
```

### String Substitution (msubLite)

```typescript
import { msubLite } from '@epdoc/transform';

msubLite('Hello ${name}!', { name: 'World' });
// → 'Hello World!'
```

## API Reference

### `Deep.copy(value, options?)`

Deep copy with optional string replacement and RegExp detection.

| Option        | Type                                                             | Description                                     |
| ------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| `replace`     | `Record<string, string>` or `Record<string, unknown>` + `msubFn` | Substitution placeholders                       |
| `autoRegExp`  | `boolean`                                                        | Reconstruct `{ regex, flags }` as RegExp        |
| `pre`, `post` | `string`                                                         | Placeholder delimiters (default: `'${'`, `'}'`) |

### `Json.serialize(value, options?, space?)`

Serialise to JSON with optional type encoding and string replacement.

| Option       | Type                | Description                                                      |
| ------------ | ------------------- | ---------------------------------------------------------------- |
| `encode`     | `boolean`           | Wrap Set, Map, RegExp, Uint8Array in `__filter` (default: false) |
| `autoRegExp` | `boolean`           | Serialize RegExp as `{ regex, flags }` (default: false)          |
| `replace`    | see `Deep.CopyOpts` | String substitution                                              |

### `Json.deserialize(json, options?)`

Deserialize JSON, restoring encoded types, Temporal values, and RegExp.

| Option          | Type                             | Description                                                   |
| --------------- | -------------------------------- | ------------------------------------------------------------- |
| `decode`        | `boolean`                        | Restore `__filter`-wrapped types (default: false)             |
| `autoTemporal`  | `boolean`                        | Convert ISO strings to Temporal types (default: false)        |
| `autoRegExp`    | `boolean`                        | Detect `{ regex, flags }` and rebuild RegExp (default: false) |
| `stripComments` | `boolean` or `StripCommentsOpts` | Strip JSONC comments before parsing                           |
| `replace`       | see `Deep.CopyOpts`              | String substitution                                           |

### `Json.stripComments(json, options?)`

Removes `//` and `/* */` comments from a JSON(C) string. See
[sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments) for the original algorithm.

### `msubLite(string, replacements, pre?, post?)`

Simple string-for-string placeholder substitution without `eval`. For advanced formatting, supply a custom `msubFn` that
handles non-string values.

## License

MIT. See [LICENSE](LICENSE).

The JSONC comment-stripping logic is ported from
[sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments/blob/main/readme.md) which is
also MIT-licensed.
