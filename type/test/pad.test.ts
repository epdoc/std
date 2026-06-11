import { assertEquals } from '@std/assert';
import { pad } from '../src/mod.ts';

Deno.test('pad', async (t) => {
  await t.step('numbers (default pad: "0")', () => {
    assertEquals(pad(32, 4), '0032');
    assertEquals(pad(7, 3), '007');
    assertEquals(pad(123, 5), '00123');

    assertEquals(pad(32, -4), '32  ');
    assertEquals(pad(7, -3), '7  ');
    assertEquals(pad(123, -5), '123  ');

    assertEquals(pad(12345, 5), '12345');
    assertEquals(pad(12345, 3), '12345');
    assertEquals(pad(12345, -3), '12345');

    assertEquals(pad(0, 5), '00000');
    assertEquals(pad(-42, 5), '-0042');
    assertEquals(pad(-42, 6), '-00042');

    assertEquals(pad(3.14, 6), '003.14');
    assertEquals(pad(3.14, -6), '3.14  ');
    assertEquals(pad(1.5, 4), '01.5');
  });

  await t.step('strings (default pad: " ")', () => {
    assertEquals(pad('hello', 10), '     hello');
    assertEquals(pad('AB', 5), '   AB');
    assertEquals(pad('test', 6), '  test');

    assertEquals(pad('hello', -10), 'hello     ');
    assertEquals(pad('AB', -5), 'AB   ');
    assertEquals(pad('test', -6), 'test  ');

    assertEquals(pad('hello', 5), 'hello');
    assertEquals(pad('hello', 3), 'hello');
    assertEquals(pad('hello', -3), 'hello');

    assertEquals(pad('', 3), '   ');
    assertEquals(pad('', -3), '   ');
    assertEquals(pad('', 0), '');

    assertEquals(pad('42', 5), '   42');
    assertEquals(pad('007', 6), '   007');
    assertEquals(pad('123', -4), '123 ');
  });

  await t.step('explicit pad character (overrides default)', () => {
    assertEquals(pad(32, 4, '*'), '**32');
    assertEquals(pad(7, 3, ' '), '  7');
    assertEquals(pad(123, 5, '-'), '--123');

    assertEquals(pad('hello', 10, '.'), '.....hello');
    assertEquals(pad('AB', 5, '0'), '000AB');
    assertEquals(pad('test', 6, '-'), '--test');

    assertEquals(pad(42, 10, 'ab'), 'aaaaaaaa42');
    assertEquals(pad('hi', 8, '+-'), '++++++hi');

    assertEquals(pad(7, 4, '\t'), '\t\t\t7');
    assertEquals(pad('x', 3, '\n'), '\n\nx');
  });

  await t.step('edge cases and boundaries', () => {
    assertEquals(pad(42, 0), '42');
    assertEquals(pad('hello', 0), 'hello');
    assertEquals(pad(42, -0), '42');

    assertEquals(pad(7, 1000).length, 1000);
    assertEquals(pad('x', -500).length, 500);

    assertEquals(pad(5, 1), '5');
    assertEquals(pad(5, 2), '05');
    assertEquals(pad('x', 1), 'x');
    assertEquals(pad('x', 2), ' x');

    assertEquals(pad(12345, 5), '12345');
    assertEquals(pad('hello', 5), 'hello');
    assertEquals(pad(12345, -5), '12345');
    assertEquals(pad('hello', -5), 'hello');

    assertEquals(pad(42, 4.7), '0042');
    assertEquals(pad(42, -4.2), '42  ');

    assertEquals(pad(Infinity, 10), '  Infinity');
    assertEquals(pad(-Infinity, 12), '   -Infinity');
    assertEquals(pad(NaN, 5), '  NaN');
  });

  await t.step('type coercion behavior', () => {
    // @ts-expect-error - testing runtime behavior
    assertEquals(pad(true, 5), ' true');
    // @ts-expect-error - testing runtime behavior
    assertEquals(pad(false, 6), ' false');
    // @ts-expect-error - testing runtime behavior
    assertEquals(pad(null, 5), ' null');
    // @ts-expect-error - testing runtime behavior
    assertEquals(pad(undefined, 9), 'undefined');

    assertEquals(pad('32', 4), '  32');
    assertEquals(pad('007', 5), '  007');

    // @ts-expect-error - testing runtime behavior
    assertEquals(pad(new Number(42), 5), '00042');
  });

  await t.step('real-world scenarios', () => {
    const ids = [1, 23, 456].map((id) => pad(id, 6));
    assertEquals(ids, ['000001', '000023', '000456']);

    const names = ['Alice', 'Bob', 'Charlie'].map((name) => pad(name, -10));
    assertEquals(names, ['Alice     ', 'Bob       ', 'Charlie   ']);

    assertEquals(pad((255).toString(16).toUpperCase(), 4, '0'), '00FF');

    const amounts = [12.5, 123.45, 7].map((amt) => pad(amt.toFixed(2), 8, '0'));
    assertEquals(amounts, ['00012.50', '00123.45', '00007.00']);

    const progress = 75;
    const bar = pad('', -20, '█').slice(0, progress / 5) +
      pad('', 20 - progress / 5, '░');
    assertEquals(bar, '███████████████░░░░░');
  });
});
