/**
 * Tests for terminal utilities that don't require a TTY.
 *
 * These tests verify ANSI string manipulation, key checking functions,
 * and other logic that can run in a non-interactive environment.
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { padVisual, stripAnsi, visualLength, visualTruncate } from '../src/screen.ts';
import { isNextPage, isPreviousPage, isQuit, Keys } from '../src/keys.ts';

Deno.test('screen utilities', async (t) => {
  await t.step('stripAnsi', async (t) => {
    await t.step('removes ANSI color codes', () => {
      const colored = '\x1b[31mred\x1b[0m';
      assertEquals(stripAnsi(colored), 'red');
    });

    await t.step('handles multiple ANSI codes', () => {
      const text = '\x1b[1m\x1b[31mbold red\x1b[0m';
      assertEquals(stripAnsi(text), 'bold red');
    });

    await t.step('returns plain text unchanged', () => {
      assertEquals(stripAnsi('hello'), 'hello');
    });

    await t.step('handles empty string', () => {
      assertEquals(stripAnsi(''), '');
    });
  });

  await t.step('visualLength', async (t) => {
    await t.step('counts visible characters only', () => {
      assertEquals(visualLength('\x1b[31mred\x1b[0m'), 3);
    });

    await t.step('matches plain string length', () => {
      assertEquals(visualLength('hello'), 5);
    });

    await t.step('handles Unicode characters', () => {
      assertEquals(visualLength('日本語'), 3);
    });
  });

  await t.step('visualTruncate', async (t) => {
    await t.step('truncates to target width with ellipsis', () => {
      const result = visualTruncate('hello world', 8);
      assertEquals(stripAnsi(result), 'hello w…');
    });

    await t.step('preserves ANSI codes when truncating', () => {
      const colored = '\x1b[31mhello world\x1b[0m';
      const result = visualTruncate(colored, 8);
      assertStringIncludes(result, '\x1b[31m');
      assertEquals(visualLength(result), 8);
    });

    await t.step('returns original if already fits', () => {
      assertEquals(visualTruncate('hi', 10), 'hi');
    });

    await t.step('handles exact fit', () => {
      assertEquals(stripAnsi(visualTruncate('hello', 5)), 'hello');
    });
  });

  await t.step('padVisual', async (t) => {
    await t.step('pads left-aligned (default)', () => {
      const result = padVisual('hi', 5);
      assertEquals(stripAnsi(result), 'hi   ');
    });

    await t.step('pads right-aligned', () => {
      const result = padVisual('hi', 5, 'right');
      assertEquals(stripAnsi(result), '   hi');
    });

    await t.step('pads center-aligned', () => {
      const result = padVisual('hi', 6, 'center');
      assertEquals(stripAnsi(result), '  hi  ');
    });

    await t.step('handles ANSI codes in padding', () => {
      const colored = '\x1b[31mhi\x1b[0m';
      const result = padVisual(colored, 5, 'left');
      assertStringIncludes(result, '\x1b[31m');
      assertEquals(visualLength(result), 5);
    });

    await t.step('returns original if already wide enough', () => {
      assertEquals(padVisual('hello', 3), 'hello');
    });

    await t.step('uses custom padding character', () => {
      const result = padVisual('hi', 5, 'left', '.');
      assertEquals(result, 'hi...');
    });
  });
});

Deno.test('key utilities', async (t) => {
  await t.step('isQuit', async (t) => {
    await t.step('returns true for q', () => {
      assert(isQuit('q'));
    });

    await t.step('returns true for Q', () => {
      assert(isQuit('Q'));
    });

    await t.step('returns true for Ctrl+C', () => {
      assert(isQuit(Keys.CTRL_C));
    });

    await t.step('returns false for other keys', () => {
      assertEquals(isQuit('a'), false);
      assertEquals(isQuit(Keys.SPACE), false);
    });
  });

  await t.step('isNextPage', async (t) => {
    await t.step('returns true for space', () => {
      assert(isNextPage(Keys.SPACE));
    });

    await t.step('returns true for Page Down', () => {
      assert(isNextPage(Keys.PAGE_DOWN));
    });

    await t.step('returns false for other keys', () => {
      assertEquals(isNextPage('n'), false);
      assertEquals(isNextPage(Keys.PAGE_UP), false);
    });
  });

  await t.step('isPreviousPage', async (t) => {
    await t.step('returns true for Page Up', () => {
      assert(isPreviousPage(Keys.PAGE_UP));
    });

    await t.step('returns false for other keys', () => {
      assertEquals(isPreviousPage('p'), false);
      assertEquals(isPreviousPage(Keys.PAGE_DOWN), false);
    });
  });

  await t.step('Keys constants', async (t) => {
    await t.step('has expected arrow keys', () => {
      assertEquals(Keys.UP, '\x1b[A');
      assertEquals(Keys.DOWN, '\x1b[B');
      assertEquals(Keys.LEFT, '\x1b[D');
      assertEquals(Keys.RIGHT, '\x1b[C');
    });

    await t.step('has expected control keys', () => {
      assertEquals(Keys.CTRL_C, '\x03');
      assertEquals(Keys.CTRL_D, '\x04');
      assertEquals(Keys.ESC, '\x1b');
    });

    await t.step('has expected special keys', () => {
      assertEquals(Keys.SPACE, ' ');
      assertEquals(Keys.ENTER, '\r');
      assertEquals(Keys.TAB, '\t');
      assertEquals(Keys.BACKSPACE, '\x08');
    });
  });
});
