import { _, type Dict } from '@epdoc/type';
import { decodeAscii85 } from '@std/encoding/ascii85';
import * as Deep from '../deep/mod.ts';
import { stripComments } from './strip-comments.ts';
import type * as Json from './types.ts';

/**
 * Restores a value that was previously wrapped in a `__filter` envelope by
 * the serializer (via `encodeFilter` or `replaceTemporals`).
 *
 * Supports: Temporal.Instant/ZonedDateTime/PlainDateTime, RegExp, Set, Map,
 * and ASCII85-decoded Uint8Array.
 */
function decodeFilter(val: Json.EncodedValue): unknown {
  const filter = val.__filter;
  if (filter === 'RegExp' && _.isString((val as Dict).regex)) {
    try {
      return new RegExp((val as Dict).regex as string, ((val as Dict).flags as string) || '');
    } catch {
      return val;
    }
  }
  if (!('data' in val)) return val;

  if (filter === 'Instant' || filter === 'ZonedDateTime' || filter === 'PlainDateTime') {
    if (_.isString(val.data)) {
      try {
        if (filter === 'Instant') return Temporal.Instant.from(val.data);
        if (filter === 'ZonedDateTime') return Temporal.ZonedDateTime.from(val.data);
        return Temporal.PlainDateTime.from(val.data);
      } catch {
        return val;
      }
    }
    return val;
  }
  if (filter === 'Set' && _.isArray(val.data)) {
    return new Set(val.data);
  } else if (filter === 'Map' && _.isArray(val.data)) {
    return new Map(val.data as Iterable<readonly [unknown, unknown]>);
  }
  if ((filter === 'ASCII85Decode' || _.isArray(filter)) && _.hasValue(val.data)) {
    const filters = _.isArray(filter) ? filter : [filter];
    let result: unknown = val.data;

    for (const filter of filters) {
      if (filter === 'ASCII85Decode' && _.isString(result)) {
        result = decodeAscii85(result);
      }
    }
    return result;
  }
  return val;
}

/**
 * Checks whether a plain object carries a `__filter` property, indicating it
 * was produced by the serializer's encode step.
 */
export function isEncodedValue(val: unknown): val is Json.EncodedValue {
  return (_.isDict(val) && '__filter' in val);
}

type JsonReviver = (key: string, value: unknown) => unknown;

/**
 * Creates a JSON.parse reviver function that can restore `__filter`-wrapped
 * types, detect RegExp shapes, convert ISO strings to Temporal, and perform
 * string substitution.
 *
 * Options are read from `opts`:
 * - `decode` — restore `__filter` envelopes (must match `encode: true` on serialization)
 * - `autoTemporal` — convert ISO 8601 strings to Temporal types
 * - `autoRegExp` — detect `{ regex, flags }` shapes and rebuild RegExp
 * - `replace` / `pre` / `post` / `msubFn` — string substitution
 */
export function createDeserializerReviver(
  opts: Deep.CopyOpts & Json.IAutoTemporal & Json.IDecode & Json.IAutoRegExp,
): JsonReviver {
  return (_key: string, val: unknown): unknown => {
    if (opts.decode && isEncodedValue(val)) {
      return decodeFilter(val);
    }

    if (opts.autoRegExp && _.isRegExpDef(val)) {
      try {
        const re = _.asRegExp(val);
        return (re instanceof RegExp) ? re : val;
      } catch (_e) {
        return val;
      }
    }

    if (typeof val === 'string') {
      let s = val;
      if (opts.replace) {
        s = Deep.processStringWithReplacements(s, opts);
      }
      if (opts.autoTemporal) {
        const parsed = _.parseTemporalString(s, { strict: true });
        if (parsed) return parsed;
      }
      return s;
    }

    return val;
  };
}

/**
 * Deserializes a JSON string, restoring `__filter`-encoded special types
 * and performing optional string replacement and Temporal conversion.
 *
 * Supports:
 * - Temporal.Instant, ZonedDateTime, PlainDateTime (from `__filter`)
 * - Uint8Array (decoded from ASCII85)
 * - Set, Map, RegExp
 * - ISO string → Temporal conversion (`autoTemporal`)
 * - String substitution (`replace`)
 *
 * @param json - The JSON string to parse.
 * @param [opts] - Deserialisation options:
 *   - `decode` — restore encoded types (must match `encode: true` on serialization)
 *   - `autoTemporal` — auto-convert ISO strings to Temporal types
 *   - `autoRegExp` — detect `{ regex, flags }` shapes and rebuild RegExp
 *   - `stripComments` — strip JSONC-style comments before parsing
 *   - `replace` — string substitution config (see {@link Deep.CopyOpts})
 * @returns The deserialized value with original types restored.
 *
 * @example
 * ```ts
 * Json.deserialize('{"__filter":"Set","data":[1,2]}', { decode: true });
 * // → Set { 1, 2 }
 * ```
 *
 * @example
 * ```ts
 * Json.deserialize('{"time":"2024-01-15T12:30:45Z"}', { autoTemporal: true });
 * // → { time: Temporal.Instant.from('...') }
 * ```
 *
 * @example
 * ```ts
 * Json.deserialize('{"msg":"Hello ${name}!"}', { replace: { name: 'World' } });
 * // → { msg: "Hello World!" }
 * ```
 */
export function deserialize<T = unknown>(
  json: string,
  opts: Json.DeserializeOpts = {},
): T {
  if (opts.stripComments) {
    json = stripComments(json, opts.stripComments);
  }
  const reviver = opts.reviver ? opts.reviver : createDeserializerReviver(opts);
  return JSON.parse(json, reviver) as T;
}
