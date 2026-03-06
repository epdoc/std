/**
 * Demonstration of the ProgressLine class.
 * Run with: deno run -A progress/demo.ts
 */

import { HorizontalOptions, ProgressLine } from './mod.ts';

// Helper function for delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoSpinnerMode() {
  console.log('=== Spinner Mode Demo ===\n');

  const progress = new ProgressLine();

  // Simulate a task with spinner (no chunks specified)
  progress.start('Initializing...');
  await delay(800);

  progress.update('Loading configuration...');
  await delay(800);

  progress.update('Connecting to database...');
  await delay(800);

  progress.update('Fetching data...');
  await delay(800);

  progress.stop('All tasks completed successfully!');
  console.log('');
}

async function demoProgressBarMode() {
  console.log('=== Progress Bar Mode Demo ===\n');

  const progress = new ProgressLine({ type: 'spinner', index: 1 });
  const totalFiles = 20;

  // Start with progress bar mode (20 chunks, default 10-char width)
  progress.start(`Downloading ${totalFiles} files...`, totalFiles);

  for (let i = 0; i <= totalFiles; i++) {
    progress.update(`Downloading file ${i}/${totalFiles}...`, i);
    await delay(100);
  }

  progress.stop('All files downloaded!');
  console.log('');
}

async function demoProgressBarWithCustomWidth() {
  console.log('=== Progress Bar with Custom Width Demo ===\n');

  const progress = new ProgressLine({ type: 'spinner', index: 2 });
  const totalItems = 50;

  // Start with custom width of 20 characters
  progress.start(`Processing ${totalItems} items...`, totalItems, 20);

  for (let i = 0; i <= totalItems; i += 5) {
    progress.update(`Processing item ${i}/${totalItems}...`, i);
    await delay(150);
  }

  progress.stop('Processing complete!');
  console.log('');
}

async function demoFileProcessing() {
  console.log('=== File Processing with Progress Bar ===\n');

  const files = ['document.pdf', 'image.png', 'data.csv', 'archive.zip', 'readme.md'];
  const progress = new ProgressLine();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progress.start(`Processing ${file} (${i + 1}/${files.length})...`, files.length, 10);
    progress.update(`Processing ${file}...`, i + 1);
    await delay(600);
    progress.stop(`✓ ${file} processed`);
  }

  console.log('');
}

async function demoMixedModes() {
  console.log('=== Mixed Modes Demo ===\n');

  const progress = new ProgressLine();

  // Start with spinner for unknown duration task
  progress.start('Connecting to server...');
  await delay(800);
  progress.stop('Connected!');

  // Switch to progress bar for download
  const fileSize = 100;
  const fileProgress = new ProgressLine({ type: 'horizontal', total: fileSize, width: 10 });
  fileProgress.start(`Downloading package (${fileSize} MB)...`, fileSize, 15);

  for (let i = 0; i <= fileSize; i += 10) {
    fileProgress.update(`Downloading... ${i}%`, i);
    await delay(100);
  }

  fileProgress.stop('Download complete!');

  // Back to spinner for installation
  progress.start('Installing package...');
  await delay(600);
  progress.update('Configuring package...');
  await delay(600);
  progress.stop('Installation complete!');

  console.log('');
}

async function demoProgressComparison() {
  console.log('=== Progress Bar Width Comparison ===\n');

  const opts: HorizontalOptions = { type: 'horizontal', total: 10, width: 10 };

  // 10-character width (default)
  const progress1 = new ProgressLine(opts);
  progress1.start('10-char width progress bar...');
  for (let i = 0; i <= opts.total; i++) {
    progress1.update(`Progress: ${i}/${opts.total}`, i);
    await delay(80);
  }
  progress1.stop('Done with 10-char bar!');
  await delay(300);

  // 5-character width
  opts.width = 5;
  const progress2 = new ProgressLine(opts);
  progress2.start('5-char width progress bar...');
  for (let i = 0; i <= opts.total; i += 0.125) {
    progress2.update(`Progress: ${i}/${opts.total}`, i);
    await delay(40);
  }
  progress2.stop('Done with 5-char bar!');
  await delay(300);

  // 30-character width
  opts.width = 30;
  const progress3 = new ProgressLine(opts);
  progress3.start('30-char width progress bar...');
  for (let i = 0; i <= opts.total; i += 0.4) {
    progress3.update(`Progress: ${i}/${opts.total}`, i);
    await delay(50);
  }
  progress3.stop('Done with 30-char bar!');

  console.log('');
}

// Run all demos
async function main() {
  // await demoSpinnerMode();
  // await delay(500);

  // await demoProgressBarMode();
  // await delay(500);

  // await demoProgressBarWithCustomWidth();
  // await delay(500);

  // await demoFileProcessing();
  // await delay(500);

  // await demoMixedModes();
  // await delay(500);

  await demoProgressComparison();
}

if (import.meta.main) {
  main().catch(console.error);
}
