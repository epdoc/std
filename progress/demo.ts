/**
 * Demonstration of the Progress.Line class.
 * Run with: deno run -A progress/demo.ts
 */

import { blocks, favSpinners } from './src/consts.ts';
import * as Progress from './src/mod.ts';

// Helper function for delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Spinner demos — one per spinner index, each with a different color
// ---------------------------------------------------------------------------

async function demoSpinner(index: Progress.Spinner) {
  console.log(`=== Spinner: ${index} (color: cyan) ===\n`);
  const progress = new Progress.Line({ type: 'spinner', index: index, color: 'cyan' });
  progress.start('Initializing...');
  await delay(600);
  progress.update('Loading configuration...');
  await delay(600);
  progress.update('Connecting to database...');
  await delay(600);
  progress.stop('All tasks completed!');
  console.log('');
}

// ---------------------------------------------------------------------------
// Bounce demos — both bounce indices with different colors
// ---------------------------------------------------------------------------

async function demoBounceParenBall() {
  console.log('=== Bounce: Parenthesized ball (index 0, color: magenta) ===\n');
  const progress = new Progress.Line({ type: 'bounce', index: 'ball', color: 'magenta' });
  progress.start('Deploying to production...');
  await delay(600);
  progress.update('Waiting for health check...');
  await delay(600);
  progress.update('Verifying deployment...');
  await delay(600);
  progress.stop('Deployment successful!');
  console.log('');
}

async function demoBounceSlider() {
  console.log('=== Bounce: Sliding blocks (index 1, color: purple) ===\n');
  const progress = new Progress.Line({ type: 'bounce', index: 'comet', color: 'purple' });
  progress.start('Thinking...');
  await delay(1200);
  progress.update('Still thinking...');
  await delay(1200);
  progress.stop('Thought complete!');
  console.log('');
}

async function demoBounceHexColor() {
  console.log('=== Bounce: Sliding blocks (index 1, color: 0xA060E0) ===\n');
  const progress = new Progress.Line({ type: 'bounce', index: 'comet', color: 0xA060E0 });
  progress.start('Processing request...');
  await delay(1000);
  progress.stop('Request processed!');
  console.log('');
}

// ---------------------------------------------------------------------------
// Horizontal bar demos — varying widths, totals, and colors
// ---------------------------------------------------------------------------

async function demoHorizontalDefault() {
  console.log('=== Horizontal: default width 10, total 20 (color: red) ===\n');
  const totalFiles = 20;
  const progress = new Progress.Line({ type: 'horizontal', total: totalFiles, width: 10, color: 'red' });
  progress.start('Downloading files...');
  for (let i = 0; i <= totalFiles; i++) {
    progress.update(`Downloading file ${i}/${totalFiles}...`, i);
    await delay(80);
  }
  progress.stop('All files downloaded!');
  console.log('');
}

async function demoHorizontalWide() {
  console.log('=== Horizontal: wide bar 30 chars, total 100 (color: blue) ===\n');
  const total = 100;
  const progress = new Progress.Line({ type: 'horizontal', total, width: 30, color: 'blue' });
  progress.start('Processing...');
  for (let i = 0; i <= total; i += 2) {
    progress.update(`Processing ${i}%...`, i);
    await delay(30);
  }
  progress.stop('Processing complete!');
  console.log('');
}

async function demoHorizontalNarrow() {
  console.log('=== Horizontal: narrow bar 5 chars, total 40 (color: 0x50C878) ===\n');
  const total = 40;
  const progress = new Progress.Line({ type: 'horizontal', total, width: 5, color: 0x50C878 });
  progress.start('Fine-grained progress...');
  for (let i = 0; i <= total; i++) {
    progress.update(`Progress: ${i}/${total}`, i);
    await delay(50);
  }
  progress.stop('Complete!');
  console.log('');
}

