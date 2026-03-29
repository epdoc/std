/**
 * Terminal screen utilities for cursor control, clearing, and size detection.
 *
 * @module @epdoc/terminal/screen
 *
 * @example
 * ```typescript
 * import { screen } from '@epdoc/terminal';
 *
 * // Get terminal dimensions
 * const { columns, rows } = screen.getTerminalSize();
 *
 * // Clear screen and move cursor
 * screen.clearScreen();
 * screen.moveTo(1, 1);
 *
 * // Hide cursor during operations
 * screen.hideCursor();
 * // ... display content ...
 * screen.showCursor();
 *
 * // ANSI-aware string operations
 * const cleanText = screen.stripAnsi('\x1b[31mred\x1b[0m text');
 * const len = screen.visualLength('\x1b[31mred\x1b[0m');
 * ```
 */

/**
 * Terminal size information with column and row counts.
 *
 * Represents the dimensions of the terminal window, typically obtained via
 * {@link getTerminalSize}. Returns safe defaults (80x24) when not in a TTY.
 */
export interface TerminalSize {
  /** Number of columns (characters wide) */
  columns: number;
  /** Number of rows (lines tall) */
  rows: number;
}

/**
 * Get the current terminal size.
 *
 * Uses `Deno.consoleSize()` to get the actual terminal dimensions.
 * Returns safe defaults (80 columns × 24 rows) when not running in a TTY.
 *
 * @returns Terminal dimensions with columns and rows
 */
export function getTerminalSize(): TerminalSize {
  try {
    return Deno.consoleSize();
  } catch {
    // Not a TTY, return defaults
    return { columns: 80, rows: 24 };
  }
}

/**
 * Clear the entire terminal screen and move cursor to top-left.
 *
 * Uses ANSI escape sequence ESC[2J (clear entire screen) followed by
 * ESC[H (move cursor to position 0,0).
 */
export function clearScreen(): void {
  // ESC[2J clears entire screen, ESC[H moves cursor to 0,0
  Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
}

/**
 * Clear the current line from cursor position to end.
 *
 * Uses ANSI escape sequence ESC[K (erase in line, from cursor to end).
 */
export function clearLine(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\x1b[K'));
}

/**
 * Clear the entire current line.
 *
 * Uses ANSI escape sequence ESC[2K (erase entire line).
 * Cursor position is not changed.
 */
export function clearEntireLine(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2K'));
}

/**
 * Move cursor to beginning of current line.
 *
 * Uses carriage return character (\r) to move to start of line.
 */
export function moveToLineStart(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\r'));
}

/**
 * Move cursor up N lines.
 *
 * @param lines - Number of lines to move up (default: 1)
 */
export function moveUp(lines = 1): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${lines}A`));
}

/**
 * Move cursor down N lines.
 *
 * @param lines - Number of lines to move down (default: 1)
 */
export function moveDown(lines = 1): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${lines}B`));
}

/**
 * Move cursor to specific position (1-indexed).
 *
 * @param row - Row number (1 is top)
 * @param col - Column number (1 is left)
 */
export function moveTo(row: number, col: number): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${row};${col}H`));
}

/**
 * Hide the cursor.
 *
 * Uses ANSI escape sequence ESC[?25l to hide the cursor.
 * Call {@link showCursor} to restore visibility.
 */
export function hideCursor(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\x1b[?25l'));
}

/**
 * Show the cursor.
 *
 * Uses ANSI escape sequence ESC[?25h to show the cursor.
 * Typically used after {@link hideCursor} to restore visibility.
 */
export function showCursor(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\x1b[?25h'));
}

/**
 * Write a string to stdout synchronously.
 *
 * Encodes the string to UTF-8 and writes it using `Deno.stdout.writeSync()`.
 *
 * @param s - String to write
 */
export function writeSync(s: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(s));
}

/**
 * Write a string to stdout asynchronously.
 *
 * Encodes the string to UTF-8 and writes it using `Deno.stdout.write()`.
 *
 * @param s - String to write
 */
export async function write(s: string): Promise<void> {
  await Deno.stdout.write(new TextEncoder().encode(s));
}

/**
 * Write newline characters to stdout.
 *
 * @param count - Number of newlines to write (default: 1)
 */
export function newline(count = 1): void {
  writeSync('\n'.repeat(count));
}

// ── ANSI/text utilities ────────────────────────────────────────────────────

/**
 * Strip ANSI escape codes from a string.
 *
 * Removes all ANSI escape sequences (e.g., color codes like `\x1b[31m`)
 * to get the raw text content.
 *
 * @param str - String that may contain ANSI escape codes
 * @returns String with ANSI codes removed
 *
 * @example
 * ```typescript
 * const plain = stripAnsi('\x1b[31mred\x1b[0m text'); // "red text"
 * ```
 */
export function stripAnsi(str: string): string {
  // deno-lint-ignore no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get the visual length of a string (excluding ANSI codes).
 *
 * Calculates the number of visible characters by stripping ANSI escape
 * codes before counting.
 *
 * @param str - String that may contain ANSI escape codes
 * @returns Number of visible characters
 *
 * @example
 * ```typescript
 * const len = visualLength('\x1b[31mred\x1b[0m'); // 3
 * ```
 */
export function visualLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Truncate a string to a specific visual width, respecting ANSI codes.
 *
 * Truncates the string to fit within the specified visual width while
 * preserving any ANSI escape codes. Adds an ellipsis character (…) at
 * the truncation point. Returns the original string if it already fits.
 *
 * @param str - String that may contain ANSI escape codes
 * @param maxWidth - Maximum visual width allowed
 * @returns Truncated string with ellipsis
 *
 * @example
 * ```typescript
 * const truncated = visualTruncate('\x1b[31mlong red text\x1b[0m', 8);
 * // Returns: "\x1b[31mlong re…\x1b[0m" (8 visible chars + ellipsis)
 * ```
 */
export function visualTruncate(str: string, maxWidth: number): string {
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
 * Pad a string to a visual width, respecting ANSI escape codes.
 *
 * Pads the string to reach the target visual width while preserving any
 * ANSI escape codes. By default, pads on the right (left-aligned).
 *
 * @param str - The string to pad (may contain ANSI escape codes)
 * @param width - Target visual width (visible characters)
 * @param align - Alignment direction: 'left' (default) pads on right,
 *                'center' splits padding on both sides, 'right' pads on left
 * @param char - Padding character (default: space)
 * @returns Padded string
 *
 * @example
 * ```typescript
 * // Left-aligned (default)
 * padVisual('hello', 10);              // "hello     "
 *
 * // Center-aligned
 * padVisual('hello', 10, 'center');    // "  hello   "
 *
 * // Right-aligned
 * padVisual('hello', 10, 'right');     // "     hello"
 *
 * // Works with ANSI codes
 * padVisual('\x1b[31mhi\x1b[0m', 6);   // "\x1b[31mhi\x1b[0m    "
 * ```
 */
export function padVisual(
  str: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left',
  char: string = ' ',
): string {
  const visualLen = stripAnsi(str).length;
  if (visualLen >= width) {
    return str;
  }
  if (align === 'center') {
    const totalPad = width - visualLen;
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;
    return char.repeat(leftPad) + str + char.repeat(rightPad);
  }
  const padding = char.repeat(width - visualLen);
  if (align === 'right') {
    return padding + str;
  }
  return str + padding;
}
