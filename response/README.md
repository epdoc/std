# @epdoc/response

A collection of TypeScript utilities for handling throws and response data for asynchronous operations.

## Installation

```bash
deno add @epdoc/response
```

## Features

### Error Handling Utilities

This package provides two similar approaches to handle errors and response data from asynchronous operations. Both have
variants that return timing information:

#### Array-based: [catch-array.ts](./catch-array.ts)

Uses tuples to handle success/error states:

```typescript
import catchAsArray as safe from './mod.ts';

const [error, result] = await safe.wrap(fetchData());
if (error) {
  console.error('Failed:', error);
  return;
}
console.log('Success:', result);
```

#### Object-based: [catch-obj.ts](./catch-obj.ts)

Uses object properties to handle success/error states:

```typescript
import catchAsObj as safe from './mod.ts';

const result = await safe.wrap(fetchData());
if (result.error) {
  console.error('Failed:', result.error);
  return;
}
console.log('Success:', result.data);
```

Both approaches:

- Never throw exceptions
- Provide type-safe access to results
- Support TypeScript generics
- Handle promises consistently
- Always convert errors into Error objects

### Experimental Features

> **Warning**: The following features are experimental and not recommended for production use.

#### ApiResponse Class

The `ApiResponse` class is currently experimental and under development. It provides additional features like:

- Timing information for operations
- Chaining support
- Data validation

Please avoid using `ApiResponse` in production code until it reaches stable status.

## License

MIT
