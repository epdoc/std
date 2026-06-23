import type { ITestable, LogFn } from './types.ts';

/**
 * A condition that always returns a fixed boolean value.
 *
 * Useful for defaults, fallbacks, or as the base case for an empty condition
 * object.
 *
 * @template D The type of data passed to {@link BooleanCondition.test}.
 */
export class BooleanCondition<D> implements ITestable<D> {
  #value: boolean;
  #log?: LogFn;

  /**
   * Creates a boolean condition.
   * @param value - The constant value to return.
   * @param log - Optional logger callback.
   */
  constructor(value: boolean, log?: LogFn) {
    this.#value = value;
    this.#log = log;
  }

  test(_data: D): boolean {
    this.#log?.(`BooleanCondition.test: ${this.#value}`);
    return this.#value;
  }
}
