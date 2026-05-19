/**
 * @module text
 *
 * Standalone string manipulation utilities.
 */

import type { Integer } from '@epdoc/type';

/**
 * Wraps a string into an array of lines, each no longer than `maxWidth`.
 *
 * @param text - The string to wrap.
 * @param maxWidth - Maximum line length (default 80).
 * @returns An array of wrapped lines.
 */
export function wrap(text: string, maxWidth: Integer = 80 as Integer): string[] {
  if (text.length === 0) return [];

  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;

      const expectedLength = currentLine ? currentLine.length + 1 + word.length : word.length;

      if (expectedLength <= maxWidth) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        if (word.length > maxWidth) {
          let remainingWord = word;
          while (remainingWord.length > maxWidth) {
            lines.push(remainingWord.substring(0, maxWidth));
            remainingWord = remainingWord.substring(maxWidth);
          }
          currentLine = remainingWord;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Returns the plural form of a word based on the given count. If the plural
 * form is not provided, it defaults to the singular form with an 's' appended.
 *
 * @param word - The singular form of the word.
 * @param count - The count of items.
 * @param pluralForm - The plural form of the word (optional).
 * @returns The plural or singular form of the word.
 */
export function pluralize(word: string, count: number, pluralForm?: string): string {
  if (count === 1) {
    return word;
  }
  return pluralForm ? pluralForm : word + 's';
}

/**
 * Counts the number of tabs at the beginning of a string.
 *
 * @param text - The string to inspect.
 * @returns The number of leading tabs.
 */
export function countLeadingTabs(text: string): Integer {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count as Integer;
}

/**
 * Right-pads a string to a specified length. Truncates if `truncate` is true
 * and the string already exceeds the length.
 *
 * @param text - The string to pad.
 * @param length - The desired length.
 * @param char - The padding character (default space).
 * @param truncate - Whether to truncate if too long (default true).
 * @returns The padded or truncated string.
 */
export function padRight(
  text: string,
  length: Integer,
  char = ' ',
  truncate = true,
): string {
  if (text.length > length) {
    return truncate ? text.slice(0, length) : text;
  }
  return text + char.repeat(length - text.length);
}

/**
 * Left-pads a string to a specified length. Truncates if `truncate` is true
 * and the string already exceeds the length.
 *
 * @param text - The string to pad.
 * @param length - The desired length.
 * @param char - The padding character (default space).
 * @param truncate - Whether to truncate if too long (default true).
 * @returns The padded or truncated string.
 */
export function padLeft(
  text: string,
  length: Integer,
  char = ' ',
  truncate = true,
): string {
  if (text.length > length) {
    return truncate ? text.slice(0, length) : text;
  }
  return char.repeat(length - text.length) + text;
}

/**
 * Centers a string within a specified length. Truncates if `truncate` is true
 * and the string already exceeds the length.
 *
 * @param text - The string to center.
 * @param length - The desired length.
 * @param char - The padding character (default space).
 * @param truncate - Whether to truncate if too long (default true).
 * @returns The centered or truncated string.
 */
export function padCenter(
  text: string,
  length: Integer,
  char = ' ',
  truncate = true,
): string {
  if (text.length > length) {
    return truncate ? text.slice(0, length) : text;
  }
  const padding = Math.floor((length - text.length) / 2);
  return char.repeat(padding) + text + char.repeat(length - text.length - padding);
}

/**
 * Encodes a string into a 16-bit hexadecimal representation.
 *
 * @param text - The string to encode.
 * @returns The hexadecimal encoded string.
 */
export function hexEncode(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const hex = text.charCodeAt(i).toString(16);
    result += ('000' + hex).slice(-4);
  }
  return result;
}

/**
 * Formats an array of strings into rows of aligned columns, fitting within
 * a maximum width.
 *
 * @param strings - The strings to arrange into columns.
 * @param maxWidth - Maximum total width of a row (default 80).
 * @param padding - Minimum spaces between columns (default 2).
 * @returns An array of formatted row strings.
 */
export function createTable(
  strings: string[],
  maxWidth: Integer = 80 as Integer,
  padding: Integer = 2 as Integer,
): string[] {
  if (strings.length === 0) return [];

  const maxStringLength = Math.max(...strings.map((s) => s.length));
  const colWidth = maxStringLength + padding;
  const numColumns = Math.max(1, Math.floor(maxWidth / colWidth));

  const rows: string[] = [];

  for (let i = 0; i < strings.length; i += numColumns) {
    const rowItems = strings.slice(i, i + numColumns);

    const rowString = rowItems
      .map((item, index) => {
        if (index === rowItems.length - 1) {
          return item;
        }
        return item.padEnd(colWidth, ' ');
      })
      .join('');

    rows.push(rowString);
  }

  return rows;
}
