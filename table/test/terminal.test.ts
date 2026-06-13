import { assertEquals } from '@std/assert';
import { rgb24 } from '@std/fmt/colors';
import { padVisual, stripAnsi, visibleTruncate } from '../src/terminal.ts';

Deno.test('stripAnsi', async (t) => {
  await t.step('should return plain text unchanged', () => {
    assertEquals(stripAnsi('hello'), 'hello');
  });

  await t.step('should strip single ANSI escape code', () => {
    const colored = rgb24('hello', 0xff0000);
    assertEquals(stripAnsi(colored), 'hello');
  });

  await t.step('should strip multiple ANSI escape codes', () => {
    const text = `${rgb24('red', 0xff0000)} ${rgb24('blue', 0x0000ff)}`;
    assertEquals(stripAnsi(text), 'red blue');
  });

  await t.step('should handle empty string', () => {
    assertEquals(stripAnsi(''), '');
  });

  await t.step('should strip complex ANSI sequences', () => {
    const text = '\x1b[1m\x1b[31mBold Red\x1b[0m';
    assertEquals(stripAnsi(text), 'Bold Red');
  });
});

Deno.test('visibleTruncate', async (t) => {
  await t.step('should not truncate when text fits within maxWidth', () => {
    assertEquals(visibleTruncate('hello', 10), 'hello');
  });

  await t.step('should not truncate when text exactly equals maxWidth', () => {
    assertEquals(visibleTruncate('hello', 5), 'hello');
  });

  await t.step('should truncate with ellipsis when text exceeds maxWidth', () => {
    const result = visibleTruncate('hello world', 8);
    assertEquals(result, 'hello w…');
    assertEquals(stripAnsi(result).length, 8);
  });

  await t.step('should preserve ANSI codes when truncating', () => {
    const colored = rgb24('hello world', 0xff0000);
    const result = visibleTruncate(colored, 8);
    assertEquals(stripAnsi(result), 'hello w…');
    assertEquals(stripAnsi(result).length, 8);
  });

  await t.step('should handle truncation at ANSI boundary', () => {
    const text = `${rgb24('hello', 0xff0000)} world`;
    const result = visibleTruncate(text, 8);
    assertEquals(stripAnsi(result), 'hello w…');
  });

  await t.step('should handle very short maxWidth', () => {
    const result = visibleTruncate('hello', 2);
    assertEquals(result, 'h…');
    assertEquals(stripAnsi(result).length, 2);
  });

  await t.step('should handle maxWidth of 1', () => {
    const result = visibleTruncate('hello', 1);
    assertEquals(result, '…');
  });

  await t.step('should handle empty string', () => {
    assertEquals(visibleTruncate('', 5), '');
  });
});

Deno.test('padVisual', async (t) => {
  await t.step('should pad on right for left alignment (default)', () => {
    const result = padVisual('hello', 10);
    assertEquals(result, 'hello     ');
    assertEquals(result.length, 10);
  });

  await t.step('should pad on right for explicit left alignment', () => {
    const result = padVisual('hello', 10, 'left');
    assertEquals(result, 'hello     ');
  });

  await t.step('should pad on left for right alignment', () => {
    const result = padVisual('hello', 10, 'right');
    assertEquals(result, '     hello');
  });

  await t.step('should not pad when text already at width', () => {
    assertEquals(padVisual('hello', 5), 'hello');
  });

  await t.step('should not pad when text exceeds width', () => {
    assertEquals(padVisual('hello world', 5), 'hello world');
  });

  await t.step('should handle ANSI-containing strings for left align', () => {
    const colored = rgb24('hello', 0xff0000);
    const result = padVisual(colored, 10, 'left');
    // Visual length should be 10, but actual length includes ANSI codes
    assertEquals(stripAnsi(result).length, 10);
    assertEquals(stripAnsi(result), 'hello     ');
  });

  await t.step('should handle ANSI-containing strings for right align', () => {
    const colored = rgb24('hello', 0xff0000);
    const result = padVisual(colored, 10, 'right');
    assertEquals(stripAnsi(result).length, 10);
    assertEquals(stripAnsi(result), '     hello');
  });

  await t.step('should support custom padding character', () => {
    const result = padVisual('hello', 10, 'left', '-');
    assertEquals(result, 'hello-----');
  });

  await t.step('should support custom padding character with right align', () => {
    const result = padVisual('hello', 10, 'right', '*');
    assertEquals(result, '*****hello');
  });

  await t.step('should pad evenly for center alignment with even padding', () => {
    const result = padVisual('hi', 8, 'center');
    assertEquals(result, '   hi   ');
    assertEquals(stripAnsi(result).length, 8);
  });

  await t.step('should pad unevenly for center alignment with odd padding (extra on right)', () => {
    const result = padVisual('hi', 7, 'center');
    assertEquals(result, '  hi   ');
    assertEquals(stripAnsi(result).length, 7);
  });

  await t.step('should handle center alignment with ANSI-containing strings', () => {
    const colored = rgb24('hi', 0xff0000);
    const result = padVisual(colored, 8, 'center');
    assertEquals(stripAnsi(result).length, 8);
    assertEquals(stripAnsi(result), '   hi   ');
  });

  await t.step('should handle empty string', () => {
    const result = padVisual('', 5);
    assertEquals(result, '     ');
  });

  await t.step('should handle zero width', () => {
    assertEquals(padVisual('hello', 0), 'hello');
  });
});
