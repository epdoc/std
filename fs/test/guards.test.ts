import { assert, assertEquals } from '@std/assert';
import { isFileUrl, isRelativePath } from '../src/guards.ts';
import type { RelativePath } from '../src/types.ts';

Deno.test('isFileUrl', async (t) => {
  await t.step('returns true for valid file:// URLs', () => {
    assert(isFileUrl('file:///home/user/documents/file.txt'));
    assert(isFileUrl('file:///C:/Users/test/file.txt'));
    assert(isFileUrl('file://localhost/etc/hosts'));
    assert(isFileUrl('file:///path/to/folder/'));
  });

  await t.step('returns false for non-file URLs', () => {
    assertEquals(isFileUrl('http://example.com/file.txt'), false);
    assertEquals(isFileUrl('https://example.com/file.txt'), false);
    assertEquals(isFileUrl('ftp://ftp.example.com/file.txt'), false);
    assertEquals(isFileUrl('mailto:test@example.com'), false);
  });

  await t.step('returns false for plain file paths', () => {
    assertEquals(isFileUrl('/home/user/file.txt'), false);
    assertEquals(isFileUrl('C:\\Users\\test\\file.txt'), false);
    assertEquals(isFileUrl('./relative/path.txt'), false);
    assertEquals(isFileUrl('../parent/file.txt'), false);
  });

  await t.step('returns false for empty or invalid inputs', () => {
    assertEquals(isFileUrl(''), false);
    assertEquals(isFileUrl('   '), false);
    assertEquals(isFileUrl(null), false);
    assertEquals(isFileUrl(undefined), false);
    assertEquals(isFileUrl(123), false);
    assertEquals(isFileUrl({}), false);
    assertEquals(isFileUrl([]), false);
  });

  await t.step('returns false for malformed URLs', () => {
    assert(isFileUrl('file://'));
    assertEquals(isFileUrl('not a url'), false);
    assertEquals(isFileUrl('://missing-protocol'), false);
  });

  await t.step('returns true for file URLs with special characters', () => {
    assert(isFileUrl('file:///path/to/file%20with%20spaces.txt'));
    assert(isFileUrl('file:///path/to/file%2Bsymbol.txt'));
  });

  await t.step('returns true for file URLs with query strings and hashes', () => {
    assert(isFileUrl('file:///path/to/file.txt?query=1'));
    assert(isFileUrl('file:///path/to/file.txt#section'));
  });
});

Deno.test('isRelativePath', async (t) => {
  await t.step('strict mode (default is false)', async (t) => {
    await t.step('returns true for paths starting with ./', () => {
      assert(isRelativePath('./file.txt'));
      assert(isRelativePath('./path/to/file.txt'));
      assert(isRelativePath('./'));
    });

    await t.step('returns true for paths starting with ../', () => {
      assert(isRelativePath('../file.txt'));
      assert(isRelativePath('../../file.txt'));
      assert(isRelativePath('../path/to/file.txt'));
    });

    await t.step('returns true for paths starting with .\\ (Windows)', () => {
      assert(isRelativePath('.\\file.txt'));
      assert(isRelativePath('.\\path\\to\\file.txt'));
    });

    await t.step('returns true for paths starting with ..\\ (Windows)', () => {
      assert(isRelativePath('..\\file.txt'));
      assert(isRelativePath('..\\..\\file.txt'));
    });

    await t.step('returns true for single dot or double dot', () => {
      assert(isRelativePath('.'));
      assert(isRelativePath('..'));
    });

    await t.step('returns true for paths containing path separators (loose mode)', () => {
      assert(isRelativePath('path/to/file.txt'));
    });

    await t.step('returns false for absolute Unix paths', () => {
      assertEquals(isRelativePath('/absolute/path'), false);
      assertEquals(isRelativePath('/'), false);
      assertEquals(isRelativePath('/home/user/file.txt'), false);
    });

    await t.step('returns false for absolute Windows paths', () => {
    });

    await t.step('returns false for file URLs', () => {
      assertEquals(isRelativePath('file:///path/to/file'), false);
    });

    await t.step('returns false for empty or whitespace-only strings', () => {
      assertEquals(isRelativePath(''), false);
      assertEquals(isRelativePath('   '), false);
      assertEquals(isRelativePath('\t\n'), false);
    });
  });

  await t.step('strict mode (strict=true)', async (t) => {
    await t.step('returns true only for paths starting with ./ or ../', () => {
      assert(isRelativePath('./file.txt', true));
      assert(isRelativePath('../file.txt', true));
      assert(isRelativePath('./path/to/file.txt', true));
      assert(isRelativePath('../path/to/file.txt', true));
    });

    await t.step('returns true for Windows-style relative prefixes', () => {
      assert(isRelativePath('.\\file.txt', true));
      assert(isRelativePath('..\\file.txt', true));
    });

    await t.step('returns false for simple file names in strict mode', () => {
      assertEquals(isRelativePath('file.txt', true), false);
      assertEquals(isRelativePath('script', true), false);
    });

    await t.step('returns false for paths with separators but no dot prefix in strict mode', () => {
      assertEquals(isRelativePath('path/to/file.txt', true), false);
      assertEquals(isRelativePath('path\\to\\file.txt', true), false);
    });

    await t.step('returns false for single dot or double dot in strict mode', () => {
      assertEquals(isRelativePath('.', true), false);
      assertEquals(isRelativePath('..', true), false);
    });

    await t.step('returns false for absolute paths in strict mode', () => {
      assertEquals(isRelativePath('/absolute/path', true), false);
      assertEquals(isRelativePath('C:\\path', true), false);
    });
  });

  await t.step('type narrowing', async (t) => {
    await t.step('narrows type to RelativePath when true', () => {
      const path: string = './test.txt';
      if (isRelativePath(path)) {
        const relative: RelativePath = path;
        assertEquals(relative, './test.txt');
      }
    });

    await t.step('does not narrow type when false', () => {
      const path: string = '/absolute/path';
      if (!isRelativePath(path)) {
        assertEquals(typeof path, 'string');
      }
    });
  });

  await t.step('edge cases', async (t) => {
    await t.step('handles whitespace at start/end', () => {
      assert(isRelativePath('  ./file.txt  '));
      assertEquals(isRelativePath('  /absolute  '), false);
    });

    await t.step('handles complex relative paths', () => {
      assert(isRelativePath('././file.txt'));
      assert(isRelativePath('.././../file.txt'));
      assert(isRelativePath('./path/../other/file.txt'));
    });

    await t.step('handles paths with dots in names', () => {
      assert(isRelativePath('./file.name.txt'));
      assert(isRelativePath('../.hidden/file'));
    });
  });
});
