import { expect } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';
import { catchError } from './apires.ts';

describe('apires', () => {
  it('response', async () => {
    const res = await catchError(Deno.readFile('./deno.json'));
    expect(res.isOk()).toBe(true);
    expect(res.hasData()).toBe(true);
    expect(res.isError()).toBe(false);
    expect(res.data).toContain('"name": "@epdoc/response');
  });
});
