import * as Runtime from '../src/util/runtime.ts';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

describe('Runtime utilities', () => {
  describe('Runtime detection', () => {
    test('Runtime object has correct shape', () => {
      expect(Runtime.Runtime).toHaveProperty('Deno');
      expect(Runtime.Runtime).toHaveProperty('Node');
      expect(Runtime.Runtime).toHaveProperty('Bun');
      expect(typeof Runtime.Runtime.Deno).toBe('boolean');
      expect(typeof Runtime.Runtime.Node).toBe('boolean');
      expect(typeof Runtime.Runtime.Bun).toBe('boolean');
    });

    test('getRuntime() returns a valid runtime name', () => {
      const runtime = Runtime.getRuntime();
      expect(['deno', 'node', 'bun', 'unknown']).toContain(runtime);
    });

    test('At least one runtime should be detected', () => {
      // In test environment, at least Deno should be true
      const anyRuntime = Runtime.Runtime.Deno || Runtime.Runtime.Node || Runtime.Runtime.Bun;
      expect(anyRuntime).toBe(true);
    });
  });

  describe('getHomeDir()', () => {
    test('returns a non-empty string', () => {
      const home = Runtime.getHomeDir();
      expect(typeof home).toBe('string');
      expect(home.length).toBeGreaterThan(0);
    });

    test('returns an absolute path', () => {
      const home = Runtime.getHomeDir();
      expect(home.startsWith('/')).toBe(true);
    });
  });

  describe('getCwd()', () => {
    test('returns current working directory', () => {
      const cwd = Runtime.getCwd();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
      expect(cwd.startsWith('/')).toBe(true);
    });

    test('matches Deno.cwd() when running under Deno', () => {
      if (Runtime.Runtime.Deno) {
        expect(Runtime.getCwd()).toBe(Deno.cwd());
      }
    });
  });

  describe('setCwd()', () => {
    test('changes current working directory', () => {
      const originalCwd = Runtime.getCwd();
      const tempDir = Runtime.getTempDir();

      Runtime.setCwd(tempDir);
      const newCwd = Runtime.getCwd();
      // On macOS, /var is a symlink to /private/var, and paths may have trailing slashes
      // Normalize both paths before comparing
      const normalize = (p: string) => p.replace('/private', '').replace(/\/$/, '');
      expect(normalize(newCwd)).toBe(normalize(tempDir));

      // Restore original
      Runtime.setCwd(originalCwd);
      expect(Runtime.getCwd()).toBe(originalCwd);
    });
  });

  describe('getEnv()', () => {
    test('returns value for existing environment variable', () => {
      // PATH should exist on all platforms
      const path = Runtime.getEnv('PATH');
      expect(typeof path).toBe('string');
      expect(path!.length).toBeGreaterThan(0);
    });

    test('returns undefined for non-existent variable', () => {
      const value = Runtime.getEnv('THIS_VAR_DEFINITELY_DOES_NOT_EXIST_12345');
      expect(value).toBeUndefined();
    });
  });

  describe('getTempDir()', () => {
    test('returns a non-empty string', () => {
      const tmp = Runtime.getTempDir();
      expect(typeof tmp).toBe('string');
      expect(tmp.length).toBeGreaterThan(0);
    });

    test('returns an absolute path', () => {
      const tmp = Runtime.getTempDir();
      expect(tmp.startsWith('/')).toBe(true);
    });
  });

  describe('fileURLToPath()', () => {
    test('converts file URL to path', () => {
      const url = 'file:///home/user/project/file.ts';
      const path = Runtime.fileURLToPath(url);
      expect(path).toBe('/home/user/project/file.ts');
    });

    test('handles URL object', () => {
      const url = new URL('file:///home/user/project/file.ts');
      const path = Runtime.fileURLToPath(url);
      expect(path).toBe('/home/user/project/file.ts');
    });
  });

  describe('makeTempDir()', () => {
    test('creates a temporary directory', async () => {
      const tmpDir = await Runtime.makeTempDir('test-');
      expect(typeof tmpDir).toBe('string');
      expect(tmpDir.includes('test-')).toBe(true);

      // Cleanup
      await Deno.remove(tmpDir);
    });

    test('creates directory with default prefix', async () => {
      const tmpDir = await Runtime.makeTempDir();
      expect(typeof tmpDir).toBe('string');
      expect(tmpDir.length).toBeGreaterThan(0);

      // Cleanup
      await Deno.remove(tmpDir);
    });
  });

  describe('resolvePath()', () => {
    test('resolves relative paths', () => {
      const resolved = Runtime.resolvePath('src', 'util', 'test.ts');
      expect(typeof resolved).toBe('string');
      expect(resolved.startsWith('/')).toBe(true);
    });

    test('handles absolute paths', () => {
      const resolved = Runtime.resolvePath('/usr', 'local', 'bin');
      expect(resolved).toBe('/usr/local/bin');
    });
  });
});
