import { assert } from '@std/assert';
import { isError, isNull, isString } from './dep.ts';

const NO_RESPONSE_DATA = 'No response data';

/**
 * A generic response wrapper that handles both successful results and errors.
 * @template T The type of data contained in a successful response
 * @experimental
 */
export class Response<T> {
  /** Indicates if the response represents a success state */
  ok: boolean = true;
  /** The response data */
  _data: T | undefined;
  /** Error information if the response failed */
  _error: Error | undefined;
  /** Internal flag tracking if data has been verified */
  _assertedData: boolean = false;
  /** Internal flag tracking if error has been verified */
  _assertedError: boolean = false;

  /**
   * Sets the response data and marks the response as successful.
   * @param {T | undefined | null} val - The data to set
   * @returns {this} The response instance for chaining
   */
  setData(val: T | undefined | null): this {
    this._data = isNull(val) ? undefined : val;
    this.ok = true;
    return this;
  }

  /**
   * Gets the response data. Must call hasData() first.
   * @throws {Error} If hasData() hasn't been called
   * @returns {T} The response data
   */
  get data(): T {
    assert(this._assertedData, 'Must call hasData() first, or use dataOrUndefined() instead');
    return this._data as T;
  }

  /**
   * Gets the response data without assertion checks.
   * @returns {T | undefined} The response data or undefined
   */
  get anyData(): T | undefined {
    return this._data;
  }

  /**
   * Sets an error and marks the response as failed.
   * @param {unknown} val - The error to set (string or Error object)
   * @returns {this} The response instance for chaining
   */
  setError(val: unknown): this {
    if (isString(val)) {
      this._error = new Error(val);
    } else if (isError(val)) {
      this._error = val;
    }
    this.ok = false;
    return this;
  }

  /**
   * Gets the error. Must call isError() first.
   * @throws {Error} If isError() hasn't been called
   * @returns {Error} The error object
   */
  get error(): Error {
    assert(this._assertedError, 'Must call isError() first, or use dataOrUndefined() instead');
    return this._error as Error;
  }

  /**
   * Checks if the response represents a success state.
   * @returns {boolean} True if the response is successful
   */
  isOk(): boolean {
    return this.ok;
  }

  /**
   * Checks if the response contains data.
   * @param {string | boolean} [arg] - If true or string, sets error if no data
   * @returns {boolean} True if response has data
   */
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

  /**
   * Checks if this is a successful response with no data.
   * @returns {boolean} True if successful but no data present
   */
  isVoid(): boolean {
    return this.ok && this._data === undefined;
  }

  /**
   * Checks if the response represents an error state.
   * @returns {boolean} True if the response contains an error
   */
  isError(): boolean {
    if (!this.ok) {
      assert(this._error, 'Service failed to set error.');
      this._assertedError = true;
      return true;
    }
    return false;
  }

  /**
   * Converts a void (successful but no data) response to an error.
   * @param {string} [s='No response data'] - The error message
   */
  markVoidAsError(s: string = NO_RESPONSE_DATA): void {
    if (this.ok && this._data === undefined) {
      this.setError(s);
      this._assertedError = true;
    }
  }
}

/**
 * Extended response class that includes timing information.
 * @template T The type of data contained in a successful response
 * @experimental
 */
export class ApiResponse<T> extends Response<T> {
  /** Start time of the operation */
  t0: number = performance.now();
  /** Duration of the operation in milliseconds */
  duration: number = 0;

  /**
   * Calculates the duration of the operation.
   * @returns {this} The response instance for chaining
   */
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

/**
 * Creates a new Response instance.
 * @template T The type of data the response will contain
 * @returns {Response<T>} A new Response instance
 */
export function response<T>(): Response<T> {
  return new Response<T>();
}

/**
 * Creates a new ApiResponse instance.
 * @template T The type of data the response will contain
 * @returns {ApiResponse<T>} A new ApiResponse instance
 */
export function apiResponse<T>(): ApiResponse<T> {
  return new ApiResponse<T>();
}

/** Type alias for a Promise that resolves to a Response */
export type ResponsePromise<T> = Promise<Response<T>>;
/** Type alias for a Promise that resolves to an ApiResponse */
export type ApiResponsePromise<T> = Promise<ApiResponse<T>>;

/**
 * Wraps a promise in a Response object to handle success/error states.
 * @template T The type of data the promise resolves to
 * @param {Promise<T>} promise The promise to wrap
 * @returns {ResponsePromise<T>} A promise that resolves to a Response
 */
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

/**
 * Wraps a promise in an ApiResponse object to handle success/error states with timing.
 * @template T The type of data the promise resolves to
 * @param {Promise<T>} promise The promise to wrap
 * @returns {ApiResponsePromise<T>} A promise that resolves to an ApiResponse
 */
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
