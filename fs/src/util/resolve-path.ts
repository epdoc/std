import { FSSpecBase } from '$spec';
import { isString } from '@epdoc/type';
import path from 'node:path';
import type * as FS from '../types.ts';

/**
 * Error messages for invalid argument types.
 */
export const ERR_STR = {
  replace: (o: { type: string }): string => `Error: Invalid argument type at index > 0: ${o.type}`,
};

/**
 * Error messages for invalid file arguments.
 */
export const ERR_FILE_STR = { replace: (o: { type: string }): string => `Error: ${o.type} must be the only argument.` };

/**
 * Type guard to check if a value is a valid file name.
 * A valid file name is a string that includes a '.' and is not just '.' or '..'.
 * @param val - The value to check.
 * @returns `true` if the value is a valid file name, `false` otherwise.
 */
export const isFileNameCheck = (val: unknown): val is FS.FileName =>
  isString(val) && val.includes('.') && val !== '.' && val !== '..';

/**
 * Resolves path arguments and returns a branded FilePath or FolderPath.
 * The return type is determined by the last segment of the path.
 */
export function resolvePathArgs(...args: FS.PathSegment[]): FS.Path {
  // Start with CWD as the root
  const parts: string[] = [Deno.cwd()];

  for (let i = 0; i < args.length; i++) {
    const item = args[i];
    const isFirst = i === 0;

    if (item instanceof FSSpecBase) {
      if (isFirst) {
        parts.push(item.path);
      } else {
        throw new Error(`A path may only use a ${item.constructor.name} as its first parameter`);
      }
    } else if (typeof item === 'string') {
      // If it's an absolute path but NOT the first argument, that's usually a bug
      if (!isFirst && path.isAbsolute(item)) {
        throw new Error(`Absolute path "${item}" found at index ${i}. Only the first argument can be absolute.`);
      }
      parts.push(item);
    } else {
      throw new Error(`Invalid argument type: ${typeof item}`);
    }
  }

  // path.resolve creates an absolute path, so we cast to our branded Path
  return path.resolve(...parts) as FS.Path;
}
