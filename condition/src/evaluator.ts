import { _ } from '@epdoc/type';
import type { ObjectCondition, ValueCondition } from './types.ts';

/**
 * Evaluates if a given value satisfies a declarative value condition.
 *
 * Supports a wide range of comparisons:
 * - **Primitives**: Direct equality checks for strings, numbers, and booleans.
 * - **Regular Expressions**: Matches string or number values against a regex.
 * - **String Operators**: `eq`, `contains`, `startsWith`, `endsWith`.
 * - **Number Operators**: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`.
 * - **Date Operators**: `before`, `after`.
 * - **Array Operators**: `includes`, `excludes`, `includesAll`, `isEmpty`, `some`.
 *
 * @param value - The actual data value to be tested.
 * @param condition - The declarative condition to test against.
 * @returns `true` if the value satisfies the condition, otherwise `false`.
 */
export function evaluateValueCondition(
  value: unknown,
  condition: ValueCondition,
): boolean {
  if (_.isNullOrUndefined(condition)) {
    return false;
  }

  const prim = convertType(condition);

  if (_.isArray(value) && (_.isString(prim) || _.isNumber(prim))) {
    return value.includes(prim);
  }

  if (_.isString(prim)) {
    return value === prim;
  } else if (_.isNumber(prim)) {
    return value === prim;
  } else if (_.isBoolean(prim)) {
    return value === prim;
  } else if (_.isRegExp(prim)) {
    if (_.isString(value) || _.isNumber(value)) {
      const val = _.asString(value);
      return prim.test(val);
    }
  }

  if (_.isDict(condition)) {
    if ('eq' in condition && _.isString(condition.eq)) {
      return value === condition.eq;
    } else if ('contains' in condition && _.isString(condition.contains)) {
      return _.isString(value) && value.includes(condition.contains);
    } else if ('startsWith' in condition && _.isString(condition.startsWith)) {
      return _.isString(value) && value.startsWith(condition.startsWith);
    } else if ('endsWith' in condition && _.isString(condition.endsWith)) {
      return _.isString(value) && value.endsWith(condition.endsWith);
    }

    if ('eq' in condition && _.isNumber(condition.eq)) {
      return value === condition.eq;
    } else if ('ne' in condition && _.isNumber(condition.ne)) {
      return value !== condition.ne;
    } else if ('gt' in condition && _.isNumber(condition.gt)) {
      return _.isNumber(value) && value > condition.gt;
    } else if ('gte' in condition && _.isNumber(condition.gte)) {
      return _.isNumber(value) && value >= condition.gte;
    } else if ('lt' in condition && _.isNumber(condition.lt)) {
      return _.isNumber(value) && value < condition.lt;
    } else if ('lte' in condition && _.isNumber(condition.lte)) {
      return _.isNumber(value) && value <= condition.lte;
    }

    if ('before' in condition) {
      if (_.isString(value) || _.isDate(value) || _.isNumber(value)) {
        const date = new Date(value);
        const beforeDate = _.isDate(condition.before) ? condition.before : new Date(condition.before as string);
        return date !== null && beforeDate !== null && date.getTime() < beforeDate.getTime();
      }
      return false;
    } else if ('after' in condition) {
      if (_.isString(value) || _.isDate(value) || _.isNumber(value)) {
        const date = new Date(value);
        const afterDate = _.isDate(condition.after) ? condition.after : new Date(condition.after as string);
        return date !== null && afterDate !== null && date.getTime() > afterDate.getTime();
      }
      return false;
    }

    if (_.isArray(value)) {
      if ('includes' in condition) {
        const inc = convertType(condition.includes);
        if (_.isArray(inc)) {
          const valueSet = new Set(value);
          for (const item of inc) {
            if (valueSet.has(item)) return true;
          }
        } else if (_.isString(inc)) {
          return value.includes(inc);
        } else if (_.isRegExp(inc)) {
          return value.some((item) => inc.test(item as string));
        }
      } else if ('excludes' in condition) {
        const exc = convertType(condition.excludes);
        if (_.isArray(exc)) {
          return !exc.some((item) => value.includes(item));
        } else if (_.isString(exc)) {
          return !value.includes(exc);
        } else if (_.isRegExp(exc)) {
          return !value.some((item) => exc.test(item as string));
        }
      } else if ('includesAll' in condition && _.isArray(condition.includesAll)) {
        return condition.includesAll.every((item) => value.includes(item));
      } else if ('isEmpty' in condition && _.isBoolean(condition.isEmpty)) {
        return condition.isEmpty ? value.length === 0 : value.length > 0;
      } else if ('some' in condition && _.isDict(condition.some)) {
        return value.some((item) => {
          if (_.isDict(item)) {
            return evaluateFieldCondition(
              item,
              condition.some as ObjectCondition,
            );
          }
          return false;
        });
      }
    }
  }

  return false;
}

/**
 * Safely retrieves a value from a nested object using a dot-notation path.
 * @param obj - The object to retrieve the value from.
 * @param path - The dot-separated path to the desired value (e.g., 'a.b.c').
 * @returns The value at the specified path, or `undefined` if the path is not valid.
 */
function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    return _.isDict(acc) ? acc[part] : undefined;
  }, obj);
}

/**
 * Evaluates an object condition against a data object.
 *
 * Iterates through the fields in `condition`, retrieves the corresponding value
 * from `data`, and evaluates it using {@link evaluateValueCondition}. Acts as a
 * logical OR, returning `true` as soon as any field matches.
 *
 * @param data - The data object to test.
 * @param condition - The object condition, where keys are field paths and values
 * are value conditions.
 * @returns `true` if any field satisfies its condition, otherwise `false`.
 */
export function evaluateFieldCondition(
  data: Record<string, unknown>,
  condition: ObjectCondition,
): boolean {
  for (const [fieldPath, valueCondition] of Object.entries(condition)) {
    if (valueCondition) {
      const value = get(data, fieldPath);
      if (evaluateValueCondition(value, valueCondition)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Converts a regex-dictionary representation into a `RegExp` object.
 *
 * If `val` is an object like `{ regex: 'pattern', flags: 'i' }`, a `RegExp` is
 * constructed. Otherwise the value is returned unchanged.
 * @param val - The value to convert.
 * @returns A `RegExp` or the original value.
 */
function convertType(val: unknown): unknown {
  if (_.isDict(val)) {
    if ('regex' in val && _.isString(val.regex)) {
      const flags = (val as { flags?: string }).flags || '';
      return new RegExp(val.regex, flags);
    }
  }
  return val;
}
