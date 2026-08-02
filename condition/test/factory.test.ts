import { assertEquals, assertThrows } from '@std/assert';
import { factory } from '../src/factory.ts';

Deno.test('factory', async (t) => {
  await t.step('creates boolean conditions', () => {
    assertEquals(factory(true).test({}), true);
    assertEquals(factory(false).test({}), false);
  });

  await t.step('creates and conditions', () => {
    assertEquals(factory({ and: [true, true] }).test({}), true);
    assertEquals(factory({ and: [true, false] }).test({}), false);
  });

  await t.step('creates or conditions', () => {
    assertEquals(factory({ or: [false, true] }).test({}), true);
    assertEquals(factory({ or: [false, false] }).test({}), false);
  });

  await t.step('creates not conditions', () => {
    assertEquals(factory({ not: false }).test({}), true);
    assertEquals(factory({ not: true }).test({}), false);
  });

  await t.step('creates nested logical conditions', () => {
    const c = factory({
      and: [
        { or: [false, true] },
        { not: false },
      ],
    });
    assertEquals(c.test({}), true);
  });

  await t.step('throws on field conditions', () => {
    assertThrows(() => factory({ value: 'ok' } as unknown as Parameters<typeof factory>[0]));
  });

  await t.step('throws on invalid definitions', () => {
    assertThrows(() => factory('invalid' as unknown as boolean));
  });
});
