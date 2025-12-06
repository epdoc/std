/**
 * A simple alias for code hinting
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
 * A "branded type" is a technique in TypeScript to create a new type that is a
 * subtype of an existing type (like `string`), but is not assignable to the
 * original type or other branded types. This is useful when you want to
 * distinguish between different kinds of strings that have a specific format or
 * meaning.
 */
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

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

export type ExactlyOne<T, K extends keyof T = keyof T> = {
  [P in K]: { [Q in P]: T[P] } & { [Q in Exclude<K, P>]?: never };
}[K];

/**
 * Extracts only the known (explicitly defined) property keys from a type,
 * excluding keys from index signatures (like `[key: string]` or `[key: number]`).
 *
 * This is useful for types that have both explicitly defined properties
 * and an index signature, allowing you to work with only the known properties
 * in a type-safe manner.
 *
 * @template T - The type from which to extract known keys
 * @returns A union type of the known property keys (as string literals)
 *
 * @example
 * ```typescript
 * type Example = {
 *   name: string;
 *   age: number;
 *   [key: string]: unknown; // Index signature
 * };
 *
 * type KnownExampleKeys = KnownKeys<Example>;
 * // Result: "name" | "age"
 *
 * // Without KnownKeys:
 * type AllKeys = keyof Example;
 * // Result: "name" | "age" | string | number
 * // (includes index signature keys, which is usually not desired)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world usage with configuration objects
 * type Config = {
 *   apiUrl: string;
 *   timeout: number;
 *   retries: number;
 *   [key: string]: string | number; // Allow additional string/number config
 * };
 *
 * type RequiredConfigKeys = KnownKeys<Config>;
 * // Result: "apiUrl" | "timeout" | "retries"
 *
 * // Type-safe iteration over required config
 * const requiredKeys: RequiredConfigKeys[] = ['apiUrl', 'timeout', 'retries'];
 * ```
 *
 * @example
 * ```typescript
 * // Creating a type-safe getter function
 * function getKnownProperty<T>(
 *   obj: T,
 *   key: KnownKeys<T>
 * ): T[typeof key] {
 *   return obj[key];
 * }
 *
 * const config: Config = { apiUrl: '...', timeout: 5000, retries: 3 };
 * const url = getKnownProperty(config, 'apiUrl'); // Type: string
 * // getKnownProperty(config, 'someUnknownKey'); // Type error!
 * ```
 *
 * @note This type uses conditional type inference to filter out index signatures.
 * The logic works by mapping over keys and replacing index signature keys with `never`,
 * then extracting the non-`never` values.
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/keyof-types.html keyof Types}
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html Indexed Access Types}
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html Conditional Types}
 */
export type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U } ? U extends never ? never
  : U
  : never;

export type LowerCaseChar =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';
export type UpperCaseChar =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';
export type LetterChar = LowerCaseChar | UpperCaseChar;
export type DigitChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type HexChar = DigitChar | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

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
