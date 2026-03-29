/**
 * Key codes and input handling for terminal interaction.
 *
 * @module @epdoc/terminal/keys
 *
 * Provides constants for terminal key codes and functions to read key input.
 * Supports arrow keys, navigation keys, control characters, and basic input detection.
 *
 * @example
 * ```typescript
 * import { keys, Keys } from '@epdoc/terminal';
 *
 * // Read a keypress (requires TTY)
 * const key = await keys.readKey();
 *
 * if (key === Keys.SPACE) {
 *   console.log('Space pressed');
 * } else if (keys.isQuit(key)) {
 *   process.exit(0);
 * }
 * ```
 */

/**
 * Key codes for common terminal input.
 *
 * Contains string representations of terminal key codes including:
 * - Basic keys: SPACE, ENTER, ESC, TAB
 * - Arrow keys: UP, DOWN, LEFT, RIGHT
 * - Navigation: PAGE_UP, PAGE_DOWN, HOME, END
 * - Control sequences: CTRL_C, CTRL_D, CTRL_R
 * - Editing: BACKSPACE, DELETE
 */
export const Keys = {
  /** Space bar */
  SPACE: ' ',
  /** Enter/Return key */
  ENTER: '\r',
  /** Newline */
  NEWLINE: '\n',
  /** Escape key */
  ESC: '\x1b',
  /** Ctrl+C */
  CTRL_C: '\x03',
  /** Ctrl+D (EOF) */
  CTRL_D: '\x04',
  /** Ctrl+R */
  CTRL_R: '\x12',
  /** Backspace */
  BACKSPACE: '\x08',
  /** Delete */
  DELETE: '\x7f',
  /** Tab */
  TAB: '\t',
  /** Up arrow */
  UP: '\x1b[A',
  /** Down arrow */
  DOWN: '\x1b[B',
  /** Right arrow */
  RIGHT: '\x1b[C',
  /** Left arrow */
  LEFT: '\x1b[D',
  /** Page Up */
  PAGE_UP: '\x1b[5~',
  /** Page Down */
  PAGE_DOWN: '\x1b[6~',
  /** Home */
  HOME: '\x1b[H',
  /** End */
  END: '\x1b[F',
  /** q key */
  Q: 'q',
  /** Q key (uppercase) */
  Q_UPPER: 'Q',
} as const;

/**
 * Type representing all possible key values from the Keys constant.
 *
 * This is a union type of all key code strings defined in {@link Keys}.
 */
export type KeyValue = typeof Keys[keyof typeof Keys];

/**
 * Read a single keypress from stdin.
 *
 * Sets the terminal to raw mode, reads a single keypress or escape sequence,
 * and then restores the terminal to normal mode. Returns `undefined` if
 * stdin is not a TTY or when EOF is reached.
 *
 * Supports regular characters, control characters, and escape sequences
 * for arrow keys and special keys.
 *
 * @returns The key code/sequence that was pressed, or undefined if not a TTY or EOF
 *
 * @example
 * ```typescript
 * const key = await readKey();
 * if (key === Keys.UP) {
 *   moveSelectionUp();
 * } else if (key === Keys.ENTER) {
 *   confirmSelection();
 * }
 * ```
 */
export async function readKey(): Promise<string | undefined> {
  if (!Deno.stdin.isTerminal()) {
    return undefined;
  }

  const buf = new Uint8Array(8);

  try {
    Deno.stdin.setRaw(true);
    const n = await Deno.stdin.read(buf);

    if (n === null) {
      return undefined;
    }

    return new TextDecoder().decode(buf.slice(0, n));
  } finally {
    Deno.stdin.setRaw(false);
  }
}

/**
 * Check if a key is a quit command.
 *
 * Recognizes 'q', 'Q', and Ctrl+C as quit signals.
 *
 * @param key - The key code to check
 * @returns True if the key represents a quit command
 *
 * @example
 * ```typescript
 * const key = await readKey();
 * if (isQuit(key)) {
 *   console.log('Goodbye!');
 *   process.exit(0);
 * }
 * ```
 */
export function isQuit(key: string): boolean {
  return key === Keys.Q || key === Keys.Q_UPPER || key === Keys.CTRL_C;
}

/**
 * Check if a key is a "next page" command.
 *
 * Recognizes space bar and Page Down key as next page commands.
 *
 * @param key - The key code to check
 * @returns True if the key represents a next page command
 *
 * @example
 * ```typescript
 * const key = await readKey();
 * if (isNextPage(key)) {
 *   currentPage++;
 *   showPage(currentPage);
 * }
 * ```
 */
export function isNextPage(key: string): boolean {
  return key === Keys.SPACE || key === Keys.PAGE_DOWN;
}

/**
 * Check if a key is a "previous page" command.
 *
 * Recognizes the Page Up key as a previous page command.
 *
 * @param key - The key code to check
 * @returns True if the key represents a previous page command
 *
 * @example
 * ```typescript
 * const key = await readKey();
 * if (isPreviousPage(key) && currentPage > 0) {
 *   currentPage--;
 *   showPage(currentPage);
 * }
 * ```
 */
export function isPreviousPage(key: string): boolean {
  return key === Keys.PAGE_UP;
}
