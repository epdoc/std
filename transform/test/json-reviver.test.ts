import type { Dict } from '@epdoc/type';
import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import { Json } from '../src/mod.ts';

Deno.test('jsonDeserialize reviver', async (t) => {
  await t.step('autoRegExp \u2013 basic patterns', async (t) => {
    await t.step('converts { pattern } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals((result.re as RegExp).flags, '');
    });

    await t.step('converts { pattern, flags } to RegExp', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"abc","flags":"gi"}}',
        { autoRegExp: true },
      );
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals((result.re as RegExp).flags, 'gi');
    });

    await t.step('converts { regex } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"regex":"abc"}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals((result.re as RegExp).flags, '');
    });

    await t.step('converts { regex, flags } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"regex":"abc","flags":"m"}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals((result.re as RegExp).flags, 'm');
    });

    await t.step('converts with no flags given', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: true,
      });
      assertEquals((result.re as RegExp).flags, '');
    });

    await t.step('converts with multiple flags', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"test","flags":"gimsuy"}}',
        { autoRegExp: true },
      );
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'test');
    });
  });

  await t.step('autoRegExp \u2013 special regex patterns', async (t) => {
    await t.step('converts pattern with anchors', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"^test$","flags":"m"}}',
        { autoRegExp: true },
      );
      assertInstanceOf(result.re, RegExp);
      assert((result.re as RegExp).test('test'));
      assertEquals((result.re as RegExp).test('atestb'), false);
    });

    await t.step('converts pattern with quantifiers', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"\\\\d+","flags":""}}',
        { autoRegExp: true },
      );
      assertInstanceOf(result.re, RegExp);
      assert((result.re as RegExp).test('123'));
      assertEquals((result.re as RegExp).test('abc'), false);
    });

    await t.step('converts pattern with alternation', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"cat|dog"}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assert((result.re as RegExp).test('cat'));
      assert((result.re as RegExp).test('dog'));
      assertEquals((result.re as RegExp).test('bird'), false);
    });

    await t.step('converts pattern with character classes', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"[a-z]"}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assert((result.re as RegExp).test('m'));
      assertEquals((result.re as RegExp).test('9'), false);
    });
  });

  await t.step('autoRegExp \u2013 edge cases', async (t) => {
    await t.step('converts empty pattern string to empty RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":""}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
    });

    await t.step('converts pattern with single dot', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"."}}', {
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assert((result.re as RegExp).test('x'));
    });
  });

  await t.step('autoRegExp \u2013 invalid patterns (returns original value)', async (t) => {
    await t.step('returns original object for unterminated character class', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"[invalid"}}', {
        autoRegExp: true,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: '[invalid' });
    });

    await t.step('returns original object for unclosed group', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"("}}', {
        autoRegExp: true,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: '(' });
    });

    await t.step('returns original object for invalid flags', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"abc","flags":"zz"}}',
        { autoRegExp: true },
      );
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 'abc', flags: 'zz' });
    });
  });

  await t.step('autoRegExp \u2013 invalid shapes (not RegExpDef)', async (t) => {
    await t.step('does not convert object where pattern is a number', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":123}}', {
        autoRegExp: true,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 123 });
    });

    await t.step('does not convert object with both pattern and regex keys', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"a","regex":"b"}}', {
        autoRegExp: true,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 'a', regex: 'b' });
    });

    await t.step('does not convert object with extra properties', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"a","extra":"prop"}}',
        { autoRegExp: true },
      );
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 'a', extra: 'prop' });
    });

    await t.step('does not convert empty object', () => {
      const result = Json.deserialize<Dict>('{"re":{}}', { autoRegExp: true });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, {});
    });

    await t.step('does not convert null', () => {
      const result = Json.deserialize<Dict>('{"re":null}', { autoRegExp: true });
      assertEquals(result.re, null);
    });

    await t.step('does not convert primitive values', () => {
      const result = Json.deserialize<Dict>('{"re":"abc"}', { autoRegExp: true });
      assertEquals(typeof result.re, 'string');
      assertEquals(result.re, 'abc');
    });
  });

  await t.step('autoRegExp \u2013 disabled', async (t) => {
    await t.step('does not convert when autoRegExp is false', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: false,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 'abc' });
    });

    await t.step('does not convert when autoRegExp is not set (default falsy)', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}');
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { pattern: 'abc' });
    });
  });

  await t.step('autoRegExp \u2013 nested structures', async (t) => {
    await t.step('converts RegExpDef nested inside an object', () => {
      const result = Json.deserialize<{ outer: Dict }>(
        '{"outer":{"inner":{"pattern":"hello","flags":"i"}}}',
        {
          autoRegExp: true,
        },
      );
      assertInstanceOf(result.outer.inner, RegExp);
      assertEquals((result.outer.inner as RegExp).source, 'hello');
      assertEquals((result.outer.inner as RegExp).flags, 'i');
    });

    await t.step('converts RegExpDef inside an array', () => {
      const result = Json.deserialize<{ list: unknown[] }>(
        '{"list":[{"pattern":"a"},{"pattern":"b","flags":"i"}]}',
        {
          autoRegExp: true,
        },
      );
      assertInstanceOf(result.list[0], RegExp);
      assertEquals((result.list[0] as RegExp).source, 'a');
      assertInstanceOf(result.list[1], RegExp);
      assertEquals((result.list[1] as RegExp).source, 'b');
      assertEquals((result.list[1] as RegExp).flags, 'i');
    });

    await t.step('converts RegExpDef at root level when JSON is a RegExpDef', () => {
      const result = Json.deserialize('{"pattern":"abc","flags":"g"}', {
        autoRegExp: true,
      });
      assertInstanceOf(result, RegExp);
      assertEquals((result as RegExp).source, 'abc');
      assertEquals((result as RegExp).flags, 'g');
    });
  });

  await t.step('autoRegExp \u2013 interaction with other features', async (t) => {
    await t.step('autoRegExp and autoTemporal both work independently', () => {
      const json = '{"re":{"pattern":"abc"},"time":"2024-01-15T12:30:45Z"}';
      const result = Json.deserialize<Dict>(json, {
        autoRegExp: true,
        autoTemporal: true,
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertInstanceOf(result.time, Temporal.Instant);
    });

    await t.step('autoRegExp and replace both work independently', () => {
      const json = '{"re":{"pattern":"abc"},"msg":"Hello ${name}"}';
      const result = Json.deserialize<Dict>(json, {
        autoRegExp: true,
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals(result.msg, 'Hello World');
    });

    await t.step('__filter RegExp takes precedence over autoRegExp', () => {
      const json = '{"re":{"__filter":"RegExp","regex":"from-filter","flags":"gi"}}';
      const result = Json.deserialize<Dict>(json, {
        decode: true,
        autoRegExp: true,
      });
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'from-filter');
      assertEquals((result.re as RegExp).flags, 'gi');
    });

    await t.step('autoRegExp does not interact with __filter non-RegExp types', () => {
      const json = '{"map":{"__filter":"Map","data":[["a",1]]}}';
      const result = Json.deserialize<Dict>(json, {
        decode: true,
        autoRegExp: true,
      });
      assertInstanceOf(result.map, Map);
    });
  });

  await t.step('__filter RegExp edge cases', async (t) => {
    await t.step('decodes valid __filter RegExp', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"abc","flags":"gi"}}',
        {
          decode: true,
        },
      );
      assertInstanceOf(result.re, RegExp);
      assertEquals((result.re as RegExp).source, 'abc');
      assertEquals((result.re as RegExp).flags, 'gi');
    });

    await t.step('returns original value for invalid RegExp in __filter', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"[invalid"}}',
        { decode: true },
      );
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { __filter: 'RegExp', regex: '[invalid' });
    });

    await t.step('returns original value for __filter RegExp with missing regex key', () => {
      const result = Json.deserialize<Dict>('{"re":{"__filter":"RegExp"}}', {
        decode: true,
      });
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { __filter: 'RegExp' });
    });

    await t.step('does not decode __filter RegExp when decode is false', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"abc"}}',
        { decode: false },
      );
      assertEquals(result.re instanceof RegExp, false);
      assertEquals(result.re, { __filter: 'RegExp', regex: 'abc' });
    });
  });
});
