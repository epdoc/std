import type * as Json from './types.ts';

/**
 * Type guard to check if a given value is a valid StrictJsonReviver function.
 */
export function isJsonReviver(fn: unknown): fn is Json.Reviver {
  // 1. Verify it's actually a function
  if (typeof fn !== 'function') {
    return false;
  }

  // 2. A standard JSON reviver expects exactly 2 arguments (key, value)
  // JavaScript functions expose the number of expected arguments via `.length`
  return fn.length === 2;
}
