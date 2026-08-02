import { assertEquals } from '@std/assert';
import { evaluateValueCondition } from '../src/evaluator.ts';

Deno.test('evaluateValueCondition', async (t) => {
  await t.step('primitives', async (t) => {
    await t.step('matches string equality', () => {
      assertEquals(evaluateValueCondition('hello', 'hello'), true);
      assertEquals(evaluateValueCondition('hello', 'world'), false);
    });

    await t.step('matches number equality', () => {
      assertEquals(evaluateValueCondition(42, 42), true);
      assertEquals(evaluateValueCondition(42, 43), false);
    });

    await t.step('matches boolean equality', () => {
      assertEquals(evaluateValueCondition(true, true), true);
      assertEquals(evaluateValueCondition(false, true), false);
    });

    await t.step('matches regex', () => {
      assertEquals(evaluateValueCondition('hello world', /world/), true);
      assertEquals(evaluateValueCondition('hello world', /foo/), false);
    });
  });

  await t.step('string operators', async (t) => {
    await t.step('checks contains', () => {
      assertEquals(evaluateValueCondition('hello world', { contains: 'world' }), true);
      assertEquals(evaluateValueCondition('hello world', { contains: 'foo' }), false);
    });

    await t.step('checks startsWith and endsWith', () => {
      assertEquals(evaluateValueCondition('hello world', { startsWith: 'hello' }), true);
      assertEquals(evaluateValueCondition('hello world', { endsWith: 'world' }), true);
      assertEquals(evaluateValueCondition('hello world', { startsWith: 'world' }), false);
    });

    await t.step('checks regex object', () => {
      assertEquals(evaluateValueCondition('hello world', { regex: 'world', flags: 'i' }), true);
      assertEquals(evaluateValueCondition('hello world', { regex: '^world' }), false);
    });
  });

  await t.step('number operators', async (t) => {
    await t.step('compares numbers', () => {
      assertEquals(evaluateValueCondition(5, { gt: 3 }), true);
      assertEquals(evaluateValueCondition(5, { gte: 5 }), true);
      assertEquals(evaluateValueCondition(5, { lt: 10 }), true);
      assertEquals(evaluateValueCondition(5, { lte: 4 }), false);
      assertEquals(evaluateValueCondition(5, { ne: 3 }), true);
    });
  });

  await t.step('array operators', async (t) => {
    await t.step('checks includes', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: 'b' }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: 'z' }), false);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: ['b', 'z'] }), true);
    });

    await t.step('checks excludes', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { excludes: 'z' }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { excludes: 'b' }), false);
    });

    await t.step('checks includesAll', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includesAll: ['a', 'b'] }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includesAll: ['a', 'z'] }), false);
    });

    await t.step('checks isEmpty', () => {
      assertEquals(evaluateValueCondition([], { isEmpty: true }), true);
      assertEquals(evaluateValueCondition(['a'], { isEmpty: true }), false);
      assertEquals(evaluateValueCondition(['a'], { isEmpty: false }), true);
    });
  });
});
