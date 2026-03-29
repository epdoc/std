/**
 * Tests for terminal utilities that don't require a TTY.
 *
 * These tests verify ANSI string manipulation, key checking functions,
 * and other logic that can run in a non-interactive environment.
 */

import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';
import {
  padVisual,
  stripAnsi,
  visualLength,
  visualTruncate,
} from '../src/screen.ts';
import { isNextPage, isPreviousPage, isQuit, Keys } from '../src/keys.ts';

describe('screen utilities', () => {
  describe('stripAnsi', () => {
    it('removes ANSI color codes', () => {
      const colored = '\x1b[31mred\x1b[0m';
      expect(stripAnsi(colored)).toBe('red');
    });

    it('handles multiple ANSI codes', () => {
      const text = '\x1b[1m\x1b[31mbold red\x1b[0m';
      expect(stripAnsi(text)).toBe('bold red');
    });

    it('returns plain text unchanged', () => {
      expect(stripAnsi('hello')).toBe('hello');
    });

    it('handles empty string', () => {
      expect(stripAnsi('')).toBe('');
    });
  });

  describe('visualLength', () => {
    it('counts visible characters only', () => {
      expect(visualLength('\x1b[31mred\x1b[0m')).toBe(3);
    });

    it('matches plain string length', () => {
      expect(visualLength('hello')).toBe(5);
    });

    it('handles Unicode characters', () => {
      expect(visualLength('日本語')).toBe(3);
    });
  });

  describe('visualTruncate', () => {
    it('truncates to target width with ellipsis', () => {
      const result = visualTruncate('hello world', 8);
      expect(stripAnsi(result)).toBe('hello w…');
    });

    it('preserves ANSI codes when truncating', () => {
      const colored = '\x1b[31mhello world\x1b[0m';
      const result = visualTruncate(colored, 8);
      expect(result).toContain('\x1b[31m');
      expect(visualLength(result)).toBe(8);
    });

    it('returns original if already fits', () => {
      expect(visualTruncate('hi', 10)).toBe('hi');
    });

    it('handles exact fit', () => {
      expect(stripAnsi(visualTruncate('hello', 5))).toBe('hello');
    });
  });

  describe('padVisual', () => {
    it('pads left-aligned (default)', () => {
      const result = padVisual('hi', 5);
      expect(stripAnsi(result)).toBe('hi   ');
    });

    it('pads right-aligned', () => {
      const result = padVisual('hi', 5, 'right');
      expect(stripAnsi(result)).toBe('   hi');
    });

    it('pads center-aligned', () => {
      const result = padVisual('hi', 6, 'center');
      expect(stripAnsi(result)).toBe('  hi  ');
    });

    it('handles ANSI codes in padding', () => {
      const colored = '\x1b[31mhi\x1b[0m';
      const result = padVisual(colored, 5, 'left');
      expect(result).toContain('\x1b[31m');
      expect(visualLength(result)).toBe(5);
    });

    it('returns original if already wide enough', () => {
      expect(padVisual('hello', 3)).toBe('hello');
    });

    it('uses custom padding character', () => {
      const result = padVisual('hi', 5, 'left', '.');
      expect(result).toBe('hi...');
    });
  });
});

describe('key utilities', () => {
  describe('isQuit', () => {
    it('returns true for q', () => {
      expect(isQuit('q')).toBe(true);
    });

    it('returns true for Q', () => {
      expect(isQuit('Q')).toBe(true);
    });

    it('returns true for Ctrl+C', () => {
      expect(isQuit(Keys.CTRL_C)).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isQuit('a')).toBe(false);
      expect(isQuit(Keys.SPACE)).toBe(false);
    });
  });

  describe('isNextPage', () => {
    it('returns true for space', () => {
      expect(isNextPage(Keys.SPACE)).toBe(true);
    });

    it('returns true for Page Down', () => {
      expect(isNextPage(Keys.PAGE_DOWN)).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isNextPage('n')).toBe(false);
      expect(isNextPage(Keys.PAGE_UP)).toBe(false);
    });
  });

  describe('isPreviousPage', () => {
    it('returns true for Page Up', () => {
      expect(isPreviousPage(Keys.PAGE_UP)).toBe(true);
    });

    it('returns false for other keys', () => {
      expect(isPreviousPage('p')).toBe(false);
      expect(isPreviousPage(Keys.PAGE_DOWN)).toBe(false);
    });
  });

  describe('Keys constants', () => {
    it('has expected arrow keys', () => {
      expect(Keys.UP).toBe('\x1b[A');
      expect(Keys.DOWN).toBe('\x1b[B');
      expect(Keys.LEFT).toBe('\x1b[D');
      expect(Keys.RIGHT).toBe('\x1b[C');
    });

    it('has expected control keys', () => {
      expect(Keys.CTRL_C).toBe('\x03');
      expect(Keys.CTRL_D).toBe('\x04');
      expect(Keys.ESC).toBe('\x1b');
    });

    it('has expected special keys', () => {
      expect(Keys.SPACE).toBe(' ');
      expect(Keys.ENTER).toBe('\r');
      expect(Keys.TAB).toBe('\t');
      expect(Keys.BACKSPACE).toBe('\x08');
    });
  });
});
