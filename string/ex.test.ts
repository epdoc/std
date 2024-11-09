import { expect } from 'jsr:@std/expect';
import { describe } from 'jsr:@std/testing/bdd';
import { StringEx } from './ex.ts';

describe('StringEx', () => {
  Deno.test('pluralize', () => {
    expect(StringEx('body').pluralize(1, 'bodies')).toBe('body');
    expect(StringEx('body').pluralize(2, 'bodies')).toBe('bodies');
    expect(StringEx('body').pluralize(0, 'bodies')).toBe('bodies');
    expect(StringEx('bird').pluralize(0)).toBe('birds');
    expect(StringEx('bird').pluralize(1)).toBe('bird');
    expect(StringEx('bird').pluralize(3)).toBe('birds');
  });
  Deno.test('tabs', () => {
    expect(StringEx('body').countTabsAtBeginningOfString()).toBe(0);
    expect(StringEx('\tbody').countTabsAtBeginningOfString()).toBe(1);
    expect(StringEx('\t\tbody').countTabsAtBeginningOfString()).toBe(2);
  });
  Deno.test('rightPadAndTruncate', () => {
    expect(StringEx('body').rightPadAndTruncate(6)).toBe('body  ');
    expect(StringEx('body').rightPadAndTruncate(6, 'x')).toBe('bodyxx');
    expect(StringEx('body').rightPadAndTruncate(5, ' ')).toBe('body ');
    expect(StringEx('body').rightPadAndTruncate(4)).toBe('body');
    expect(StringEx('body').rightPadAndTruncate(3)).toBe('bod');
    expect(StringEx('body').rightPadAndTruncate(2)).toBe('bo');
  });
  Deno.test('hexEncode', () => {
    expect(StringEx('body').hexEncode()).toBe('0062006f00640079');
  });
});
