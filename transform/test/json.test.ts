import { _, type Dict } from '@epdoc/type';
import { assert, assertEquals, assertInstanceOf, assertStringIncludes, assertThrows } from '@std/assert';
import { Json } from '../src/mod.ts';

Deno.test('json', async (t) => {
  await t.step('jsonSerialize', async (t) => {
    await t.step('should serialize a simple object', () => {
      const obj = { name: 'Alice', age: 30 };
      const json = Json.serialize(obj);
      assertEquals(json, '{"name":"Alice","age":30}');
    });

    await t.step('should serialize an array', () => {
      const arr = [1, 2, 3];
      const json = Json.serialize(arr);
      assertEquals(json, '[1,2,3]');
    });

    await t.step('should serialize nested objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const json = Json.serialize(obj);
      assertEquals(json, '{"a":1,"b":{"c":2}}');
    });

    await t.step('should serialize null and undefined', () => {
      const obj = { a: null, b: undefined };
      const json = Json.serialize(obj);
      assertEquals(json, '{"a":null}');
    });

    await t.step('should serialize boolean and number', () => {
      const obj = { flag: true, count: 42 };
      const json = Json.serialize(obj);
      assertEquals(json, '{"flag":true,"count":42}');
    });

    await t.step('should serialize string with special characters', () => {
      const obj = { text: 'Hello\nWorld' };
      const json = Json.serialize(obj);
      assertEquals(json, '{"text":"Hello\\nWorld"}');
    });

    await t.step('should serialize empty object', () => {
      const obj = {};
      const json = Json.serialize(obj);
      assertEquals(json, '{}');
    });

    await t.step('should serialize empty array', () => {
      const arr: unknown[] = [];
      const json = Json.serialize(arr);
      assertEquals(json, '[]');
    });

    await t.step('should serialize deeply nested structures', () => {
      const obj = { a: [{ b: { c: [1, 2, { d: null }] } }] };
      const json = Json.serialize(obj);
      assertEquals(json, '{"a":[{"b":{"c":[1,2,{"d":null}]}}]}');
    });

    await t.step('should serialize array with undefined and null', () => {
      const arr = [1, undefined, null, 4];
      const json = Json.serialize(arr);
      assertEquals(json, '[1,null,null,4]');
    });

    await t.step('should serialize Date as ISO string', () => {
      const obj = { now: new Date('2020-01-01T00:00:00Z') };
      const json = Json.serialize(obj);
      assertEquals(json, '{"now":"2020-01-01T00:00:00.000Z"}');
    });

    await t.step('should serialize object with toJSON method', () => {
      const obj = {
        a: 1,
        toJSON() {
          return { b: 2 };
        },
      };
      const json = Json.serialize(obj);
      assertEquals(json, '{"b":2}');
    });
  });

  await t.step('jsonDeserialize', async (t) => {
    await t.step('should deserialize a simple object', () => {
      const json = '{"name":"Alice","age":30}';
      const obj = Json.deserialize(json);
      assertEquals(obj, { name: 'Alice', age: 30 });
    });

    await t.step('should deserialize an array', () => {
      const json = '[1,2,3]';
      const arr = Json.deserialize(json);
      assertEquals(arr, [1, 2, 3]);
    });

    await t.step('should deserialize nested objects', () => {
      const json = '{"a":1,"b":{"c":2}}';
      const obj = Json.deserialize(json);
      assertEquals(obj, { a: 1, b: { c: 2 } });
    });

    await t.step('should deserialize null', () => {
      const json = 'null';
      const value = Json.deserialize(json);
      assertEquals(value, null);
    });

    await t.step('should deserialize boolean and number', () => {
      const json = '{"flag":true,"count":42}';
      const obj = Json.deserialize(json);
      assertEquals(obj, { flag: true, count: 42 });
    });

    await t.step('should throw on invalid JSON', () => {
      const json = '{"a":1,}';
      assertThrows(() => Json.deserialize(json));
    });

    await t.step('should deserialize empty object', () => {
      const json = '{}';
      const obj = Json.deserialize(json);
      assertEquals(obj, {});
    });

    await t.step('should deserialize empty array', () => {
      const json = '[]';
      const arr = Json.deserialize(json);
      assertEquals(arr, []);
    });

    await t.step('should deserialize deeply nested structures', () => {
      const json = '{"a":[{"b":{"c":[1,2,{"d":null}]}}]}';
      const obj = Json.deserialize(json);
      assertEquals(obj, { a: [{ b: { c: [1, 2, { d: null }] } }] });
    });

    await t.step('should deserialize string with special characters', () => {
      const json = '{"text":"Hello\\nWorld"}';
      const obj = Json.deserialize(json);
      assertEquals(obj, { text: 'Hello\nWorld' });
    });

    await t.step('should deserialize ISO date string as string', () => {
      const json = '{"now":"2020-01-01T00:00:00.000Z"}';
      const result = Json.deserialize(json) as Record<string, unknown>;
      assertEquals(typeof result.now, 'string');
      assertEquals(result.now, '2020-01-01T00:00:00.000Z');
    });

    await t.step('should deserialize array with nulls', () => {
      const json = '[1,null,null,4]';
      const arr = Json.deserialize(json);
      assertEquals(arr, [1, null, null, 4]);
    });
  });
  await t.step('jsonSerialize/jsonDeserialize advanced', async (t) => {
    await t.step('serializes and deserializes Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3]);
      const json = Json.serialize(arr, { encode: true });
      const restored = Json.deserialize<typeof arr>(json, { decode: true });
      assertEquals(restored, arr);
      assertInstanceOf(restored, Uint8Array);
    });

    await t.step('serializes and deserializes Set', () => {
      const set = new Set([1, 2, 3]);
      const json = Json.serialize(set, { encode: true });
      const restored = Json.deserialize<typeof set>(json, { decode: true });
      assertInstanceOf(restored, Set);
      assertEquals(Array.from(restored), [1, 2, 3]);
    });

    await t.step('serializes and deserializes Map', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const json = Json.serialize(map, { encode: true });
      const restored = Json.deserialize<typeof map>(json, { decode: true });
      assertInstanceOf(restored, Map);
      assertEquals(Array.from(restored.entries()), [['a', 1], ['b', 2]]);
    });

    await t.step('serializes and deserializes RegExp', () => {
      const re = /abc/gi;
      const json = Json.serialize(re, { encode: true });
      const restored = Json.deserialize<typeof re>(json, { decode: true });
      assertInstanceOf(restored, RegExp);
      assertEquals(restored.source, 'abc');
      assertEquals(restored.flags, 'gi');
    });

    await t.step('serializes and deserializes RegExp with detectRegExp', () => {
      const re = /abc/gi;
      const json = Json.serialize(re, { autoRegExp: true });
      const restored = Json.deserialize<typeof re>(json, { autoRegExp: true });
      assertInstanceOf(restored, RegExp);
      assertEquals(restored.source, 'abc');
      assertEquals(restored.flags, 'gi');
    });

    await t.step('serializes Date as ISO string (no auto-restore to Date)', () => {
      const date = new Date('2022-01-01T12:00:00.000Z');
      const json = Json.serialize(date);
      const restored = Json.deserialize(json);
      assertEquals(typeof restored, 'string');
      assertEquals(restored, '2022-01-01T12:00:00.000Z');
    });

    await t.step('serializes and deserializes nested structures with special types', () => {
      const obj = {
        arr: [1, 2, new Uint8Array([3, 4])],
        set: new Set(['a', 'b']),
        map: new Map([[1, 'one']]),
        date: new Date('2020-01-01T00:00:00.000Z'),
        re: /foo/i,
      };
      const json = Json.serialize(obj, { encode: true });
      const restored = Json.deserialize(json, { decode: true }) as typeof obj;
      assertInstanceOf(restored.arr[2], Uint8Array);
      assertInstanceOf(restored.set, Set);
      assertInstanceOf(restored.map, Map);
      assertEquals(typeof restored.date, 'string');
      assertInstanceOf(restored.re, RegExp);
    });

    await t.step('serializes and deserializes with string replacer', () => {
      const obj = { msg: 'Hello ${name}!', other: 'No replace' };
      const json = Json.serialize(obj, {
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      assertStringIncludes(json, 'Hello World!');
      const restored = Json.deserialize<typeof obj>(json, {
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      assertEquals(restored.msg, 'Hello World!');
      assertEquals(restored.other, 'No replace');
    });

    await t.step('applies replacer on deserialization only', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = Json.serialize(obj);
      const restored = Json.deserialize<typeof obj>(json, {
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      assertEquals(restored.msg, 'Hello World!');
    });

    await t.step('applies replacer on serialization only', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = Json.serialize(obj, {
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      assertStringIncludes(json, 'Hello World!');
      const restored = Json.deserialize<typeof obj>(json);
      assertEquals(restored.msg, 'Hello World!');
    });

    await t.step('serializes and deserializes with custom delimiters', () => {
      const obj = { msg: 'Hi <<user>>!' };
      const json = Json.serialize(obj, {
        replace: { user: 'Bob' },
        pre: '<<',
        post: '>>',
      });
      assertStringIncludes(json, 'Hi Bob!');
      const restored = Json.deserialize<typeof obj>(json, {
        replace: { user: 'Bob' },
        pre: '<<',
        post: '>>',
      });
      assertEquals(restored.msg, 'Hi Bob!');
    });

    await t.step('does not replace if no match in replacer', () => {
      const obj = { msg: 'Hello ${name}!' };
      const json = Json.serialize(obj, { replace: { foo: 'Bar' } });
      assertStringIncludes(json, '${name}');
      const restored = Json.deserialize<typeof obj>(json, {
        replace: { foo: 'Bar' },
      });
      assertEquals(restored.msg, 'Hello ${name}!');
    });

    await t.step('throws on circular reference', () => {
      const obj: Dict = { a: 1 };
      obj.self = obj;
      assertThrows(() => Json.serialize(obj));
    });
  });
  await t.step('temporal serialization', async (t) => {
    await t.step('serializes and deserializes Temporal.Instant', () => {
      const obj = { time: Temporal.Instant.from('2024-01-15T12:30:45.123Z') };
      const json = Json.serialize(obj);
      const result = Json.deserialize(json, { autoTemporal: true }) as { time: unknown };
      assertInstanceOf(result.time, Temporal.Instant);
      assertEquals(
        (result.time as Temporal.Instant).epochMilliseconds,
        obj.time.epochMilliseconds,
      );
    });

    await t.step('serializes and deserializes Temporal.ZonedDateTime', () => {
      const obj = {
        time: Temporal.ZonedDateTime.from(
          '2024-01-15T12:30:45-05:00[America/New_York]',
        ),
      };
      const json = Json.serialize(obj);
      const result = Json.deserialize(json, { autoTemporal: true }) as { time: unknown };
      assertInstanceOf(result.time, Temporal.ZonedDateTime);
      assertEquals(
        (result.time as Temporal.ZonedDateTime).epochMilliseconds,
        obj.time.epochMilliseconds,
      );
    });

    await t.step('serializes and deserializes Temporal.PlainDateTime', () => {
      const obj = {
        time: Temporal.PlainDateTime.from('2024-01-15T12:30:45.123'),
      };
      const json = Json.serialize(obj);
      const result = Json.deserialize(json, { autoTemporal: true }) as { time: unknown };
      assertInstanceOf(result.time, Temporal.PlainDateTime);
    });

    await t.step('autoTemporal converts ISO strings to Temporal types', () => {
      const json = '{"time":"2024-01-15T12:30:45Z"}';
      const result = Json.deserialize(json, { autoTemporal: true }) as {
        time: unknown;
      };
      assertInstanceOf(result.time, Temporal.Instant);
    });

    await t.step('without autoTemporal, ISO strings remain strings', () => {
      const json = '{"time":"2024-01-15T12:30:45Z"}';
      const result = Json.deserialize(json) as { time: unknown };
      assertEquals(typeof result.time, 'string');
    });

    await t.step('serializes and deserializes Temporal values in arrays', () => {
      const obj = {
        times: [
          Temporal.Instant.from('2024-01-15T12:30:45Z'),
          Temporal.ZonedDateTime.from(
            '2024-01-15T12:30:45-05:00[America/New_York]',
          ),
        ],
      };
      const json = Json.serialize(obj);
      const result = Json.deserialize(json, { autoTemporal: true }) as { times: unknown[] };
      assert(Array.isArray(result.times));
      assertInstanceOf(result.times[0], Temporal.Instant);
      assertInstanceOf(result.times[1], Temporal.ZonedDateTime);
    });

    await t.step('serializes but do not dserialize Temporal values in arrays', () => {
      const obj = {
        times: [
          Temporal.Instant.from('2024-01-15T12:30:45Z'),
          Temporal.ZonedDateTime.from(
            '2024-01-15T12:30:45-05:00[America/New_York]',
          ),
        ],
      };
      const json = Json.serialize(obj);

      // autoTemporal is not set
      let result = Json.deserialize<{ times: unknown[] }>(json, {});
      assert(Array.isArray(result.times));
      assert(_.isString(result.times[0]));
      assert(_.isString(result.times[1]));
      assertEquals(result.times[0], '2024-01-15T12:30:45Z');
      assertEquals(result.times[1], '2024-01-15T12:30:45-05:00[America/New_York]');

      // decode is true, but autoTemporal needs to be set
      result = Json.deserialize<{ times: unknown[] }>(json, { decode: true });
      assert(Array.isArray(result.times));
      assert(_.isString(result.times[0]));
      assert(_.isString(result.times[1]));
      assertEquals(result.times[0], '2024-01-15T12:30:45Z');
      assertEquals(result.times[1], '2024-01-15T12:30:45-05:00[America/New_York]');
    });

    await t.step('serializes and deserializes Temporal values in nested objects', () => {
      const obj = {
        meta: {
          created: Temporal.Instant.from('2024-01-15T12:30:45Z'),
        },
      };
      const json = Json.serialize(obj);
      const result = Json.deserialize(json, { autoTemporal: true }) as { meta: { created: unknown } };
      assertInstanceOf(result.meta.created, Temporal.Instant);
    });
  });

  await t.step('Json.stripComments', async (t) => {
    await t.step('removes single-line comments', () => {
      const jsonc = `
      {
        // this is a comment
        "a": 1 // another comment
      }
    `;
      const stripped = Json.stripComments(jsonc);
      assert(!stripped.includes('//'));
      assertEquals(JSON.parse(stripped), { a: 1 });
    });

    await t.step('removes multi-line comments', () => {
      const jsonc = `
      {
        /* this is a
           multi-line comment */
        "b": 2
      }
    `;
      const stripped = Json.stripComments(jsonc);
      assert(!stripped.includes('/*'));
      assertEquals(JSON.parse(stripped), { b: 2 });
    });

    await t.step('handles comments and trailing commas', () => {
      const jsonc = `
      {
        "a": 1, // comment
        "b": 2, /* another comment */
      }
    `;
      const stripped = Json.stripComments(jsonc);
      const clean = stripped.replace(/,(\s*[}\]])/g, '$1');
      assertEquals(JSON.parse(clean), { a: 1, b: 2 });
    });

    await t.step('does not remove comment-like content in strings', () => {
      const jsonc = `
      {
        "str": "// not a comment",
        "str2": "/* not a comment */"
      }
    `;
      const stripped = Json.stripComments(jsonc);
      assertEquals(JSON.parse(stripped), {
        str: '// not a comment',
        str2: '/* not a comment */',
      });
    });
  });
});
