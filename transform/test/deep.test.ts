import { compareValues, deepEquals, type Dict, isArray, isDict, omit, pick } from '@epdoc/type';
import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import { Deep } from '../src/mod.ts';

Deno.test('deep', async (t) => {
  await t.step('compare', async (t) => {
    const a = { a: 'boo', c: 'd', e: 4 };
    const b = { a: 'boo', c: 'd', e: 4 };
    const c = { a: 'ba', c: 'd', e: 4 };
    const d = { a: 'boo', c: 'e', e: 4 };
    await t.step('compare equals', () => {
      assertEquals(compareValues(a, b, 'a'), 0);
      assertEquals(compareValues(a, b, 'c'), 0);
      assertEquals(compareValues(a, b, 'e'), 0);
      assertEquals(compareValues(a, b, 'f'), 0);
      assertEquals(compareValues(a, b, 'a', 'c', 'e'), 0);
    });
    await t.step('compare not equal a', () => {
      assertEquals(compareValues(a, c, 'a'), 1);
      assertEquals(compareValues(a, c, 'c'), 0);
      assertEquals(compareValues(a, c, 'e'), 0);
      assertEquals(compareValues(a, c, 'f'), 0);
      assertEquals(compareValues(a, c, 'a', 'c', 'e'), 1);
    });
    await t.step('compare not equal b', () => {
      assertEquals(compareValues(a, d, 'a'), 0);
      assertEquals(compareValues(a, d, 'c'), -1);
      assertEquals(compareValues(a, d, 'e'), 0);
      assertEquals(compareValues(a, d, 'f'), 0);
      assertEquals(compareValues(a, d, 'a', 'c', 'e'), -1);
    });
  });
  await t.step('deep', async (t) => {
    const obj = {
      a: 'b',
      c: 'd',
      e: 4,
    };
    await t.step('pick and deepEquals', () => {
      const result1 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 4 });
      assert(result1);
      const result2 = deepEquals(pick(obj, 'a', 'e'), { a: 'b', e: 5 });
      assertEquals(result2, false);
      // @ts-ignore this is okay
      const result3 = deepEquals(pick(obj, ['a', 'c']), { a: 'b', c: 'd' });
      assert(result3);
    });

    await t.step('omit and deepEquals', () => {
      const result1 = deepEquals(omit(obj, 'a', 'e'), { c: 'd' });
      assert(result1);
      const result2 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'd' });
      assert(result2);
      // @ts-ignore this is okay
      const result3 = deepEquals(omit(obj, ['a', 'c']), { e: 4 });
      assert(result3);
      const result4 = deepEquals(omit(obj, 'e'), { a: 'b', c: 'f' });
      assertEquals(result4, false);
    });
  });

  await t.step('deepCopy', async (t) => {
    await t.step('deepCopy handles arrays of primitives and objects', () => {
      const arr: Array<number | { a: number }> = [1, 2, { a: 3 }];
      const copy = Deep.copy(arr) as typeof arr;
      assert(copy !== arr);
      assertEquals(copy, arr);
      arr.forEach((_item, idx) => {
        if (
          typeof copy[idx] === 'object' && copy[idx] !== null &&
          'a' in copy[idx]!
        ) {
          (copy[idx] as { a: number }).a = 99;
        }
      });
      assertEquals((arr[2] as { a: number }).a, 3);
      assertEquals(
        typeof copy[2] === 'object' && copy[2] !== null && 'a' in copy[2] ? (copy[2] as { a: number }).a : undefined,
        99,
      );
    });

    await t.step('deepCopy handles nested arrays with mixed types', () => {
      const arr: Array<number | { a: number } | Array<{ b: number }>> = [
        1,
        { a: 2 },
        [{ b: 3 }, { b: 4 }],
      ];
      const copy = Deep.copy(arr) as typeof arr;
      assert(copy !== arr);
      assertEquals(copy, arr);
      if (Array.isArray(copy[2])) {
        (copy[2][0] as { b: number }).b = 99;
      }
      assertEquals(Array.isArray(arr[2]) && (arr[2][0] as { b: number }).b, 3);
      assertEquals(Array.isArray(copy[2]) && (copy[2][0] as { b: number }).b, 99);
    });

    await t.step('deepCopy handles array of arrays', () => {
      const arr = [[1, 2], [3, 4]];
      const copy = Deep.copy(arr) as typeof arr;
      assert(copy !== arr);
      assertEquals(copy, arr);
      copy[0][0] = 99;
      assertEquals(arr[0][0], 1);
      assertEquals(copy[0][0], 99);
    });

    await t.step('deepCopy handles sparse arrays', () => {
      const arr: { a: number }[] = [];
      arr[2] = { a: 5 };
      const copy = Deep.copy(arr) as typeof arr;
      assert(copy !== arr);
      assertEquals(copy[2], { a: 5 });
      if (copy[2]) (copy[2] as { a: number }).a = 10;
      assertEquals(arr[2].a, 5);
    });

    await t.step('deepCopy handles arrays with null and undefined', () => {
      const arr = [null, undefined, { a: 1 }];
      const copy = Deep.copy(arr) as typeof arr;
      assert(copy !== arr);
      assertEquals(copy, arr);
      if (copy[2]) (copy[2] as { a: number }).a = 2;
      if (isArray(arr) && arr.length > 2 && isDict(arr[2]) && 'a' in arr[2]) {
        assertEquals(arr[2].a, 1);
      }
    });
  });
  await t.step('deepEquals', async (t) => {
    await t.step('deepEquals works for arrays of objects', () => {
      const arr1 = [{ a: 1 }, { a: 2 }];
      const arr2 = [{ a: 1 }, { a: 2 }];
      assert(deepEquals(arr1, arr2));
      (arr2[1] as { a: number }).a = 3;
      assertEquals(deepEquals(arr1, arr2), false);
    });

    await t.step('deepEquals works for arrays with mixed types', () => {
      const arr1: Array<number | { a: number }> = [1, { a: 2 }];
      const arr2: Array<number | { a: number }> = [1, { a: 2 }];
      assert(deepEquals(arr1, arr2));
      (arr2[1] as { a: number }).a = 3;
      assertEquals(deepEquals(arr1, arr2), false);
    });

    await t.step('deepEquals works for arrays with null and undefined', () => {
      const arr1 = [null, undefined, { a: 1 }];
      const arr2 = [null, undefined, { a: 1 }];
      assert(deepEquals(arr1, arr2));
      (arr2[2] as { a: number }).a = 2;
      assertEquals(deepEquals(arr1, arr2), false);
    });

    await t.step('deepEquals works for deep structures', () => {
      const a = { x: [1, 2, { y: 3 }], z: new Set([1, 2]) };
      const b = { x: [1, 2, { y: 3 }], z: new Set([1, 2]) };
      assert(deepEquals(a, b));
      (b.x[2] as Dict).y = 4;
      assertEquals(deepEquals(a, b), false);
    });
  });

  await t.step('compareValues', async (t) => {
    const date1 = new Date('2023-01-01T00:00:00.000Z');
    const date2 = new Date('2023-01-02T00:00:00.000Z');
    const date3 = new Date('2023-01-01T00:00:00.000Z');

    await t.step('should compare numbers directly', () => {
      assertEquals(compareValues(1, 2), -1);
      assertEquals(compareValues(2, 1), 1);
      assertEquals(compareValues(1, 1), 0);
    });

    await t.step('should compare strings directly', () => {
      assertEquals(compareValues('a', 'b'), -1);
      assertEquals(compareValues('b', 'a'), 1);
      assertEquals(compareValues('a', 'a'), 0);
    });

    await t.step('should compare Dates directly', () => {
      assertEquals(compareValues(date1, date2), -1);
      assertEquals(compareValues(date2, date1), 1);
      assertEquals(compareValues(date1, date3), 0);
    });

    await t.step('should return 0 for mixed types in direct comparison', () => {
      assertEquals(compareValues(1, 'a'), 0);
      assertEquals(compareValues('a', 1), 0);
      assertEquals(compareValues(date1, 1), 0);
      assertEquals(compareValues(null, 1), 0);
      assertEquals(compareValues(undefined, 'a'), 0);
      assertEquals(compareValues({}, []), 0);
    });

    await t.step('should return 0 for unsupported types in direct comparison', () => {
      assertEquals(
        compareValues(
          () => {},
          () => {},
        ),
        0,
      );
      assertEquals(compareValues(Symbol('a'), Symbol('b')), 0);
      assertEquals(compareValues(true, false), 0);
    });
  });

  await t.step('temporal', async (t) => {
    await t.step('deepCopy preserves Temporal.Instant as-is', () => {
      const original = Temporal.Instant.from('2024-01-15T12:30:45Z');
      const result = Deep.copy(original);
      assertEquals(result, original);
      assertInstanceOf(result, Temporal.Instant);
    });

    await t.step('deepCopy preserves Temporal.ZonedDateTime as-is', () => {
      const original = Temporal.ZonedDateTime.from(
        '2024-01-15T12:30:45-05:00[America/New_York]',
      );
      const result = Deep.copy(original);
      assertEquals(result, original);
      assertInstanceOf(result, Temporal.ZonedDateTime);
    });

    await t.step('deepCopy preserves Temporal.PlainDateTime as-is', () => {
      const original = Temporal.PlainDateTime.from('2024-01-15T12:30:45');
      const result = Deep.copy(original);
      assertEquals(result, original);
      assertInstanceOf(result, Temporal.PlainDateTime);
    });

    await t.step('deepCopy handles objects containing Temporal values', () => {
      const obj = {
        name: 'test',
        createdAt: Temporal.Instant.from('2024-01-15T12:30:45Z'),
        updatedAt: Temporal.ZonedDateTime.from(
          '2024-01-15T12:30:45-05:00[America/New_York]',
        ),
      };
      const result = Deep.copy(obj) as typeof obj;
      assert(result !== obj);
      assertEquals(result.createdAt, obj.createdAt);
      assertEquals(result.updatedAt, obj.updatedAt);
    });

    await t.step('deepCopy handles arrays containing Temporal values', () => {
      const arr = [
        Temporal.Instant.from('2024-01-15T12:30:45Z'),
        Temporal.PlainDateTime.from('2024-01-15T12:30:45'),
      ];
      const result = Deep.copy(arr) as typeof arr;
      assert(result !== arr);
      assertEquals(result[0], arr[0]);
      assertEquals(result[1], arr[1]);
    });
  });

  await t.step('object property comparison', async (t) => {
    const date1 = new Date('2023-01-01T00:00:00.000Z');
    const date2 = new Date('2023-01-02T00:00:00.000Z');
    const objA = { name: 'Alice', age: 30, city: 'New York', joined: date1 };
    const objB = { name: 'Bob', age: 25, city: 'New York', joined: date2 };
    const objC = { name: 'Alice', age: 30, city: 'London', joined: date1 };
    const objD = { name: 'Alice', age: 30, city: 'New York', joined: date1 };
    const objE = { name: 'Alice', age: '30', city: 'New York' };
    const objF = { name: 'Alice', city: 'New York' };

    await t.step('should compare objects by a single numeric property', () => {
      assertEquals(compareValues(objA, objB, 'age'), 1);
      assertEquals(compareValues(objB, objA, 'age'), -1);
    });

    await t.step('should compare objects by a single string property', () => {
      assertEquals(compareValues(objA, objB, 'name'), -1);
      assertEquals(compareValues(objB, objA, 'name'), 1);
    });

    await t.step('should compare objects by a single Date property', () => {
      assertEquals(compareValues(objA, objB, 'joined'), -1);
      assertEquals(compareValues(objB, objA, 'joined'), 1);
    });

    await t.step('should compare objects by multiple properties with precedence', () => {
      assertEquals(compareValues(objA, objC, 'name', 'age', 'city'), 1);
      assertEquals(compareValues(objC, objA, 'name', 'age', 'city'), -1);
      assertEquals(compareValues(objA, objB, 'name', 'age'), -1);
    });

    await t.step('should return 0 if all specified properties are equal', () => {
      assertEquals(compareValues(objA, objD, 'name', 'age', 'city', 'joined'), 0);
    });

    await t.step('should skip properties with mismatched types', () => {
      assertEquals(compareValues(objA, objE, 'age'), 0);
      assertEquals(compareValues(objA, objE, 'name', 'age', 'city'), 0);
    });

    await t.step('should skip properties missing in one object', () => {
      assertEquals(compareValues(objA, objF, 'age'), 0);
      assertEquals(compareValues(objA, objF, 'name', 'age', 'city'), 0);
    });

    await t.step('should return 0 if one of the items is not an object when props are provided', () => {
      assertEquals(compareValues(objA, null, 'name'), 0);
      assertEquals(compareValues(null, objA, 'name'), 0);
      assertEquals(compareValues(objA, 123, 'name'), 0);
      assertEquals(compareValues('string', objA, 'name'), 0);
    });

    await t.step('should return 0 if props array is empty (falls back to direct object comparison)', () => {
      assertEquals(compareValues(objA, objB), 0);
      assertEquals(compareValues(objA, objB, ...[]), 0);
    });

    await t.step('should handle objects with undefined or null property values', () => {
      const objWithNull = { val: null };
      const objWithUndefined = { val: undefined };
      const objWithNumber = { val: 1 };

      assertEquals(compareValues(objWithNull, objWithNumber, 'val'), 0);
      assertEquals(compareValues(objWithUndefined, objWithNumber, 'val'), 0);
      assertEquals(compareValues(objWithNull, objWithUndefined, 'val'), 0);
    });

    await t.step('should correctly compare when a property value is explicitly undefined', () => {
      const o1 = { a: 1, b: undefined };
      const o2 = { a: 1, b: 2 };
      const o3 = { a: 1, b: undefined };

      assertEquals(compareValues(o1, o2, 'b'), 0);
      assertEquals(compareValues(o1, o2, 'a', 'b'), 0);

      assertEquals(compareValues(o1, o3, 'b'), 0);
      assertEquals(compareValues(o1, o3, 'a', 'b'), 0);
    });

    await t.step('should return 0 for non-existent properties', () => {
      assertEquals(compareValues(objA, objB, 'nonExistentProp'), 0);
      assertEquals(compareValues(objA, objB, 'name', 'nonExistentProp'), -1);
    });
  });
});
