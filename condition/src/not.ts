import type { ITestable, LogFn } from './types.ts';

/**
 * A logical NOT condition that inverts the result of a sub-condition.
 *
 * @template D The type of data passed to {@link NotCondition.test}.
 */
export class NotCondition<D> implements ITestable<D> {
  #condition: ITestable<D>;
  #log?: LogFn;

  /**
   * Creates a NOT condition wrapping another condition.
   * @param condition - The condition to negate.
   * @param log - Optional logger callback.
   */
  constructor(condition: ITestable<D>, log?: LogFn) {
    this.#condition = condition;
    this.#log = log;
  }

  test(data: D): boolean {
    const result = !this.#condition.test(data);
    if (result) {
      this.#log?.('NotCondition.test: condition not met, returning true');
    }
    return result;
  }
}
