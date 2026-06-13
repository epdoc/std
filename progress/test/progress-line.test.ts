import { assert, assertEquals } from '@std/assert';
import * as Progress from '../src/mod.ts';

const TEST_DELAY_MS = 10;

Deno.test('constructor', async (t) => {
  await t.step('should create instance with default spinner options', () => {
    const progress = new Progress.Line();
    assert(progress);
  });

  await t.step('should create instance with spinner options', () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille', color: 'cyan' });
    assert(progress);
  });

  await t.step('should create instance with bounce options', () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'ball', color: 'magenta' });
    assert(progress);
  });

  await t.step('should create instance with horizontal options', () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 50, width: 20, color: 0x20D020 });
    assert(progress);
  });

  await t.step('should create instance with vertical options', () => {
    const progress = new Progress.Line({ type: 'vertical', total: 100, color: 'green' });
    assert(progress);
  });
});

Deno.test('type guards', async (t) => {
  await t.step('isSpinner validates correct spinner options', () => {
    assert(Progress.isSpinner({ type: 'spinner', index: 'braille' }));
    assert(Progress.isSpinner({ type: 'spinner', index: 'brailleCircle' }));
    assert(Progress.isSpinner({ type: 'spinner', index: 'braille', color: 'red' }));
  });

  await t.step('isSpinner rejects invalid options', () => {
    assertEquals(Progress.isSpinner({ type: 'spinner', index: 'brailleCircleCircle' }), false);
    assertEquals(Progress.isSpinner({ type: 'spinner', index: -1 }), false);
    assertEquals(Progress.isSpinner({ type: 'horizontal', total: 10, width: 5 }), false);
    assertEquals(Progress.isSpinner({ type: 'bounce', index: 'ball' }), false);
    assertEquals(Progress.isSpinner(null), false);
    assertEquals(Progress.isSpinner('spinner'), false);
  });

  await t.step('Progress.isBounce validates correct bounce options', () => {
    assert(Progress.isBounce({ type: 'bounce', index: 'ball' }));
    assert(Progress.isBounce({ type: 'bounce', index: 'comet' }));
    assert(Progress.isBounce({ type: 'bounce', index: 'ball', color: 'purple' }));
  });

  await t.step('Progress.isBounce rejects invalid options', () => {
    assertEquals(Progress.isBounce({ type: 'bounce', index: 'cometcomet' }), false);
    assertEquals(Progress.isBounce({ type: 'bounce', index: -1 }), false);
    assertEquals(Progress.isBounce({ type: 'spinner', index: 'braille' }), false);
    assertEquals(Progress.isBounce(null), false);
    assertEquals(Progress.isBounce('bounce'), false);
  });

  await t.step('Progress.isHorizontal validates correct horizontal options', () => {
    assert(Progress.isHorizontal({ type: 'horizontal', total: 10, width: 5 }));
    assert(Progress.isHorizontal({ type: 'horizontal', total: 100, width: 20, color: 0xFF0000 }));
  });

  await t.step('Progress.isHorizontal rejects invalid options', () => {
    assertEquals(Progress.isHorizontal({ type: 'horizontal', total: 10, width: 0 }), false);
    assertEquals(Progress.isHorizontal({ type: 'horizontal', total: 10, width: -1 }), false);
    assertEquals(Progress.isHorizontal({ type: 'spinner', index: 0 }), false);
    assertEquals(Progress.isHorizontal(null), false);
  });

  await t.step('Progress.isVertical validates correct vertical options', () => {
    assert(Progress.isVertical({ type: 'vertical', total: 10 }));
    assert(Progress.isVertical({ type: 'vertical', total: 100, color: 'purple' }));
  });

  await t.step('Progress.isVertical rejects invalid options', () => {
    assertEquals(Progress.isVertical({ type: 'horizontal', total: 10, width: 5 }), false);
    assertEquals(Progress.isVertical(null), false);
  });
});

Deno.test('spinner mode', async (t) => {
  await t.step('should start and stop', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille' });
    progress.start('Testing...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.stop();
  });

  await t.step('should start and stop with color', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'brailleCircle', color: 'cyan' });
    progress.start('Loading...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.stop('Done!');
  });

  await t.step('should start and stop with hex color', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'brailleDots', color: 0x50C878 });
    progress.start('Processing...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.stop();
  });

  await t.step('should update message while running', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille', color: 'yellow' });
    progress.start('Step 1...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.update('Step 2...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop('Complete!');
  });
});

Deno.test('bounce mode', async (t) => {
  await t.step('should start and stop with bouncing ball', async () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'ball', color: 'cyan' });
    progress.start('Bouncing...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 4));
    progress.stop('Done!');
  });

  await t.step('should start and stop with sliding blocks', async () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'comet', color: 'purple' });
    progress.start('Thinking...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 4));
    progress.stop('Complete!');
  });

  await t.step('should start and stop with hex color', async () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'ball', color: 0xA040D0 });
    progress.start('Working...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.stop();
  });

  await t.step('should update message while bouncing', async () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'comet', color: 'magenta' });
    progress.start('Phase 1...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.update('Phase 2...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS * 2));
    progress.stop('All phases done!');
  });
});

