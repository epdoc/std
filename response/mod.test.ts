import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import { resolve } from 'node:path';
import { catchError } from './apires.ts';

const pwd: string = import.meta.dirname as string;

describe('apires', () => {
  it('response', async () => {
    const res = await catchError(Deno.readTextFile(resolve(pwd, './deno.json')));
    expect(res.isOk()).toBe(true);
    expect(res.hasData()).toBe(true);
    expect(res.isError()).toBe(false);
    expect(res.data).toContain('"name": "@epdoc/response');
  });
});
