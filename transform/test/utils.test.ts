import { assertEquals } from '@std/assert';
import { msubLite } from '../src/mod.ts';

Deno.test('utils', async (t) => {
  await t.step('msubLite', async (t) => {
    await t.step('replaces simple keys', () => {
      assertEquals(msubLite('Hello ${name}!', { name: 'World' }), 'Hello World!');
    });
    await t.step('leaves unknown keys unchanged', () => {
      assertEquals(msubLite('Hello ${name}!', {}), 'Hello ${name}!');
    });
    await t.step('works with custom delimiters', () => {
      assertEquals(msubLite('Hello <<name>>!', { name: 'World' }, '<<', '>>'), 'Hello World!');
    });
    await t.step('replaces multiple occurrences', () => {
      assertEquals(msubLite('${a} and ${a}', { a: 'x' }), 'x and x');
    });
    await t.step('works with adjacent keys', () => {
      assertEquals(msubLite('${a}${b}', { a: 'x', b: 'y' }), 'xy');
    });
    await t.step('returns original string if no replacements', () => {
      assertEquals(msubLite('no keys here', { a: 'x' }), 'no keys here');
    });
    await t.step('handles empty string', () => {
      assertEquals(msubLite('', { a: 'x' }), '');
    });
    await t.step('handles missing delimiters gracefully', () => {
      assertEquals(msubLite('Hello ${name}!', { name: 'World' }, '', ''), 'Hello ${name}!');
    });
  });
});
