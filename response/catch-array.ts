import { asError, type IError } from './dep.ts';

/**
 * Tuple type representing either an error or success response.
 * @template T The type of the successful result
 */
export type Result<T> = [IError, null] | [null, T];

/** Promise that resolves to a SafeResponse tuple */
export type ResultPromise<T> = Promise<Result<T>>;

/**
 * Tuple type representing either an error or success response with timing.
 * @template T The type of the successful result
 */
export type ResultTimed<T> = [IError, null, number] | [null, T, number];

/** Promise that resolves to a SafeApiResponse tuple */
export type ResultTimedPromise<T> = Promise<ResultTimed<T>>;

/**
 * Wraps a promise to handle errors safely without throwing.
 * Returns a tuple containing either [error, null] or [null, result].
 *
 * @template T The type of the successful result
 * @param {Promise<T>} promise The promise to wrap
 * @returns {ResultPromise<T>} A promise that resolves to a [error, result] tuple
 *
 * @example
 * const [error, user] = await safe(fetchUser(123));
 * if (error) {
 *   console.error('Failed to fetch user:', error);
 *   return;
 * }
 * console.log('User data:', user);
 */
export async function wrap<T>(promise: Promise<T>): ResultPromise<T> {
  try {
    const result: T = await promise;
    return [null, result];
  } catch (err) {
    return [asError(err), null];
  }
}

/**
 * Wraps a promise to handle errors safely and measure execution time.
 * Returns a tuple containing either [error, null, duration] or [null, result, duration].
 *
 * @template T The type of the successful result
 * @param {Promise<T>} promise The promise to wrap
 * @returns {ResultTimedPromise<T>} A promise that resolves to a [error, result, duration] tuple
 *
 * @example
 * const [error, user, duration] = await safeApi(fetchUser(123));
 * if (error) {
 *   console.error('Failed to fetch user:', error);
 *   console.log('Operation took:', duration, 'ms');
 *   return;
 * }
 * console.log('User data:', user);
 * console.log('Fetch took:', duration, 'ms');
 */
export async function twrap<T>(promise: Promise<T>): ResultTimedPromise<T> {
  const t0 = performance.now();
  try {
    const result: T = await promise;
    return [null, result, performance.now() - t0];
  } catch (err) {
    return [asError(err), null, performance.now() - t0];
  }
}
