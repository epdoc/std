import { asError, type CodeError } from './dep.ts';

/**
 * Represents a successful operation result containing data.
 * @template T The type of the successful result data
 */
type Success<T> = {
  data: T;
  error: null;
};

/**
 * Represents a failed operation result containing an error.
 */
type Failure = {
  data: null;
  error: CodeError;
};

/**
 * Discriminated union type representing either a successful or failed operation.
 * @template T The type of the successful result data
 */
export type Result<T> = Success<T> | Failure;

export type ResultPromise<T> = Promise<Result<T>>;

export type ResultTimed<T> = Result<T> & { duration: number };

export type ResultTimedPromise<T> = Promise<ResultTimed<T>>;

/**
 * Wraps a promise and returns a structured result object containing either data or error.
 * Never throws - always returns a Result object.
 *
 * @template T The type of the successful result data
 * @param {Promise<T>} promise The promise to wrap
 * @returns {Promise<Result<T>>} A promise that resolves to a Result object
 *
 * @example
 * const result = await tryCatch(fetchUserData(userId));
 * if (result.error) {
 *   console.error('Failed to fetch user:', result.error);
 *   return;
 * }
 * console.log('User data:', result.data);
 */
export async function wrap<T>(promise: Promise<T>): ResultPromise<T> {
  try {
    const data: T = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function twrap<T>(promise: Promise<T>): ResultTimedPromise<T> {
  const t0 = performance.now();
  try {
    const data: T = await promise;
    return { data, error: null, duration: performance.now() - t0 };
  } catch (error) {
    return { data: null, error: asError(error), duration: performance.now() - t0 };
  }
}

export function asResult<T>(resp: [Error, null] | [null, T]): Result<T> {
  const [error, data] = resp;
  if (error) {
    return { data: null, error };
  }
  return { data, error: null };
}
