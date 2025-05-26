# TypeUtil Library

## Overview

The @epdoc/type package is a TypeScript utility library that provides various functions, type guards and also
consistency when determing type.

The main set of utilities is in [util.ts](util.ts).

A second set of utilities are exposed as methods on a DictUtil object from within [dictutil.ts](./dictutil.ts). These
can be useful when handling properties of a dictionary-like object. However these are subject to change and should not
be used except in experiments.

## Installation

To install the library, you can use npm or yarn:

`deno add @epdoc/type`

## Usage

To use the library, import the necessary functions and classes in your TypeScript or JavaScript file:

```typescript
import { isBoolean } from '@epdoc/type';

const val = true;
console.log('val is a boolean?', isBoolean(val) ? 'yes' : 'no');
```

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
