import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { _, type Dict, stripJsonComments } from '../src/mod.ts';

describe('json', () => {
  describe('jsonSerialize', () => {
    it('should serialize a simple object', () => {
      const obj = { name: 'Alice', age: 30 };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"name":"Alice","age":30}');
    });

    it('should serialize an array', () => {
      const arr = [1, 2, 3];
      const json = _.jsonSerialize(arr);
      expect(json).toBe('[1,2,3]');
    });

    it('should serialize nested objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"a":1,"b":{"c":2}}');
    });

    it('should serialize null and undefined', () => {
      const obj = { a: null, b: undefined };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"a":null}');
    });

    it('should serialize boolean and number', () => {
      const obj = { flag: true, count: 42 };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"flag":true,"count":42}');
    });

    it('should serialize string with special characters', () => {
      const obj = { text: 'Hello\nWorld' };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"text":"Hello\\nWorld"}');
    });

    it('should serialize empty object', () => {
      const obj = {};
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{}');
    });

    it('should serialize empty array', () => {
      const arr: unknown[] = [];
      const json = _.jsonSerialize(arr);
      expect(json).toBe('[]');
    });

    it('should serialize deeply nested structures', () => {
      const obj = { a: [{ b: { c: [1, 2, { d: null }] } }] };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"a":[{"b":{"c":[1,2,{"d":null}]}}]}');
    });

    it('should serialize array with undefined and null', () => {
      const arr = [1, undefined, null, 4];
      const json = _.jsonSerialize(arr);
      expect(json).toBe('[1,null,null,4]');
    });

    it('should serialize Date as ISO string', () => {
      const obj = { now: new Date('2020-01-01T00:00:00Z') };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"now":"2020-01-01T00:00:00.000Z"}');
    });

    it('should serialize object with toJSON method', () => {
      const obj = {
        a: 1,
        toJSON() {
          return { b: 2 };
        },
      };
      const json = _.jsonSerialize(obj);
      expect(json).toBe('{"b":2}');
    });
  });

  describe('jsonDeserialize', () => {
    it('should deserialize a simple object', () => {
      const json = '{"name":"Alice","age":30}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ name: 'Alice', age: 30 });
    });

    it('should deserialize an array', () => {
      const json = '[1,2,3]';
      const arr = _.jsonDeserialize(json);
      expect(arr).toEqual([1, 2, 3]);
    });

    it('should deserialize nested objects', () => {
      const json = '{"a":1,"b":{"c":2}}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ a: 1, b: { c: 2 } });
    });

    it('should deserialize null', () => {
      const json = 'null';
      const value = _.jsonDeserialize(json);
      expect(value).toBeNull();
    });

    it('should deserialize boolean and number', () => {
      const json = '{"flag":true,"count":42}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ flag: true, count: 42 });
    });

    it('should throw on invalid JSON', () => {
      const json = '{"a":1,}';
      expect(() => _.jsonDeserialize(json)).toThrow();
    });

    it('should deserialize empty object', () => {
      const json = '{}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({});
    });

    it('should deserialize empty array', () => {
      const json = '[]';
      const arr = _.jsonDeserialize(json);
      expect(arr).toEqual([]);
    });

    it('should deserialize deeply nested structures', () => {
      const json = '{"a":[{"b":{"c":[1,2,{"d":null}]}}]}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ a: [{ b: { c: [1, 2, { d: null }] } }] });
    });

    it('should deserialize string with special characters', () => {
      const json = '{"text":"Hello\\nWorld"}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ text: 'Hello\nWorld' });
    });

    it('should deserialize ISO date string as string', () => {
      const json = '{"now":"2020-01-01T00:00:00.000Z"}';
      const obj = _.jsonDeserialize(json);
      expect(obj).toEqual({ now: new Date('2020-01-01T00:00:00.000Z') });
    });

    it('should deserialize array with nulls', () => {
      const json = '[1,null,null,4]';
      const arr = _.jsonDeserialize(json);
      expect(arr).toEqual([1, null, null, 4]);
    });
  });
  describe('jsonSerialize/jsonDeserialize advanced', () => {
    it('serializes and deserializes Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3]);
      const json = _.jsonSerialize(arr);
      const restored = _.jsonDeserialize<typeof arr>(json);
      expect(restored).toEqual(arr);
      expect(restored instanceof Uint8Array).toBe(true);
    });

    it('serializes and deserializes Set', () => {
      const set = new Set([1, 2, 3]);
      const json = _.jsonSerialize(set);
      const restored = _.jsonDeserialize<typeof set>(json);
      expect(restored instanceof Set).toBe(true);
      expect(Array.from(restored)).toEqual([1, 2, 3]);
    });

    it('serializes and deserializes Map', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const json = _.jsonSerialize(map);
      const restored = _.jsonDeserialize<typeof map>(json);
      expect(restored instanceof Map).toBe(true);
      expect(Array.from(restored.entries())).toEqual([['a', 1], ['b', 2]]);
    });

    it('serializes and deserializes RegExp', () => {
      const re = /abc/gi;
      const json = _.jsonSerialize(re);
      const restored = _.jsonDeserialize<typeof re>(json);
      expect(restored instanceof RegExp).toBe(true);
      expect(restored.source).toBe('abc');
      expect(restored.flags).toBe('gi');
    });

    it('serializes and deserializes RegExp with detectRegExp', () => {
      const re = /abc/gi;
      const json = _.jsonSerialize(re);
      const restored = _.jsonDeserialize<typeof re>(json);
      expect(restored instanceof RegExp).toBe(true);
      expect(restored.source).toBe('abc');
      expect(restored.flags).toBe('gi');
    });

    it('serializes and deserializes Date', () => {
      const date = new Date('2022-01-01T12:00:00.000Z');
      const json = _.jsonSerialize(date);
      const restored = _.jsonDeserialize<Date>(json);
      expect(restored instanceof Date).toBe(true);
      expect(restored.getTime()).toBe(date.getTime());
    });

    it('serializes and deserializes nested structures with special types', () => {
      const obj = {
        arr: [1, 2, new Uint8Array([3, 4])],
        set: new Set(['a', 'b']),
        map: new Map([[1, 'one']]),
        date: new Date('2020-01-01T00:00:00.000Z'),
        re: /foo/i,
      };
      const json = _.jsonSerialize(obj);
      const restored = _.jsonDeserialize<typeof obj>(json);
      expect(restored.arr[2] instanceof Uint8Array).toBe(true);
      expect(restored.set instanceof Set).toBe(true);
      expect(restored.map instanceof Map).toBe(true);
      expect(restored.date instanceof Date).toBe(true);
      expect(restored.re instanceof RegExp).toBe(true);
    });

    it('serializes and deserializes with string replacer', () => {
      const obj = { msg: 'Hello ${name}!', other: 'No replace' };
      const json = _.jsonSerialize(obj, { replace: { name: 'World' }, pre: '${', post: '}' });
      expect(json).toContain('Hello World!');
      const restored = _.jsonDeserialize<typeof obj>(json, { replace: { name: 'World' }, pre: '${', post: '}' });
      expect(restored.msg).toBe('Hello World!');
      expect(restored.other).toBe('No replace');
    });

    it('applies replacer on deserialization only', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = _.jsonSerialize(obj);
      const restored = _.jsonDeserialize<typeof obj>(json, { replace: { name: 'World' }, pre: '${', post: '}' });
      expect(restored.msg).toBe('Hello World!');
    });

    it('applies replacer on serialization only', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = _.jsonSerialize(obj, { replace: { name: 'World' }, pre: '${', post: '}' });
      expect(json).toContain('Hello World!');
      const restored = _.jsonDeserialize<typeof obj>(json);
      expect(restored.msg).toBe('Hello World!');
    });

    it('serializes and deserializes with custom delimiters', () => {
      const obj = { msg: 'Hi <<user>>!' };
      const json = _.jsonSerialize(obj, { replace: { user: 'Bob' }, pre: '<<', post: '>>' });
      expect(json).toContain('Hi Bob!');
      const restored = _.jsonDeserialize<typeof obj>(json, { replace: { user: 'Bob' }, pre: '<<', post: '>>' });
      expect(restored.msg).toBe('Hi Bob!');
    });

    it('does not replace if no match in replacer', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = _.jsonSerialize(obj, { replace: { foo: 'Bar' } });
      expect(json).toContain('${name}');
      const restored = _.jsonDeserialize<typeof obj>(json, { replace: { foo: 'Bar' } });
      expect(restored.msg).toBe('Hello ${name}!');
    });

    it('throws on circular reference', () => {
      const obj: Dict = { a: 1 };
      obj.self = obj;
      expect(() => _.jsonSerialize(obj)).toThrow();
    });
  });
  describe('stripJsonComments', () => {
    it('removes single-line comments', () => {
      const jsonc = `
      {
        // this is a comment
        "a": 1 // another comment
      }
    `;
      const stripped = stripJsonComments(jsonc);
      expect(stripped).not.toContain('//');
      expect(JSON.parse(stripped)).toEqual({ a: 1 });
    });

    it('removes multi-line comments', () => {
      const jsonc = `
      {
        /* this is a
           multi-line comment */
        "b": 2
      }
    `;
      const stripped = stripJsonComments(jsonc);
      expect(stripped).not.toContain('/*');
      expect(JSON.parse(stripped)).toEqual({ b: 2 });
    });

    it('handles comments and trailing commas', () => {
      const jsonc = `
      {
        "a": 1, // comment
        "b": 2, /* another comment */
      }
    `;
      const stripped = stripJsonComments(jsonc);
      // Remove trailing commas for valid JSON.parse
      const clean = stripped.replace(/,(\s*[}\]])/g, '$1');
      expect(JSON.parse(clean)).toEqual({ a: 1, b: 2 });
    });

    it('does not remove comment-like content in strings', () => {
      const jsonc = `
      {
        "str": "// not a comment",
        "str2": "/* not a comment */"
      }
    `;
      const stripped = stripJsonComments(jsonc);
      expect(JSON.parse(stripped)).toEqual({
        str: '// not a comment',
        str2: '/* not a comment */',
      });
    });
  });
});
