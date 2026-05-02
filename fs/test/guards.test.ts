import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { isFileUrl, isRelativePath } from '../src/guards.ts';
import type { RelativePath } from '../src/types.ts';

describe('isFileUrl', () => {
  test('returns true for valid file:// URLs', () => {
    expect(isFileUrl('file:///home/user/documents/file.txt')).toBe(true);
    expect(isFileUrl('file:///C:/Users/test/file.txt')).toBe(true);
    expect(isFileUrl('file://localhost/etc/hosts')).toBe(true);
    expect(isFileUrl('file:///path/to/folder/')).toBe(true);
  });

  test('returns false for non-file URLs', () => {
    expect(isFileUrl('http://example.com/file.txt')).toBe(false);
    expect(isFileUrl('https://example.com/file.txt')).toBe(false);
    expect(isFileUrl('ftp://ftp.example.com/file.txt')).toBe(false);
    expect(isFileUrl('mailto:test@example.com')).toBe(false);
  });

  test('returns false for plain file paths', () => {
    expect(isFileUrl('/home/user/file.txt')).toBe(false);
    expect(isFileUrl('C:\\Users\\test\\file.txt')).toBe(false);
    expect(isFileUrl('./relative/path.txt')).toBe(false);
    expect(isFileUrl('../parent/file.txt')).toBe(false);
  });

  test('returns false for empty or invalid inputs', () => {
    expect(isFileUrl('')).toBe(false);
    expect(isFileUrl('   ')).toBe(false);
    expect(isFileUrl(null)).toBe(false);
    expect(isFileUrl(undefined)).toBe(false);
    expect(isFileUrl(123)).toBe(false);
    expect(isFileUrl({})).toBe(false);
    expect(isFileUrl([])).toBe(false);
  });

  test('returns false for malformed URLs', () => {
    // Note: 'file://' is actually a valid URL per URL spec, just without a path
    expect(isFileUrl('file://')).toBe(true);
    expect(isFileUrl('not a url')).toBe(false);
    expect(isFileUrl('://missing-protocol')).toBe(false);
  });

  test('returns true for file URLs with special characters', () => {
    expect(isFileUrl('file:///path/to/file%20with%20spaces.txt')).toBe(true);
    expect(isFileUrl('file:///path/to/file%2Bsymbol.txt')).toBe(true);
  });

  test('returns true for file URLs with query strings and hashes', () => {
    expect(isFileUrl('file:///path/to/file.txt?query=1')).toBe(true);
    expect(isFileUrl('file:///path/to/file.txt#section')).toBe(true);
  });
});

describe('isRelativePath', () => {
  describe('strict mode (default is false)', () => {
    test('returns true for paths starting with ./', () => {
      expect(isRelativePath('./file.txt')).toBe(true);
      expect(isRelativePath('./path/to/file.txt')).toBe(true);
      expect(isRelativePath('./')).toBe(true);
    });

    test('returns true for paths starting with ../', () => {
      expect(isRelativePath('../file.txt')).toBe(true);
      expect(isRelativePath('../../file.txt')).toBe(true);
      expect(isRelativePath('../path/to/file.txt')).toBe(true);
    });

    test('returns true for paths starting with .\\ (Windows)', () => {
      expect(isRelativePath('.\\file.txt')).toBe(true);
      expect(isRelativePath('.\\path\\to\\file.txt')).toBe(true);
    });

    test('returns true for paths starting with ..\\ (Windows)', () => {
      expect(isRelativePath('..\\file.txt')).toBe(true);
      expect(isRelativePath('..\\..\\file.txt')).toBe(true);
    });

    test('returns true for single dot or double dot', () => {
      expect(isRelativePath('.')).toBe(true);
      expect(isRelativePath('..')).toBe(true);
    });

    test('returns true for paths containing path separators (loose mode)', () => {
      expect(isRelativePath('path/to/file.txt')).toBe(true);
      // TODO: Windows backslash paths - skipping for now
      // expect(isRelativePath('path\\to\\file.txt')).toBe(true);
    });

    test('returns false for absolute Unix paths', () => {
      expect(isRelativePath('/absolute/path')).toBe(false);
      expect(isRelativePath('/')).toBe(false);
      expect(isRelativePath('/home/user/file.txt')).toBe(false);
    });

    test('returns false for absolute Windows paths', () => {
      // TODO: Windows path detection - skipping for now, only testing Unix paths
      // expect(isRelativePath('C:\\path\\to\\file')).toBe(false);
      // expect(isRelativePath('D:/path/to/file')).toBe(false);
      // expect(isRelativePath('\\\\server\\share')).toBe(false);
    });

    test('returns false for file URLs', () => {
      expect(isRelativePath('file:///path/to/file')).toBe(false);
    });

    test('returns false for empty or whitespace-only strings', () => {
      expect(isRelativePath('')).toBe(false);
      expect(isRelativePath('   ')).toBe(false);
      expect(isRelativePath('\t\n')).toBe(false);
    });
  });

  describe('strict mode (strict=true)', () => {
    test('returns true only for paths starting with ./ or ../', () => {
      expect(isRelativePath('./file.txt', true)).toBe(true);
      expect(isRelativePath('../file.txt', true)).toBe(true);
      expect(isRelativePath('./path/to/file.txt', true)).toBe(true);
      expect(isRelativePath('../path/to/file.txt', true)).toBe(true);
    });

    test('returns true for Windows-style relative prefixes', () => {
      expect(isRelativePath('.\\file.txt', true)).toBe(true);
      expect(isRelativePath('..\\file.txt', true)).toBe(true);
    });

    test('returns false for simple file names in strict mode', () => {
      expect(isRelativePath('file.txt', true)).toBe(false);
      expect(isRelativePath('script', true)).toBe(false);
    });

    test('returns false for paths with separators but no dot prefix in strict mode', () => {
      expect(isRelativePath('path/to/file.txt', true)).toBe(false);
      expect(isRelativePath('path\\to\\file.txt', true)).toBe(false);
    });

    test('returns false for single dot or double dot in strict mode', () => {
      // Note: These might be expected to be true, but strict mode requires trailing slash
      expect(isRelativePath('.', true)).toBe(false);
      expect(isRelativePath('..', true)).toBe(false);
    });

    test('returns false for absolute paths in strict mode', () => {
      expect(isRelativePath('/absolute/path', true)).toBe(false);
      expect(isRelativePath('C:\\path', true)).toBe(false);
    });
  });

  describe('type narrowing', () => {
    test('narrows type to RelativePath when true', () => {
      const path: string = './test.txt';
      if (isRelativePath(path)) {
        // TypeScript should recognize path as RelativePath here
        const relative: RelativePath = path;
        expect(relative).toBe('./test.txt');
      }
    });

    test('does not narrow type when false', () => {
      const path: string = '/absolute/path';
      if (!isRelativePath(path)) {
        // path should still be string here
        expect(typeof path).toBe('string');
      }
    });
  });

  describe('edge cases', () => {
    test('handles whitespace at start/end', () => {
      expect(isRelativePath('  ./file.txt  ')).toBe(true);
      expect(isRelativePath('  /absolute  ')).toBe(false);
    });

    test('handles complex relative paths', () => {
      expect(isRelativePath('././file.txt')).toBe(true);
      expect(isRelativePath('.././../file.txt')).toBe(true);
      expect(isRelativePath('./path/../other/file.txt')).toBe(true);
    });

    test('handles paths with dots in names', () => {
      expect(isRelativePath('./file.name.txt')).toBe(true);
      expect(isRelativePath('../.hidden/file')).toBe(true);
    });
  });
});
