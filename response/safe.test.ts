import { FileSpec } from '@epdoc/fs';
import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import { resolve } from 'node:path';
import { safe, safeApi } from './mod.ts';

const pwd: string = import.meta.dirname as string;

describe('safe', () => {
  it('response', async () => {
    const [error, data] = await safe(Deno.readTextFile(resolve(pwd, './deno.json')));
    expect(error).toBeNull;
    expect(data).toContain('"name": "@epdoc/response');
  });
  describe('api response', () => {
    it('normal', async () => {
      const [error, data, duration] = await safeApi(Deno.readTextFile(resolve(pwd, './deno.json')));
      expect(error).toBeNull;
      expect(data).toContain('"name": "@epdoc/response');
      expect(duration).toBeGreaterThan(0);
    });
    it('error', async () => {
      const path = resolve(pwd, './deno.xyz');
      const fs = new FileSpec(pwd, './deno.xyz');
      const [error, data, duration] = await safeApi(fs.readAsString());
      expect(error).toBeDefined();
      if (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.constructor.name).toBe('NotFound');
        // @ts-ignore xxx
        expect(error.path).toBe(path);
        expect(error.cause).toBe('readTextFile');
        // @ts-ignore xxx
        expect(error.code).toBe('ENOENT');
      }
      expect(data).toBeNull;
      expect(duration).toBeGreaterThan(0);
    });
  });
});
