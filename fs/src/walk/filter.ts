/**
 * Determines whether a given path should be included based on provided filters.
 *
 * @param path The path to evaluate.
 * @param exts Optional array of file extensions to match. If provided, the path must end with one of these extensions.
 * @param match Optional array of regular expressions. If provided, the path must match at least one of these patterns.
 * @param exclude Optional array of regular expressions. If provided, the path must not match any of these patterns.
 * @param skip Optional array of regular expressions (deprecated). If provided, the path must not match any of these patterns.
 * @returns True if the path should be included, false otherwise.
 */
export function include(
  path: string,
  exts?: string[],
  match?: RegExp[],
  exclude?: RegExp[],
  skip?: RegExp[],
): boolean {
  // exts filter - must end with one of the extensions
  if (exts && !exts.some((ext): boolean => path.endsWith(ext))) {
    return false;
  }

  // match filter - must match at least one pattern
  if (match && !match.some((pattern): boolean => pattern.test(path))) {
    return false;
  }

  // exclude filter - must not match any pattern
  const excludePatterns = exclude ?? skip;
  if (excludePatterns && excludePatterns.some((pattern): boolean => pattern.test(path))) {
    return false;
  }

  return true;
}

/**
 * Checks if a path matches any of the exclude patterns.
 * Used to determine if a directory should be pruned.
 *
 * @param path The path to evaluate.
 * @param exclude Optional array of regular expressions to check against.
 * @returns True if the path should be excluded (matches a pattern), false otherwise.
 */
export function shouldExclude(
  path: string,
  exclude?: RegExp[],
): boolean {
  if (!exclude || exclude.length === 0) {
    return false;
  }
  return exclude.some((pattern): boolean => pattern.test(path));
}
