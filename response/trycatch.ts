import { asError, type CodeError } from '@epdoc/type';

// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure = {
  data: null;
  error: CodeError;
};

type Result<T> = Success<T> | Failure;

// Main wrapper function
export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}
