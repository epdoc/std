import { assertEquals, assertThrows } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { factory } from '../src/factory.ts';

describe('factory', () => {
  it('creates boolean conditions', () => {
    assertEquals(factory(true).test({}), true);
    assertEquals(factory(false).test({}), false);
  });

  it('creates and conditions', () => {
    assertEquals(factory({ and: [true, true] }).test({}), true);
    assertEquals(factory({ and: [true, false] }).test({}), false);
  });

  it('creates or conditions', () => {
    assertEquals(factory({ or: [false, true] }).test({}), true);
    assertEquals(factory({ or: [false, false] }).test({}), false);
  });

  it('creates not conditions', () => {
    assertEquals(factory({ not: false }).test({}), true);
    assertEquals(factory({ not: true }).test({}), false);
  });

  it('creates nested logical conditions', () => {
    const c = factory({
      and: [
        { or: [false, true] },
        { not: false },
      ],
    });
    assertEquals(c.test({}), true);
  });

  it('throws on field conditions', () => {
    assertThrows(() => factory({ value: 'ok' } as unknown as Parameters<typeof factory>[0]));
  });

  it('throws on invalid definitions', () => {
    assertThrows(() => factory('invalid' as unknown as boolean));
  });
});
