import { globToRegExp } from '@std/path/glob-to-regexp';

const REG = {
  isRegex: RegExp(/^\/(.*)\/([gimsuy]*)$/),
};

export function patternToRegex(pattern: string): RegExp {
  // Check if it looks like a regex (starts and ends with /)
  const match = pattern.match(REG.isRegex);
  if (match) {
    return new RegExp(match[1], match[2]);
  }

  // Otherwise treat as glob
  return globToRegExp(pattern);
}