Deno.test('horizontal mode', async (t) => {
  await t.step('should display progress bar', async () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 20, width: 10 });
    progress.start('Downloading...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.update('Downloading...', 10);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop('Download complete!');
  });

  await t.step('should display progress bar with color', async () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 20, color: 'green' });
    progress.start('Processing...');
    progress.update('Processing...', 2.5);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.update('Processing...', 5);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.update('Processing...', 10);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop('Processing complete!');
  });

  await t.step('should handle fine-grained progress with partial blocks', async () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 40, width: 5, color: 'orange' });
    progress.start('Fine-grained progress...');
    for (let i = 0; i <= 40; i += 4) {
      progress.update(`Progress: ${i}/40`, i);
      await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 3));
    }
    progress.stop('Complete!');
  });

  await t.step('should clamp progress exceeding total', async () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 10, color: 'blue' });
    progress.start('Testing edges...');
    progress.update('Starting...', 0);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    progress.update('Complete...', 10);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    progress.update('Overcomplete...', 15);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    progress.stop('Done!');
  });

  await t.step('should default total to 1 and width to 10 when not provided', () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 0, width: 0 });
    assert(progress);
  });
});

Deno.test('vertical mode', async (t) => {
  await t.step('should display vertical fill', async () => {
    const progress = new Progress.Line({ type: 'vertical', total: 8 });
    progress.start('Volume...');
    for (let i = 0; i <= 8; i++) {
      progress.update(`Level: ${i}/8`, i);
      await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    }
    progress.stop('Done!');
  });

  await t.step('should display vertical fill with color', async () => {
    const progress = new Progress.Line({ type: 'vertical', total: 100, color: 'magenta' });
    progress.start('Fill level...');
    for (let i = 0; i <= 100; i += 25) {
      progress.update(`Level: ${i}%`, i);
      await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    }
    progress.stop('Full!');
  });

  await t.step('should clamp vertical progress exceeding total', async () => {
    const progress = new Progress.Line({ type: 'vertical', total: 10, color: 0xD070D0 });
    progress.start('Testing vertical clamp...');
    progress.update('Over max...', 15);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS / 2));
    progress.stop('Done!');
  });

  await t.step('should default total to 1 when not provided', () => {
    const progress = new Progress.Line({ type: 'vertical', total: 0 });
    assert(progress);
  });
});

Deno.test('lifecycle', async (t) => {
  await t.step('should handle stop without start gracefully', () => {
    const progress = new Progress.Line();
    progress.stop();
  });

  await t.step('should handle update without start gracefully', () => {
    const progress = new Progress.Line();
    progress.update('This should not throw');
    progress.update('This should not throw', 5);
  });

  await t.step('should restart when start is called while active', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille' });
    progress.start('First message...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.start('Second message...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop();
  });

  await t.step('should show final message on stop', async () => {
    const progress = new Progress.Line({ type: 'horizontal', total: 10, width: 10 });
    progress.start('Processing...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.update('Almost done...', 9);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop('Complete!');
  });

  await t.step('should support sequential use of separate instances for different modes', async () => {
    const spinner = new Progress.Line({ type: 'spinner', index: 'braille', color: 'cyan' });
    spinner.start('First task...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    spinner.stop('First done!');

    const bouncer = new Progress.Line({ type: 'bounce', index: 'comet', color: 'purple' });
    bouncer.start('Second task...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    bouncer.stop('Second done!');

    const bar = new Progress.Line({ type: 'horizontal', total: 5, width: 10, color: 'green' });
    bar.start('Third task...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    bar.update('Third task...', 3);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    bar.stop('Third done!');

    const fill = new Progress.Line({ type: 'vertical', total: 10, color: 'orange' });
    fill.start('Fourth task...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    fill.update('Fourth task...', 7);
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    fill.stop('Fourth done!');
  });
});

Deno.test('color', async (t) => {
  await t.step('should accept named color strings', () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille', color: 'red' });
    assert(progress);
  });

  await t.step('should accept hex color numbers', () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille', color: 0xFF8800 });
    assert(progress);
  });

  await t.step('should default color when not specified', () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille' });
    assert(progress);
  });

  await t.step('should fall back to default for unrecognized color names', async () => {
    const progress = new Progress.Line({ type: 'spinner', index: 'braille', color: 'nonexistent' });
    progress.start('Testing fallback...');
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    progress.stop();
  });

  await t.step('should accept color on bounce type', () => {
    const progress = new Progress.Line({ type: 'bounce', index: 'ball', color: 'purple' });
    assert(progress);
  });
});
