import { assertEquals } from '@std/assert';
import { tryCatch } from './trycatch.ts';
import { describe, it } from 'jsr:@std/testing/bdd';
import { delayPromise } from './dep.ts';

describe('tryCatch', () => {
  it('handles successful promises', async () => {
    // Setup
    const testData = { id: 1, name: 'test' };
    const promise = Promise.resolve(testData);

    // Execute
    const result = await tryCatch(promise);

    // Verify
    assertEquals(result.error, null);
    assertEquals(result.data, testData);
  });

  it('handles rejected promises', async () => {
    // Setup
    const errorMessage = 'Test error';
    const promise = Promise.reject(new Error(errorMessage));

    // Execute
    const result = await tryCatch(promise);

    // Verify
    assertEquals(result.data, null);
    assertEquals(result.error instanceof Error, true);
    if (result.error) {
      assertEquals(result.error.message, errorMessage);
    }
  });

  it('handles thrown errors in async functions', async () => {
    // Setup
    const errorMessage = 'Async error';
    const asyncFn = async () => {
      await delayPromise(1);
      throw new Error(errorMessage);
    };

    // Execute
    const result = await tryCatch(asyncFn());

    // Verify
    assertEquals(result.data, null);
    assertEquals(result.error instanceof Error, true);
    if (result.error) {
      assertEquals(result.error.message, errorMessage);
    }
  });
  it('preserves successful response types', async () => {
    // Setup
    const numberPromise = Promise.resolve(42);
    const stringPromise = Promise.resolve('hello');
    const objectPromise = Promise.resolve({ key: 'value' });

    // Execute & Verify
    const numResult = await tryCatch(numberPromise);
    assertEquals(numResult.data, 42);

    const strResult = await tryCatch(stringPromise);
    assertEquals(strResult.data, 'hello');

    const objResult = await tryCatch(objectPromise);
    assertEquals(objResult.data, { key: 'value' });
  });
});
