import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import type { Dict } from '../src/mod.ts';
import { compareValues, deepCopy, deepEquals, isArray, isDict, omit, pick } from '../src/mod.ts';

describe('deep', () => {
  // describe('misc', () => {
  //   const _obj = {
  //     a: 'b',
  //     c: 'd',
  //     e: 4,
  //   };
  //   const _strArray = ['a', 'b', 'c'];

  describe('compare', () => {
    const a = { a: 'boo', c: 'd', e: 4 };
    const b = { a: 'boo', c: 'd', e: 4 };
    const c = { a: 'ba', c: 'd', e: 4 };
    const d = { a: 'boo', c: 'e', e: 4 };
    it('compare equals', () => {
      expect(compareValues(a, b, 'a')).toBe(0);
      expect(compareValues(a, b, 'c')).toBe(0);
      expect(compareValues(a, b, 'e')).toBe(0);
      expect(compareValues(a, b, 'f')).toBe(0);
      expect(compareValues(a, b, 'a', 'c', 'e')).toBe(0);
    });
    it('compare not equal a', () => {
      expect(compareValues(a, c, 'a')).toBe(1);
      expect(compareValues(a, c, 'c')).toBe(0);
      expect(compareValues(a, c, 'e')).toBe(0);
      expect(compareValues(a, c, 'f')).toBe(0);
      expect(compareValues(a, c, 'a', 'c', 'e')).toBe(1);
    });
    it('compare not equal b', () => {
      expect(compareValues(a, d, 'a')).toBe(0);
      expect(compareValues(a, d, 'c')).toBe(-1);
      expect(compareValues(a, d, 'e')).toBe(0);
      expect(compareValues(a, d, 'f')).toBe(0);
      expect(compareValues(a, d, 'a', 'c', 'e')).toBe(-1);
    });
  });
  describe('deep', () => {
    const obj = {
      a: 'b',
      c: 'd',
      e: 4,
    };
    it('pick and deepEquals', () => {
      const result1 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 4 });
      expect(result1).toBe(true);
      const result2 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 5 });
      expect(result2).toBe(false);
      // @ts-ignore this is okay
      const result3 = deepEquals(pick(obj, ['a', 'c']), { a: 'b', c: 'd' });
      expect(result3).toBe(true);
    });

    it('omit and deepEquals', () => {
      const result1 = deepEquals(omit(obj, 'a', 'e'), { c: 'd' });
      expect(result1).toBe(true);
      const result2 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'd' });
      expect(result2).toBe(true);
      // @ts-ignore this is okay
      const result3 = deepEquals(omit(obj, ['a', 'c']), { e: 4 });
      expect(result3).toBe(true);
      const result4 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'f' });
      expect(result4).toBe(false);
    });
  });

  describe('deepCopy', () => {
    // const obj = {
    //   a: 'b',
    //   c: '{home}/hello/world',
    //   e: 4,
    //   f: [{ a: '{home}/hello/world' }],
    //   g: { pattern: 'serial$', flags: 'i' },
    //   h: { pattern: '(a|bc)' },
    // };
    // const obj1 = {
    //   a: 'b',
    //   c: '<{home}>/hello/world',
    //   e: 4,
    //   f: [{ a: '<{home}>/hello/world' }],
    //   g: { pattern: 'serial$', flags: 'i' },
    //   h: { pattern: '(a|bc)' },
    // };
    it('deepCopy handles arrays of primitives and objects', () => {
      const arr: Array<number | { a: number }> = [1, 2, { a: 3 }];
      const copy = deepCopy(arr) as typeof arr;
      expect(copy).not.toBe(arr);
      expect(copy).toEqual(arr);
      // Only mutate if the element is an object with property 'a'
      arr.forEach((_item, idx) => {
        if (typeof copy[idx] === 'object' && copy[idx] !== null && 'a' in copy[idx]!) {
          (copy[idx] as { a: number }).a = 99;
        }
      });
      // The original array's object should not be mutated
      expect((arr[2] as { a: number }).a).toBe(3);
      // The copied array's object should be mutated
      expect(
        typeof copy[2] === 'object' && copy[2] !== null && 'a' in copy[2] ? (copy[2] as { a: number }).a : undefined,
      ).toBe(99);
    });

    it('deepCopy handles nested arrays with mixed types', () => {
      const arr: Array<number | { a: number } | Array<{ b: number }>> = [
        1,
        { a: 2 },
        [{ b: 3 }, { b: 4 }],
      ];
      const copy = deepCopy(arr) as typeof arr;
      expect(copy).not.toBe(arr);
      expect(copy).toEqual(arr);
      // Mutate nested object
      if (Array.isArray(copy[2])) {
        (copy[2][0] as { b: number }).b = 99;
      }
      expect(Array.isArray(arr[2]) && (arr[2][0] as { b: number }).b).toBe(3);
      expect(Array.isArray(copy[2]) && (copy[2][0] as { b: number }).b).toBe(99);
    });

    it('deepCopy handles array of arrays', () => {
      const arr = [[1, 2], [3, 4]];
      const copy = deepCopy(arr) as typeof arr;
      expect(copy).not.toBe(arr);
      expect(copy).toEqual(arr);
      copy[0][0] = 99;
      expect(arr[0][0]).toBe(1);
      expect(copy[0][0]).toBe(99);
    });

    it('deepCopy handles sparse arrays', () => {
      const arr = [];
      arr[2] = { a: 5 };
      const copy = deepCopy(arr) as typeof arr;
      expect(copy).not.toBe(arr);
      expect(copy[2]).toEqual({ a: 5 });
      if (copy[2]) (copy[2] as { a: number }).a = 10;
      expect(arr[2].a).toBe(5);
    });

    it('deepCopy handles arrays with null and undefined', () => {
      const arr = [null, undefined, { a: 1 }];
      const copy = deepCopy(arr) as typeof arr;
      expect(copy).not.toBe(arr);
      expect(copy).toEqual(arr);
      if (copy[2]) (copy[2] as { a: number }).a = 2;
      if (isArray(arr) && arr.length > 2 && isDict(arr[2]) && 'a' in arr[2]) {
        expect(arr[2].a).toBe(1);
      }
    });
  });
  describe('deepEquals', () => {
    it('deepEquals works for arrays of objects', () => {
      const arr1 = [{ a: 1 }, { a: 2 }];
      const arr2 = [{ a: 1 }, { a: 2 }];
      expect(deepEquals(arr1, arr2)).toBe(true);
      (arr2[1] as { a: number }).a = 3;
      expect(deepEquals(arr1, arr2)).toBe(false);
    });

    it('deepEquals works for arrays with mixed types', () => {
      const arr1: Array<number | { a: number }> = [1, { a: 2 }];
      const arr2: Array<number | { a: number }> = [1, { a: 2 }];
      expect(deepEquals(arr1, arr2)).toBe(true);
      (arr2[1] as { a: number }).a = 3;
      expect(deepEquals(arr1, arr2)).toBe(false);
    });

    it('deepEquals works for arrays with null and undefined', () => {
      const arr1 = [null, undefined, { a: 1 }];
      const arr2 = [null, undefined, { a: 1 }];
      expect(deepEquals(arr1, arr2)).toBe(true);
      (arr2[2] as { a: number }).a = 2;
      expect(deepEquals(arr1, arr2)).toBe(false);
    });

    it('deepEquals works for deep structures', () => {
      const a = { x: [1, 2, { y: 3 }], z: new Set([1, 2]) };
      const b = { x: [1, 2, { y: 3 }], z: new Set([1, 2]) };
      expect(deepEquals(a, b)).toBe(true);
      (b.x[2] as Dict).y = 4;
      expect(deepEquals(a, b)).toBe(false);
    });
  });

  describe('compareValues', () => {
    const date1 = new Date('2023-01-01T00:00:00.000Z');
    const date2 = new Date('2023-01-02T00:00:00.000Z');
    const date3 = new Date('2023-01-01T00:00:00.000Z'); // same as date1

    it('should compare numbers directly', () => {
      expect(compareValues(1, 2)).toBe(-1);
      expect(compareValues(2, 1)).toBe(1);
      expect(compareValues(1, 1)).toBe(0);
    });

    it('should compare strings directly', () => {
      expect(compareValues('a', 'b')).toBe(-1);
      expect(compareValues('b', 'a')).toBe(1);
      expect(compareValues('a', 'a')).toBe(0);
    });

    it('should compare Dates directly', () => {
      expect(compareValues(date1, date2)).toBe(-1);
      expect(compareValues(date2, date1)).toBe(1);
      expect(compareValues(date1, date3)).toBe(0);
    });

    it('should return 0 for mixed types in direct comparison', () => {
      expect(compareValues(1, 'a')).toBe(0);
      expect(compareValues('a', 1)).toBe(0);
      expect(compareValues(date1, 1)).toBe(0);
      expect(compareValues(null, 1)).toBe(0);
      expect(compareValues(undefined, 'a')).toBe(0);
      expect(compareValues({}, [])).toBe(0);
    });

    it('should return 0 for unsupported types in direct comparison', () => {
      expect(
        compareValues(
          () => {},
          () => {},
        ),
      ).toBe(0);
      expect(compareValues(Symbol('a'), Symbol('b'))).toBe(0);
      expect(compareValues(true, false)).toBe(0); // Booleans are not explicitly supported for < >
    });
  });

  describe('object property comparison', () => {
    const date1 = new Date('2023-01-01T00:00:00.000Z');
    const date2 = new Date('2023-01-02T00:00:00.000Z');
    const objA = { name: 'Alice', age: 30, city: 'New York', joined: date1 };
    const objB = { name: 'Bob', age: 25, city: 'New York', joined: date2 };
    const objC = { name: 'Alice', age: 30, city: 'London', joined: date1 }; // Same name, age as A, diff city
    const objD = { name: 'Alice', age: 30, city: 'New York', joined: date1 }; // Identical to A
    const objE = { name: 'Alice', age: '30', city: 'New York' }; // Age is string
    const objF = { name: 'Alice', city: 'New York' }; // Missing age

    it('should compare objects by a single numeric property', () => {
      expect(compareValues(objA, objB, 'age')).toBe(1); // 30 > 25
      expect(compareValues(objB, objA, 'age')).toBe(-1); // 25 < 30
    });

    it('should compare objects by a single string property', () => {
      expect(compareValues(objA, objB, 'name')).toBe(-1); // Alice < Bob
      expect(compareValues(objB, objA, 'name')).toBe(1); // Bob > Alice
    });

    it('should compare objects by a single Date property', () => {
      expect(compareValues(objA, objB, 'joined')).toBe(-1); // date1 < date2
      expect(compareValues(objB, objA, 'joined')).toBe(1); // date2 > date1
    });

    it('should compare objects by multiple properties with precedence', () => {
      // objA vs objC: name and age are same, city differs
      expect(compareValues(objA, objC, 'name', 'age', 'city')).toBe(1); // New York > London
      expect(compareValues(objC, objA, 'name', 'age', 'city')).toBe(-1); // London < New York

      // objA vs objB: name differs first
      expect(compareValues(objA, objB, 'name', 'age')).toBe(-1); // Alice < Bob
    });

    it('should return 0 if all specified properties are equal', () => {
      expect(compareValues(objA, objD, 'name', 'age', 'city', 'joined')).toBe(0);
    });

    it('should skip properties with mismatched types', () => {
      // Comparing objA.age (number) with objE.age (string)
      expect(compareValues(objA, objE, 'age')).toBe(0); // Skipped
      // If 'name' is compared first, it's equal, then 'age' is skipped
      expect(compareValues(objA, objE, 'name', 'age', 'city')).toBe(0);
    });

    it('should skip properties missing in one object', () => {
      // Comparing objA.age with objF (missing age)
      expect(compareValues(objA, objF, 'age')).toBe(0); // Skipped
      // If 'name' is compared first, it's equal, then 'age' is skipped
      expect(compareValues(objA, objF, 'name', 'age', 'city')).toBe(0);
    });

    it('should return 0 if one of the items is not an object when props are provided', () => {
      expect(compareValues(objA, null, 'name')).toBe(0);
      expect(compareValues(null, objA, 'name')).toBe(0);
      expect(compareValues(objA, 123, 'name')).toBe(0);
      expect(compareValues('string', objA, 'name')).toBe(0);
    });

    it('should return 0 if props array is empty (falls back to direct object comparison)', () => {
      expect(compareValues(objA, objB)).toBe(0); // No props, direct comparison of objects
      expect(compareValues(objA, objB, ...[])).toBe(0); // Spread empty array
    });

    it('should handle objects with undefined or null property values', () => {
      const objWithNull = { val: null };
      const objWithUndefined = { val: undefined };
      const objWithNumber = { val: 1 };

      expect(compareValues(objWithNull, objWithNumber, 'val')).toBe(0); // null vs number -> skip
      expect(compareValues(objWithUndefined, objWithNumber, 'val')).toBe(0); // undefined vs number -> skip
      expect(compareValues(objWithNull, objWithUndefined, 'val')).toBe(0); // null vs undefined -> skip
    });

    it('should correctly compare when a property value is explicitly undefined', () => {
      const o1 = { a: 1, b: undefined };
      const o2 = { a: 1, b: 2 };
      const o3 = { a: 1, b: undefined };

      expect(compareValues(o1, o2, 'b')).toBe(0); // undefined vs number -> skip
      expect(compareValues(o1, o2, 'a', 'b')).toBe(0); // a is equal, b is skipped

      expect(compareValues(o1, o3, 'b')).toBe(0); // undefined vs undefined -> skip
      expect(compareValues(o1, o3, 'a', 'b')).toBe(0); // a is equal, b is skipped
    });

    it('should return 0 for non-existent properties', () => {
      expect(compareValues(objA, objB, 'nonExistentProp')).toBe(0);
      expect(compareValues(objA, objB, 'name', 'nonExistentProp')).toBe(-1); // 'name' determines outcome
    });
  });
});
