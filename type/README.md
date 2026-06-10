# @epdoc/type

## Overview

The @epdoc/type package is a TypeScript utility library that provides various utility types, functions and type guards.

Key features:

- **Type guards and utilities** for consistent type checking
- **Dictionary utilities** for object manipulation

The main set of utilities is in [util.ts](src/util.ts), with additional dictionary utilities in
[dictutil.ts](src/dictutil.ts).

## Installation

```bash
deno add jsr:@epdoc/type
```

## Usage

### Basic Type Guards

```typescript
import { isBoolean, isNumber, isString } from '@epdoc/type';

const val = true;
console.log('val is a boolean?', isBoolean(val) ? 'yes' : 'no');
```

### Using the Utility Object

```typescript
import { _, type Integer } from '@epdoc/type';

const idx: Integer = 0;
const data = { name: '${user}', age: 25 };

// Deep copy with replacement
const result = _.deepCopy(data, {
  replace: { user: 'Alice' },
});

// Type checking
console.log('Is boolean?', _.isBoolean(true));
console.log('Is string?', _.isString('hello'));
```

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

The functionality to support stripping comments from JSONC files is ported from
[sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments/blob/main/readme.md) which is
also licensed under the MIT license.
