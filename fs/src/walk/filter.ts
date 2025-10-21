/**
 * Determines whether a given path should be included based on provided filters.
 *
 * @param path The path to evaluate.
 * @param exts Optional array of file extensions to match. If provided, the path must end with one of these extensions.
 * @param match Optional array of regular expressions. If provided, the path must match at least one of these patterns.
 * @param skip Optional array of regular expressions. If provided, the path must not match any of these patterns.
 * @returns True if the path should be included, false otherwise.
 */
export function include(
  path: string,
  exts?: string[],
  match?: RegExp[],
  skip?: RegExp[],
): boolean {
  if (exts && !exts.some((ext): boolean => path.endsWith(ext))) {
    return false;
  }
  if (match && !match.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  if (skip && skip.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}
