import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { ProgressLine } from '../mod.ts';

describe('ProgressLine', () => {
  test('should create instance', () => {
    const progress = new ProgressLine();
    expect(progress).toBeDefined();
  });

  test('should start and stop with spinner mode', async () => {
    const progress = new ProgressLine();
    progress.start('Testing...');

    // Let it run briefly
    await new Promise((resolve) => setTimeout(resolve, 200));

    progress.stop();
  });

  test('should start with progress bar mode', async () => {
    const progress = new ProgressLine();
    progress.start('Downloading...', 20);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update progress to halfway
    progress.update('Downloading...', 10);
    await new Promise((resolve) => setTimeout(resolve, 100));

    progress.stop('Download complete!');
  });

  test('should update progress bar correctly', async () => {
    const progress = new ProgressLine();
    progress.start('Processing...', 10, 20);

    // Update to 25%
    progress.update('Processing...', 2.5);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update to 50%
    progress.update('Processing...', 5);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update to 100%
    progress.update('Processing...', 10);
    await new Promise((resolve) => setTimeout(resolve, 100));

    progress.stop('Processing complete!');
  });

  test('should show final message on stop without progress bar', async () => {
    const progress = new ProgressLine();
    progress.start('Processing...', 10);

    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.update('Almost done...', 9);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Stop should show only the message, no progress bar
    progress.stop('Complete!');
  });

  test('should handle multiple start/stop cycles with different modes', async () => {
    const progress = new ProgressLine();

    // Spinner mode
    progress.start('First task...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.stop('First done!');

    // Progress bar mode
    progress.start('Second task...', 5);
    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.update('Second task...', 3);
    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.stop('Second done!');

    // Spinner mode again
    progress.start('Third task...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.stop('Third done!');
  });

  test('should handle stop without start gracefully', () => {
    const progress = new ProgressLine();
    progress.stop();
  });

  test('should handle update without start gracefully', () => {
    const progress = new ProgressLine();
    progress.update('This should not throw');
    progress.update('This should not throw', 5);
  });

  test('should restart when start is called while active', async () => {
    const progress = new ProgressLine();
    progress.start('First message...');
    await new Promise((resolve) => setTimeout(resolve, 100));

    progress.start('Second message...', 10);
    await new Promise((resolve) => setTimeout(resolve, 100));
    progress.update('Second message...', 5);
    await new Promise((resolve) => setTimeout(resolve, 100));

    progress.stop();
  });

  test('should handle edge cases for progress values', async () => {
    const progress = new ProgressLine();
    progress.start('Testing edges...', 10, 10);

    // Progress of 0
    progress.update('Starting...', 0);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Progress equal to chunks (100%)
    progress.update('Complete...', 10);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Progress greater than chunks (should cap or handle gracefully)
    progress.update('Overcomplete...', 15);
    await new Promise((resolve) => setTimeout(resolve, 50));

    progress.stop('Done!');
  });

  test('should show fine-grained progress with partial blocks', async () => {
    const progress = new ProgressLine();
    // Small bar width (5) with many chunks (40) to demonstrate partial blocks
    // Each character represents 8 chunks worth of progress
    progress.start('Fine-grained progress...', 40, 5);

    // Progress through each 1/8 increment to show partial blocks
    for (let i = 0; i <= 40; i += 1) {
      progress.update(`Progress: ${i}/40`, i);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    progress.stop('Complete!');
  });
});
