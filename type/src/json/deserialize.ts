import { decodeAscii85 } from '@std/encoding/ascii85';
import * as Deep from '../deep/mod.ts';
import type { Dict } from '../types.ts';
import * as _ from '../utils.ts';
import { stripComments } from './strip-comments.ts';
import type * as Json from './types.ts';

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
  // Future may allow multiple filters
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

export function isEncodedValue(val: unknown): val is Json.EncodedValue {
  return (_.isDict(val) && '__filter' in val);
}

type JsonReviver = (key: string, value: unknown) => unknown;

/**
 * Creates a JSON.parse reviver function.
 * @param opts.decode - Looks for __filter (mirrors json serializer)
 * @param opts.autoTemporal - Converts ISODate strings to Temporal, where it can
 * @param opts.autoRegExp - Converts { regex: string, flags?: string } to RegExp, where it can
 * @param opts.replace - does replacement of ${} in strings
 * @param opts.pre - used with opts.replace, defines opening delimiter ('${')
 * @param opts.post - used with opts.replace,defines closing delmiter ('}')
 * @param opts.msubFn - used with opts.replace
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
        const parsed = _.parseTemporalString(s);
        if (parsed) return parsed;
      }
      return s;
    }

    return val;
  };
}

// Main functions

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

export function deserialize<T = unknown>(
  json: string,
  opts: Json.DeserializeOpts = {},
): T {
  if (opts.stripComments) {
    json = stripComments(json, opts.stripComments);
  }

  return JSON.parse(json, createDeserializerReviver(opts)) as T;
}
