import { deepCopySetDefaultOpts, processStringWithReplacements } from './deeputils.ts';
import type { DeepCopyOpts, Dict } from './types.ts';
import { asRegExp, isDict } from './utils.ts';

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
export function deepCopy(a: unknown, options?: DeepCopyOpts): unknown {
  const opts = deepCopySetDefaultOpts(options);

  switch (true) {
    // Primitive values
    case a === undefined:
    case a === null:
    case typeof a === 'number':
    case typeof a === 'boolean':
    case typeof a === 'symbol':
    case typeof a === 'bigint':
    case a instanceof Date:
    case a instanceof RegExp:
      return a;

    // String with optional replacements
    case typeof a === 'string':
      return processStringWithReplacements(a, opts);

    // Collections
    case a instanceof Set:
      return new Set(Array.from(a).map((item) => deepCopy(item, opts)));

    case a instanceof Map:
      return new Map(
        Array.from(a.entries()).map(([k, v]) => [deepCopy(k, opts), deepCopy(v, opts)]),
      );

    // Array
    case Array.isArray(a):
      return a.map((item) => deepCopy(item, opts));

    // Object
    case isDict(a): {
      // Check for serialized RegExp
      if (opts.detectRegExp) {
        const re = asRegExp(a);
        if (re) return re;
      }

      // Deep copy object
      const result: Dict = {};
      for (const key in a) {
        if (Object.prototype.hasOwnProperty.call(a, key)) {
          result[key] = deepCopy(a[key], opts);
        }
      }
      return result;
    }

    // Functions and other types
    default:
      return a;
  }
}
