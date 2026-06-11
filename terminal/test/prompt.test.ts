/**
 * Tests for prompt utilities.
 *
 * Note: The promptUser function interacts directly with Deno.stdin and Deno.stdout,
 * making it difficult to test in a non-TTY environment. These tests verify the
 * module structure and exports. Full I/O testing would require Deno API mocking
 * or integration tests in a TTY environment.
 */

import { assertEquals } from '@std/assert';
import { type PromptOptions, promptUser } from '../src/prompt.ts';

Deno.test('prompt module', async (t) => {
  await t.step('exports', async (t) => {
    await t.step('exports promptUser function', () => {
      assertEquals(typeof promptUser, 'function');
    });

    await t.step('promptUser accepts message and options parameters', () => {
      // Verify function signature by checking it accepts the expected parameters
      // We don't call it to avoid stdin/stdout interaction in test environment
      // Function.length counts required parameters (opts has a default value)
      assertEquals(promptUser.length, 1); // only 'message' is required
    });
  });

  await t.step('PromptOptions interface', async (t) => {
    await t.step('accepts valid options object', () => {
      const options: PromptOptions = {
        abortKeyword: 'quit',
        bufferSize: 2048,
      };

      assertEquals(options.abortKeyword, 'quit');
      assertEquals(options.bufferSize, 2048);
    });

    await t.step('accepts partial options', () => {
      const abortOnly: PromptOptions = {
        abortKeyword: 'exit',
      };

      const bufferOnly: PromptOptions = {
        bufferSize: 512,
      };

      const empty: PromptOptions = {};

      assertEquals(abortOnly.abortKeyword, 'exit');
      assertEquals(bufferOnly.bufferSize, 512);
      assertEquals(Object.keys(empty).length, 0);
    });

    await t.step('accepts options with default values', () => {
      // Simulate how options would be used with defaults
      const opts: PromptOptions = {};
      const bufferSize = opts.bufferSize ?? 1024;
      const abortKeyword = opts.abortKeyword;

      assertEquals(bufferSize, 1024);
      assertEquals(abortKeyword, undefined);
    });
  });
});
