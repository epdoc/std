/**
 * Options controlling deep-copy behaviour and string replacement.
 *
 * This is a discriminated union ensuring type safety:
 * - No `replace` → no substitutions (default)
 * - `replace` with all string values → simple built-in msubLite
 * - `replace` with any non-string value → requires a custom `msubFn`
 *
 * @example
 * ```ts
 * // Simple
 * { replace: { name: 'Alice' } }
 * // Advanced
 * { replace: { now: new Date() }, msubFn: (s, r) => replace(s, r) }
 * ```
 */
export type CopyOpts =
  & CopyCommonOpts
  & (
    | { replace?: never; msubFn?: never }
    | { replace: Record<string, string>; msubFn?: never }
    | { replace: Record<string, unknown>; msubFn: MSubFn }
  );

/**
 * Options shared across all CopyOpts variants.
 */
export type CopyCommonOpts = {
  /** Opening delimiter for placeholders (default: '${'). */
  pre?: string;
  /** Closing delimiter for placeholders (default: '}'). */
  post?: string;
};

/**
 * Signature for custom string-replacement functions.
 * Used with advanced replacement where values are not plain strings.
 */
export type MSubFn = (s: string, replace: Record<string, unknown>, pre?: string, post?: string) => string;
