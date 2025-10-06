import { dateEx, TzMinutes } from '@epdoc/datetime';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { msub, StringEx } from './mod.ts';

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
  test('rightPad', () => {
    expect(StringEx('body').rightPad(6)).toBe('body  ');
    expect(StringEx('body').rightPad(11)).toBe('body       ');
    expect(StringEx('body').rightPad(6, 'x')).toBe('bodyxx');
    expect(StringEx('body').rightPad(5, ' ')).toBe('body ');
    expect(StringEx('body').rightPad(4)).toBe('body');
    expect(StringEx('body').rightPad(3)).toBe('bod');
    expect(StringEx('body').rightPad(2)).toBe('bo');
    expect(StringEx('body').rightPad(3, 'x', false)).toBe('body');
    expect(StringEx('body').rightPad(2, 'x', false)).toBe('body');
  });
  test('leftPad', () => {
    expect(StringEx('body').leftPad(6)).toBe('  body');
    expect(StringEx('body').leftPad(11)).toBe('       body');
    expect(StringEx('body').leftPad(6, 'x')).toBe('xxbody');
    expect(StringEx('body').leftPad(5, ' ')).toBe(' body');
    expect(StringEx('body').leftPad(4)).toBe('body');
    expect(StringEx('body').leftPad(3)).toBe('bod');
    expect(StringEx('body').leftPad(2)).toBe('bo');
    expect(StringEx('body').leftPad(3, 'x', false)).toBe('body');
    expect(StringEx('body').leftPad(2, 'x', false)).toBe('body');
  });
  test('center', () => {
    expect(StringEx('body').center(6)).toBe(' body ');
    expect(StringEx('body').center(11)).toBe('   body    ');
    expect(StringEx('body').center(6, 'x')).toBe('xbodyx');
    expect(StringEx('body').center(5, ' ')).toBe('body ');
    expect(StringEx('body').center(4)).toBe('body');
    expect(StringEx('body').center(3)).toBe('bod');
    expect(StringEx('body').center(2)).toBe('bo');
    expect(StringEx('body').center(3, 'x', false)).toBe('body');
    expect(StringEx('body').center(2, 'x', false)).toBe('body');
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
      'You have two elbows',
    );
    // expect(
    //   msub.init({ uppercase: true }).replace('You have two ${BODY_DOUBLE}', { bodyDouble: 'thumbs' })
    // ).toBe('You have two thumbs');
  });
  test('array replacement', () => {
    expect(
      msub.init().replace('This ${0} of ${1} actually belongs in the string', ['instance', 'string']),
    ).toBe('This instance of string actually belongs in the string');
  });
  test('number replacement', () => {
    expect(msub.init().replace('We have ${a:toFixed:3} metres of steel', { a: 32.3444 })).toBe(
      'We have 32.344 metres of steel',
    );
    expect(msub.replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 })).toBe(
      'There are 1.6 hours remaining',
    );
  });
  test('date formatting', () => {
    expect(msub.replace('The year is ${a:getFullYear}', { a: new Date(100 * 24 * 3600 * 1000) })).toBe(
      'The year is 1970',
    );
    expect(msub.init().replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') })).toBe(
      'The date is 2024-11-15T00:00:00.000Z',
    );
  });
  test('date custom formatting', () => {
    const d = new Date('2024-11-15T00:00:00.000Z');
    const fmt1 = (_d: Date, _f: string) => {
      return dateEx(_d).tz(360 as TzMinutes).toISOLocalString() as string;
    };
    const fmt2 = (d: Date, f: string) => {
      return dateEx(d).tz(0 as TzMinutes).format(f);
    };

    const r0 = msub.init({ format: fmt1 }).replace('The date is ${a:toISOString}', { a: d });
    expect(r0).toBe('The date is 2024-11-15T00:00:00.000Z'); // fmt is ignored because a:toISOstring takes precedence

    const r1 = msub.init({ format: fmt1 }).replace('The date is ${a}', { a: d });
    expect(r1).toBe('The date is 2024-11-14T18:00:00.000-06:00');

    const r2 = msub.init({ format: fmt2 }).replace('The date is ${a:yyyy/MM/dd}', { a: d });
    expect(r2).toBe('The date is 2024/11/15');
  });
});
describe('StringEx with msub', () => {
  test('key value', () => {
    expect(StringEx('My ${body}').replace({ body: 'eyes' })).toBe('My eyes');
    expect(
      StringEx('My %<{body}>')
        .init({ msub: { open: '%<{' } })
        .replace({ body: 'nose' }),
    ).toBe('My nose');
    expect(
      StringEx('You have two %<{body}>')
        .init({ msub: { open: '%<{' } })
        .replace({ body: 'knees' }),
    ).toBe('You have two knees');
    expect(
      StringEx('You have two %<{body}')
        .init({ msub: { open: '%<{', close: '}' } })
        .replace({ body: 'elbows' }),
    ).toBe('You have two elbows');
  });
});
