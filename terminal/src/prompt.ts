/**
 * Terminal prompt utilities for CLI applications.
 *
 * @module @epdoc/terminal/prompt
 *
 * Provides functions for prompting the user for input via stdin.
 * Supports line-based input with optional abort keyword detection.
 *
 * @example
 * ```typescript
 * import { promptUser } from '@epdoc/terminal/prompt';
 *
 * // Simple prompt
 * const name = await promptUser('Enter your name:');
 *
 * // Prompt with abort keyword
 * const input = await promptUser('Continue? (type "abort" to cancel):', {
 *   abortKeyword: 'abort'
 * });
 * ```
 */

/** Options for promptUser function */
export interface PromptOptions {
  /** Keyword that triggers abort (case-insensitive). If matched, returns empty string. */
  abortKeyword?: string;
  /** Maximum buffer size for input in bytes. Default: 1024 */
  bufferSize?: number;
}

/**
 * Prompt the user for line-based input via stdin.
 *
 * Writes the message to stdout, then reads a line from stdin and returns
 * the trimmed result. Handles EOF gracefully by returning an empty string.
 *
 * The abort keyword feature allows users to cancel an operation by typing
 * a specific word (case-insensitive). When the abort keyword is matched,
 * an empty string is returned, which can be checked to exit early.
 *
 * @param message - The prompt message to display to the user
 * @param opts - Optional configuration for the prompt behavior
 * @returns The user's input (trimmed), or empty string if EOF or abort keyword detected
 *
 * @example
 * ```typescript
 * const answer = await promptUser('Are you sure? (yes/no):');
 * if (answer.toLowerCase() === 'yes') {
 *   // Proceed with action
 * }
 * ```
 *
 * @example With abort keyword
 * ```typescript
 * const input = await promptUser('Press Enter to continue (type "abort" to cancel):', {
 *   abortKeyword: 'abort'
 * });
 * if (!input) {
 *   console.log('Aborted');
 *   return;
 * }
 * ```
 */
export async function promptUser(message: string, opts: PromptOptions = {}): Promise<string> {
  const bufferSize = opts.bufferSize ?? 1024;
  const buf = new Uint8Array(bufferSize);

  await Deno.stdout.write(new TextEncoder().encode(message + ' '));

  const n = await Deno.stdin.read(buf);
  if (n === null) {
    return '';
  }

  const input = new TextDecoder().decode(buf.subarray(0, n)).trim();

  if (opts.abortKeyword && input.toLowerCase() === opts.abortKeyword.toLowerCase()) {
    return '';
  }

  return input;
}
