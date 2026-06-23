import type { ITestable, LogFn } from './types.ts';

/**
 * A logical OR condition that evaluates a set of sub-conditions.
 *
 * Returns `true` if any sub-condition evaluates to `true`. Uses short-circuit
 * evaluation.
 *
 * @template D The type of data passed to {@link OrCondition.test}.
 */
export class OrCondition<D> implements ITestable<D> {
  #conditions: ITestable<D>[];
  #log?: LogFn;

  /**
   * Creates an OR condition from an array of already-constructed testable
   * conditions.
   * @param conditions - The sub-conditions to evaluate.
   * @param log - Optional logger callback.
   */
  constructor(conditions: ITestable<D>[], log?: LogFn) {
    this.#conditions = conditions;
    this.#log = log;
  }

  test(data: D): boolean {
    this.#log?.('OrCondition.test');
    for (const condition of this.#conditions) {
      if (condition.test(data)) {
        return true;
      }
    }
    return false;
  }
}
