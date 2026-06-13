import { FileSpec } from '@epdoc/fs';
import { assert, assertEquals, assertInstanceOf, assertStringIncludes } from '@std/assert';
import { resolve } from 'node:path';
import * as Resp from '../src/mod.ts';

const pwd: string = import.meta.dirname as string;

Deno.test('safe', async (t) => {
  await t.step('response', async (t) => {
    await t.step('normal', async () => {
      const p: Resp.catchAsArray.Result<string> = await Resp.catchAsArray.wrap<string>(
        Deno.readTextFile(resolve(pwd, '../deno.json')),
      );
      assertEquals(p[0], null);
      assertStringIncludes(p[1] as string, '"name": "@epdoc/response');
    });
    await t.step('error', async () => {
      const [error, data] = await Resp.catchAsArray.wrap<string>(Deno.readTextFile(resolve(pwd, '../deno.xyz')));
      assert(error);
      assertEquals(data, null);
      if (error) {
        assertEquals(error.constructor.name, 'NotFound');
        assertInstanceOf(error, Error);
        assertEquals(error.code, 'ENOENT');
      }
    });
  });
  await t.step('api response', async (t) => {
    await t.step('normal', async () => {
      const [error, data, duration] = await Resp.catchAsArray.twrap(Deno.readTextFile(resolve(pwd, '../deno.json')));
      assertEquals(error, null);
      assertStringIncludes(data as string, '"name": "@epdoc/response');
      assert(duration > 0);
    });
    await t.step('error', async () => {
      const path = resolve(pwd, '../deno.xyz');
      const fs = new FileSpec(pwd, '../deno.xyz');
      const [error, data, duration] = await Resp.catchAsArray.twrap(fs.readAsString());
      assert(error);
      if (error) {
        assertInstanceOf(error, Error);
        assertEquals(error.constructor.name, 'NotFound');
        // @ts-ignore xxx
        assertEquals(error.path, path);
        assertEquals(error.cause, 'readAsString');
        // @ts-ignore xxx
        assertEquals(error.code, 'ENOENT');
      }
      assertEquals(data, null);
      assert(duration > 0);
    });
  });
});
