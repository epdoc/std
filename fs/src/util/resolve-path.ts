import { BaseSpec } from '$spec';
import { isString } from '@epdoc/type';
import path from 'node:path';
import type * as FS from '../types.ts';

export const ERR_STR = {
  replace: (o: { type: string }): string => `Error: Invalid argument type at index > 0: ${o.type}`,
};

export const ERR_FILE_STR = { replace: (o: { type: string }): string => `Error: ${o.type} must be the only argument.` };

export const isFileNameCheck = (val: unknown): val is FS.FileName =>
  isString(val) && val.includes('.') && val !== '.' && val !== '..';

/**
 * Resolves path arguments and returns a branded FilePath or FolderPath.
 * The return type is determined by the last segment of the path.
 */
export function resolvePathArgs(...args: FS.PathSegment[]): FS.Path {
  const parts: string[] = [Deno.cwd()];

  for (let adx = 0; adx < args.length; ++adx) {
    const item = args[adx];

    if (item instanceof BaseSpec) {
      if (adx === 0) {
        parts.push(item.path);
      } else {
        throw new Error(`A path may only use a ${item.constructor.name} as it's first parameter`);
      }
    } else if (isString(item)) {
      parts.push(item);
    } else {
      throw new Error('Invalid argument type: ' + typeof item);
    }
  }

  return path.resolve(...parts) as FS.Path;
}
