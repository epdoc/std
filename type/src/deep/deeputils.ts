import { REGEX } from '../consts.ts';
import { isNonEmptyString, isRecordStringString } from '../utils.ts';
import type * as Deep from './types.ts';

/**
 * Type guard for the "simple replacements" case of DeepCopyOpts.
 * Uses isRecordStringString for runtime validation.
 */
export function hasSimpleReplacements(
  opts: Deep.CopyOpts,
): opts is Deep.CopyCommonOpts & { replace: Record<string, string>; msubFn?: never } {
  return opts.replace !== undefined &&
    isRecordStringString(opts.replace) &&
    opts.msubFn === undefined;
}

/**
 * Type guard for the "complex replacements" case of DeepCopyOpts.
 */
export function hasComplexReplacements(
  opts: Deep.CopyOpts,
): opts is Deep.CopyCommonOpts & { replace: Record<string, unknown>; msubFn: Deep.MSubFn } {
  return opts.replace !== undefined &&
    opts.msubFn !== undefined;
}

/**
 * Core string processing that both serialize and deserialize use.
 * This is where isRecordStringString is actually used.
 */
export function processStringWithReplacements(str: string, options: Deep.CopyOpts): string {
  if (!options.replace) {
    return str;
  }
  const opts: Deep.CopyOpts = { pre: '${', post: '}', ...options };

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
