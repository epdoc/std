import { delayPromise } from '@epdoc/type';
import { assertEquals } from '@std/assert';
import * as Resp from '../src/mod.ts';

Deno.test('tryCatch', async (t) => {
  await t.step('handles successful promises', async () => {
    const testData = { id: 1, name: 'test' };
    const promise = Promise.resolve(testData);
    const result = await Resp.catchAsObj.wrap(promise);
    assertEquals(result.error, null);
    assertEquals(result.data, testData);
  });

  await t.step('handles rejected promises', async () => {
    const errorMessage = 'Test error';
    const promise = Promise.reject(new Error(errorMessage));
    const result = await Resp.catchAsObj.wrap(promise);
    assertEquals(result.data, null);
    assertEquals(result.error instanceof Error, true);
    if (result.error) {
      assertEquals(result.error.message, errorMessage);
    }
  });

  await t.step('handles thrown errors in async functions', async () => {
    const errorMessage = 'Async error';
    const asyncFn = async () => {
      await delayPromise(1);
      throw new Error(errorMessage);
    };
    const result = await Resp.catchAsObj.wrap(asyncFn());
    assertEquals(result.data, null);
    assertEquals(result.error instanceof Error, true);
    if (result.error) {
      assertEquals(result.error.message, errorMessage);
    }
  });
  await t.step('preserves successful response types', async () => {
    const numberPromise = Promise.resolve(42);
    const stringPromise = Promise.resolve('hello');
    const objectPromise = Promise.resolve({ key: 'value' });
    const numResult = await Resp.catchAsObj.wrap(numberPromise);
    assertEquals(numResult.data, 42);
    const strResult = await Resp.catchAsObj.wrap(stringPromise);
    assertEquals(strResult.data, 'hello');
    const objResult = await Resp.catchAsObj.wrap(objectPromise);
    assertEquals(objResult.data, { key: 'value' });
  });
});
