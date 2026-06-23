import type { ITestable, LogFn } from './types.ts';

/**
 * A logical AND condition that evaluates a set of sub-conditions.
 *
 * Returns `true` only if all sub-conditions evaluate to `true`. Uses
 * short-circuit evaluation.
 *
 * @template D The type of data passed to {@link AndCondition.test}.
 */
export class AndCondition<D> implements ITestable<D> {
  #conditions: ITestable<D>[];
  #log?: LogFn;

  /**
   * Creates an AND condition from an array of already-constructed testable
   * conditions.
   * @param conditions - The sub-conditions to evaluate.
   * @param log - Optional logger callback.
   */
  constructor(conditions: ITestable<D>[], log?: LogFn) {
    this.#conditions = conditions;
    this.#log = log;
  }

  test(data: D): boolean {
    this.#log?.('AndCondition.test');
    for (const condition of this.#conditions) {
      if (!condition.test(data)) {
        return false;
      }
    }
    return true;
  }
}
