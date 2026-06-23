# @epdoc/condition

Generic condition evaluation utilities for TypeScript/Deno.

Provides the building blocks for declarative matching: logical combinators (`and`, `or`, `not`), value operators (`eq`,
`contains`, `gt`, `regex`, `includes`, etc.), and a pure evaluation engine. This package is intentionally
domain-agnostic; consumers supply their own field extraction and condition factories.

## Usage

```ts
import { AndCondition, evaluateValueCondition, factory } from '@epdoc/condition';

// Direct value evaluation
const matches = evaluateValueCondition('hello world', { contains: 'world' });

// Logical combinators
const c = factory({ and: [{ not: false }, true] });
console.log(c.test({})); // true
```

## Exports

- `evaluateValueCondition(value, condition)` — evaluate a value against a `ValueCondition`.
- `evaluateFieldCondition(data, condition)` — evaluate a `Record<string,
  ValueCondition>` against an object.
- `factory(def, opts)` — build `ITestable<D>` instances for logical conditions.
- `AndCondition<D>`, `OrCondition<D>`, `NotCondition<D>`, `BooleanCondition<D>` — composable condition classes.
- Type definitions: `ValueCondition`, `StringOperators`, `NumberOperators`, `DateOperators`, `ArrayOperators`,
  `AnyCondition`, `ITestable<D>`, etc.
