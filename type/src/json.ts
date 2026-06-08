import { decodeAscii85, encodeAscii85 } from '@std/encoding/ascii85';
import { deepCopySetDefaultOpts, processStringWithReplacements } from './deeputils.ts';
import stripJsonComments from './strip-comments.ts';
import type { DeepCopyOpts, Dict, IAutoTemporal, JsonDeserializeOpts, StripJsonCommentsOpts } from './types.ts';
import { asTemporal, hasValue, isArray, isDict, isMap, isRegExp, isSet, isString, isTemporal } from './utils.ts';

/**
 * Pre-processes a value tree to wrap Temporal instances in `__filter` wrappers
 * before JSON.stringify. This is necessary because Temporal objects have a
 * `toJSON()` method that converts them to strings, which would prevent the
 * serializer replacer from seeing them as Temporal instances.
 */
function replaceTemporals(val: unknown): unknown {
  if (isTemporal(val)) {
    const name = val.constructor.name;
    return { __filter: name, data: val.toString() };
  }
  if (Array.isArray(val)) {
    return val.map(replaceTemporals);
  }
  if (isDict(val)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      result[key] = replaceTemporals(val[key]);
    }
    return result;
  }
  return val;
}

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
 * @param opts.autoTemporal
 * @param opts.replace
 * @param opts.pre
 * @param opts.post
 * @param opts.msubFn
 */
function createDeserializerReviver(opts: DeepCopyOpts & IAutoTemporal) {
  return (_key: string, val: unknown): unknown => {
    if (isDict(val) && '__filter' in val) {
      const filter = val.__filter;
      if (filter === 'Instant' || filter === 'ZonedDateTime' || filter === 'PlainDateTime') {
        if (isString(val.data)) {
          try {
            if (filter === 'Instant') return Temporal.Instant.from(val.data);
            if (filter === 'ZonedDateTime') return Temporal.ZonedDateTime.from(val.data);
            return Temporal.PlainDateTime.from(val.data);
          } catch {
            return undefined;
          }
        }
        return undefined;
      }
      if (filter === 'RegExp' && isString((val as Dict).regex)) {
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
      if ((opts as JsonDeserializeOpts).autoTemporal) {
        const parsed = asTemporal(s);
        if (parsed) return parsed;
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
  const processed = replaceTemporals(value);
  return JSON.stringify(processed, createSerializerReplacer(opts), space);
}

/**
 * Deserializes a JSON string produced by jsonSerialize, restoring special types and handling string replacements.
 *
 * Supports deserialization of:
 * - Temporal.Instant, Temporal.ZonedDateTime, Temporal.PlainDateTime
 * - Uint8Array (decoded from ASCII85)
 * - Set (restored from array)
 * - Map (restored from entries array)
 * - RegExp (restored with source and flags)
 * - ISO date strings (converted to Temporal types when autoTemporal is true)
 * - String replacement using simple or advanced msub
 *
 * @param {string} json - The JSON string to deserialize.
 * @param {JsonDeserializeOpts} [opts] - Deserialization options including string replacement, autoTemporal, and comment stripping.
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
 *
 * @example
 * // Auto-convert ISO strings to Temporal types
 * const result = jsonDeserialize('{"time": "2024-01-15T12:30:45Z"}', { autoTemporal: true });
 * // result.time is a Temporal.ZonedDateTime
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
