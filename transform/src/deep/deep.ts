import type * as Json from '../json/types.ts';
import type { Dict } from '../types.ts';
import * as _ from '../utils.ts';
import { processStringWithReplacements } from './deeputils.ts';
import type * as Deep from './types.ts';

/**
 * Performs a deep copy of the provided value, with advanced options for transformation and string replacement.
 *
 * This function supports:
 * - Deep cloning of objects, arrays, and primitives
 * - String replacement using simple built-in msub or advanced msub with date formatting
 * - Preserving RegExp, Date, Set, Map, and other special objects
 * - Optional RegExp detection and reconstruction
 *
 * @param {unknown} value - The value to deep copy.
 * @param {DeepCopyOpts} [options] - Options for the deep copy operation:
 *   - For simple string replacement: `{ replace: Record<string, string> }`
 *   - For advanced replacement with dates: `{ replace: Record<string, unknown>, msubFn: MSubFn }`
 *   - `detectRegExp`: If true, detects and reconstructs RegExp objects from plain objects
 *   - `pre`/`post`: Custom delimiters for replacement (default: '${' and '}')
 * @returns {unknown} The deeply copied value, possibly transformed.
 *
 * @example
 * // Simple string replacement
 * deepCopy(obj, { replace: { name: 'John', version: '1.0' } });
 *
 * @example
 * // Advanced replacement with date formatting
 * import { replace } from '@epdoc/string';
 * deepCopy(obj, {
 *   replace: { now: new Date(), name: 'John' },
 *   msubFn: (s, replacements) => replace(s, replacements)
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
