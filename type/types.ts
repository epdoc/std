/**
 * Represents an integer type.
 */
export type Integer = number;

/**
 * A dictionary type where keys are strings and values are unknown. If you want
 * keys to be PropertyKey, then look elsewhere or submit a pull request to add
 * it as a separate type.
 */
export type Dict = Record<string, unknown>;

/**
 * Result of a comparison between two Dict objects.
 */
export type CompareResult = -1 | 0 | 1;

/**
 * Constructs a type where exactly one property from a set of keys `K`
 * in type `T` is required to be present. All other properties from `T`
 * are forbidden.
 *
 * This is useful for creating discriminated unions where the discriminant
 * is the presence of a specific key, rather than the value of a shared key.
 *
 * @template T - The base object type from which to derive the properties.
 * @template K - The subset of keys from T to enforce the "exactly one" rule upon. Defaults to all keys
   of T.
 *
 * @example
 * // Define a base type for different kinds of messages
 * type MessagePayload = {
 *   text: string;
 *   imageUrl: string;
 *   videoUrl: string;
 * };
 *
 * // Create a new type that requires exactly one of the payload fields
 * type Message = ExactlyOne<MessagePayload>;
 *
 * // --- VALID ASSIGNMENTS ---
 * const textMessage: Message = { text: 'Hello, world!' };
 * const imageMessage: Message = { imageUrl: 'https://example.com/image.png' };
 *
 * // --- INVALID ASSIGNMENTS (will cause a TypeScript error) ---
 *
 * // Error: No properties are set
 * // const invalidMessage1: Message = {};
 *
 * // Error: More than one property is set
 * // const invalidMessage2: Message = { text: 'Hi', imageUrl: 'url' };
 *
 * // Error: 'otherProp' is not a valid key
 * // const invalidMessage3: Message = { otherProp: 'value' };
 */
export type ExactlyOne<T, K extends keyof T = keyof T> = K extends keyof T // For each key K, create an object with that key required
  // and all other keys from T mapped to `never` (making them forbidden).
  ? Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>
  : never;

/**
 * Represents a regular expression definition with pattern and optional flags.
 */
export type RegExpDef =
  | { pattern: string; flags?: string; regex?: never }
  | { regex: string; flags?: string; pattern?: never };

/**
 * Options for converting a value to a float.
 */
export type AsFloatOpts = {
  def?: number;
  commaAsDecimal?: boolean;
};

/**
 * Function type for deep copying an object.
 */
export type DeepCopyFn = (a: unknown, opts: DeepCopyOpts) => unknown;

/**
 * Options for deep copying an object.
 */
export type DeepCopyOpts = {
  replace?: Record<string, string>;
  detectRegExp?: boolean;
  pre?: string;
  post?: string;
};

export type JsonDeserializeOpts = DeepCopyOpts & {
  stripComments?: StripJsonCommentsOpts;
};

export type StripJsonCommentsOpts = {
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
