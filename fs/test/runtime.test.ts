import * as Runtime from '../src/util/runtime.ts';
import { assert, assertEquals } from '@std/assert';

Deno.test('Runtime utilities', async (t) => {
  await t.step('Runtime detection', async (t) => {
    await t.step('Runtime object has correct shape', () => {
      assert('Deno' in Runtime.Runtime);
      assert('Node' in Runtime.Runtime);
      assert('Bun' in Runtime.Runtime);
      assertEquals(typeof Runtime.Runtime.Deno, 'boolean');
      assertEquals(typeof Runtime.Runtime.Node, 'boolean');
      assertEquals(typeof Runtime.Runtime.Bun, 'boolean');
    });

    await t.step('getRuntime() returns a valid runtime name', () => {
      const runtime = Runtime.getRuntime();
      assert(['deno', 'node', 'bun', 'unknown'].includes(runtime));
    });

    await t.step('At least one runtime should be detected', () => {
      const anyRuntime = Runtime.Runtime.Deno || Runtime.Runtime.Node || Runtime.Runtime.Bun;
      assert(anyRuntime);
    });
  });

  await t.step('getHomeDir()', async (t) => {
    await t.step('returns a non-empty string', () => {
      const home = Runtime.getHomeDir();
      assertEquals(typeof home, 'string');
      assert(home.length > 0);
    });

    await t.step('returns an absolute path', () => {
      const home = Runtime.getHomeDir();
      assert(home.startsWith('/'));
    });
  });

  await t.step('getCwd()', async (t) => {
    await t.step('returns current working directory', () => {
      const cwd = Runtime.getCwd();
      assertEquals(typeof cwd, 'string');
      assert(cwd.length > 0);
      assert(cwd.startsWith('/'));
    });

    await t.step('matches Deno.cwd() when running under Deno', () => {
      if (Runtime.Runtime.Deno) {
        assertEquals(Runtime.getCwd(), Deno.cwd());
      }
    });
  });

  await t.step('setCwd()', async (t) => {
    await t.step('changes current working directory', () => {
      const originalCwd = Runtime.getCwd();
      const tempDir = Runtime.getTempDir();

      Runtime.setCwd(tempDir);
      const newCwd = Runtime.getCwd();
      const normalize = (p: string) => p.replace('/private', '').replace(/\/$/, '');
      assertEquals(normalize(newCwd), normalize(tempDir));

      Runtime.setCwd(originalCwd);
      assertEquals(Runtime.getCwd(), originalCwd);
    });
  });

  await t.step('getEnv()', async (t) => {
    await t.step('returns value for existing environment variable', () => {
      const path = Runtime.getEnv('PATH');
      assertEquals(typeof path, 'string');
      assert(path!.length > 0);
    });

    await t.step('returns undefined for non-existent variable', () => {
      const value = Runtime.getEnv('THIS_VAR_DEFINITELY_DOES_NOT_EXIST_12345');
      assertEquals(value, undefined);
    });
  });

  await t.step('getTempDir()', async (t) => {
    await t.step('returns a non-empty string', () => {
      const tmp = Runtime.getTempDir();
      assertEquals(typeof tmp, 'string');
      assert(tmp.length > 0);
    });

    await t.step('returns an absolute path', () => {
      const tmp = Runtime.getTempDir();
      assert(tmp.startsWith('/'));
    });
  });

  await t.step('fileURLToPath()', async (t) => {
    await t.step('converts file URL to path', () => {
      const url = 'file:///home/user/project/file.ts';
      const path = Runtime.fileURLToPath(url);
      assertEquals(path, '/home/user/project/file.ts');
    });

    await t.step('handles URL object', () => {
      const url = new URL('file:///home/user/project/file.ts');
      const path = Runtime.fileURLToPath(url);
      assertEquals(path, '/home/user/project/file.ts');
    });
  });

  await t.step('makeTempDir()', async (t) => {
    await t.step('creates a temporary directory', async () => {
      const tmpDir = await Runtime.makeTempDir('test-');
      assertEquals(typeof tmpDir, 'string');
      assert(tmpDir.includes('test-'));

      await Deno.remove(tmpDir);
    });

    await t.step('creates directory with default prefix', async () => {
      const tmpDir = await Runtime.makeTempDir();
      assertEquals(typeof tmpDir, 'string');
      assert(tmpDir.length > 0);

      await Deno.remove(tmpDir);
    });
  });

  await t.step('resolvePath()', async (t) => {
    await t.step('resolves relative paths', () => {
      const resolved = Runtime.resolvePath('src', 'util', 'test.ts');
      assertEquals(typeof resolved, 'string');
      assert(resolved.startsWith('/'));
    });

    await t.step('handles absolute paths', () => {
      const resolved = Runtime.resolvePath('/usr', 'local', 'bin');
      assertEquals(resolved, '/usr/local/bin');
    });
  });
});
