#!/usr/bin/env -S deno run
/**
 * Example demonstrating internationalization support in the humanize function
 */

import { humanize, supportedLocales } from '../src/mod.ts';

console.log('=== Duration Humanization with Internationalization ===\n');

const durations = [
  { ms: 0, label: 'Now' },
  { ms: 1500, label: 'A moment' },
  { ms: 30000, label: '30 seconds' },
  { ms: 300000, label: '5 minutes' },
  { ms: 3600000, label: '1 hour' },
  { ms: 86400000, label: '1 day' },
  { ms: 604800000, label: '1 week' },
  { ms: 2592000000, label: '1 month' },
  { ms: 31536000000, label: '1 year' },
];

console.log('Supported locales:', supportedLocales.join(', '));
console.log();

// Demonstrate basic humanization across languages
durations.forEach(({ ms, label }) => {
  console.log(`${label} (${ms}ms):`);
  console.log(`  English: ${humanize(ms, { locale: 'en' })}`);
  console.log(`  French:  ${humanize(ms, { locale: 'fr' })}`);
  console.log(`  Spanish: ${humanize(ms, { locale: 'es' })}`);
  console.log(`  Chinese: ${humanize(ms, { locale: 'zh' })}`);
  console.log();
});

console.log('=== With Suffixes (Past/Future) ===\n');

const suffixExamples = [
  { ms: 30000, label: '30 seconds (future)' },
  { ms: -30000, label: '30 seconds (past)' },
  { ms: 3600000, label: '1 hour (future)' },
  { ms: -3600000, label: '1 hour (past)' },
];

suffixExamples.forEach(({ ms, label }) => {
  console.log(`${label}:`);
  console.log(`  English: ${humanize(ms, { locale: 'en', withSuffix: true })}`);
  console.log(`  French:  ${humanize(ms, { locale: 'fr', withSuffix: true })}`);
  console.log(`  Spanish: ${humanize(ms, { locale: 'es', withSuffix: true })}`);
  console.log(`  Chinese: ${humanize(ms, { locale: 'zh', withSuffix: true })}`);
  console.log();
});

console.log('=== Backward Compatibility ===\n');
console.log('Legacy boolean parameter still works:');
console.log(`humanize(30000, true): ${humanize(30000, true)}`);
console.log(`humanize(-30000, true): ${humanize(-30000, true)}`);
