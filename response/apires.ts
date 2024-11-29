import { isNull, isString } from '@epdoc/type';
import { assert } from '@std/assert';

const NO_RESPONSE_DATA = 'No response data';

export class Response<T> {
  ok: boolean = true;
  _data: T | undefined;
  _error: Error | undefined;
  _assertedData: boolean = false;
  _assertedError: boolean = false;

  setData(val: T | undefined | null): this {
    this._data = isNull(val) ? undefined : val;
    this.ok = true;
    return this;
  }

  get data(): T {
    assert(this._assertedData, 'Must call hasData() first, or use dataOrUndefined() instead');
    return this._data as T;
  }

  get anyData(): T | undefined {
    return this._data;
  }

  setError(val: Error | string): this {
    this._error = isString(val) ? new Error(val) : val;
    this.ok = false;
    return this;
  }

  get error(): Error {
    assert(this._assertedError, 'Must call isError() first, or use dataOrUndefined() instead');
    return this._error as Error;
  }

  isOk(): boolean {
    return this.ok;
  }

  hasData(arg?: string | boolean): boolean {
    if (this.ok) {
      if (this._data !== undefined) {
        this._assertedData = true;
        return true;
      } else if (arg === true) {
        this.setError(NO_RESPONSE_DATA);
        this._assertedError = true;
      } else if (isString(arg)) {
        this.setError(arg);
        this._assertedError = true;
      }
    }
    return false;
  }

  isVoid(): boolean {
    return this.ok && this._data === undefined;
  }

  isError(): boolean {
    if (!this.ok) {
      assert(this._error, 'Service failed to set error.');
      this._assertedError = true;
      return true;
    }
    return false;
  }

  markVoidAsError(s: string = NO_RESPONSE_DATA): void {
    if (this.ok && this._data === undefined) {
      this.setError(s);
      this._assertedError = true;
    }
  }

  // assertValid(): void {
  //   if (!this.ok) {
  //     throw this.error;
  //   }
  // }

  // assertOk(s: string = 'No response data'): this is IResponseOk<T> {
  //   if (!this.ok) {
  //     throw this.error;
  //   }
  //   if (!this._data) {
  //     throw new Error(s);
  //   }
  //   return true;
  // }
}

export class ApiResponse<T> extends Response<T> {
  t0: number = performance.now();
  duration: number = 0;

  measure(): this {
    this.duration = performance.now() - this.t0;
    return this;
  }

  override setData(val: T | undefined | null): this {
    if (!this.duration) {
      this.duration = performance.now() - this.t0;
    }
    return super.setData(val);
  }
}

export function response<T>(): Response<T> {
  return new Response<T>();
}
export function apiResponse<T>(): ApiResponse<T> {
  return new ApiResponse<T>();
}

export type ResponsePromise<T> = Promise<Response<T>>;
export type ApiResponsePromise<T> = Promise<ApiResponse<T>>;

export function catchError<T>(promise: Promise<T>): ResponsePromise<T> {
  const res: Response<T> = new Response();
  return promise
    .then((result: T) => {
      return res.setData(result);
    })
    .catch((err) => {
      return res.setError(err);
    });
}

export function catchApiError<T>(promise: Promise<T>): ApiResponsePromise<T> {
  const res: ApiResponse<T> = new ApiResponse();
  return promise
    .then((result: T) => {
      return res.setData(result);
    })
    .catch((err) => {
      return res.setError(err);
    });
}
