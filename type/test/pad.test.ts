import { pad } from '@epdoc/type';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

describe('pad', () => {
  describe('numbers (default pad: "0")', () => {
    it('should left pad numbers with zeros by default', () => {
      expect(pad(32, 4)).toEqual('0032');
      expect(pad(7, 3)).toEqual('007');
      expect(pad(123, 5)).toEqual('00123');
    });

    it('should right pad numbers with spaces when width is negative', () => {
      expect(pad(32, -4)).toEqual('32  ');
      expect(pad(7, -3)).toEqual('7  ');
      expect(pad(123, -5)).toEqual('123  ');
    });

    it('should return number unchanged if already at or exceeds width', () => {
      expect(pad(12345, 5)).toEqual('12345');
      expect(pad(12345, 3)).toEqual('12345');
      expect(pad(12345, -3)).toEqual('12345');
    });

    it('should handle zero and negative numbers', () => {
      expect(pad(0, 5)).toEqual('00000');
      expect(pad(-42, 5)).toEqual('-0042'); // Note: "-42" becomes 0-42
      expect(pad(-42, 6)).toEqual('-00042');
    });

    it('should handle decimal numbers', () => {
      expect(pad(3.14, 6)).toEqual('003.14');
      expect(pad(3.14, -6)).toEqual('3.14  ');
      expect(pad(1.5, 4)).toEqual('01.5');
    });
  });

  describe('strings (default pad: " ")', () => {
    it('should left pad strings with spaces by default', () => {
      expect(pad('hello', 10)).toEqual('     hello');
      expect(pad('AB', 5)).toEqual('   AB');
      expect(pad('test', 6)).toEqual('  test');
    });

    it('should right pad strings with spaces when width is negative', () => {
      expect(pad('hello', -10)).toEqual('hello     ');
      expect(pad('AB', -5)).toEqual('AB   ');
      expect(pad('test', -6)).toEqual('test  ');
    });

    it('should return string unchanged if already at or exceeds width', () => {
      expect(pad('hello', 5)).toEqual('hello');
      expect(pad('hello', 3)).toEqual('hello');
      expect(pad('hello', -3)).toEqual('hello');
    });

    it('should handle empty strings', () => {
      expect(pad('', 3)).toEqual('   ');
      expect(pad('', -3)).toEqual('   ');
      expect(pad('', 0)).toEqual('');
    });

    it('should handle string representations of numbers', () => {
      expect(pad('42', 5)).toEqual('   42'); // Space padding, not zero!
      expect(pad('007', 6)).toEqual('   007');
      expect(pad('123', -4)).toEqual('123 ');
    });
  });

  describe('explicit pad character (overrides default)', () => {
    it('should use explicit pad character for numbers', () => {
      expect(pad(32, 4, '*')).toEqual('**32');
      expect(pad(7, 3, ' ')).toEqual('  7');
      expect(pad(123, 5, '-')).toEqual('--123');
    });

    it('should use explicit pad character for strings', () => {
      expect(pad('hello', 10, '.')).toEqual('.....hello');
      expect(pad('AB', 5, '0')).toEqual('000AB');
      expect(pad('test', 6, '-')).toEqual('--test');
    });

    it('should work with multi-character pad strings', () => {
      expect(pad(42, 10, 'ab')).toEqual('aaaaaaaa42');
      expect(pad('hi', 8, '+-')).toEqual('++++++hi');
    });

    it('should handle special characters', () => {
      expect(pad(7, 4, '\t')).toEqual('\t\t\t7');
      expect(pad('x', 3, '\n')).toEqual('\n\nx');
    });
  });

  describe('edge cases and boundaries', () => {
    it('should handle width of zero', () => {
      expect(pad(42, 0)).toEqual('42');
      expect(pad('hello', 0)).toEqual('hello');
      expect(pad(42, -0)).toEqual('42'); // negative zero
    });

    it('should handle very large widths', () => {
      expect(pad(7, 1000).length).toEqual(1000);
      expect(pad('x', -500).length).toEqual(500);
    });

    it('should handle width of 1', () => {
      expect(pad(5, 1)).toEqual('5');
      expect(pad(5, 2)).toEqual('05');
      expect(pad('x', 1)).toEqual('x');
      expect(pad('x', 2)).toEqual(' x');
    });

    it('should correctly pad when input length equals width', () => {
      expect(pad(12345, 5)).toEqual('12345');
      expect(pad('hello', 5)).toEqual('hello');
      expect(pad(12345, -5)).toEqual('12345');
      expect(pad('hello', -5)).toEqual('hello');
    });

    it('should handle floating point width', () => {
      expect(pad(42, 4.7)).toEqual('0042'); // Math.abs(4.7) = 4
      expect(pad(42, -4.2)).toEqual('42  '); // Math.abs(-4.2) = 4
    });

    it('should handle Infinity and NaN as inputs', () => {
      expect(pad(Infinity, 10)).toEqual('  Infinity');
      expect(pad(-Infinity, 12)).toEqual('   -Infinity');
      expect(pad(NaN, 5)).toEqual('  NaN');
    });
  });

  describe('type coercion behavior', () => {
    it('should convert non-string/number inputs via String()', () => {
      // @ts-expect-error - testing runtime behavior
      expect(pad(true, 5)).toEqual(' true'); // string default (space)
      // @ts-expect-error - testing runtime behavior
      expect(pad(false, 6)).toEqual(' false'); // string default (space)
      // @ts-expect-error - testing runtime behavior
      expect(pad(null, 5)).toEqual(' null'); // string default (space)
      // @ts-expect-error - testing runtime behavior
      expect(pad(undefined, 9)).toEqual('undefined'); // string default (space)
    });

    it('should treat numeric strings as strings (space padding)', () => {
      expect(pad('32', 4)).toEqual('  32'); // Space padding!
      expect(pad('007', 5)).toEqual('  007');
    });

    it('should treat number objects as numbers (zero padding)', () => {
      const numObj = new Number(42); // eslint-disable-line no-new-wrappers
      // @ts-expect-error - Number object
      expect(pad(numObj, 5)).toEqual('00042');
    });
  });

  describe('real-world scenarios', () => {
    it('should format IDs with leading zeros', () => {
      const ids = [1, 23, 456].map((id) => pad(id, 6));
      expect(ids).toEqual(['000001', '000023', '000456']);
    });

    it('should align text in columns', () => {
      const names = ['Alice', 'Bob', 'Charlie'].map((name) => pad(name, -10));
      expect(names).toEqual(['Alice     ', 'Bob       ', 'Charlie   ']);
    });

    it('should create fixed-width hexadecimal', () => {
      const hex = pad((255).toString(16).toUpperCase(), 4, '0');
      expect(hex).toEqual('00FF'); // Number default (zero)
    });

    it('should format monetary amounts', () => {
      const amounts = [12.5, 123.45, 7].map((amt) => pad(amt.toFixed(2), 8, '0'));
      expect(amounts).toEqual(['00012.50', '00123.45', '00007.00']);
    });

    it('should create progress bars', () => {
      const progress = 75;
      const bar = pad('', -20, '█').slice(0, progress / 5) +
        pad('', 20 - progress / 5, '░');
      expect(bar).toEqual('███████████████░░░░░');
    });
  });
});
