import { encodeAscii85 } from '@std/encoding/ascii85';
import * as Deep from '../deep/mod.ts';
import * as _ from '../utils.ts';
import type * as Json from './types.ts';

/**
 * Pre-processes a value tree to wrap Temporal instances in `__filter` wrappers
 * before JSON.stringify. This is necessary because Temporal objects have a
 * `toJSON()` method that converts them to strings, which would prevent the
 * serializer replacer from seeing them as Temporal instances.
 */
function replaceTemporals(val: unknown): unknown {
  if (_.isTemporal(val)) {
    const name = val.constructor.name;
    return { __filter: name, data: val.toString() };
  }
  if (Array.isArray(val)) {
    return val.map(replaceTemporals);
  }
  if (_.isDict(val)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      result[key] = replaceTemporals(val[key]);
    }
    return result;
  }
  return val;
}

function encodeFilter(val: unknown): unknown {
  if (val instanceof Uint8Array) {
    return { __filter: 'ASCII85Decode', data: encodeAscii85(val) };
  }
  if (_.isSet(val)) return { __filter: 'Set', data: Array.from(val) };
  if (_.isMap(val)) return { __filter: 'Map', data: Array.from(val.entries()) };
  if (_.isRegExp(val)) {
    return { __filter: 'RegExp', regex: val.source, flags: val.flags };
  }
  if (val instanceof Temporal.PlainDateTime) {
    return { __filter: 'Temporal.PlainDateTime', data: val.toJSON() };
  }
  if (val instanceof Temporal.Instant) {
    return { __filter: 'Temporal.Instant', data: val.toJSON() };
  }
  if (val instanceof Temporal.ZonedDateTime) {
    return { __filter: 'Temporal.ZonedDateTime', data: val.toJSON() };
  }
}

/**
 * Creates a JSON.stringify replacer function. Note that Temporal already has a toJSON method.
 */
function createSerializerReplacer(opts: Deep.CopyOpts & Json.IAutoRegExp & Json.IEncode) {
  return (_key: string, val: unknown): unknown => {
    if (_.isString(val) && opts.replace) {
      val = Deep.processStringWithReplacements(val, opts);
    }
    if (_.isRegExp(val) && opts.autoRegExp) {
      return { regex: val.source, flags: val.flags };
    }

    if (opts.encode) {
      val = encodeFilter(val);
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

export function serialize(
  value: unknown,
  options: Deep.CopyOpts = {},
  space?: string | number,
): string {
  const processed = replaceTemporals(value);
  return JSON.stringify(processed, createSerializerReplacer(options), space);
}
