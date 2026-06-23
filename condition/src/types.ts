import type { ISODate } from '@epdoc/datetime';

/**
 * A simple logging callback that receives a single string message.
 *
 * Condition classes accept an optional logger so callers can observe evaluation
 * without imposing a specific logging framework.
 */
export type LogFn = (msg: string) => void;

/**
 * The minimal contract for any object that can evaluate a declarative condition
 * against a data payload.
 *
 * @template D The shape of the data passed to {@link ITestable.test}.
 */
export interface ITestable<D> {
  /**
   * Evaluates the condition against the provided data.
   * @param data - The data payload to test.
   * @returns `true` if the condition is met, otherwise `false`.
   */
  test(data: D): boolean;
}

/**
 * A recursive type for defining logical conditions.
 *
 * This type only covers the logical combinators and boolean constants. Domain
 * packages (such as `@finsync/condition`) can extend it with their own field
 * condition types.
 */
export type AnyCondition =
  | { and: AnyCondition[] }
  | { or: AnyCondition[] }
  | { not: AnyCondition }
  | boolean;

/**
 * A condition that tests one or more fields of a data object.
 */
export type FieldCondition = Record<string, ValueCondition>;

/**
 * A condition describing how a value should be tested.
 *
 * Can be a primitive for an equality check, or an object for a specific
 * operator.
 */
export type ValueCondition =
  | string
  | RegExp
  | number
  | boolean
  | StringOperators
  | NumberOperators
  | DateOperators
  | ArrayOperators;

/** Operators for testing string values. */
export type StringOperators =
  | { eq: string }
  | { contains: string }
  | { startsWith: string }
  | { endsWith: string }
  | { regex: string; flags?: string };

/** Operators for testing numeric values. */
export type NumberOperators =
  | { eq: number }
  | { ne: number }
  | { gt: number }
  | { gte: number }
  | { lt: number }
  | { lte: number };

/** Operators for testing date values. */
export type DateOperators =
  | { before: Date | ISODate; after?: Date | ISODate }
  | { after: Date | ISODate; before?: Date | ISODate };

/** A condition applied to each property of an object in an array. */
export type ObjectCondition = Record<string, ValueCondition>;

/** Operators for testing array values. */
export type ArrayOperators =
  | { includes: (string | number)[] | string | RegExp | { regex: string; flags?: string } }
  | { excludes: (string | number)[] | string | RegExp | { regex: string; flags?: string } }
  | { includesAll: (string | number)[] }
  | { isEmpty: boolean }
  | { some: ObjectCondition };
