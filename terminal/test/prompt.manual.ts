#!/usr/bin/env -S deno run -SERW
/**
 * Interactive test for prompt utilities.
 *
 * This test requires a human tester to verify that prompts work correctly.
 * Run with: deno run -SERW test/prompt.manual.ts
 *
 * The tester will be asked to respond to prompts and confirm whether
 * the behavior matches expectations.
 */

import { promptUser } from '../src/prompt.ts';
import * as screen from '../src/screen.ts';

interface TestResult {
  name: string;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function askTester(question: string): Promise<boolean> {
  const answer = await promptUser(`${question} (yes/no):`);
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  screen.writeSync(`\n${'='.repeat(60)}\n`);
  screen.writeSync(`Test: ${name}\n`);
  screen.writeSync(`${'='.repeat(60)}\n\n`);

  try {
    await fn();
  } catch (err) {
    screen.writeSync(`\n❌ Test error: ${err.message}\n`);
    results.push({ name, passed: false, notes: `Error: ${err.message}` });
  }
}

async function main(): Promise<void> {
  screen.writeSync('\n');
  screen.writeSync('╔══════════════════════════════════════════════════════════╗\n');
  screen.writeSync('║     INTERACTIVE PROMPT TEST                              ║\n');
  screen.writeSync('║     Human tester verification required                   ║\n');
  screen.writeSync('╚══════════════════════════════════════════════════════════╝\n');
  screen.writeSync('\nThis test requires you to interact with prompts and verify behavior.\n');
  screen.writeSync('Press Ctrl+C at any time to exit.\n\n');

  // Test 1: Basic prompt
  await runTest('Basic prompt display and input', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. You should see a prompt asking for your name\n');
    screen.writeSync('2. Type your name and press Enter\n');
    screen.writeSync('3. Verify the prompt was displayed correctly\n\n');

    const name = await promptUser('Please enter your name:');
    screen.writeSync(`\nYou entered: "${name}"\n`);

    const passed = await askTester('Did the prompt display correctly and capture your input?');
    results.push({ name: 'Basic prompt', passed });
  });

  // Test 2: Prompt with space appended
  await runTest('Prompt message formatting', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. Check that the prompt message has a space after the colon\n');
    screen.writeSync('2. The cursor should be positioned after the space\n\n');

    const input = await promptUser('Test message (type anything):');
    screen.writeSync(`\nYou entered: "${input}"\n`);

    const passed = await askTester('Was there a space between the colon and your input?');
    results.push({ name: 'Prompt formatting (space after message)', passed });
  });

  // Test 3: Empty input handling
  await runTest('Empty input (Enter key only)', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. When prompted, press Enter without typing anything\n');
    screen.writeSync('2. Verify that an empty string is returned\n\n');

    const input = await promptUser('Press Enter without typing:');
    screen.writeSync(`\nReturned value: "${input}" (length: ${input.length})\n`);

    const passed = await askTester('Did the function return an empty string?');
    results.push({ name: 'Empty input handling', passed });
  });

  // Test 4: Input trimming
  await runTest('Input trimming (whitespace removal)', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. When prompted, type "hello" with leading/trailing spaces\n');
    screen.writeSync('2. Example: "   hello   "\n');
    screen.writeSync('3. Verify the spaces are trimmed from the result\n\n');

    const input = await promptUser('Type "hello" with spaces around it:');
    screen.writeSync(`\nReturned value: "${input}"\n`);

    const passed = await askTester('Were the leading and trailing spaces removed?');
    results.push({
      name: 'Input trimming',
      passed,
      notes: `Returned: "${input}"`,
    });
  });

  // Test 5: Abort keyword (lowercase)
  await runTest('Abort keyword detection (lowercase)', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. When prompted, type "abort" (lowercase)\n');
    screen.writeSync('2. The function should return an empty string\n\n');

    const input = await promptUser('Type "abort" to cancel:', { abortKeyword: 'abort' });
    screen.writeSync(`\nReturned value: "${input}" (length: ${input.length})\n`);

    const passed = input === '' && await askTester('Did the function return an empty string when "abort" was typed?');
    results.push({
      name: 'Abort keyword (lowercase)',
      passed,
      notes: `Returned: "${input}"`,
    });
  });

  // Test 6: Abort keyword (uppercase - case insensitive)
  await runTest('Abort keyword detection (case insensitive)', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. When prompted, type "ABORT" (uppercase)\n');
    screen.writeSync('2. The function should still return an empty string (case-insensitive match)\n\n');

    const input = await promptUser('Type "ABORT" (uppercase) to cancel:', { abortKeyword: 'abort' });
    screen.writeSync(`\nReturned value: "${input}" (length: ${input.length})\n`);

    const passed = input === '' && await askTester('Did the function return an empty string when "ABORT" was typed?');
    results.push({
      name: 'Abort keyword (case insensitive)',
      passed,
      notes: `Returned: "${input}"`,
    });
  });

  // Test 7: Non-abort input with abort keyword configured
  await runTest('Non-abort input with abort keyword configured', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. When prompted, type something other than "quit"\n');
    screen.writeSync('2. The function should return what you typed\n\n');

    const input = await promptUser('Type anything except "quit":', { abortKeyword: 'quit' });
    screen.writeSync(`\nReturned value: "${input}"\n`);

    const passed = input !== '' && await askTester('Did the function return your input (not empty)?');
    results.push({
      name: 'Non-abort input handling',
      passed,
      notes: `Returned: "${input}"`,
    });
  });

  // Test 8: Custom buffer size
  await runTest('Custom buffer size option', async () => {
    screen.writeSync('Instructions:\n');
    screen.writeSync('1. Type a short message (the buffer size is set to 256 bytes)\n');
    screen.writeSync('2. Verify the input is captured correctly\n\n');

    const input = await promptUser('Type a short message:', { bufferSize: 256 });
    screen.writeSync(`\nReturned value: "${input}"\n`);

    const passed = await askTester('Was your input captured correctly?');
    results.push({
      name: 'Custom buffer size',
      passed,
      notes: `Returned: "${input}"`,
    });
  });

  // Summary
  screen.writeSync('\n');
  screen.writeSync('╔══════════════════════════════════════════════════════════╗\n');
  screen.writeSync('║     TEST SUMMARY                                         ║\n');
  screen.writeSync('╚══════════════════════════════════════════════════════════╝\n\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    screen.writeSync(`${status}: ${result.name}\n`);
    if (result.notes) {
      screen.writeSync(`      ${result.notes}\n`);
    }
  }

  screen.writeSync(`\n${'-'.repeat(40)}\n`);
  screen.writeSync(`Total: ${results.length} tests\n`);
  screen.writeSync(`Passed: ${passed}\n`);
  screen.writeSync(`Failed: ${failed}\n`);
  screen.writeSync(`${'-'.repeat(40)}\n`);

  if (failed === 0) {
    screen.writeSync('\n🎉 All tests passed!\n\n');
  } else {
    screen.writeSync(`\n⚠️  ${failed} test(s) failed. Please review the output above.\n\n`);
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  Deno.exit(1);
});
