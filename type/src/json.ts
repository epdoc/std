import { decodeAscii85, encodeAscii85 } from '@std/encoding/ascii85';
import { REGEX } from './consts.ts';
import { deepCopySetDefaultOpts, processStringWithReplacements } from './deeputils.ts';
import stripJsonComments from './strip-comments.ts';
import type { DeepCopyOpts, Dict, JsonDeserializeOpts, StripJsonCommentsOpts } from './types.ts';
import { hasValue, isArray, isDict, isMap, isRegExp, isSet, isString } from './utils.ts';

/**
 * Creates a JSON.stringify replacer function.
 */
function createSerializerReplacer(opts: DeepCopyOpts) {
  return (_key: string, val: unknown): unknown => {
    if (isString(val)) {
      val = processStringWithReplacements(val, opts);
    }

    if (val instanceof Uint8Array) {
      return { __filter: ['ASCII85Decode'], data: encodeAscii85(val) };
    }
    if (isSet(val)) return { __filter: 'Set', data: Array.from(val) };
    if (isMap(val)) return { __filter: 'Map', data: Array.from(val.entries()) };
    if (isRegExp(val) && opts.detectRegExp !== false) {
      return { __filter: 'RegExp', regex: val.source, flags: val.flags };
    }

    return val;
  };
}

/**
 * Creates a JSON.parse reviver function.
 */
function createDeserializerReviver(opts: DeepCopyOpts) {
  return (_key: string, val: unknown): unknown => {
    if (isDict(val) && '__filter' in val) {
      if (val.__filter === 'RegExp' && isString((val as Dict).regex)) {
        try {
          return new RegExp((val as Dict).regex as string, ((val as Dict).flags as string) || '');
        } catch {
          return null;
        }
      }

      if (hasValue(val.data)) {
        const filters = Array.isArray(val.__filter) ? val.__filter : [val.__filter];
        let result = val.data;

        for (const filter of filters) {
          if (filter === 'ASCII85Decode' && isString(result)) {
            result = decodeAscii85(result);
          } else if (filter === 'Set' && isArray(result)) {
            result = new Set(result);
          } else if (filter === 'Map' && isArray(result)) {
            result = new Map(result as Iterable<readonly [unknown, unknown]>);
          }
        }
        return result;
      }
    }

    if (typeof val === 'string') {
      let s = val;
      if (opts.replace) {
        s = processStringWithReplacements(s, opts);
      }
      if (REGEX.isISODate.test(s)) {
        return new Date(s);
      }
      return s;
    }

    return val;
  };
}

// Main functions

/**
 * Serializes a JavaScript value to a JSON string, preserving special types and handling string replacements.
 *
 * Supports serialization of:
 * - Uint8Array (encoded as ASCII85)
 * - Set (converted to array)
 * - Map (converted to entries array)
 * - RegExp (preserved with source and flags)
 * - String replacement using simple or advanced msub
 *
 * @param {unknown} value - The value to serialize.
 * @param {DeepCopyOpts | null} [options] - Serialization options for string replacement.
 * @param {string | number} [space] - JSON.stringify space parameter for formatting.
 * @returns {string} The serialized JSON string.
 *
 * @example
 * // Simple serialization
 * jsonSerialize({ name: '${user}', data: new Set([1, 2]) }, { replace: { user: 'John' } });
 *
 * @example
 * // Advanced serialization with date formatting
 * import { replace } from '@epdoc/string';
 * jsonSerialize(
 *   { timestamp: '${now:yyyy-MM-dd}' },
 *   { replace: { now: new Date() }, msubFn: (s, r) => replace(s, r) }
 * );
 */
// json-serialize.ts

export function jsonSerialize(
  value: unknown,
  options: DeepCopyOpts | null = null,
  space?: string | number,
): string {
  const opts = deepCopySetDefaultOpts(options ?? undefined);
  return JSON.stringify(value, createSerializerReplacer(opts), space);
}

/**
 * Deserializes a JSON string produced by jsonSerialize, restoring special types and handling string replacements.
 *
 * Supports deserialization of:
 * - Uint8Array (decoded from ASCII85)
 * - Set (restored from array)
 * - Map (restored from entries array)
 * - RegExp (restored with source and flags)
 * - ISO date strings (converted to Date objects)
 * - String replacement using simple or advanced msub
 *
 * @param {string} json - The JSON string to deserialize.
 * @param {JsonDeserializeOpts} [opts] - Deserialization options including string replacement and comment stripping.
 * @returns {T} The restored value with original types.
 *
 * @example
 * // Simple deserialization
 * jsonDeserialize('{"name": "${user}"}', { replace: { user: 'John' } });
 *
 * @example
 * // Advanced deserialization with date formatting
 * import { replace } from '@epdoc/string';
 * jsonDeserialize(
 *   '{"timestamp": "${now:yyyy-MM-dd}"}',
 *   { replace: { now: new Date() }, msubFn: (s, r) => replace(s, r) }
 * );
 */

// json-deserialize.ts

export function jsonDeserialize<T = unknown>(
  json: string,
  opts: JsonDeserializeOpts = {},
): T {
  const validatedOpts = deepCopySetDefaultOpts(opts);

  if (validatedOpts.stripComments) {
    const stripOptions: StripJsonCommentsOpts = typeof validatedOpts.stripComments === 'boolean'
      ? { whitespace: true }
      : validatedOpts.stripComments;
    json = stripJsonComments(json, stripOptions);
  }

  return JSON.parse(json, createDeserializerReviver(validatedOpts)) as T;
}
