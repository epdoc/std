import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { msubLite } from '../src/mod.ts';

describe('utils', () => {
  describe('msubLite', () => {
    it('replaces simple keys', () => {
      expect(msubLite('Hello ${name}!', { name: 'World' })).toBe('Hello World!');
    });
    it('leaves unknown keys unchanged', () => {
      expect(msubLite('Hello ${name}!', {})).toBe('Hello ${name}!');
    });
    it('works with custom delimiters', () => {
      expect(msubLite('Hello <<name>>!', { name: 'World' }, '<<', '>>')).toBe('Hello World!');
    });
    it('replaces multiple occurrences', () => {
      expect(msubLite('${a} and ${a}', { a: 'x' })).toBe('x and x');
    });
    it('works with adjacent keys', () => {
      expect(msubLite('${a}${b}', { a: 'x', b: 'y' })).toBe('xy');
    });
    it('returns original string if no replacements', () => {
      expect(msubLite('no keys here', { a: 'x' })).toBe('no keys here');
    });
    it('handles empty string', () => {
      expect(msubLite('', { a: 'x' })).toBe('');
    });
    it('handles missing delimiters gracefully', () => {
      expect(msubLite('Hello ${name}!', { name: 'World' }, '', '')).toBe('Hello ${name}!');
    });
  });
});
