import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { resolve } from 'node:path';
import { catchError } from '../src/mod.ts';

const pwd: string = import.meta.dirname as string;

Deno.test('apires', async (t) => {
  await t.step('response', async () => {
    const res = await catchError(Deno.readTextFile(resolve(pwd, '../deno.json')));
    assert(res.isOk());
    assert(res.hasData());
    assertEquals(res.isError(), false);
    assertStringIncludes(res.data as string, '"name": "@epdoc/response');
  });
});
