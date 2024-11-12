import { dateEx } from '@epdoc/datetime';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { StringEx, msub } from './mod.ts';

describe('StringEx', () => {
  test('pluralize', () => {
    expect(StringEx('body').pluralize(1, 'bodies')).toBe('body');
    expect(StringEx('body').pluralize(2, 'bodies')).toBe('bodies');
    expect(StringEx('body').pluralize(0, 'bodies')).toBe('bodies');
    expect(StringEx('bird').pluralize(0)).toBe('birds');
    expect(StringEx('bird').pluralize(1)).toBe('bird');
    expect(StringEx('bird').pluralize(3)).toBe('birds');
  });
  test('tabs', () => {
    expect(StringEx('body').countLeadingTabs()).toBe(0);
    expect(StringEx('\tbody').countLeadingTabs()).toBe(1);
    expect(StringEx('\t\tbody').countLeadingTabs()).toBe(2);
  });
  test('rightPadAndTruncate', () => {
    expect(StringEx('body').rightPadAndTruncate(6)).toBe('body  ');
    expect(StringEx('body').rightPadAndTruncate(6, 'x')).toBe('bodyxx');
    expect(StringEx('body').rightPadAndTruncate(5, ' ')).toBe('body ');
    expect(StringEx('body').rightPadAndTruncate(4)).toBe('body');
    expect(StringEx('body').rightPadAndTruncate(3)).toBe('bod');
    expect(StringEx('body').rightPadAndTruncate(2)).toBe('bo');
  });
  test('hexEncode', () => {
    expect(StringEx('body').hexEncode()).toBe('0062006f00640079');
  });
});
describe('msub', () => {
  test('key value', () => {
    expect(msub.init().replace('My ${body}', { body: 'eyes' })).toBe('My eyes');
    expect(msub.init({ open: '%<{' }).replace('My %<{body}>', { body: 'nose' })).toBe('My nose');
    expect(msub.replace('You have two %<{body}>', { body: 'knees' })).toBe('You have two knees');
    expect(msub.init({ open: '%<{', close: '}' }).replace('You have two %<{body}', { body: 'elbows' })).toBe(
      'You have two elbows'
    );
    // expect(
    //   msub.init({ uppercase: true }).replace('You have two ${BODY_DOUBLE}', { bodyDouble: 'thumbs' })
    // ).toBe('You have two thumbs');
  });
  test('array replacement', () => {
    expect(
      msub.init().replace('This ${0} of ${1} actually belongs in the string', ['instance', 'string'])
    ).toBe('This instance of string actually belongs in the string');
  });
  test('number replacement', () => {
    expect(msub.init().replace('We have ${a:toFixed:3} metres of steel', { a: 32.3444 })).toBe(
      'We have 32.344 metres of steel'
    );
    expect(msub.replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 })).toBe(
      'There are 1.6 hours remaining'
    );
  });
  test('date formatting', () => {
    expect(msub.replace('The year is ${a:getFullYear}', { a: new Date(100 * 24 * 3600 * 1000) })).toBe(
      'The year is 1970'
    );
    expect(
      msub.init().replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') })
    ).toBe('The date is 2024-11-15T00:00:00.000Z');
    expect(
      msub.init({ format: fmt1 }).replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') })
    ).toBe('The date is 2024-11-15T00:00:00.000Z');
  });
  test('date custom formatting', () => {
    const fmt1 = (_d: Date, _f: string) => {
      return dateEx().toISOLocalString();
    };
    const fmt2 = (d: Date, f: string) => {
      return dateEx(d).format(f);
    };
    expect(
      msub.init({ format: fmt1 }).replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') })
    ).toBe('The date is 2024-11-15T00:00:00.000Z');
  });
});
