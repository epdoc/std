import { _ } from '@epdoc/type';
import { AndCondition } from './and.ts';
import { BooleanCondition } from './boolean.ts';
import { NotCondition } from './not.ts';
import { OrCondition } from './or.ts';
import type { AnyCondition, ITestable, LogFn } from './types.ts';

/**
 * Options for {@link factory}.
 *
 * @template D The type of data passed to created conditions.
 */
export type FactoryOptions<D = unknown> = {
  /** Optional logger callback invoked during evaluation. */
  log?: LogFn;
};

/**
 * Creates a testable condition instance from a logical condition definition.
 *
 * Handles boolean constants and the logical combinators `and`, `or`, and `not`.
 * Domain-specific field conditions must be constructed by the caller.
 *
 * @template D The type of data passed to the created condition.
 * @param def - The logical condition definition.
 * @param opts - Optional factory configuration.
 * @returns A testable condition instance.
 * @throws {Error} If the definition is not a valid logical condition.
 */
export function factory<D>(
  def: AnyCondition,
  opts?: FactoryOptions<D>,
): ITestable<D> {
  if (_.isBoolean(def)) {
    return new BooleanCondition<D>(def, opts?.log);
  }

  if (typeof def !== 'object' || def === null) {
    throw new Error('Invalid condition definition: must be an object or boolean');
  }

  if ('and' in def && _.isArray(def.and)) {
    return new AndCondition<D>(
      def.and.map((child: AnyCondition) => factory(child, opts)),
      opts?.log,
    );
  }

  if ('or' in def && _.isArray(def.or)) {
    return new OrCondition<D>(
      def.or.map((child: AnyCondition) => factory(child, opts)),
      opts?.log,
    );
  }

  if ('not' in def) {
    return new NotCondition<D>(factory(def.not, opts), opts?.log);
  }

  throw new Error('Invalid condition definition: expected and, or, not, or boolean');
}
