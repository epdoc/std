import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { msub } from '../src/mod.ts';

describe('msub', () => {
  test('key value', () => {
    expect(msub.configure().replace('My ${body}', { body: 'eyes' })).toBe('My eyes');
    expect(msub.configure({ open: '%<{' }).replace('My %<{body}>', { body: 'nose' })).toBe('My nose');
    expect(msub.replace('You have two %<{body}>', { body: 'knees' })).toBe('You have two knees');
    expect(
      msub.configure({ open: '%<{', close: '}' }).replace('You have two %<{body}', { body: 'elbows' }),
    ).toBe('You have two elbows');
  });

  test('array replacement', () => {
    expect(
      msub.configure().replace('This ${0} of ${1} actually belongs in the string', ['instance', 'string']),
    ).toBe('This instance of string actually belongs in the string');
  });

  test('number replacement', () => {
    expect(msub.configure().replace('We have ${a:toFixed:3} metres of steel', { a: 32.3444 })).toBe(
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
    expect(msub.configure().replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') })).toBe(
      'The date is 2024-11-15T00:00:00.000Z',
    );
  });

  test('date custom formatting', () => {
    const d = Temporal.ZonedDateTime.from('2024-11-15T00:00:00Z[UTC]');
    const fmt1 = (_d: Temporal.ZonedDateTime, _f: string) => {
      return _d.toString() as string;
    };
    const fmt2 = (val: Temporal.ZonedDateTime, f: string) => {
      if (val instanceof Temporal.ZonedDateTime) {
        if (f === 'yyyy/MM/dd') {
          return `${val.year}/${String(val.month).padStart(2, '0')}/${String(val.day).padStart(2, '0')}`;
        }
      }
      return String(val);
    };

    const r0 = msub.configure({ format: fmt1 }).replace('The date is ${a:toString}', { a: d });
    expect(r0).toBe('The date is 2024-11-15T00:00:00+00:00[UTC]');

    const r1 = msub.configure({ format: fmt1 }).replace('The date is ${a}', { a: d });
    expect(r1).toBe('The date is 2024-11-15T00:00:00+00:00[UTC]');

    const r2 = msub.configure({ format: fmt2 }).replace('The date is ${a:yyyy/MM/dd}', { a: d });
    expect(r2).toBe('The date is 2024/11/15');
  });
});
