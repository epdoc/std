import { _ } from '@epdoc/type';
import { encodeAscii85 } from '@std/encoding/ascii85';
import * as Deep from '../deep/mod.ts';
import type * as Json from './types.ts';

/**
 * Wraps Temporal instances with a `__filter` envelope before JSON.stringify
 * sees them. This is needed because Temporal objects define `toJSON()` which
 * would convert them to ISO strings, preventing the serializer from detecting
 * the original type.
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

/**
 * Wraps a recognized special type inside a `__filter` envelope so that
 * `Json.deserialize` with `decode: true` can restore it.
 *
 * Handled types: Uint8Array (ASCII85), Set, Map, RegExp.
 */
function encodeFilter(val: unknown): unknown {
  if (val instanceof Uint8Array) {
    return { __filter: 'ASCII85Decode', data: encodeAscii85(val) };
  }
  if (_.isSet(val)) return { __filter: 'Set', data: Array.from(val) };
  if (_.isMap(val)) return { __filter: 'Map', data: Array.from(val.entries()) };
  if (_.isRegExp(val)) {
    return { __filter: 'RegExp', regex: val.source, flags: val.flags };
  }
  return val;
}

/**
 * Creates a JSON.stringify replacer that handles string substitution,
 * optional RegExp serialisation, and optional type encoding.
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

/**
 * Serializes a JavaScript value to a JSON string, with optional type encoding
 * and string replacement.
 *
 * When `encode: true` is set, special types — Uint8Array (ASCII85), Set, Map,
 * and RegExp — are wrapped in a `__filter` envelope so they can be faithfully
 * restored by {@link deserialize} with `decode: true`.
 *
 * Temporal types (Instant, ZonedDateTime, PlainDateTime) are handled
 * automatically via a pre-processing step and do not require `encode: true`.
 *
 * @param value - The value to serialize.
 * @param [options] - Serialization options:
 *   - `encode` — wrap special types in `__filter` (default: false)
 *   - `autoRegExp` — serialize RegExp as `{ regex, flags }` (default: false)
 *   - `replace` — string substitution config (see {@link Deep.CopyOpts})
 * @param [space] - JSON.stringify formatting parameter.
 * @returns The serialized JSON string.
 *
 * @example
 * ```ts
 * Json.serialize({ data: new Set([1, 2]) }, { encode: true });
 * // → '{"data":{"__filter":"Set","data":[1,2]}}'
 * ```
 *
 * @example
 * ```ts
 * Json.serialize({ msg: 'Hello ${name}!' }, { replace: { name: 'World' } });
 * // → '{"msg":"Hello World!"}'
 * ```
 */
export function serialize(
  value: unknown,
  options: Deep.CopyOpts & Json.IEncode & Json.IAutoRegExp = {},
  space?: string | number,
): string {
  const processed = replaceTemporals(value);
  return JSON.stringify(processed, createSerializerReplacer(options), space);
}
