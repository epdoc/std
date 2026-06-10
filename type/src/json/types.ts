import type * as Deep from '../deep/types.ts';

export type DeserializerReviverOptions = Deep.CopyOpts & IAutoTemporal & IDecode & IAutoRegExp;

/**
 * When true, ISO 8601 date-time strings encountered during deserialization
 * will be converted to the appropriate Temporal type (ZonedDateTime,
 * PlainDateTime, or Instant) via {@link asTemporal}, rather than left as
 * plain strings.
 * @default false
 */
export interface IAutoTemporal {
  autoTemporal?: boolean;
}
export interface IAutoRegExp {
  autoRegExp?: boolean;
}

export type StripCommentsOpts = {
  /**
   * If true, whitespace characters in comments will be replaced with a single space.
   * If false, comments will be removed without replacing them with spaces.
   * Defaults to true.
   */
  whitespace?: boolean;

  /**
   * If true, trailing commas in arrays and objects will be removed.
   * Defaults to false.
   */
  trailingCommas?: boolean;
};

export interface IStripComments {
  stripComments?: boolean | StripCommentsOpts;
}

export type DeserializeOpts = Deep.CopyOpts & IStripComments & IAutoTemporal & IDecode & IAutoRegExp;

/**
 * When true, look for __filter key in JSON and decode according to the __filter value
 */
export interface IDecode {
  decode?: boolean;
}
/**
 * When true, create __filter in JSON for Set, Map, Temporal datetimes, RegExp, UInt8Array
 */
export interface IEncode {
  encode?: boolean;
}

export interface IDetectRegExp {
  detectRegExp?: boolean;
}
export interface IIncludeUrl {
  includeUrl?: boolean;
}

export type EncodedValue =
  | { __filter: 'Instant'; data: string }
  | { __filter: 'ZonedDateTime'; data: string }
  | { __filter: 'PlainDateTime'; data: string }
  | { __filter: 'RegExp'; regex: string; flags?: string }
  | { __filter: 'Set'; data: unknown[] }
  | { __filter: 'Map'; data: [unknown, unknown][] }
  | { __filter: 'ASCII85Decode' | 'ASCII85Decode'[]; data: string };
