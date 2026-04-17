/**
 * Tests for prompt utilities.
 *
 * Note: The promptUser function interacts directly with Deno.stdin and Deno.stdout,
 * making it difficult to test in a non-TTY environment. These tests verify the
 * module structure and exports. Full I/O testing would require Deno API mocking
 * or integration tests in a TTY environment.
 */

import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';
import { type PromptOptions, promptUser } from '../src/prompt.ts';

describe('prompt module', () => {
  describe('exports', () => {
    it('exports promptUser function', () => {
      expect(typeof promptUser).toBe('function');
    });

    it('promptUser accepts message and options parameters', () => {
      // Verify function signature by checking it accepts the expected parameters
      // We don't call it to avoid stdin/stdout interaction in test environment
      // Function.length counts required parameters (opts has a default value)
      expect(promptUser.length).toBe(1); // only 'message' is required
    });
  });

  describe('PromptOptions interface', () => {
    it('accepts valid options object', () => {
      const options: PromptOptions = {
        abortKeyword: 'quit',
        bufferSize: 2048,
      };

      expect(options.abortKeyword).toBe('quit');
      expect(options.bufferSize).toBe(2048);
    });

    it('accepts partial options', () => {
      const abortOnly: PromptOptions = {
        abortKeyword: 'exit',
      };

      const bufferOnly: PromptOptions = {
        bufferSize: 512,
      };

      const empty: PromptOptions = {};

      expect(abortOnly.abortKeyword).toBe('exit');
      expect(bufferOnly.bufferSize).toBe(512);
      expect(Object.keys(empty)).toHaveLength(0);
    });

    it('accepts options with default values', () => {
      // Simulate how options would be used with defaults
      const opts: PromptOptions = {};
      const bufferSize = opts.bufferSize ?? 1024;
      const abortKeyword = opts.abortKeyword;

      expect(bufferSize).toBe(1024);
      expect(abortKeyword).toBeUndefined();
    });
  });
});
