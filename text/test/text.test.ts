import { assertEquals } from '@std/assert';
import { countLeadingTabs, createTable, hexEncode, padCenter, padLeft, padRight, pluralize, wrap } from '../src/mod.ts';

Deno.test('wrap', async (t) => {
  await t.step('basic wrapping', () => {
    const result = wrap('The quick brown fox jumps over the lazy dog', 20);
    assertEquals(result, ['The quick brown fox', 'jumps over the lazy', 'dog']);
  });

  await t.step('preserves existing newlines', () => {
    const result = wrap('Line one\nLine two', 20);
    assertEquals(result, ['Line one', 'Line two']);
  });

  await t.step('handles empty string', () => {
    assertEquals(wrap('', 10), []);
  });

  await t.step('handles word longer than maxWidth', () => {
    const result = wrap('supercalifragilisticexpialidocious', 10);
    assertEquals(result, ['supercalif', 'ragilistic', 'expialidoc', 'ious']);
  });

  await t.step('preserves empty lines', () => {
    const result = wrap('hello\n\nworld', 10);
    assertEquals(result, ['hello', '', 'world']);
  });
});

Deno.test('pluralize', async (t) => {
  await t.step('pluralize', () => {
    assertEquals(pluralize('body', 1, 'bodies'), 'body');
    assertEquals(pluralize('body', 2, 'bodies'), 'bodies');
    assertEquals(pluralize('body', 0, 'bodies'), 'bodies');
    assertEquals(pluralize('bird', 0), 'birds');
    assertEquals(pluralize('bird', 1), 'bird');
    assertEquals(pluralize('bird', 3), 'birds');
  });
});

Deno.test('tabs', async (t) => {
  await t.step('countLeadingTabs', () => {
    assertEquals(countLeadingTabs('body'), 0);
    assertEquals(countLeadingTabs('\tbody'), 1);
    assertEquals(countLeadingTabs('\t\tbody'), 2);
  });
});

Deno.test('padRight', async (t) => {
  await t.step('padRight', () => {
    assertEquals(padRight('body', 6), 'body  ');
    assertEquals(padRight('body', 11), 'body       ');
    assertEquals(padRight('body', 6, 'x'), 'bodyxx');
    assertEquals(padRight('body', 5, ' '), 'body ');
    assertEquals(padRight('body', 4), 'body');
    assertEquals(padRight('body', 3), 'bod');
    assertEquals(padRight('body', 2), 'bo');
    assertEquals(padRight('body', 3, 'x', false), 'body');
    assertEquals(padRight('body', 2, 'x', false), 'body');
  });
});

Deno.test('padLeft', async (t) => {
  await t.step('padLeft', () => {
    assertEquals(padLeft('body', 6), '  body');
    assertEquals(padLeft('body', 11), '       body');
    assertEquals(padLeft('body', 6, 'x'), 'xxbody');
    assertEquals(padLeft('body', 5, ' '), ' body');
    assertEquals(padLeft('body', 4), 'body');
    assertEquals(padLeft('body', 3), 'bod');
    assertEquals(padLeft('body', 2), 'bo');
    assertEquals(padLeft('body', 3, 'x', false), 'body');
    assertEquals(padLeft('body', 2, 'x', false), 'body');
  });
});

Deno.test('padCenter', async (t) => {
  await t.step('padCenter', () => {
    assertEquals(padCenter('body', 6), ' body ');
    assertEquals(padCenter('body', 11), '   body    ');
    assertEquals(padCenter('body', 6, 'x'), 'xbodyx');
    assertEquals(padCenter('body', 5, ' '), 'body ');
    assertEquals(padCenter('body', 4), 'body');
    assertEquals(padCenter('body', 3), 'bod');
    assertEquals(padCenter('body', 2), 'bo');
    assertEquals(padCenter('body', 3, 'x', false), 'body');
    assertEquals(padCenter('body', 2, 'x', false), 'body');
  });
});

Deno.test('hexEncode', async (t) => {
  await t.step('hexEncode', () => {
    assertEquals(hexEncode('body'), '0062006f00640079');
  });
});

Deno.test('createTable', async (t) => {
  await t.step('empty array', () => {
    assertEquals(createTable([], 80, 2), []);
  });

  await t.step('single column when too wide', () => {
    const result = createTable(['supercalifragilistic'], 10, 2);
    assertEquals(result, ['supercalifragilistic']);
  });

  await t.step('multiple columns', () => {
    const result = createTable(['a', 'bb', 'ccc', 'd', 'ee'], 10, 2);
    assertEquals(result, ['a    bb', 'ccc  d', 'ee']);
  });

  await t.step('custom padding', () => {
    const result = createTable(['x', 'yy'], 10, 4);
    assertEquals(result, ['x', 'yy']);
  });

  await t.step('all fit on one row', () => {
    const result = createTable(['a', 'b', 'c'], 20, 2);
    assertEquals(result, ['a  b  c']);
  });
});
