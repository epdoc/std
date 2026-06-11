import { isNonEmptyString, isRecordStringString } from '@epdoc/type';

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
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
