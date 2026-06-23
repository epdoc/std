import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { evaluateValueCondition } from '../src/evaluator.ts';

describe('evaluateValueCondition', () => {
  describe('primitives', () => {
    it('matches string equality', () => {
      assertEquals(evaluateValueCondition('hello', 'hello'), true);
      assertEquals(evaluateValueCondition('hello', 'world'), false);
    });

    it('matches number equality', () => {
      assertEquals(evaluateValueCondition(42, 42), true);
      assertEquals(evaluateValueCondition(42, 43), false);
    });

    it('matches boolean equality', () => {
      assertEquals(evaluateValueCondition(true, true), true);
      assertEquals(evaluateValueCondition(false, true), false);
    });

    it('matches regex', () => {
      assertEquals(evaluateValueCondition('hello world', /world/), true);
      assertEquals(evaluateValueCondition('hello world', /foo/), false);
    });
  });

  describe('string operators', () => {
    it('checks contains', () => {
      assertEquals(evaluateValueCondition('hello world', { contains: 'world' }), true);
      assertEquals(evaluateValueCondition('hello world', { contains: 'foo' }), false);
    });

    it('checks startsWith and endsWith', () => {
      assertEquals(evaluateValueCondition('hello world', { startsWith: 'hello' }), true);
      assertEquals(evaluateValueCondition('hello world', { endsWith: 'world' }), true);
      assertEquals(evaluateValueCondition('hello world', { startsWith: 'world' }), false);
    });

    it('checks regex object', () => {
      assertEquals(evaluateValueCondition('hello world', { regex: 'world', flags: 'i' }), true);
      assertEquals(evaluateValueCondition('hello world', { regex: '^world' }), false);
    });
  });

  describe('number operators', () => {
    it('compares numbers', () => {
      assertEquals(evaluateValueCondition(5, { gt: 3 }), true);
      assertEquals(evaluateValueCondition(5, { gte: 5 }), true);
      assertEquals(evaluateValueCondition(5, { lt: 10 }), true);
      assertEquals(evaluateValueCondition(5, { lte: 4 }), false);
      assertEquals(evaluateValueCondition(5, { ne: 3 }), true);
    });
  });

  describe('array operators', () => {
    it('checks includes', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: 'b' }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: 'z' }), false);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includes: ['b', 'z'] }), true);
    });

    it('checks excludes', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { excludes: 'z' }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { excludes: 'b' }), false);
    });

    it('checks includesAll', () => {
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includesAll: ['a', 'b'] }), true);
      assertEquals(evaluateValueCondition(['a', 'b', 'c'], { includesAll: ['a', 'z'] }), false);
    });

    it('checks isEmpty', () => {
      assertEquals(evaluateValueCondition([], { isEmpty: true }), true);
      assertEquals(evaluateValueCondition(['a'], { isEmpty: true }), false);
      assertEquals(evaluateValueCondition(['a'], { isEmpty: false }), true);
    });
  });
});
