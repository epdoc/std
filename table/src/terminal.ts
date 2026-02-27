/**
 * Terminal utilities for formatting and parsing.
 */

/**
 * Strips ANSI escape codes from a string to calculate its visual length.
 */
export function stripAnsi(str: string): string {
  // deno-lint-ignore no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Truncates a string to a specific visual width, respecting ANSI escape codes.
 * Returns a string that fits within maxWidth visual characters.
 */
export function visibleTruncate(str: string, maxWidth: number): string {
  const visual = stripAnsi(str);
  if (visual.length <= maxWidth) {
    return str;
  }

  const ellipsis = '…';
  const targetWidth = maxWidth - 1; // Subtract 1 for the ellipsis character width
  let visualLen = 0;
  let result = '';
  let i = 0;

  while (i < str.length && visualLen < targetWidth) {
    if (str[i] === '\x1b') {
      const start = i;
      while (i < str.length && str[i] !== 'm') {
        i++;
      }
      i++; // Include 'm'
      result += str.substring(start, i);
    } else {
      result += str[i];
      visualLen++;
      i++;
    }
  }

  return result + ellipsis;
}

/**
 * Pads a string to a visual width, respecting ANSI escape codes.
 * Pads on the right (left-aligned) by default.
 *
 * @param str - The string to pad (may contain ANSI escape codes)
 * @param width - Target visual width
 * @param align - Alignment: 'left' pads on right, 'right' pads on left
 * @param char - Padding character (default: space)
 */
export function padVisual(
  str: string,
  width: number,
  align: 'left' | 'right' = 'left',
  char: string = ' ',
): string {
  const visualLen = stripAnsi(str).length;
  if (visualLen >= width) {
    return str;
  }
  const padding = char.repeat(width - visualLen);
  if (align === 'right') {
    return padding + str;
  }
  return str + padding;
}
