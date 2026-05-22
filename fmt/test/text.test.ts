import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { countLeadingTabs, createTable, hexEncode, padCenter, padLeft, padRight, pluralize, wrap } from '../src/mod.ts';

describe('wrap', () => {
  test('basic wrapping', () => {
    const result = wrap('The quick brown fox jumps over the lazy dog', 20);
    expect(result).toEqual([
      'The quick brown fox',
      'jumps over the lazy',
      'dog',
    ]);
  });

  test('preserves existing newlines', () => {
    const result = wrap('Line one\nLine two', 20);
    expect(result).toEqual(['Line one', 'Line two']);
  });

  test('handles empty string', () => {
    expect(wrap('', 10)).toEqual([]);
  });

  test('handles word longer than maxWidth', () => {
    const result = wrap('supercalifragilisticexpialidocious', 10);
    expect(result).toEqual([
      'supercalif',
      'ragilistic',
      'expialidoc',
      'ious',
    ]);
  });

  test('preserves empty lines', () => {
    const result = wrap('hello\n\nworld', 10);
    expect(result).toEqual(['hello', '', 'world']);
  });
});

describe('pluralize', () => {
  test('pluralize', () => {
    expect(pluralize('body', 1, 'bodies')).toBe('body');
    expect(pluralize('body', 2, 'bodies')).toBe('bodies');
    expect(pluralize('body', 0, 'bodies')).toBe('bodies');
    expect(pluralize('bird', 0)).toBe('birds');
    expect(pluralize('bird', 1)).toBe('bird');
    expect(pluralize('bird', 3)).toBe('birds');
  });
});

describe('tabs', () => {
  test('countLeadingTabs', () => {
    expect(countLeadingTabs('body')).toBe(0);
    expect(countLeadingTabs('\tbody')).toBe(1);
    expect(countLeadingTabs('\t\tbody')).toBe(2);
  });
});

describe('padRight', () => {
  test('padRight', () => {
    expect(padRight('body', 6)).toBe('body  ');
    expect(padRight('body', 11)).toBe('body       ');
    expect(padRight('body', 6, 'x')).toBe('bodyxx');
    expect(padRight('body', 5, ' ')).toBe('body ');
    expect(padRight('body', 4)).toBe('body');
    expect(padRight('body', 3)).toBe('bod');
    expect(padRight('body', 2)).toBe('bo');
    expect(padRight('body', 3, 'x', false)).toBe('body');
    expect(padRight('body', 2, 'x', false)).toBe('body');
  });
});

describe('padLeft', () => {
  test('padLeft', () => {
    expect(padLeft('body', 6)).toBe('  body');
    expect(padLeft('body', 11)).toBe('       body');
    expect(padLeft('body', 6, 'x')).toBe('xxbody');
    expect(padLeft('body', 5, ' ')).toBe(' body');
    expect(padLeft('body', 4)).toBe('body');
    expect(padLeft('body', 3)).toBe('bod');
    expect(padLeft('body', 2)).toBe('bo');
    expect(padLeft('body', 3, 'x', false)).toBe('body');
    expect(padLeft('body', 2, 'x', false)).toBe('body');
  });
});

describe('padCenter', () => {
  test('padCenter', () => {
    expect(padCenter('body', 6)).toBe(' body ');
    expect(padCenter('body', 11)).toBe('   body    ');
    expect(padCenter('body', 6, 'x')).toBe('xbodyx');
    expect(padCenter('body', 5, ' ')).toBe('body ');
    expect(padCenter('body', 4)).toBe('body');
    expect(padCenter('body', 3)).toBe('bod');
    expect(padCenter('body', 2)).toBe('bo');
    expect(padCenter('body', 3, 'x', false)).toBe('body');
    expect(padCenter('body', 2, 'x', false)).toBe('body');
  });
});

describe('hexEncode', () => {
  test('hexEncode', () => {
    expect(hexEncode('body')).toBe('0062006f00640079');
  });
});

describe('createTable', () => {
  test('empty array', () => {
    expect(createTable([], 80, 2)).toEqual([]);
  });

  test('single column when too wide', () => {
    const result = createTable(['supercalifragilistic'], 10, 2);
    expect(result).toEqual(['supercalifragilistic']);
  });

  test('multiple columns', () => {
    const result = createTable(['a', 'bb', 'ccc', 'd', 'ee'], 10, 2);
    // max length is 3, colWidth = 5
    // numColumns = floor(10 / 5) = 2
    expect(result).toEqual(['a    bb', 'ccc  d', 'ee']);
  });

  test('custom padding', () => {
    const result = createTable(['x', 'yy'], 10, 4);
    // max length = 2, colWidth = 6
    // numColumns = floor(10 / 6) = 1
    expect(result).toEqual(['x', 'yy']);
  });

  test('all fit on one row', () => {
    const result = createTable(['a', 'b', 'c'], 20, 2);
    // max length = 1, colWidth = 3
    // numColumns = floor(20 / 3) = 6
    expect(result).toEqual(['a  b  c']);
  });
});
