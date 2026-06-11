import type { Dict } from '@epdoc/type';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { Json } from '../src/mod.ts';

describe('jsonDeserialize reviver', () => {
  describe('autoRegExp – basic patterns', () => {
    it('converts { pattern } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect((result.re as RegExp).flags).toBe('');
    });

    it('converts { pattern, flags } to RegExp', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"abc","flags":"gi"}}',
        { autoRegExp: true },
      );
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect((result.re as RegExp).flags).toBe('gi');
    });

    it('converts { regex } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"regex":"abc"}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect((result.re as RegExp).flags).toBe('');
    });

    it('converts { regex, flags } to RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"regex":"abc","flags":"m"}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect((result.re as RegExp).flags).toBe('m');
    });

    it('converts with no flags given', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: true,
      });
      expect((result.re as RegExp).flags).toBe('');
    });

    it('converts with multiple flags', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"test","flags":"gimsuy"}}',
        { autoRegExp: true },
      );
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('test');
    });
  });

  describe('autoRegExp – special regex patterns', () => {
    it('converts pattern with anchors', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"^test$","flags":"m"}}',
        { autoRegExp: true },
      );
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).test('test')).toBe(true);
      expect((result.re as RegExp).test('atestb')).toBe(false);
    });

    it('converts pattern with quantifiers', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"\\\\d+","flags":""}}',
        { autoRegExp: true },
      );
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).test('123')).toBe(true);
      expect((result.re as RegExp).test('abc')).toBe(false);
    });

    it('converts pattern with alternation', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"cat|dog"}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).test('cat')).toBe(true);
      expect((result.re as RegExp).test('dog')).toBe(true);
      expect((result.re as RegExp).test('bird')).toBe(false);
    });

    it('converts pattern with character classes', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"[a-z]"}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).test('m')).toBe(true);
      expect((result.re as RegExp).test('9')).toBe(false);
    });
  });

  describe('autoRegExp – edge cases', () => {
    it('converts empty pattern string to empty RegExp', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":""}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
    });

    it('converts pattern with single dot', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"."}}', {
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).test('x')).toBe(true);
    });
  });

  describe('autoRegExp – invalid patterns (returns original value)', () => {
    it('returns original object for unterminated character class', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"[invalid"}}', {
        autoRegExp: true,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: '[invalid' });
    });

    it('returns original object for unclosed group', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"("}}', {
        autoRegExp: true,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: '(' });
    });

    it('returns original object for invalid flags', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"abc","flags":"zz"}}',
        { autoRegExp: true },
      );
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 'abc', flags: 'zz' });
    });
  });

  describe('autoRegExp – invalid shapes (not RegExpDef)', () => {
    it('does not convert object where pattern is a number', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":123}}', {
        autoRegExp: true,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 123 });
    });

    it('does not convert object with both pattern and regex keys', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"a","regex":"b"}}', {
        autoRegExp: true,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 'a', regex: 'b' });
    });

    it('does not convert object with extra properties', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"pattern":"a","extra":"prop"}}',
        { autoRegExp: true },
      );
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 'a', extra: 'prop' });
    });

    it('does not convert empty object', () => {
      const result = Json.deserialize<Dict>('{"re":{}}', { autoRegExp: true });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({});
    });

    it('does not convert null', () => {
      const result = Json.deserialize<Dict>('{"re":null}', { autoRegExp: true });
      expect(result.re).toBeNull();
    });

    it('does not convert primitive values', () => {
      const result = Json.deserialize<Dict>('{"re":"abc"}', { autoRegExp: true });
      expect(typeof result.re).toBe('string');
      expect(result.re).toBe('abc');
    });
  });

  describe('autoRegExp – disabled', () => {
    it('does not convert when autoRegExp is false', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}', {
        autoRegExp: false,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 'abc' });
    });

    it('does not convert when autoRegExp is not set (default falsy)', () => {
      const result = Json.deserialize<Dict>('{"re":{"pattern":"abc"}}');
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ pattern: 'abc' });
    });
  });

  describe('autoRegExp – nested structures', () => {
    it('converts RegExpDef nested inside an object', () => {
      const result = Json.deserialize<{ outer: Dict }>(
        '{"outer":{"inner":{"pattern":"hello","flags":"i"}}}',
        {
          autoRegExp: true,
        },
      );
      expect(result.outer.inner).toBeInstanceOf(RegExp);
      expect((result.outer.inner as RegExp).source).toBe('hello');
      expect((result.outer.inner as RegExp).flags).toBe('i');
    });

    it('converts RegExpDef inside an array', () => {
      const result = Json.deserialize<{ list: unknown[] }>(
        '{"list":[{"pattern":"a"},{"pattern":"b","flags":"i"}]}',
        {
          autoRegExp: true,
        },
      );
      expect(result.list[0]).toBeInstanceOf(RegExp);
      expect((result.list[0] as RegExp).source).toBe('a');
      expect(result.list[1]).toBeInstanceOf(RegExp);
      expect((result.list[1] as RegExp).source).toBe('b');
      expect((result.list[1] as RegExp).flags).toBe('i');
    });

    it('converts RegExpDef at root level when JSON is a RegExpDef', () => {
      const result = Json.deserialize('{"pattern":"abc","flags":"g"}', {
        autoRegExp: true,
      });
      expect(result).toBeInstanceOf(RegExp);
      expect((result as RegExp).source).toBe('abc');
      expect((result as RegExp).flags).toBe('g');
    });
  });

  describe('autoRegExp – interaction with other features', () => {
    it('autoRegExp and autoTemporal both work independently', () => {
      const json = '{"re":{"pattern":"abc"},"time":"2024-01-15T12:30:45Z"}';
      const result = Json.deserialize<Dict>(json, {
        autoRegExp: true,
        autoTemporal: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect(result.time).toBeInstanceOf(Temporal.ZonedDateTime);
    });

    it('autoRegExp and replace both work independently', () => {
      const json = '{"re":{"pattern":"abc"},"msg":"Hello ${name}"}';
      const result = Json.deserialize<Dict>(json, {
        autoRegExp: true,
        replace: { name: 'World' },
        pre: '${',
        post: '}',
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect(result.msg).toBe('Hello World');
    });

    it('__filter RegExp takes precedence over autoRegExp', () => {
      const json = '{"re":{"__filter":"RegExp","regex":"from-filter","flags":"gi"}}';
      const result = Json.deserialize<Dict>(json, {
        decode: true,
        autoRegExp: true,
      });
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('from-filter');
      expect((result.re as RegExp).flags).toBe('gi');
    });

    it('autoRegExp does not interact with __filter non-RegExp types', () => {
      const json = '{"map":{"__filter":"Map","data":[["a",1]]}}';
      const result = Json.deserialize<Dict>(json, {
        decode: true,
        autoRegExp: true,
      });
      expect(result.map).toBeInstanceOf(Map);
    });
  });

  describe('__filter RegExp edge cases', () => {
    it('decodes valid __filter RegExp', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"abc","flags":"gi"}}',
        {
          decode: true,
        },
      );
      expect(result.re).toBeInstanceOf(RegExp);
      expect((result.re as RegExp).source).toBe('abc');
      expect((result.re as RegExp).flags).toBe('gi');
    });

    it('returns original value for invalid RegExp in __filter', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"[invalid"}}',
        { decode: true },
      );
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ __filter: 'RegExp', regex: '[invalid' });
    });

    it('returns original value for __filter RegExp with missing regex key', () => {
      const result = Json.deserialize<Dict>('{"re":{"__filter":"RegExp"}}', {
        decode: true,
      });
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ __filter: 'RegExp' });
    });

    it('does not decode __filter RegExp when decode is false', () => {
      const result = Json.deserialize<Dict>(
        '{"re":{"__filter":"RegExp","regex":"abc"}}',
        { decode: false },
      );
      expect(result.re).not.toBeInstanceOf(RegExp);
      expect(result.re).toEqual({ __filter: 'RegExp', regex: 'abc' });
    });
  });
});
