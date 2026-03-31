#!/usr/bin/env -S deno run -SERW
/**
 * Manual test script for the pager fix.
 * 
 * This script generates test content and runs the pager with clearScreen: false
 * to verify that scrolling up after pressing SPACE shows clean output without
 * the corruption bug.
 * 
 * Usage:
 *   deno run -SERW ./terminal/test/test-pager.ts
 * 
 * Test steps:
 * 1. The pager will display page 1 of 3
 * 2. Press SPACE to go to page 2
 * 3. Press SPACE to go to page 3
 * 4. Scroll UP in your terminal to verify:
 *    - All lines from all pages are visible
 *    - Line numbers increment sequentially (001, 002, 003, etc.)
 *    - No lines are corrupted or overwritten
 *    - The status lines are properly overwritten (not visible in scrollback)
 * 5. Press 'q' to quit at any time
 */

import { pager } from '../src/mod.ts';

// Generate test content that spans multiple pages
const lines: string[] = [];

// Page 1 content - 15 lines
for (let i = 1; i <= 15; i++) {
  lines.push(`Line ${i.toString().padStart(3, '0')} - Page 1 - This is test content for verifying the pager functionality`);
}

// Page 2 content - 15 lines
for (let i = 16; i <= 30; i++) {
  lines.push(`Line ${i.toString().padStart(3, '0')} - Page 2 - This is test content for verifying the pager functionality`);
}

// Page 3 content - 10 lines
for (let i = 31; i <= 40; i++) {
  lines.push(`Line ${i.toString().padStart(3, '0')} - Page 3 - This is test content for verifying the pager functionality`);
}

console.log('Starting pager test with clearScreen: false');
console.log('Terminal size:', Deno.consoleSize());
console.log('');

const result = await pager.display(lines, {
  pageSize: 20,
  showStatus: true,
  clearScreen: false, // This is the key setting we're testing
  prompt: 'SPACE=next, q=quit',
});

console.log('');
console.log('Pager result:', result);
console.log('Test 1 complete! (clearScreen: false)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Now starting Test 2 with clearScreen: true');
console.log('Press any key to continue...');

// Wait for user to press a key before starting test 2
if (Deno.stdin.isTerminal()) {
  const buf = new Uint8Array(8);
  try {
    Deno.stdin.setRaw(true);
    await Deno.stdin.read(buf);
  } finally {
    Deno.stdin.setRaw(false);
  }
}

console.clear();
console.log('Starting pager test with clearScreen: true');
console.log('');

const result2 = await pager.display(lines, {
  pageSize: 20,
  showStatus: true,
  clearScreen: true, // This is the key setting we're testing
  prompt: 'SPACE=next, q=quit',
});

console.log('');
console.log('Pager result:', result2);
console.log('Test 2 complete! (clearScreen: true)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('All tests complete!');
console.log('');
console.log('Test 1 (clearScreen: false): Scroll up to check all lines are intact.');
console.log('Look for sequential line numbers 001-040. Before the fix, lines would be missing/corrupted.');
console.log('');
console.log('Test 2 (clearScreen: true): Screen should be cleared between pages.');
console.log('The status line should appear on each page and be properly cleaned up.');
