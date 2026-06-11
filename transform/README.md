# @epdoc/transform

## Overview

The @epdoc/transform package is a TypeScript utility library that provides utilities for\
deep copying, JSON serialization/deserialization, and string replacement operations.

Key features:

- **Deep copying** with optional string replacement and transformation
- **JSON serialization/deserialization** preserving special types (Set, Map, RegExp, Uint8Array)
- **String replacement** with simple built-in msub or advanced msub integration

## Installation

```bash
deno add jsr:@epdoc/transform
```

## Usage

### Deep Copy with String Replacement

#### Simple String Replacement

```typescript
import { _ } from '@epdoc/type';

const config = {
  apiUrl: '${baseUrl}/api',
  version: '${appVersion}',
  nested: {
    path: '${baseUrl}/nested',
  },
};

const result = _.deepCopy(config, {
  replace: { baseUrl: 'https://api.example.com', appVersion: '1.0.0' },
});
// Result: { apiUrl: 'https://api.example.com/api', version: '1.0.0', ... }
```

#### Advanced String Replacement with Date Formatting

```typescript
import { _, type DeepCopyOpts } from '@epdoc/type';
import { replace } from '@epdoc/string';

const config = {
  timestamp: '${now:yyyy-MM-dd HH:mm:ss}',
  user: '${username}',
  buildDate: '${now:yyyy-MM-dd}',
};

const options: DeepCopyOpts = {
  replace: { now: new Date(), username: 'john.doe' },
  msubFn: (s, replacements) => replace(s, replacements),
};

const result = _.deepCopy(config, options);
// Result: { timestamp: '2025-12-10 16:30:00', user: 'john.doe', ... }
```

### JSON Serialization with Special Types

```typescript
import { jsonDeserialize, jsonSerialize } from '@epdoc/type';

const data = {
  users: new Set(['alice', 'bob']),
  metadata: new Map([['version', '1.0'], ['env', 'prod']]),
  pattern: /^[a-z]+$/i,
  binary: new Uint8Array([1, 2, 3, 4]),
  config: '${environment}/config.json',
};

// Serialize with string replacement
const json = jsonSerialize(data, {
  replace: { environment: 'production' },
});

// Deserialize back to original types
const restored = jsonDeserialize(json);
// restored.users is a Set, restored.metadata is a Map, etc.
```

## API Reference

### DeepCopyOpts

The `DeepCopyOpts` type is a discriminated union that ensures type safety:

```typescript
type DeepCopyOpts =
  | DeepCopyCommonOpts // No replacement
  | { replace: Record<string, string> } // Simple replacement
  | { replace: Record<string, unknown>; msubFn: MSubFn }; // Advanced replacement
```

- **Simple replacement**: Use `Record<string, string>` for basic string-to-string replacement
- **Advanced replacement**: Use `Record<string, unknown>` with `msubFn` for date formatting and complex transformations
- **Common options**: `detectRegExp`, `pre`, `post` available in all variants

### Key Functions

- `deepCopy(value, options?)` - Deep copy with optional string replacement
- `jsonSerialize(value, options?, space?)` - Serialize with special type preservation
- `jsonDeserialize(json, options?)` - Deserialize with type restoration
- `msub(string, replacements, pre?, post?)` - Simple string replacement
- Type guards: `isString`, `isNumber`, `isBoolean`, `isDate`, `isArray`, etc.

## Integration with @epdoc/string

For advanced string replacement features like date formatting, install `@epdoc/string`:

```bash
deno add jsr:@epdoc/string
```

Then use the advanced msub function:

```typescript
import { replace } from '@epdoc/string';
import { deepCopy } from '@epdoc/type';

deepCopy(config, {
  replace: { now: new Date(), version: '2.0.0' },
  msubFn: (s, replacements) => replace(s, replacements),
});
```

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

The functionality to support stripping comments from JSONC files is ported from\
[sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments/blob/main/readme.md) which is\
also licensed under the MIT license.
