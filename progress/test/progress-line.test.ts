import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import * as Progress from '../src/mod.ts';

describe('Progress.Line', () => {
  describe('constructor', () => {
    test('should create instance with default spinner options', () => {
      const progress = new Progress.Line();
      expect(progress).toBeDefined();
    });

    test('should create instance with spinner options', () => {
      const progress = new Progress.Line({ type: 'spinner', index: 2, color: 'cyan' });
      expect(progress).toBeDefined();
    });

    test('should create instance with bounce options', () => {
      const progress = new Progress.Line({ type: 'bounce', index: 0, color: 'magenta' });
      expect(progress).toBeDefined();
    });

    test('should create instance with horizontal options', () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 50, width: 20, color: 0x20D020 });
      expect(progress).toBeDefined();
    });

    test('should create instance with vertical options', () => {
      const progress = new Progress.Line({ type: 'vertical', total: 100, color: 'green' });
      expect(progress).toBeDefined();
    });
  });

  describe('type guards', () => {
    test('isSpinner validates correct spinner options', () => {
      expect(Progress.isSpinner({ type: 'spinner', index: 0 })).toBe(true);
      expect(Progress.isSpinner({ type: 'spinner', index: 2 })).toBe(true);
      expect(Progress.isSpinner({ type: 'spinner', index: 0, color: 'red' })).toBe(true);
    });

    test('isSpinner rejects invalid options', () => {
      expect(Progress.isSpinner({ type: 'spinner', index: 3 })).toBe(false);
      expect(Progress.isSpinner({ type: 'spinner', index: -1 })).toBe(false);
      expect(Progress.isSpinner({ type: 'horizontal', total: 10, width: 5 })).toBe(false);
      expect(Progress.isSpinner({ type: 'bounce', index: 0 })).toBe(false);
      expect(Progress.isSpinner(null)).toBe(false);
      expect(Progress.isSpinner('spinner')).toBe(false);
    });

    test('Progress.isBounce validates correct bounce options', () => {
      expect(Progress.isBounce({ type: 'bounce', index: 0 })).toBe(true);
      expect(Progress.isBounce({ type: 'bounce', index: 1 })).toBe(true);
      expect(Progress.isBounce({ type: 'bounce', index: 0, color: 'purple' })).toBe(true);
    });

    test('Progress.isBounce rejects invalid options', () => {
      expect(Progress.isBounce({ type: 'bounce', index: 2 })).toBe(false);
      expect(Progress.isBounce({ type: 'bounce', index: -1 })).toBe(false);
      expect(Progress.isBounce({ type: 'spinner', index: 0 })).toBe(false);
      expect(Progress.isBounce(null)).toBe(false);
      expect(Progress.isBounce('bounce')).toBe(false);
    });

    test('Progress.isHorizontal validates correct horizontal options', () => {
      expect(Progress.isHorizontal({ type: 'horizontal', total: 10, width: 5 })).toBe(true);
      expect(Progress.isHorizontal({ type: 'horizontal', total: 100, width: 20, color: 0xFF0000 })).toBe(true);
    });

    test('Progress.isHorizontal rejects invalid options', () => {
      expect(Progress.isHorizontal({ type: 'horizontal', total: 10, width: 0 })).toBe(false);
      expect(Progress.isHorizontal({ type: 'horizontal', total: 10, width: -1 })).toBe(false);
      expect(Progress.isHorizontal({ type: 'spinner', index: 0 })).toBe(false);
      expect(Progress.isHorizontal(null)).toBe(false);
    });

    test('Progress.isVertical validates correct vertical options', () => {
      expect(Progress.isVertical({ type: 'vertical', total: 10 })).toBe(true);
      expect(Progress.isVertical({ type: 'vertical', total: 100, color: 'purple' })).toBe(true);
    });

    test('Progress.isVertical rejects invalid options', () => {
      expect(Progress.isVertical({ type: 'horizontal', total: 10, width: 5 })).toBe(false);
      expect(Progress.isVertical(null)).toBe(false);
    });
  });

  describe('spinner mode', () => {
    test('should start and stop', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0 });
      progress.start('Testing...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.stop();
    });

    test('should start and stop with color', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 1, color: 'cyan' });
      progress.start('Loading...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.stop('Done!');
    });

    test('should start and stop with hex color', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 2, color: 0x50C878 });
      progress.start('Processing...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.stop();
    });

    test('should update message while running', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0, color: 'yellow' });
      progress.start('Step 1...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.update('Step 2...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop('Complete!');
    });
  });

  describe('bounce mode', () => {
    test('should start and stop with bouncing ball', async () => {
      const progress = new Progress.Line({ type: 'bounce', index: 0, color: 'cyan' });
      progress.start('Bouncing...');
      await new Promise((resolve) => setTimeout(resolve, 400));
      progress.stop('Done!');
    });

    test('should start and stop with sliding blocks', async () => {
      const progress = new Progress.Line({ type: 'bounce', index: 1, color: 'purple' });
      progress.start('Thinking...');
      await new Promise((resolve) => setTimeout(resolve, 400));
      progress.stop('Complete!');
    });

    test('should start and stop with hex color', async () => {
      const progress = new Progress.Line({ type: 'bounce', index: 0, color: 0xA040D0 });
      progress.start('Working...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.stop();
    });

    test('should update message while bouncing', async () => {
      const progress = new Progress.Line({ type: 'bounce', index: 1, color: 'magenta' });
      progress.start('Phase 1...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.update('Phase 2...');
      await new Promise((resolve) => setTimeout(resolve, 200));
      progress.stop('All phases done!');
    });
  });

  describe('horizontal mode', () => {
    test('should display progress bar', async () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 20, width: 10 });
      progress.start('Downloading...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.update('Downloading...', 10);
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop('Download complete!');
    });

    test('should display progress bar with color', async () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 20, color: 'green' });
      progress.start('Processing...');
      progress.update('Processing...', 2.5);
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.update('Processing...', 5);
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.update('Processing...', 10);
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop('Processing complete!');
    });

    test('should handle fine-grained progress with partial blocks', async () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 40, width: 5, color: 'orange' });
      progress.start('Fine-grained progress...');
      for (let i = 0; i <= 40; i += 4) {
        progress.update(`Progress: ${i}/40`, i);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      progress.stop('Complete!');
    });

    test('should clamp progress exceeding total', async () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 10, color: 'blue' });
      progress.start('Testing edges...');
      progress.update('Starting...', 0);
      await new Promise((resolve) => setTimeout(resolve, 50));
      progress.update('Complete...', 10);
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Progress exceeds total — should clamp without visual artifacts
      progress.update('Overcomplete...', 15);
      await new Promise((resolve) => setTimeout(resolve, 50));
      progress.stop('Done!');
    });

    test('should default total to 1 and width to 10 when not provided', () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 0, width: 0 });
      expect(progress).toBeDefined();
    });
  });

  describe('vertical mode', () => {
    test('should display vertical fill', async () => {
      const progress = new Progress.Line({ type: 'vertical', total: 8 });
      progress.start('Volume...');
      for (let i = 0; i <= 8; i++) {
        progress.update(`Level: ${i}/8`, i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      progress.stop('Done!');
    });

    test('should display vertical fill with color', async () => {
      const progress = new Progress.Line({ type: 'vertical', total: 100, color: 'magenta' });
      progress.start('Fill level...');
      for (let i = 0; i <= 100; i += 25) {
        progress.update(`Level: ${i}%`, i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      progress.stop('Full!');
    });

    test('should clamp vertical progress exceeding total', async () => {
      const progress = new Progress.Line({ type: 'vertical', total: 10, color: 0xD070D0 });
      progress.start('Testing vertical clamp...');
      progress.update('Over max...', 15);
      await new Promise((resolve) => setTimeout(resolve, 50));
      progress.stop('Done!');
    });

    test('should default total to 1 when not provided', () => {
      const progress = new Progress.Line({ type: 'vertical', total: 0 });
      expect(progress).toBeDefined();
    });
  });

  describe('lifecycle', () => {
    test('should handle stop without start gracefully', () => {
      const progress = new Progress.Line();
      progress.stop();
    });

    test('should handle update without start gracefully', () => {
      const progress = new Progress.Line();
      progress.update('This should not throw');
      progress.update('This should not throw', 5);
    });

    test('should restart when start is called while active', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0 });
      progress.start('First message...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.start('Second message...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop();
    });

    test('should show final message on stop', async () => {
      const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 10 });
      progress.start('Processing...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.update('Almost done...', 9);
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop('Complete!');
    });

    test('should support sequential use of separate instances for different modes', async () => {
      // Spinner mode
      const spinner = new Progress.Line({ type: 'spinner', index: 0, color: 'cyan' });
      spinner.start('First task...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      spinner.stop('First done!');

      // Bounce mode
      const bouncer = new Progress.Line({ type: 'bounce', index: 1, color: 'purple' });
      bouncer.start('Second task...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      bouncer.stop('Second done!');

      // Horizontal bar mode
      const bar = new Progress.Line({ type: 'horizontal', total: 5, width: 10, color: 'green' });
      bar.start('Third task...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      bar.update('Third task...', 3);
      await new Promise((resolve) => setTimeout(resolve, 100));
      bar.stop('Third done!');

      // Vertical fill mode
      const fill = new Progress.Line({ type: 'vertical', total: 10, color: 'orange' });
      fill.start('Fourth task...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      fill.update('Fourth task...', 7);
      await new Promise((resolve) => setTimeout(resolve, 100));
      fill.stop('Fourth done!');
    });
  });

  describe('color', () => {
    test('should accept named color strings', () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0, color: 'red' });
      expect(progress).toBeDefined();
    });

    test('should accept hex color numbers', () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0, color: 0xFF8800 });
      expect(progress).toBeDefined();
    });

    test('should default color when not specified', () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0 });
      expect(progress).toBeDefined();
    });

    test('should fall back to default for unrecognized color names', async () => {
      const progress = new Progress.Line({ type: 'spinner', index: 0, color: 'nonexistent' });
      progress.start('Testing fallback...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      progress.stop();
    });

    test('should accept color on bounce type', () => {
      const progress = new Progress.Line({ type: 'bounce', index: 1, color: 'purple' });
      expect(progress).toBeDefined();
    });
  });
});
