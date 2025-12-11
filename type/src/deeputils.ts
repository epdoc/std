import { REGEX } from './consts.ts';
import type { DeepCopyCommonOpts, DeepCopyOpts, MSubFn } from './types.ts';
import { isNonEmptyString, isRecordStringString } from './utils.ts';

/**
 * Type guard for the "simple replacements" case of DeepCopyOpts.
 * Uses isRecordStringString for runtime validation.
 */
export function hasSimpleReplacements(
  opts: DeepCopyOpts,
): opts is DeepCopyCommonOpts & { replace: Record<string, string>; msubFn?: never } {
  return opts.replace !== undefined &&
    isRecordStringString(opts.replace) &&
    opts.msubFn === undefined;
}

/**
 * Type guard for the "complex replacements" case of DeepCopyOpts.
 */
export function hasComplexReplacements(
  opts: DeepCopyOpts,
): opts is DeepCopyCommonOpts & { replace: Record<string, unknown>; msubFn: MSubFn } {
  return opts.replace !== undefined &&
    opts.msubFn !== undefined;
}

/**
 * Core string processing that both serialize and deserialize use.
 * This is where isRecordStringString is actually used.
 */
export function processStringWithReplacements(str: string, opts: DeepCopyOpts): string {
  if (!opts.replace) {
    return str;
  }

  if (opts.msubFn) {
    // Complex case: use custom handler
    return opts.msubFn(str, opts.replace, opts.pre, opts.post);
  }

  // Simple case: must be Record<string, string>
  // This is where isRecordStringString provides runtime type safety
  if (isRecordStringString(opts.replace)) {
    return msubLite(str, opts.replace, opts.pre!, opts.post!);
  }

  // Defensive: TypeScript says this shouldn't happen, but runtime might differ
  throw new Error(
    'Invalid replacement configuration. When msubFn is not provided, ' +
      'replace must be Record<string, string>. ' +
      `Got keys with types: ${
        Object.entries(opts.replace)
          .map(([k, v]) => `${k}: ${typeof v}`)
          .join(', ')
      }`,
  );
}

/**
 * Performs string substitution similar to JavaScript template strings.
 * Replaces all occurrences of `${key}` (or custom delimiters) in `s` with values from `replace`.
 * Does not use eval, so is safe for user input.
 *
 * This is the simple built-in msub that only handles string values.
 * For advanced features like date formatting, use the msub from @epdoc/string.
 *
 * @param s - The input string.
 * @param replace - The dictionary of string replacements.
 * @param pre - The prefix for a placeholder (default: '${').
 * @param post - The suffix for a placeholder (default: '}').
 * @returns The substituted string.
 */
export function msubLite(
  s: string,
  replace: Record<string, string> = {},
  pre = '${',
  post = '}',
): string {
  if (!isRecordStringString(replace) || !isNonEmptyString(pre) || !isNonEmptyString(post)) {
    return s;
  }
  // Build a global regex for ${key}
  const escapedPre = escapeString(pre);
  const escapedPost = escapeString(post);
  const pattern = new RegExp(`${escapedPre}(.*?)${escapedPost}`, 'g');
  return s.replace(
    pattern,
    (_match, key) => Object.prototype.hasOwnProperty.call(replace, key) ? replace[key] : _match,
  );
}

function escapeString(s: string): string {
  return s.replace(REGEX.escMatch, '\\$&');
}

/**
 * Sets default options for deep copying operations.
 * Ensures required properties have sensible defaults.
 *
 * @param opts - The options to set defaults for.
 * @returns The options with defaults applied.
 */
export function deepCopySetDefaultOpts<T extends DeepCopyOpts = DeepCopyOpts>(opts?: T): T {
  if (!opts) {
    opts = {} as T;
  }
  if (!opts.pre) {
    opts.pre = '${';
  }
  if (!opts.post) {
    opts.post = '}';
  }
  return opts;
}
