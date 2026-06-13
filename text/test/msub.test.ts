import { assertEquals } from '@std/assert';
import { msub } from '../src/mod.ts';

Deno.test('msub', async (t) => {
  await t.step('key value', () => {
    assertEquals(msub.configure().replace('My ${body}', { body: 'eyes' }), 'My eyes');
    assertEquals(msub.configure({ open: '%<{' }).replace('My %<{body}>', { body: 'nose' }), 'My nose');
    assertEquals(msub.replace('You have two %<{body}>', { body: 'knees' }), 'You have two knees');
    assertEquals(
      msub.configure({ open: '%<{', close: '}' }).replace('You have two %<{body}', { body: 'elbows' }),
      'You have two elbows',
    );
  });

  await t.step('array replacement', () => {
    assertEquals(
      msub.configure().replace('This ${0} of ${1} actually belongs in the string', ['instance', 'string']),
      'This instance of string actually belongs in the string',
    );
  });

  await t.step('number replacement', () => {
    assertEquals(
      msub.configure().replace('We have ${a:toFixed:3} metres of steel', { a: 32.3444 }),
      'We have 32.344 metres of steel',
    );
    assertEquals(
      msub.replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 }),
      'There are 1.6 hours remaining',
    );
  });

  await t.step('date formatting', () => {
    assertEquals(
      msub.replace('The year is ${a:getFullYear}', { a: new Date(100 * 24 * 3600 * 1000) }),
      'The year is 1970',
    );
    assertEquals(
      msub.configure().replace('The date is ${a:toISOString}', { a: new Date('2024-11-15') }),
      'The date is 2024-11-15T00:00:00.000Z',
    );
  });

  await t.step('date custom formatting', () => {
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
    assertEquals(r0, 'The date is 2024-11-15T00:00:00+00:00[UTC]');

    const r1 = msub.configure({ format: fmt1 }).replace('The date is ${a}', { a: d });
    assertEquals(r1, 'The date is 2024-11-15T00:00:00+00:00[UTC]');

    const r2 = msub.configure({ format: fmt2 }).replace('The date is ${a:yyyy/MM/dd}', { a: d });
    assertEquals(r2, 'The date is 2024/11/15');
  });
});
