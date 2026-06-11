import { _, type Dict } from '@epdoc/type';
import type * as Json from '../json/types.ts';
import { processStringWithReplacements } from './deeputils.ts';
import type * as Deep from './types.ts';

/**
 * Performs a deep copy of the provided value, with optional string replacement
 * and RegExp reconstruction.
 *
 * Supports cloning of objects, arrays, primitives, Date, RegExp, Set, Map, and
 * Temporal types. When a string contains replacement placeholders (e.g. `${key}`),
 * they are substituted using either the built-in msubLite (for string values)
 * or a custom msubFn (for advanced formatting like dates).
 *
 * @param value - The value to deep copy.
 * @param [options] - Deep copy and transformation options:
 *   - `{ replace: Record<string, string> }` — simple string-for-string substitution
 *   - `{ replace: Record<string, unknown>, msubFn: MSubFn }` — advanced replacement with custom handler
 *   - `autoRegExp` — if true, detects `{ regex, flags }` shapes and reconstructs RegExp
 *   - `pre` / `post` — custom delimiters for placeholders (default: `'${'` and `'}'`)
 * @returns The deeply copied value, possibly with replaced strings.
 *
 * @example
 * // Simple string replacement
 * deepCopy(obj, { replace: { name: 'John', version: '1.0' } });
 *
 * @example
 * // Advanced replacement with date formatting
 * deepCopy(obj, {
 *   replace: { now: new Date(), name: 'John' },
 *   msubFn: (s, replacements) => customHandler(s, replacements)
 * });
 */
export function deepCopy(a: unknown, opts: Deep.CopyOpts & Json.IAutoRegExp = {}): unknown {
  // Primitives
  if (
    a === undefined ||
    a === null ||
    typeof a === 'number' ||
    typeof a === 'boolean' ||
    typeof a === 'symbol' ||
    typeof a === 'bigint' ||
    a instanceof Date ||
    a instanceof RegExp ||
    a instanceof Temporal.Instant ||
    a instanceof Temporal.ZonedDateTime ||
    a instanceof Temporal.PlainDateTime
  ) {
    return a;
  }

  if (typeof a === 'string') {
    return processStringWithReplacements(a, opts);
  }

  if (a instanceof Set) {
    return new Set(Array.from(a).map((item) => deepCopy(item, opts)));
  }

  if (a instanceof Map) {
    return new Map(
      Array.from(a.entries()).map(([k, v]) => [deepCopy(k, opts), deepCopy(v, opts)]),
    );
  }

  if (Array.isArray(a)) {
    return a.map((item) => deepCopy(item, opts));
  }

  // Object - Type Guard works perfectly here!
  if (_.isDict(a)) {
    if (opts.autoRegExp && _.isRegExpDef(a)) {
      try {
        const re = _.asRegExp(a);
        if (re instanceof RegExp) return re;
      } catch (_e) { // keep going
      }
    }

    // Explicitly cast to Dict here to wipe out the RegExpDef union trace
    const dictA = a as Dict;
    const result: Dict = {};
    for (const key in dictA) {
      if (Object.prototype.hasOwnProperty.call(dictA, key)) {
        // TypeScript now knows `a` is a Dict, so `a[key]` is completely safe!
        result[key] = deepCopy(dictA[key], opts);
      }
    }
    return result;
  }

  // Functions and other types
  return a;
}
