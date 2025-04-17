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
type Result<T> = Success<T> | Failure;

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
export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data: T = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}
