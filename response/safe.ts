import { asError } from '@epdoc/type';

export type SafeResponse<T> = [Error, null] | [null, T];
export type SafePromise<T> = Promise<SafeResponse<T>>;
export type SafeApiResponse<T> = [Error, null, number] | [null, T, number];
export type SafeApiPromise<T> = Promise<SafeApiResponse<T>>;

export async function safe<T>(promise: Promise<T>): SafePromise<T> {
  try {
    const result = await promise;
    return [null, result];
  } catch (err) {
    return [asError(err), null];
  }
}

export async function safeApi<T>(promise: Promise<T>): SafeApiPromise<T> {
  const t0 = performance.now();
  try {
    const result = await promise;
    return [null, result, performance.now() - t0];
  } catch (err) {
    return [asError(err), null, performance.now() - t0];
  }
}