async function demoHorizontalFileProcessing() {
  console.log('=== Horizontal: file processing simulation (color: orange) ===\n');
  const files = ['document.pdf', 'image.png', 'data.csv', 'archive.zip', 'readme.md'];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = new Progress.Line({ type: 'horizontal', total: files.length, width: 10, color: 'orange' });
    progress.start(`Processing ${file} (${i + 1}/${files.length})...`);
    progress.update(`Processing ${file}...`, i + 1);
    await delay(400);
    progress.stop(`✓ ${file} processed`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Vertical fill demos — varying totals and colors
// ---------------------------------------------------------------------------

async function demoVerticalBasic() {
  console.log('=== Vertical: basic fill, total 8 (color: yellow) ===\n');
  const progress = new Progress.Line({ type: 'vertical', total: 8, color: 'yellow' });
  progress.start('Volume level...');
  for (let i = 0; i <= 8; i++) {
    progress.update(`Level: ${i}/8`, i);
    await delay(300);
  }
  progress.stop('Maximum reached!');
  console.log('');
}

async function demoVerticalPercentage() {
  console.log('=== Vertical: percentage fill, total 100 (color: purple) ===\n');
  const progress = new Progress.Line({ type: 'vertical', total: 100, color: 'purple' });
  progress.start('Battery level...');
  for (let i = 0; i <= 100; i += 10) {
    progress.update(`Battery: ${i}%`, i);
    await delay(200);
  }
  progress.stop('Fully charged!');
  console.log('');
}

async function demoVerticalHexColor() {
  console.log('=== Vertical: hex color 0x20D0D0, total 50 ===\n');
  const progress = new Progress.Line({ type: 'vertical', total: 50, color: 0x20D0D0 });
  progress.start('Signal strength...');
  for (let i = 0; i <= 50; i += 5) {
    progress.update(`Signal: ${Math.round((i / 50) * 100)}%`, i);
    await delay(150);
  }
  progress.stop('Full signal!');
  console.log('');
}

// ---------------------------------------------------------------------------
// Mixed mode demo — sequential use of separate instances
// ---------------------------------------------------------------------------

async function demoMixedModes() {
  console.log('=== Mixed Modes: spinner → bounce → horizontal → vertical ===\n');

  // Spinner for connection phase
  const spinner = new Progress.Line({ type: 'spinner', index: 'brailleDots', color: 'cyan' });
  spinner.start('Connecting to server...');
  await delay(800);
  spinner.stop('Connected!');

  // Bounce for thinking phase
  const bouncer = new Progress.Line({ type: 'bounce', index: 'ball', color: 'purple' });
  bouncer.start('Analyzing request...');
  await delay(1000);
  bouncer.stop('Analysis complete!');

  // Horizontal bar for download phase
  const fileSize = 100;
  const bar = new Progress.Line({ type: 'horizontal', total: fileSize, width: 15, color: 'green' });
  bar.start(`Downloading package (${fileSize} MB)...`);
  for (let i = 0; i <= fileSize; i += 10) {
    bar.update(`Downloading... ${i}%`, i);
    await delay(80);
  }
  bar.stop('Download complete!');

  // Vertical fill for installation phase
  const stages = 5;
  const fill = new Progress.Line({ type: 'vertical', total: stages, color: 'magenta' });
  fill.start('Installing...');
  const labels = ['Extracting...', 'Compiling...', 'Linking...', 'Configuring...', 'Finalizing...'];
  for (let i = 0; i <= stages; i++) {
    fill.update(labels[Math.min(i, labels.length - 1)], i);
    await delay(400);
  }
  fill.stop('Installation complete!');

  console.log('');
}

// ---------------------------------------------------------------------------
// Width comparison demo — same data, different bar widths
// ---------------------------------------------------------------------------

async function demoWidthComparison() {
  console.log('=== Horizontal: width comparison (5, 10, 30 chars) ===\n');
  const total = 10;

  for (const width of [5, 10, 30]) {
    const progress = new Progress.Line({ type: 'horizontal', total, width, color: 'red' });
    progress.start(`${width}-char width bar...`);
    for (let i = 0; i <= total; i += 0.25) {
      progress.update(`Progress: ${i.toFixed(1)}/${total}`, i);
      await delay(20);
    }
    progress.stop(`Done with ${width}-char bar!`);
    await delay(200);
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// Run all demos
// ---------------------------------------------------------------------------

async function main() {
  // Spinner demos (3 spinner indices)
  for (const index of Object.keys(blocks.spinner)) {
    await demoSpinner(index as Progress.Spinner);
    await delay(600);
  }

  console.log('=== Favourite spinners ===\n');

  for (const index of favSpinners) {
    await demoSpinner(index as Progress.Spinner);
    await delay(600);
  }

  // Bounce demos (2 bounce indices)
  await demoBounceParenBall();
  await delay(300);
  await demoBounceSlider();
  await delay(300);
  await demoBounceHexColor();
  await delay(300);

  // Horizontal bar demos
  await demoHorizontalDefault();
  await delay(300);
  await demoHorizontalWide();
  await delay(300);
  await demoHorizontalNarrow();
  await delay(300);
  await demoHorizontalFileProcessing();
  await delay(300);

  // Vertical fill demos
  await demoVerticalBasic();
  await delay(300);
  await demoVerticalPercentage();
  await delay(300);
  await demoVerticalHexColor();
  await delay(300);

  // Mixed and comparison demos
  await demoMixedModes();
  await delay(300);
  await demoWidthComparison();
}

if (import.meta.main) {
  main().catch(console.error);
}
