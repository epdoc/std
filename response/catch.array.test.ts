import { FileSpec } from '@epdoc/fs';
import { catchAsArray as safe } from '@epdoc/response';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { resolve } from 'node:path';

const pwd: string = import.meta.dirname as string;

describe('safe', () => {
  describe('response', () => {
    it('normal', async () => {
      const p: safe.Result<string> = await safe.wrap<string>(Deno.readTextFile(resolve(pwd, './deno.json')));
      expect(p[0]).toBeNull();
      expect(p[1]).toContain('"name": "@epdoc/response');
    });
    it('error', async () => {
      const [error, data] = await safe.wrap<string>(Deno.readTextFile(resolve(pwd, './deno.xyz')));
      expect(error).toBeDefined();
      expect(data).toBeNull();
      if (error) {
        expect(error.constructor.name).toBe('NotFound');
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toEqual('ENOENT');
      }
    });
  });
  describe('api response', () => {
    it('normal', async () => {
      const [error, data, duration] = await safe.twrap(Deno.readTextFile(resolve(pwd, './deno.json')));
      expect(error).toBeNull;
      expect(data).toContain('"name": "@epdoc/response');
      expect(duration).toBeGreaterThan(0);
    });
    it('error', async () => {
      const path = resolve(pwd, './deno.xyz');
      const fs = new FileSpec(pwd, './deno.xyz');
      const [error, data, duration] = await safe.twrap(fs.readAsString());
      expect(error).toBeDefined();
      if (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.constructor.name).toBe('NotFound');
        // @ts-ignore xxx
        expect(error.path).toBe(path);
        expect(error.cause).toBe('readAsString');
        // @ts-ignore xxx
        expect(error.code).toBe('ENOENT');
      }
      expect(data).toBeNull;
      expect(duration).toBeGreaterThan(0);
    });
  });
});
