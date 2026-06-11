import { dictUtil, isType } from '../src/mod.ts';
import { isString } from '../src/mod.ts';
import { assert, assertEquals, assertThrows } from '@std/assert';

Deno.test('dictUtil', async (t) => {
  await t.step('isType', () => {
    assert(isType('string', 'string'));
    assertEquals(isType(false, 'string|number'), false);
    assert(isType(false, ' string,number,  boolean'));
    assert(isType(34, ' string,boolean', 'number'));
    assert(isType(34, ' string,boolean', ['number']));
    assertEquals(isType({}, ' string,boolean', ['number']), false);
    assert(isType({}, 'object'));
    assertEquals(isType(34, 'date'), false);
    assertThrows(() => {
      isType(34, 'xxx,yyy');
    }, 'Invalid type [xxx,yyy]');
    assert(isType(new Date(), 'date'));
  });

  await t.step('isType property', () => {
    assert(dictUtil({ a: 3 }).property('a').isType('number'));
    assertEquals(dictUtil({ a: 3 }).property('a').isType('string'), false);
    assert(
      dictUtil({ a: { b: 3 } })
        .property('a.b')
        .isType('string|number'),
    );
    assertThrows(() => {
      dictUtil({ a: { b: 3 } }, { throw: true })
        .property('a.c')
        .isType('string|number');
    }, 'Property a.c not found in object');
    assertThrows(() => {
      dictUtil({ a: { b: 3 } }, { throw: true, src: 'test' })
        .property('a.c')
        .isType('string|number');
    }, 'Property a.c not found in test');
  });

  await t.step('isString', () => {
    assert(isString('string'));
    assert(dictUtil({ a: 'string' }).property('a').isString());
    assert(
      dictUtil({ a: { b: 'string' } })
        .prop('a.b')
        .isString(),
    );
    assertEquals(
      dictUtil({ a: { b: 'string' } })
        .property('a.c')
        .isString(),
      false,
    );
    assertEquals(isString(4), false);
  });

  await t.step('value1', () => {
    assertEquals(
      dictUtil({ a: { b: 3 } })
        .property('a.b')
        .value(),
      3,
    );
  });

  await t.step('value2', () => {
    assertEquals(
      dictUtil({ a: { b: 3 } })
        .property('a')
        .prop('b')
        .value(),
      3,
    );
  });

  await t.step('value3', () => {
    assertEquals(
      dictUtil({ a: { b: 3 } })
        .property('a')
        .prop('b')
        .value(),
      3,
    );
  });
});
